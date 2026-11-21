from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, Address, RecentSearch, BlacklistedToken

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'full_name', 'phone', 'is_staff', 'is_active')
    search_fields = ('email', 'full_name', 'phone')
    ordering = ('email',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'dietary_preference', 'theme', 'notify_orders', 'notify_offers')

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'label', 'city', 'pincode', 'is_default')

@admin.register(RecentSearch)
class RecentSearchAdmin(admin.ModelAdmin):
    list_display = ('user', 'term', 'searched_at')

@admin.register(BlacklistedToken)
class BlacklistedTokenAdmin(admin.ModelAdmin):
    list_display = ('token', 'blacklisted_at')
