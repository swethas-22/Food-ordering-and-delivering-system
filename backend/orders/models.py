from django.db import models
from decimal import Decimal
import random
import string
from accounts.models import User
from restaurants.models import Restaurant
from menu.models import FoodItem

def generate_order_number():
    num = random.randint(1000, 9999)
    return f"PRC-{num}"

class Order(models.Model):
    STATUS_CHOICES = [
        ('placed', 'Order Placed'),
        ('confirmed', 'Order Confirmed'),
        ('preparing', 'Preparing Food'),
        ('out_for_delivery', 'Out for Delivery'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=50, unique=True, default=generate_order_number)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.PROTECT, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='placed')

    # Delivery Snapshot
    delivery_name = models.CharField(max_length=150)
    delivery_phone = models.CharField(max_length=50)
    delivery_address = models.TextField()
    delivery_instruction = models.CharField(max_length=100, blank=True, default='leave_at_door')

    # Payment Snapshot
    payment_method = models.CharField(max_length=50, default='upi')
    payment_provider = models.CharField(max_length=50, blank=True, default='Google Pay')
    payment_is_simulated = models.BooleanField(default=True)

    # Financials (Server-calculated, DecimalField)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    coupon_code = models.CharField(max_length=50, blank=True, null=True)

    # Simulated Delivery Partner Info (FR-6.5)
    eta_minutes = models.PositiveIntegerField(default=28)
    rider_name = models.CharField(max_length=100, default='Vikram S.')
    rider_rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.90)
    rider_vehicle = models.CharField(max_length=100, default='Ather 450X • KA-05-EV-4921')
    idempotency_key = models.CharField(max_length=255, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['status']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number} ({self.status}) - ₹{self.total}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')
    name = models.CharField(max_length=200)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)
    options_summary = models.CharField(max_length=255, blank=True)
    instructions = models.CharField(max_length=200, blank=True)

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.name} in {self.order.order_number}"


class OrderTracking(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='tracking_history')
    status = models.CharField(max_length=20)
    changed_at = models.DateTimeField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['changed_at']
        unique_together = ('order', 'status')

    def __str__(self):
        return f"{self.order.order_number} -> {self.status}"
