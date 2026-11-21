from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import FoodCategory, FoodItem
from .serializers import FoodCategorySerializer, FoodItemSerializer
from restaurants.models import Restaurant

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def restaurant_menu_view(request, restaurant_id):
    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id, is_published=True)
    except Restaurant.DoesNotExist:
        return Response({'detail': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Strictly only this restaurant's items (FR-4.5)
    qs = FoodItem.objects.filter(restaurant=restaurant, is_available=True)

    # Search in menu
    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

    # Category filter
    category = request.GET.get('category', '').strip()
    if category and category.lower() != 'all':
        qs = qs.filter(category__name__iexact=category)

    # Veg only switch
    veg = request.GET.get('veg', '') or request.GET.get('veg_only', '')
    if veg in ['true', '1', 'True']:
        qs = qs.filter(is_veg=True)

    categories = FoodCategory.objects.filter(restaurant=restaurant).values('id', 'name', 'sort_order')
    items_data = FoodItemSerializer(qs, many=True, context={'request': request}).data

    return Response({
        'restaurant': {
            'id': restaurant.id,
            'name': restaurant.name,
            'cover': restaurant.image,
            'badge': restaurant.badge,
            'cuisines': [restaurant.cuisine.name] if restaurant.cuisine else [],
            'location': restaurant.location,
            'rating': str(restaurant.rating),
            'review_count': restaurant.review_count,
            'delivery_time': restaurant.delivery_time_display,
            'delivery_fee': f"₹{int(restaurant.delivery_fee)}" if restaurant.delivery_fee > 0 else "Free",
            'min_order': int(restaurant.min_order),
            'is_pure_veg': restaurant.is_pure_veg,
            'is_available': restaurant.is_available,
        },
        'categories': list(categories),
        'items': items_data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def food_items_list(request):
    qs = FoodItem.objects.filter(is_available=True, restaurant__is_published=True)

    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(name__icontains=search) |
            Q(description__icontains=search) |
            Q(restaurant__name__icontains=search) |
            Q(restaurant__cuisine__name__icontains=search)
        )

    cuisine = request.GET.get('cuisine', '').strip()
    if cuisine and cuisine.lower() != 'all':
        qs = qs.filter(restaurant__cuisine__name__iexact=cuisine)

    trending = request.GET.get('trending', '')
    if trending in ['true', '1', 'True']:
        qs = qs.filter(is_trending=True)

    chef_special = request.GET.get('chef_special', '')
    if chef_special in ['true', '1', 'True']:
        qs = qs.filter(is_chef_special=True)

    restaurant_id = request.GET.get('restaurant', '')
    if restaurant_id:
        qs = qs.filter(restaurant_id=restaurant_id)

    limit = request.GET.get('limit')
    if limit:
        try:
            qs = qs[:int(limit)]
        except ValueError:
            pass

    serializer = FoodItemSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def food_item_detail(request, pk):
    try:
        item = FoodItem.objects.get(pk=pk, is_available=True)
    except FoodItem.DoesNotExist:
        return Response({'detail': 'Food item not found.'}, status=status.HTTP_404_NOT_FOUND)

    serializer = FoodItemSerializer(item, context={'request': request})
    return Response(serializer.data)
