from django.urls import path
from . import views

urlpatterns = [
    path('restaurants/<int:restaurant_id>/menu/', views.restaurant_menu_view, name='restaurant-menu'),
    path('food-items/', views.food_items_list, name='food-items-list'),
    path('food-items/<int:pk>/', views.food_item_detail, name='food-item-detail'),
]
