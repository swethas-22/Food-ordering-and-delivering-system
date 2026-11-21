from django.db import models
from accounts.models import User

class AIConversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_conversations')
    title = models.CharField(max_length=100, default='New Culinary Inquiry')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'updated_at']),
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.email} - {self.title}"


class AIMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    OUTCOME_CHOICES = [
        ('ok', 'Ok'),
        ('replaced', 'Replaced'),
        ('error', 'Error'),
    ]

    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    dish_ids = models.JSONField(default=list, blank=True)
    outcome = models.CharField(max_length=20, choices=OUTCOME_CHOICES, default='ok')
    input_tokens = models.PositiveIntegerField(default=0)
    output_tokens = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"[{self.role}] {self.content[:40]}"
