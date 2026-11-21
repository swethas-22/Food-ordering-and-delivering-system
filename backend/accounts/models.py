from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=150, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if not self.full_name and (self.first_name or self.last_name):
            self.full_name = f"{self.first_name} {self.last_name}".strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email


class Address(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label = models.CharField(max_length=50) # Home, Work, Villa, etc.
    line = models.TextField()
    city = models.CharField(max_length=100, default='Bengaluru')
    pincode = models.CharField(max_length=20, default='560034')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.label}: {self.line[:30]}"


class UserProfile(models.Model):
    DIETARY_CHOICES = [
        ('all', 'All Cuisines'),
        ('veg', 'Pure Vegetarian'),
        ('egg', 'Eggetarian'),
    ]
    THEME_CHOICES = [
        ('midnight', 'Midnight Luxe'),
        ('royal', 'Royal Coastal'),
        ('velvet', 'Velvet Heritage'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    avatar = models.CharField(max_length=500, blank=True, default='')
    dietary_preference = models.CharField(max_length=20, choices=DIETARY_CHOICES, default='all')
    theme = models.CharField(max_length=20, choices=THEME_CHOICES, default='midnight')
    notify_orders = models.BooleanField(default=True)
    notify_offers = models.BooleanField(default=True)
    default_address = models.ForeignKey(Address, on_delete=models.SET_NULL, null=True, blank=True, related_name='+')

    def __str__(self):
        return f"Profile of {self.user.email}"


class RecentSearch(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='recent_searches')
    term = models.CharField(max_length=100)
    searched_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-searched_at']

    def __str__(self):
        return f"{self.user.email} - {self.term}"


class BlacklistedToken(models.Model):
    token = models.CharField(max_length=500, unique=True)
    blacklisted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.token[:30]
