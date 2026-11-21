from rest_framework import serializers
from .models import Cuisine, Restaurant

class CuisineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuisine
        fields = ['id', 'name', 'image', 'sort_order']


class RestaurantSerializer(serializers.ModelSerializer):
    cuisine_name = serializers.CharField(source='cuisine.name', read_only=True)
    cuisines = serializers.SerializerMethodField()
    delivery_time = serializers.CharField(source='delivery_time_display', read_only=True)
    delivery_fee_display = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Restaurant
        fields = [
            'id', 'name', 'description', 'image', 'cuisine', 'cuisine_name',
            'cuisines', 'badge', 'location', 'rating', 'review_count',
            'delivery_time', 'delivery_min_minutes', 'delivery_max_minutes',
            'delivery_fee', 'delivery_fee_display', 'min_order',
            'is_pure_veg', 'is_available', 'is_published', 'is_favorite'
        ]

    def get_cuisines(self, obj):
        res = []
        if obj.cuisine:
            res.append(obj.cuisine.name)
        if obj.secondary_cuisines:
            res.extend([c.strip() for c in obj.secondary_cuisines.split(',') if c.strip()])
        return res

    def get_delivery_fee_display(self, obj):
        if obj.delivery_fee <= 0:
            return "Free"
        return f"₹{int(obj.delivery_fee)}"

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(user=request.user).exists()
        return False
