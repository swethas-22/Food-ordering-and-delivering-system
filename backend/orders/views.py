from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
from .models import Order, OrderItem, OrderTracking
from .serializers import OrderSerializer
from cart.models import Cart, CartItem
from accounts.models import Address
from menu.models import FoodItem, FoodCustomization

STATUS_FLOW = ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'delivered']

def update_simulated_progression(order):
    if order.status in ['delivered', 'cancelled']:
        return order
    
    elapsed = (timezone.now() - order.created_at).total_seconds()
    new_status = order.status
    if elapsed >= 95:
        new_status = 'delivered'
    elif elapsed >= 65:
        new_status = 'out_for_delivery'
    elif elapsed >= 35:
        new_status = 'preparing'
    elif elapsed >= 15:
        new_status = 'confirmed'

    if new_status != order.status:
        # Check transition order
        curr_idx = STATUS_FLOW.index(order.status) if order.status in STATUS_FLOW else 0
        new_idx = STATUS_FLOW.index(new_status) if new_status in STATUS_FLOW else 0
        if new_idx > curr_idx:
            for i in range(curr_idx + 1, new_idx + 1):
                st = STATUS_FLOW[i]
                OrderTracking.objects.get_or_create(order=order, status=st, defaults={'note': f"Stage updated to {st}"})
            order.status = new_status
            order.save()
    return order


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def orders_collection(request):
    if request.method == 'GET':
        return order_list(request)
    
    # POST: create order
    user = request.user
    cart = Cart.objects.filter(user=user).first()
    if not cart or not cart.items.exists():
        return Response({'detail': 'Your culinary bag is empty.'}, status=status.HTTP_400_BAD_REQUEST)

    restaurant = cart.restaurant
    if not restaurant or not restaurant.is_available:
        return Response({'detail': 'This restaurant is currently unavailable for delivery.'}, status=status.HTTP_400_BAD_REQUEST)

    # Server recalculates all financials
    bill_data = cart.calculate_bill()
    subtotal = Decimal(bill_data['bill']['subtotal'])
    discount = Decimal(bill_data['bill']['discount'])
    delivery_fee = Decimal(bill_data['bill']['delivery_fee'])
    tax = Decimal(bill_data['bill']['tax'])
    total = Decimal(bill_data['bill']['total'])
    coupon_code = bill_data['bill']['coupon_code']

    # Min order check (FR-5.14)
    if subtotal < restaurant.min_order:
        return Response({
            'detail': f'Minimum order amount for {restaurant.name} is ₹{int(restaurant.min_order)}. Please add more items.'
        }, status=status.HTTP_400_BAD_REQUEST)

    address_id = request.data.get('address_id')
    address_line = request.data.get('delivery_address', '')
    if address_id:
        addr = Address.objects.filter(id=address_id, user=user).first()
        if addr:
            address_line = f"{addr.label} — {addr.line}, {addr.city} {addr.pincode}"
    if not address_line:
        default_addr = user.addresses.filter(is_default=True).first() or user.addresses.first()
        if default_addr:
            address_line = f"{default_addr.label} — {default_addr.line}, {default_addr.city} {default_addr.pincode}"
        else:
            address_line = "Penthouse 14B, Koramangala 4th Block, Bengaluru 560034"

    payment_method = request.data.get('payment_method', 'upi')
    payment_provider = request.data.get('payment_provider', 'Google Pay')
    delivery_instruction = request.data.get('delivery_instruction', 'leave_at_door')
    idempotency_key = request.data.get('idempotency_key')

    # NFR-R3: Idempotency check
    if idempotency_key:
        existing = Order.objects.filter(user=user, idempotency_key=idempotency_key).first()
        if existing:
            return Response({
                'order_id': existing.order_number,
                'id': existing.id,
                'status': existing.status,
                'total': str(existing.total),
                'payment': {'method': existing.payment_method, 'simulated': True, 'status': 'confirmed'},
                'eta_minutes': existing.eta_minutes
            }, status=status.HTTP_200_OK)

    with transaction.atomic():
        order = Order.objects.create(
            user=user,
            restaurant=restaurant,
            status='placed',
            delivery_name=user.full_name or user.email.split('@')[0],
            delivery_phone=user.phone or '+91 98765 43210',
            delivery_address=address_line,
            delivery_instruction=delivery_instruction,
            payment_method=payment_method,
            payment_provider=payment_provider,
            payment_is_simulated=True,
            subtotal=subtotal,
            discount=discount,
            delivery_fee=delivery_fee,
            tax=tax,
            total=total,
            coupon_code=coupon_code,
            eta_minutes=restaurant.delivery_min_minutes,
            idempotency_key=idempotency_key
        )

        for line in bill_data['items']:
            food_item = FoodItem.objects.filter(id=line['food_item']).first()
            OrderItem.objects.create(
                order=order,
                food_item=food_item,
                name=line['name'],
                unit_price=Decimal(line['unit_price']),
                quantity=line['quantity'],
                options_summary=line['summary'],
                instructions=line['instructions']
            )

        OrderTracking.objects.create(
            order=order,
            status='placed',
            note='Order successfully placed and routed to restaurant kitchen'
        )

        # Empty cart (FR-5.13)
        cart.items.all().delete()
        cart.coupon = None
        cart.save()

    return Response({
        'order_id': order.order_number,
        'id': order.id,
        'status': order.status,
        'total': f"{order.total:.2f}",
        'payment': {
            'method': order.payment_method,
            'simulated': True,
            'status': 'confirmed'
        },
        'eta_minutes': order.eta_minutes
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_list(request):
    orders = Order.objects.filter(user=request.user).select_related('restaurant').prefetch_related('items', 'tracking_history')
    for ord in orders:
        update_simulated_progression(ord)
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_detail(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    update_simulated_progression(order)
    serializer = OrderSerializer(order)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def order_tracking(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    update_simulated_progression(order)

    # 5 tracking stages (FR-6.1)
    stages = [
        {'key': 'placed', 'label': 'Order Placed', 'pill': 'Order Dispatched to Kitchen', 'coords': [120, 140]},
        {'key': 'confirmed', 'label': 'Order Confirmed', 'pill': 'Kitchen Confirmed Order', 'coords': [260, 180]},
        {'key': 'preparing', 'label': 'Preparing Food', 'pill': 'Chef Preparing Your Gourmet Meal', 'coords': [420, 240]},
        {'key': 'out_for_delivery', 'label': 'Out for Delivery', 'pill': f'Valet {order.rider_name} on Route', 'coords': [600, 310]},
        {'key': 'delivered', 'label': 'Delivered', 'pill': 'Delivered to Doorstep • Enjoy!', 'coords': [780, 390]},
    ]
    curr_idx = 0
    if order.status in STATUS_FLOW:
        curr_idx = STATUS_FLOW.index(order.status)
    elif order.status == 'cancelled':
        curr_idx = -1

    return Response({
        'order': OrderSerializer(order).data,
        'stages': stages,
        'current_stage_index': curr_idx,
        'status': order.status,
        'can_cancel': order.status in ['placed', 'confirmed'],
        'rider': {
            'name': order.rider_name,
            'rating': str(order.rider_rating),
            'vehicle': order.rider_vehicle
        }
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def order_cancel(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    update_simulated_progression(order)

    # FR-6.6: Allowed ONLY until Preparing Food
    if order.status not in ['placed', 'confirmed']:
        return Response({
            'code': 'cancel_forbidden',
            'detail': f'Order cannot be cancelled once it reaches "{order.get_status_display()}".'
        }, status=status.HTTP_409_CONFLICT)

    order.status = 'cancelled'
    order.save()
    OrderTracking.objects.create(order=order, status='cancelled', note='Cancelled by customer')
    return Response({'detail': f'Order #{order.order_number} has been cancelled successfully.'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def order_reorder(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    cart, _ = Cart.objects.get_or_create(user=request.user)
    cart.items.all().delete()
    cart.restaurant = order.restaurant
    cart.coupon = None
    cart.save()

    unavailable = []
    added_count = 0

    for item in order.items.all():
        if item.food_item and item.food_item.is_available:
            cart_item = CartItem.objects.create(
                cart=cart,
                food_item=item.food_item,
                quantity=item.quantity,
                instructions=item.instructions,
                signature=f"reorder-{item.id}-{timezone.now().timestamp()}"
            )
            added_count += 1
        else:
            unavailable.append(item.name)

    data = cart.calculate_bill()
    data['id'] = cart.id
    data['unavailable_items'] = unavailable
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def order_advance_stage(request, pk):
    # FR-6.7: Development / Admin control to advance simulated status
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    if order.status == 'cancelled':
        return Response({'detail': 'Cannot advance a cancelled order.'}, status=status.HTTP_409_CONFLICT)

    curr_idx = STATUS_FLOW.index(order.status) if order.status in STATUS_FLOW else 0
    next_idx = (curr_idx + 1) % len(STATUS_FLOW)
    next_status = STATUS_FLOW[next_idx]

    order.status = next_status
    order.save()
    OrderTracking.objects.get_or_create(order=order, status=next_status, defaults={'note': f'Simulated advance to {next_status}'})

    return Response({
        'detail': f'Status advanced to {next_status}',
        'status': next_status,
        'order': OrderSerializer(order).data
    })
