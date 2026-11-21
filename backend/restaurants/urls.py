from django.urls import path
from . import views

urlpatterns = [
    path('cuisines/', views.cuisines_list, name='cuisines-list'),
    path('restaurants/', views.restaurants_list, name='restaurants-list'),
    path('restaurants/<int:pk>/', views.restaurant_detail, name='restaurant-detail'),
    path('offers/', views.offers_list, name='offers-list'),
]
