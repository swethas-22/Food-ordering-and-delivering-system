from django.db import models
from django.db.models import Avg
from accounts.models import User
from restaurants.models import Restaurant
from menu.models import FoodItem
from orders.models import Order

class Review(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='reviews')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, related_name='reviews')
    food_item = models.ForeignKey(FoodItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.PositiveSmallIntegerField(default=5) # 1 to 5
    comment = models.TextField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('order', 'food_item')
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalculate restaurant rating (FR-7.5)
        rest_reviews = Review.objects.filter(restaurant=self.restaurant, food_item__isnull=True)
        count = rest_reviews.count()
        avg = rest_reviews.aggregate(Avg('rating'))['rating__avg'] or 5.0
        self.restaurant.rating = round(avg, 2)
        self.restaurant.review_count = count
        self.restaurant.save(update_fields=['rating', 'review_count'])

    def __str__(self):
        return f"{self.rating}★ by {self.user.email} for {self.restaurant.name}"


class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    restaurant = models.ForeignKey(Restaurant, on_delete=models.CASCADE, null=True, blank=True, related_name='favorites')
    food_item = models.ForeignKey(FoodItem, on_delete=models.CASCADE, null=True, blank=True, related_name='favorites')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [('user', 'restaurant'), ('user', 'food_item')]
        ordering = ['-created_at']

    def __str__(self):
        target = self.restaurant.name if self.restaurant else (self.food_item.name if self.food_item else "Unknown")
        return f"{self.user.email} -> {target}"
