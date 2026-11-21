from django.urls import path
from . import views

urlpatterns = [
    path('auth/register/', views.register_view, name='auth-register'),
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/token/refresh/', views.token_refresh_view, name='auth-token-refresh'),
    path('auth/logout/', views.logout_view, name='auth-logout'),
    path('auth/password-reset/', views.password_reset_view, name='auth-password-reset'),
    path('auth/otp/request/', views.otp_request_view, name='auth-otp-request'),
    path('auth/otp/verify/', views.otp_verify_view, name='auth-otp-verify'),
    path('auth/profile/', views.profile_view, name='auth-profile'),
    path('profile/preferences/', views.preferences_view, name='profile-preferences'),
    path('addresses/', views.addresses_list_create, name='addresses-list-create'),
    path('addresses/<int:pk>/', views.address_detail, name='address-detail'),
    path('search/recent/', views.recent_searches_view, name='recent-searches'),
]
