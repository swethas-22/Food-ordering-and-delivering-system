from django.urls import path
from . import views

urlpatterns = [
    path('reviews/', views.review_create, name='review-create'),
    path('reviews/<int:pk>/', views.review_edit, name='review-edit'),
    path('restaurants/<int:restaurant_id>/reviews/', views.restaurant_reviews, name='restaurant-reviews'),
    path('favorites/', views.favorites_collection, name='favorites-collection'),
    path('favorites/<int:pk>/', views.favorite_delete, name='favorite-delete'),
]
