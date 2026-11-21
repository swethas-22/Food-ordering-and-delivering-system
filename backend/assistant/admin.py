from django.contrib import admin
from .models import AIConversation, AIMessage

class AIMessageInline(admin.TabularInline):
    model = AIMessage
    extra = 0

@admin.register(AIConversation)
class AIConversationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'updated_at', 'created_at')
    inlines = [AIMessageInline]

@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'role', 'outcome', 'created_at')
    list_filter = ('role', 'outcome')
