from django.contrib import admin
from .models import Cuisine, Restaurant

@admin.register(Cuisine)
class CuisineAdmin(admin.ModelAdmin):
    list_display = ('name', 'sort_order')

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ('name', 'cuisine', 'rating', 'review_count', 'min_order', 'delivery_fee', 'is_pure_veg', 'is_available', 'is_published')
    list_filter = ('cuisine', 'is_pure_veg', 'is_available', 'is_published')
    search_fields = ('name', 'location')
