from rest_framework import serializers
from .models import AIConversation, AIMessage
from menu.models import FoodItem

class AIMessageSerializer(serializers.ModelSerializer):
    dishes = serializers.SerializerMethodField()

    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'dish_ids', 'dishes', 'outcome', 'created_at']

    def get_dishes(self, obj):
        if not obj.dish_ids:
            return []
        items = FoodItem.objects.filter(id__in=obj.dish_ids, is_available=True)
        return [
            {
                'id': item.id,
                'name': item.name,
                'image': item.image,
                'price': str(item.price),
                'cuisine': item.restaurant.cuisine.name if item.restaurant.cuisine else '',
                'restaurant': item.restaurant.id,
                'restaurant_name': item.restaurant.name,
                'rating': str(item.rating),
                'is_veg': item.is_veg,
            }
            for item in items
        ]


class AIConversationSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)
    time_display = serializers.SerializerMethodField()

    class Meta:
        model = AIConversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'time_display', 'messages']

    def get_time_display(self, obj):
        # e.g. "Just now", "Yesterday", "16 Nov"
        return obj.updated_at.strftime('%d %b • %I:%M %p')
