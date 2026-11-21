from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Cuisine, Restaurant
from .serializers import CuisineSerializer, RestaurantSerializer
from cart.models import Coupon
from cart.serializers import CouponSerializer

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def cuisines_list(request):
    cuisines = Cuisine.objects.all().order_by('sort_order', 'name')
    return Response(CuisineSerializer(cuisines, many=True).data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def restaurants_list(request):
    qs = Restaurant.objects.filter(is_published=True)

    # Search filter
    search = request.GET.get('search', '').strip()
    if search:
        qs = qs.filter(
            Q(name__icontains=search) |
            Q(cuisine__name__icontains=search) |
            Q(secondary_cuisines__icontains=search) |
            Q(description__icontains=search)
        )

    # Cuisine filter
    cuisine = request.GET.get('cuisine', '').strip()
    if cuisine and cuisine.lower() != 'all':
        qs = qs.filter(
            Q(cuisine__name__iexact=cuisine) |
            Q(secondary_cuisines__icontains=cuisine)
        )

    # Veg only filter
    veg_only = request.GET.get('veg_only', '') or request.GET.get('is_pure_veg', '')
    if veg_only in ['true', '1', 'True']:
        qs = qs.filter(is_pure_veg=True)

    # Min rating filter (e.g. 4.7)
    min_rating = request.GET.get('min_rating', '')
    if min_rating:
        try:
            qs = qs.filter(rating__gte=float(min_rating))
        except ValueError:
            pass

    # Price tier filter: budget (<300), mid (300-450), luxury (>450)
    price_tier = request.GET.get('price_tier', '').strip()
    if price_tier == 'budget':
        qs = qs.filter(min_order__lt=300)
    elif price_tier == 'mid':
        qs = qs.filter(min_order__gte=300, min_order__lte=450)
    elif price_tier == 'luxury':
        qs = qs.filter(min_order__gt=450)

    # Sorting
    ordering = request.GET.get('ordering', '').strip()
    if ordering == 'popularity':
        qs = qs.order_by('-review_count', '-rating')
    elif ordering in ['rating', '-rating']:
        qs = qs.order_by('-rating')
    elif ordering in ['delivery_time', 'deliveryTime']:
        qs = qs.order_by('delivery_min_minutes', '-rating')
    elif ordering in ['min_order', 'priceLow']:
        qs = qs.order_by('min_order')
    else:
        qs = qs.order_by('-rating', '-review_count')

    # Pagination or all
    page = request.GET.get('page')
    if page:
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 12
        paginated_qs = paginator.paginate_queryset(qs, request)
        serializer = RestaurantSerializer(paginated_qs, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    serializer = RestaurantSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def restaurant_detail(request, pk):
    try:
        restaurant = Restaurant.objects.get(pk=pk, is_published=True)
    except Restaurant.DoesNotExist:
        return Response({'detail': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = RestaurantSerializer(restaurant, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def offers_list(request):
    coupons = Coupon.objects.filter(is_active=True).order_by('min_subtotal')
    return Response(CouponSerializer(coupons, many=True).data)
