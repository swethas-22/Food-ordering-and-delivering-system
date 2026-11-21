from django.contrib import admin
from .models import Order, OrderItem, OrderTracking

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

class OrderTrackingInline(admin.TabularInline):
    model = OrderTracking
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'user', 'restaurant', 'status', 'total', 'payment_method', 'created_at')
    list_filter = ('status', 'payment_method', 'restaurant')
    search_fields = ('order_number', 'delivery_name', 'delivery_phone')
    inlines = [OrderItemInline, OrderTrackingInline]
