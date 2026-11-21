from rest_framework import serializers
from .models import Order, OrderItem, OrderTracking

class OrderItemSerializer(serializers.ModelSerializer):
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'food_item', 'name', 'unit_price', 'quantity', 'line_total', 'options_summary', 'instructions']


class OrderTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderTracking
        fields = ['status', 'changed_at', 'note']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    tracking_history = OrderTrackingSerializer(many=True, read_only=True)
    restaurant_name = serializers.CharField(source='restaurant.name', read_only=True)
    restaurant_image = serializers.CharField(source='restaurant.image', read_only=True)
    restaurant_location = serializers.CharField(source='restaurant.location', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    date_display = serializers.SerializerMethodField()
    can_cancel = serializers.SerializerMethodField()
    user_review = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'restaurant', 'restaurant_name', 'restaurant_image',
            'restaurant_location', 'status', 'status_display', 'date_display',
            'items', 'subtotal', 'discount', 'delivery_fee', 'tax', 'total',
            'coupon_code', 'delivery_name', 'delivery_phone', 'delivery_address',
            'delivery_instruction', 'payment_method', 'payment_provider',
            'payment_is_simulated', 'eta_minutes', 'rider_name', 'rider_rating',
            'rider_vehicle', 'can_cancel', 'user_review', 'tracking_history',
            'created_at'
        ]

    def get_date_display(self, obj):
        # Format: "16 Nov 2026 • 8:42 PM"
        return obj.created_at.strftime('%d %b %Y • %I:%M %p')

    def get_can_cancel(self, obj):
        # FR-6.6: Allowed only until Preparing Food (i.e. 'placed' or 'confirmed')
        return obj.status in ['placed', 'confirmed']

    def get_user_review(self, obj):
        review = obj.reviews.filter(food_item__isnull=True).first()
        if review:
            return {'rating': review.rating, 'comment': review.comment, 'id': review.id}
        return None
