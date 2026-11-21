from django.contrib import admin
from .models import Coupon, Cart, CartItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'kind', 'value', 'min_subtotal', 'max_discount', 'is_active')
    list_filter = ('kind', 'is_active')
    search_fields = ('code', 'title')

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'restaurant', 'coupon', 'updated_at')
    inlines = [CartItemInline]
