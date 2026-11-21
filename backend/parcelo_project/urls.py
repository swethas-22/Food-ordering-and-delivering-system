from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/', include('restaurants.urls')),
    path('api/', include('menu.urls')),
    path('api/', include('cart.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('reviews.urls')),
    path('api/assistant/', include('assistant.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets')
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# SPA fallback for React router
urlpatterns += [
    re_path(r'^(?!api/|admin/|media/|assets/).*$', TemplateView.as_view(template_name='index.html')),
]
