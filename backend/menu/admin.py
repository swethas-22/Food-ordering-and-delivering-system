from django.contrib import admin
from .models import FoodCategory, FoodItem, FoodCustomization

class FoodCustomizationInline(admin.TabularInline):
    model = FoodCustomization
    extra = 1

@admin.register(FoodCategory)
class FoodCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'sort_order')
    list_filter = ('restaurant',)

@admin.register(FoodItem)
class FoodItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'restaurant', 'category', 'price', 'is_veg', 'is_available', 'is_trending', 'is_chef_special')
    list_filter = ('restaurant', 'category', 'is_veg', 'is_available', 'is_trending', 'is_chef_special')
    search_fields = ('name', 'description')
    inlines = [FoodCustomizationInline]

@admin.register(FoodCustomization)
class FoodCustomizationAdmin(admin.ModelAdmin):
    list_display = ('food_item', 'kind', 'name', 'price_delta', 'is_default')
    list_filter = ('kind', 'is_default')
