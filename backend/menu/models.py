from django.db import models
from restaurants.models import Restaurant

class FoodCategory(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100) # Starters, Main Course, Desserts, Beverages, etc.
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('restaurant', 'name')
        ordering = ['sort_order', 'name']

    def __str__(self):
        return f"{self.restaurant.name} - {self.name}"


class FoodItem(models.Model):
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='food_items')
    category = models.ForeignKey(FoodCategory, on_delete=models.SET_NULL, null=True, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.CharField(max_length=500, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2) # Greater than zero
    is_veg = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=4.80)
    prep_time_minutes = models.PositiveIntegerField(default=20)
    tag = models.CharField(max_length=50, blank=True, default='Chef Special')
    is_trending = models.BooleanField(default=False)
    is_chef_special = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['restaurant', 'category']),
            models.Index(fields=['is_available', 'is_veg']),
            models.Index(fields=['name']),
        ]
        ordering = ['-is_trending', '-rating', 'name']

    def __str__(self):
        return f"{self.name} (₹{self.price})"


class FoodCustomization(models.Model):
    KIND_CHOICES = [
        ('portion', 'Portion Size'),
        ('spice', 'Spice Level'),
        ('extra', 'Extra / Add-on'),
    ]

    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, related_name='customizations')
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    name = models.CharField(max_length=100)
    price_delta = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    is_default = models.BooleanField(default=False)

    class Meta:
        ordering = ['kind', 'price_delta', 'name']

    def __str__(self):
        sign = f"+₹{self.price_delta}" if self.price_delta > 0 else "₹0"
        return f"{self.food_item.name} - [{self.kind}] {self.name} ({sign})"
