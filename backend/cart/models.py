from django.db import models
from decimal import Decimal
from accounts.models import User
from restaurants.models import Restaurant
from menu.models import FoodItem, FoodCustomization

class Coupon(models.Model):
    KIND_CHOICES = [
        ('percent', 'Percentage Discount'),
        ('flat', 'Flat Amount Discount'),
        ('free_delivery', 'Free Delivery'),
    ]

    code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    conditions = models.CharField(max_length=255, blank=True)
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    value = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    max_discount = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    min_subtotal = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)
    usage_limit = models.PositiveIntegerField(default=10000)
    used_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.code = self.code.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.code} ({self.kind})"


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    coupon = models.ForeignKey(Coupon, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.email}"

    def calculate_bill(self):
        items = self.items.all().select_related('food_item')
        subtotal = Decimal('0.00')
        lines = []

        for item in items:
            food = item.food_item
            # calculate unit price from DB food base price + option deltas
            unit_price = Decimal(str(food.price))
            option_names = []
            for opt in item.options.all():
                unit_price += Decimal(str(opt.price_delta))
                option_names.append(opt.name)

            summary_parts = option_names
            if item.instructions:
                summary_parts.append(f'"{item.instructions}"')
            summary = " • ".join(summary_parts) if summary_parts else "Standard Preparation"

            line_total = unit_price * item.quantity
            subtotal += line_total
            lines.append({
                'id': item.id,
                'food_item': food.id,
                'name': food.name,
                'image': food.image,
                'is_veg': food.is_veg,
                'summary': summary,
                'instructions': item.instructions,
                'unit_price': f"{unit_price:.2f}",
                'quantity': item.quantity,
                'line_total': f"{line_total:.2f}",
            })

        discount = Decimal('0.00')
        coupon_code = None
        coupon_error = None

        if self.coupon and self.coupon.is_active:
            coupon = self.coupon
            if subtotal < coupon.min_subtotal:
                coupon_error = f"Add items worth ₹{int(coupon.min_subtotal)} or more to use {coupon.code}."
            else:
                coupon_code = coupon.code
                if coupon.kind == 'percent':
                    raw_disc = subtotal * (coupon.value / Decimal('100.00'))
                    if coupon.max_discount:
                        discount = min(raw_disc, coupon.max_discount)
                    else:
                        discount = raw_disc
                elif coupon.kind == 'flat':
                    discount = min(subtotal, coupon.value)
                elif coupon.kind == 'free_delivery':
                    discount = Decimal('0.00')

        discount = round(discount, 2)
        delivery_fee = Decimal('0.00')
        if subtotal > 0 and self.restaurant:
            if self.coupon and self.coupon.kind == 'free_delivery':
                delivery_fee = Decimal('0.00')
            else:
                delivery_fee = self.restaurant.delivery_fee

        taxable = max(Decimal('0.00'), subtotal - discount)
        tax = round(taxable * Decimal('0.05'), 2) # 5% GST (FR-5.6)
        total = round(taxable + delivery_fee + tax, 2)

        eta_minutes = self.restaurant.delivery_min_minutes if self.restaurant else 25

        return {
            'items': lines,
            'bill': {
                'subtotal': f"{subtotal:.2f}",
                'discount': f"{discount:.2f}",
                'delivery_fee': f"{delivery_fee:.2f}",
                'tax': f"{tax:.2f}",
                'total': f"{total:.2f}",
                'coupon_code': coupon_code,
                'coupon_error': coupon_error,
            },
            'eta_minutes': eta_minutes,
            'restaurant_id': self.restaurant.id if self.restaurant else None,
            'restaurant_name': self.restaurant.name if self.restaurant else None,
            'restaurant_min_order': str(self.restaurant.min_order) if self.restaurant else "0.00",
        }


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='+')
    quantity = models.PositiveIntegerField(default=1)
    options = models.ManyToManyField(FoodCustomization, blank=True, related_name='+')
    instructions = models.CharField(max_length=200, blank=True)
    signature = models.CharField(max_length=255)

    class Meta:
        unique_together = ('cart', 'signature')

    def __str__(self):
        return f"{self.food_item.name} x {self.quantity}"
