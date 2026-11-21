from rest_framework import serializers
from .models import Review, Favorite

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    food_item_name = serializers.CharField(source='food_item.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'user', 'user_name', 'order', 'restaurant', 'restaurant_name',
            'food_item', 'food_item_name', 'rating', 'comment', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class FavoriteSerializer(serializers.ModelSerializer):
    type = serializers.SerializerMethodField()
    restaurant_details = serializers.SerializerMethodField()
    dish_details = serializers.SerializerMethodField()

    class Meta:
        model = Favorite
        fields = ['id', 'restaurant', 'food_item', 'type', 'restaurant_details', 'dish_details', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_type(self, obj):
        return 'restaurant' if obj.restaurant else 'dish'

    def get_restaurant_details(self, obj):
        if not obj.restaurant:
            return None
        r = obj.restaurant
        return {
            'id': r.id,
            'name': r.name,
            'image': r.image,
            'cuisines': [r.cuisine.name] if r.cuisine else [],
            'rating': str(r.rating),
            'delivery_time': r.delivery_time_display,
            'delivery_fee': f"₹{int(r.delivery_fee)}" if r.delivery_fee > 0 else "Free",
            'min_order': int(r.min_order),
        }

    def get_dish_details(self, obj):
        if not obj.food_item:
            return None
        d = obj.food_item
        return {
            'id': d.id,
            'restaurant_id': d.restaurant.id,
            'restaurant_name': d.restaurant.name,
            'name': d.name,
            'image': d.image,
            'price': str(d.price),
            'cuisine': d.restaurant.cuisine.name if d.restaurant.cuisine else '',
            'rating': str(d.rating),
            'is_veg': d.is_veg,
        }
