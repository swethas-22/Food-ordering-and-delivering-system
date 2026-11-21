from django.urls import path
from . import views

urlpatterns = [
    path('orders/', views.orders_collection, name='orders-collection'),
    path('orders/<int:pk>/', views.order_detail, name='order-detail'),
    path('orders/<int:pk>/tracking/', views.order_tracking, name='order-tracking'),
    path('orders/<int:pk>/cancel/', views.order_cancel, name='order-cancel'),
    path('orders/<int:pk>/reorder/', views.order_reorder, name='order-reorder'),
    path('admin/orders/<int:pk>/advance/', views.order_advance_stage, name='order-advance'),
]
