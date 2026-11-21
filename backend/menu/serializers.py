from rest_framework import serializers
from .models import FoodCategory, FoodItem, FoodCustomization

class FoodCustomizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FoodCustomization
        fields = ['id', 'kind', 'name', 'price_delta', 'is_default']


class FoodItemSerializer(serializers.ModelSerializer):
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    cuisine = serializers.CharField(source='restaurant.cuisine.name', read_only=True)
    customizations = FoodCustomizationSerializer(many=True, read_only=True)
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = FoodItem
        fields = [
            'id', 'restaurant', 'restaurant_name', 'category', 'category_name',
            'name', 'description', 'image', 'price', 'is_veg', 'is_available',
            'rating', 'prep_time_minutes', 'tag', 'is_trending', 'is_chef_special',
            'cuisine', 'customizations', 'is_favorite'
        ]

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorites.filter(user=request.user).exists()
        return False


class FoodCategorySerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()

    class Meta:
        model = FoodCategory
        fields = ['id', 'name', 'sort_order', 'items']

    def get_items(self, obj):
        # Allow filtering from view context if needed
        items = obj.items.filter(is_available=True)
        return FoodItemSerializer(items, many=True, context=self.context).data
