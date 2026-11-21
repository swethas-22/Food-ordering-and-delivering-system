from django.db import models

class Cuisine(models.Model):
    name = models.CharField(max_length=100, unique=True)
    image = models.CharField(max_length=500, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class Restaurant(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    image = models.CharField(max_length=500, blank=True)
    cuisine = models.ForeignKey(Cuisine, on_delete=models.SET_NULL, null=True, related_name='restaurants')
    secondary_cuisines = models.CharField(max_length=255, blank=True, help_text="Comma-separated secondary cuisines")
    badge = models.CharField(max_length=100, blank=True) # Flagship Kitchen, Michelin Inspired, 100% Pure Veg, etc.
    location = models.CharField(max_length=255)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=5.00)
    review_count = models.PositiveIntegerField(default=0)
    delivery_min_minutes = models.PositiveIntegerField(default=25)
    delivery_max_minutes = models.PositiveIntegerField(default=30)
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=30.00)
    min_order = models.DecimalField(max_digits=6, decimal_places=2, default=249.00)
    is_pure_veg = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['cuisine', 'rating', 'is_available']),
            models.Index(fields=['is_published', 'is_available']),
        ]
        ordering = ['-rating', 'name']

    def __str__(self):
        return self.name

    @property
    def delivery_time_display(self):
        return f"{self.delivery_min_minutes}–{self.delivery_max_minutes} mins"
