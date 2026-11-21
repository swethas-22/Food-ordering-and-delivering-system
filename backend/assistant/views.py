from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
import re
from .models import AIConversation, AIMessage
from .serializers import AIConversationSerializer, AIMessageSerializer
from .gemini_service import call_gemini_api
from menu.models import FoodItem
from orders.models import Order

# Rate limit cache in memory (20 per min, 200 per day per user, FR-8.10)
USER_RATE_LIMITS = {}

def check_rate_limit(user_id):
    now = timezone.now()
    user_times = USER_RATE_LIMITS.setdefault(user_id, [])
    # Keep only timestamps within last 24 hours
    user_times = [t for t in user_times if (now - t).total_seconds() < 86400]
    USER_RATE_LIMITS[user_id] = user_times

    # Last minute count
    last_min = [t for t in user_times if (now - t).total_seconds() < 60]
    if len(last_min) >= 20:
        return False, 15
    if len(user_times) >= 200:
        return False, 3600
    
    user_times.append(now)
    return True, 0


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def conversations_collection(request):
    if request.method == 'GET':
        convs = AIConversation.objects.filter(user=request.user).order_by('-updated_at')
        return Response(AIConversationSerializer(convs, many=True).data)

    # POST: create new conversation
    title = request.data.get('title', 'New Culinary Inquiry').strip()[:100]
    conv = AIConversation.objects.create(user=request.user, title=title)
    # Add initial greeting message
    AIMessage.objects.create(
        conversation=conv,
        role='assistant',
        content="Good evening! I am your Parcelo Culinary Concierge. Tell me your mood, budget in ₹, dietary preference, or inquire about an active order.",
        dish_ids=[]
    )
    return Response(AIConversationSerializer(conv).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def conversation_detail(request, pk):
    try:
        conv = AIConversation.objects.get(pk=pk, user=request.user)
    except AIConversation.DoesNotExist:
        return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(AIConversationSerializer(conv).data)

    if request.method == 'DELETE':
        conv.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # PATCH: rename
    new_title = request.data.get('title', '').strip()[:100]
    if new_title:
        conv.title = new_title
        conv.save(update_fields=['title', 'updated_at'])
    return Response(AIConversationSerializer(conv).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def conversation_messages(request, pk):
    try:
        conv = AIConversation.objects.get(pk=pk, user=request.user)
    except AIConversation.DoesNotExist:
        return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Rate limit check (FR-8.10)
    allowed, retry_after = check_rate_limit(request.user.id)
    if not allowed:
        return Response({
            'code': 'rate_limited',
            'detail': 'Too many messages. Please wait a few seconds.',
            'retry_after': retry_after
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)

    user_text = request.data.get('message', '').strip()
    if not user_text:
        return Response({'detail': 'Message text is required.'}, status=status.HTTP_400_BAD_REQUEST)

    # Save user message
    AIMessage.objects.create(
        conversation=conv,
        role='user',
        content=user_text
    )

    # FR-8.4: Auto-title new conversation from first customer question
    if conv.messages.filter(role='user').count() == 1:
        conv.title = user_text[:26] + ('...' if len(user_text) > 26 else '')
        conv.save(update_fields=['title', 'updated_at'])

    # Build CONTEXT block from live DB records (FR-8.5, Section 4.3)
    text_lower = user_text.lower()
    items_qs = FoodItem.objects.filter(is_available=True, restaurant__is_published=True).select_related('restaurant', 'restaurant__cuisine')

    if 'veg' in text_lower or 'vegetarian' in text_lower:
        items_qs = items_qs.filter(is_veg=True)

    # Budget filter check if user asked e.g. "under 500", "under 300", "budget"
    budget_match = re.search(r'(?:under|below|less than|budget of)\s*₹?\s*(\d+)', text_lower)
    if budget_match:
        budget_val = float(budget_match.group(1))
        items_qs = items_qs.filter(price__lte=budget_val)

    # Cuisine check
    cuisines_list = ['indian', 'italian', 'japanese', 'mexican', 'lebanese', 'continental', 'chinese', 'thai', 'dessert']
    for c in cuisines_list:
        if c in text_lower:
            items_qs = items_qs.filter(
                Q(restaurant__cuisine__name__icontains=c) |
                Q(restaurant__secondary_cuisines__icontains=c) |
                Q(name__icontains=c)
            )
            break

    context_dishes = list(items_qs[:15])
    if not context_dishes:
        context_dishes = list(FoodItem.objects.filter(is_available=True, restaurant__is_published=True).select_related('restaurant')[:15])

    context_lines = []
    context_dish_map = {}
    for d in context_dishes:
        context_dish_map[d.id] = d
        veg_str = "Veg" if d.is_veg else "Non-Veg"
        c_name = d.restaurant.cuisine.name if d.restaurant.cuisine else "Continental"
        context_lines.append(
            f"Dish ID: {d.id} | Name: {d.name} | Restaurant: {d.restaurant.name} | Cuisine: {c_name} | Price: ₹{int(d.price)} | {veg_str} | Rating: {d.rating}★"
        )

    # Check if asking about order
    if any(k in text_lower for k in ['order', 'status', 'prc-', 'rider', 'delivery']):
        latest_order = Order.objects.filter(user=request.user).order_by('-created_at').first()
        if latest_order:
            context_lines.append(
                f"\nCUSTOMER'S ACTIVE ORDER: Number: {latest_order.order_number} | Status: {latest_order.get_status_display()} | Restaurant: {latest_order.restaurant.name} | Total: ₹{latest_order.total} | ETA: {latest_order.eta_minutes} mins | Rider: {latest_order.rider_name} ({latest_order.rider_vehicle})"
            )

    context_str = "\n".join(context_lines)

    # Recent chat history for context
    recent_msgs = list(conv.messages.order_by('-created_at')[:8].values('role', 'content'))
    recent_msgs.reverse()

    # Call Gemini API
    ai_result = call_gemini_api(user_text, context_str, recent_msgs)

    if ai_result:
        reply_text = ai_result.get('reply', '')
        raw_dish_ids = ai_result.get('dish_ids', [])
        # Reply check: keep ONLY dishes that were in CONTEXT and exist in DB (FR-8.7)
        validated_dish_ids = [did for did in raw_dish_ids if did in context_dish_map]
        outcome = 'ok'
    else:
        # Safe Grounded Fallback (NFR-R1)
        outcome = 'replaced'
        picks = context_dishes[:2]
        validated_dish_ids = [p.id for p in picks]
        if 'order' in text_lower:
            latest_order = Order.objects.filter(user=request.user).order_by('-created_at').first()
            if latest_order:
                reply_text = f"Your latest order #{latest_order.order_number} from {latest_order.restaurant.name} is currently {latest_order.get_status_display()}. Estimated arrival is in {latest_order.eta_minutes} minutes."
            else:
                reply_text = "You don't have any recent orders. Would you like a gourmet recommendation from our flagship kitchens?"
        elif picks:
            names = " and ".join([f"{p.name} (₹{int(p.price)})" for p in picks])
            reply_text = f"I warmly recommend {names}. Both are exquisite culinary selections freshly available in our kitchen."
        else:
            reply_text = "I couldn't find any dishes matching those exact criteria in our current kitchen records. Try widening your budget or exploring other cuisines!"

    # Save Assistant message
    assistant_msg = AIMessage.objects.create(
        conversation=conv,
        role='assistant',
        content=reply_text,
        dish_ids=validated_dish_ids,
        outcome=outcome
    )
    conv.updated_at = timezone.now()
    conv.save(update_fields=['updated_at'])

    serialized = AIMessageSerializer(assistant_msg).data
    return Response({
        'reply': assistant_msg.content,
        'dish_ids': validated_dish_ids,
        'dishes': serialized['dishes']
    }, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def conversation_clear_messages(request, pk):
    # FR-8.3: Delete all messages of open conversation
    try:
        conv = AIConversation.objects.get(pk=pk, user=request.user)
    except AIConversation.DoesNotExist:
        return Response({'detail': 'Conversation not found.'}, status=status.HTTP_404_NOT_FOUND)

    conv.messages.all().delete()
    AIMessage.objects.create(
        conversation=conv,
        role='assistant',
        content="Conversation cleared. How may I assist your culinary desires today?",
        dish_ids=[]
    )
    return Response(status=status.HTTP_204_NO_CONTENT)
