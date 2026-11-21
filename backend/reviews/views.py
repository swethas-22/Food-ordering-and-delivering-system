from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Review, Favorite
from .serializers import ReviewSerializer, FavoriteSerializer
from orders.models import Order
from restaurants.models import Restaurant
from menu.models import FoodItem

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def review_create(request):
    order_id = request.data.get('order_id') or request.data.get('order')
    rating = int(request.data.get('rating', 5))
    comment = request.data.get('comment', '').strip()[:500]
    food_item_id = request.data.get('food_item')

    if not order_id:
        return Response({'detail': 'order_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

    # FR-7.4: Only delivered orders can be rated
    if order.status != 'delivered':
        return Response({'detail': 'Only delivered orders can be rated and reviewed.'}, status=status.HTTP_400_BAD_REQUEST)

    if rating < 1 or rating > 5:
        return Response({'detail': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

    food_item = None
    if food_item_id:
        food_item = FoodItem.objects.filter(id=food_item_id).first()

    # Check for existing review
    existing = Review.objects.filter(order=order, food_item=food_item).first()
    if existing:
        return Response({'detail': 'You have already reviewed this item / order.'}, status=status.HTTP_409_CONFLICT)

    review = Review.objects.create(
        user=request.user,
        order=order,
        restaurant=order.restaurant,
        food_item=food_item,
        rating=rating,
        comment=comment
    )

    return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def review_edit(request, pk):
    try:
        review = Review.objects.get(pk=pk, user=request.user)
    except Review.DoesNotExist:
        return Response({'detail': 'Review not found.'}, status=status.HTTP_404_NOT_FOUND)

    # FR-7.6: Edit review within 7 days
    if (timezone.now() - review.created_at) > timedelta(days=7):
        return Response({'detail': 'Reviews can only be edited within 7 days of publication.'}, status=status.HTTP_403_FORBIDDEN)

    rating = request.data.get('rating')
    comment = request.data.get('comment')
    if rating is not None:
        r = int(rating)
        if 1 <= r <= 5:
            review.rating = r
    if comment is not None:
        review.comment = str(comment).strip()[:500]
    review.save()

    return Response(ReviewSerializer(review).data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def restaurant_reviews(request, restaurant_id):
    try:
        restaurant = Restaurant.objects.get(pk=restaurant_id, is_published=True)
    except Restaurant.DoesNotExist:
        return Response({'detail': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)

    reviews = Review.objects.filter(restaurant=restaurant, food_item__isnull=True).order_by('-created_at')
    return Response(ReviewSerializer(reviews, many=True).data)


@api_view(['GET', 'POST'])
@permission_classes([permissions.IsAuthenticated])
def favorites_collection(request):
    if request.method == 'GET':
        favs = Favorite.objects.filter(user=request.user).select_related('restaurant', 'food_item', 'restaurant__cuisine', 'food_item__restaurant')
        return Response(FavoriteSerializer(favs, many=True).data)

    # POST: toggle or add favorite
    fav_type = request.data.get('type') # 'restaurant' or 'dish'
    target_id = request.data.get('id')
    if not fav_type or not target_id:
        return Response({'detail': 'type and id are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if fav_type == 'restaurant':
        try:
            rest = Restaurant.objects.get(pk=target_id)
        except Restaurant.DoesNotExist:
            return Response({'detail': 'Restaurant not found.'}, status=status.HTTP_404_NOT_FOUND)
        fav = Favorite.objects.filter(user=request.user, restaurant=rest).first()
        if fav:
            fav.delete()
            return Response({'action': 'removed', 'type': 'restaurant', 'id': rest.id}, status=status.HTTP_200_OK)
        else:
            fav = Favorite.objects.create(user=request.user, restaurant=rest)
            return Response(FavoriteSerializer(fav).data, status=status.HTTP_201_CREATED)

    elif fav_type in ['dish', 'food_item']:
        try:
            food = FoodItem.objects.get(pk=target_id)
        except FoodItem.DoesNotExist:
            return Response({'detail': 'Dish not found.'}, status=status.HTTP_404_NOT_FOUND)
        fav = Favorite.objects.filter(user=request.user, food_item=food).first()
        if fav:
            fav.delete()
            return Response({'action': 'removed', 'type': 'dish', 'id': food.id}, status=status.HTTP_200_OK)
        else:
            fav = Favorite.objects.create(user=request.user, food_item=food)
            return Response(FavoriteSerializer(fav).data, status=status.HTTP_201_CREATED)

    return Response({'detail': 'Invalid favorite type.'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def favorite_delete(request, pk):
    try:
        fav = Favorite.objects.get(pk=pk, user=request.user)
    except Favorite.DoesNotExist:
        return Response({'detail': 'Favorite not found.'}, status=status.HTTP_404_NOT_FOUND)

    fav.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
