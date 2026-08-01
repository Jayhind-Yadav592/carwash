from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import api_home_page, frontend_serve_file

urlpatterns = [
    # Specific Frontend Admin Dashboard & Static Asset routes (Must be BEFORE path('admin/', admin.site.urls))
    path('admin/dashboard.html', frontend_serve_file, {'path': 'admin/dashboard.html'}, name='frontend-admin-dashboard'),
    path('admin/dashboard.css', frontend_serve_file, {'path': 'admin/dashboard.css'}, name='frontend-admin-dashboard-css'),
    path('admin/dashboard.js', frontend_serve_file, {'path': 'admin/dashboard.js'}, name='frontend-admin-dashboard-js'),
    path('admin/admin.css', frontend_serve_file, {'path': 'admin/admin.css'}),
    path('admin/admin.js', frontend_serve_file, {'path': 'admin/admin.js'}),
    path('admin-dashboard', frontend_serve_file, {'path': 'admin/dashboard.html'}),

    # API Documentation & Home Pages
    path('api/', api_home_page, name='api-home'),
    path('api/v1/', api_home_page, name='api-v1-home'),

    # Django Admin Interface
    path('admin/', admin.site.urls),

    # JWT Authentication Endpoints
    path('api/v1/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Modular App API Routes
    path('api/v1/accounts/', include('accounts.urls')),
    path('api/v1/services/', include('services.urls')),
    path('api/v1/bookings/', include('bookings.urls')),
    path('api/v1/contact/', include('contact.urls')),
    path('api/v1/reviews/', include('reviews.urls')),
    path('api/v1/gallery/', include('gallery.urls')),
    path('api/v1/dashboard/', include('dashboard.urls')),

    # Root Homepage (Serves Frontend index.html or API Home)
    path('', frontend_serve_file, name='root-homepage'),

    # Serve static frontend pages & assets (css, js, images, pages)
    re_path(r'^(?P<path>.*)$', frontend_serve_file, name='frontend-static-files'),
]

# Serve media & static files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
