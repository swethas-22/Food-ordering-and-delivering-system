from django.contrib import admin
from .models import Review, Favorite

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('user', 'restaurant', 'food_item', 'rating', 'created_at')
    list_filter = ('rating', 'restaurant')
    search_fields = ('comment', 'user__email')

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('user', 'restaurant', 'food_item', 'created_at')
    list_filter = ('user',)
