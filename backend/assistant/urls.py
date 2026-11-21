from django.urls import path
from . import views

urlpatterns = [
    path('conversations/', views.conversations_collection, name='ai-conversations'),
    path('conversations/<int:pk>/', views.conversation_detail, name='ai-conversation-detail'),
    path('conversations/<int:pk>/messages/', views.conversation_messages, name='ai-conversation-messages'),
    path('conversations/<int:pk>/clear/', views.conversation_clear_messages, name='ai-conversation-clear'),
]
