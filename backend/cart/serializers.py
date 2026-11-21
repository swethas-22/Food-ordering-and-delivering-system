from rest_framework import serializers
from .models import Coupon, Cart, CartItem

class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'title', 'description', 'conditions',
            'kind', 'value', 'max_discount', 'min_subtotal', 'is_active'
        ]
