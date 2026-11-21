from django.urls import path
from . import views

urlpatterns = [
    path('cart/', views.cart_view, name='cart-view'),
    path('cart/clear/', views.cart_clear, name='cart-clear'),
    path('cart/items/', views.cart_add_item, name='cart-add-item'),
    path('cart/items/<int:pk>/', views.cart_item_detail, name='cart-item-detail'),
    path('cart/coupon/', views.cart_coupon_view, name='cart-coupon'),
]
