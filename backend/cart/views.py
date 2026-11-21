from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from decimal import Decimal
from .models import Cart, CartItem, Coupon
from menu.models import FoodItem, FoodCustomization

def get_or_create_user_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def cart_view(request):
    cart = get_or_create_user_cart(request.user)
    data = cart.calculate_bill()
    data['id'] = cart.id
    return Response(data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def cart_add_item(request):
    cart = get_or_create_user_cart(request.user)
    food_item_id = request.data.get('food_item')
    quantity = int(request.data.get('quantity', 1))
    instructions = request.data.get('instructions', '').strip()[:200]
    replace = request.data.get('replace', False) or request.data.get('replace_cart', False)

    if not food_item_id:
        return Response({'detail': 'food_item is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        food = FoodItem.objects.get(id=food_item_id, is_available=True)
    except FoodItem.DoesNotExist:
        return Response({'detail': 'Food item not available.'}, status=status.HTTP_404_NOT_FOUND)

    # Check restaurant constraint (FR-5.3)
    if cart.restaurant and cart.restaurant != food.restaurant and cart.items.exists():
        if not replace:
            return Response({
                'code': 'restaurant_conflict',
                'detail': f'Your cart contains items from {cart.restaurant.name}. Replace cart with items from {food.restaurant.name}?',
                'current_restaurant': cart.restaurant.name,
                'new_restaurant': food.restaurant.name
            }, status=status.HTTP_409_CONFLICT)
        else:
            cart.items.all().delete()
            cart.coupon = None

    cart.restaurant = food.restaurant
    cart.save()

    # Determine customizations
    options = []
    # If explicit options list passed:
    opt_ids = request.data.get('options', [])
    if opt_ids:
        options = list(FoodCustomization.objects.filter(id__in=opt_ids, food_item=food))
    else:
        # Check portion and spice strings or extras
        portion_str = request.data.get('portion', '')
        spice_str = request.data.get('spice', '')
        extras_ids = request.data.get('extras', [])

        if portion_str:
            opt = FoodCustomization.objects.filter(food_item=food, kind='portion', name__iexact=portion_str).first()
            if opt:
                options.append(opt)
        else:
            default_portion = FoodCustomization.objects.filter(food_item=food, kind='portion', is_default=True).first()
            if default_portion:
                options.append(default_portion)

        if spice_str:
            opt = FoodCustomization.objects.filter(food_item=food, kind='spice', name__iexact=spice_str).first()
            if opt:
                options.append(opt)
        else:
            default_spice = FoodCustomization.objects.filter(food_item=food, kind='spice', is_default=True).first()
            if default_spice:
                options.append(default_spice)

        if extras_ids:
            options.extend(list(FoodCustomization.objects.filter(id__in=extras_ids, food_item=food)))

    # Build signature for merging identical lines (FR-4.9)
    sorted_opt_ids = sorted([str(o.id) for o in options])
    signature = f"{food.id}:{'-'.join(sorted_opt_ids)}:{instructions}"

    existing_item = cart.items.filter(signature=signature).first()
    if existing_item:
        existing_item.quantity = min(20, existing_item.quantity + quantity)
        existing_item.save()
    else:
        item = CartItem.objects.create(
            cart=cart,
            food_item=food,
            quantity=min(20, max(1, quantity)),
            instructions=instructions,
            signature=signature
        )
        if options:
            item.options.set(options)

    data = cart.calculate_bill()
    data['id'] = cart.id
    return Response(data, status=status.HTTP_201_CREATED)


@api_view(['PATCH', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def cart_item_detail(request, pk):
    cart = get_or_create_user_cart(request.user)
    try:
        item = cart.items.get(pk=pk)
    except CartItem.DoesNotExist:
        return Response({'detail': 'Cart item not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        item.delete()
        if not cart.items.exists():
            cart.restaurant = None
            cart.coupon = None
            cart.save()
        data = cart.calculate_bill()
        data['id'] = cart.id
        return Response(data, status=status.HTTP_200_OK)

    # PATCH: update quantity or options
    quantity = request.data.get('quantity')
    if quantity is not None:
        q = int(quantity)
        if q <= 0:
            item.delete()
            if not cart.items.exists():
                cart.restaurant = None
                cart.coupon = None
                cart.save()
        else:
            item.quantity = min(20, q)
            item.save()

    data = cart.calculate_bill()
    data['id'] = cart.id
    return Response(data, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def cart_clear(request):
    cart = get_or_create_user_cart(request.user)
    cart.items.all().delete()
    cart.restaurant = None
    cart.coupon = None
    cart.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def cart_coupon_view(request):
    cart = get_or_create_user_cart(request.user)

    if request.method == 'DELETE':
        cart.coupon = None
        cart.save()
        data = cart.calculate_bill()
        data['id'] = cart.id
        return Response(data, status=status.HTTP_200_OK)

    code = request.data.get('code', '').strip().upper()
    if not code:
        return Response({'code': 'coupon_invalid', 'detail': 'Coupon code is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        coupon = Coupon.objects.get(code=code, is_active=True)
    except Coupon.DoesNotExist:
        return Response({
            'code': 'coupon_invalid',
            'detail': f"Coupon '{code}' is not valid or has expired."
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check min subtotal
    bill = cart.calculate_bill()
    subtotal = Decimal(bill['bill']['subtotal'])
    if subtotal < coupon.min_subtotal:
        return Response({
            'code': 'coupon_invalid',
            'detail': f"Add items worth ₹{int(coupon.min_subtotal)} or more to use {coupon.code}."
        }, status=status.HTTP_400_BAD_REQUEST)

    cart.coupon = coupon
    cart.save()

    data = cart.calculate_bill()
    data['id'] = cart.id
    return Response(data, status=status.HTTP_200_OK)
