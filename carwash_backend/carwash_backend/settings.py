import os
import sys
from pathlib import Path
from datetime import timedelta
from decouple import config, Csv
import dj_database_url
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Add apps folder to Python path for clean modular imports
APPS_DIR = BASE_DIR / 'apps'
sys.path.insert(0, str(APPS_DIR))

# Path to Frontend Directory
FRONTEND_DIR = BASE_DIR.parent / 'Frontend'

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-carwash-default-key')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*', cast=Csv())

# Merchant UPI Payment Configuration
MERCHANT_UPI_ID = config('MERCHANT_UPI_ID', default='7032446215-5@ibl')
MERCHANT_BUSINESS_NAME = config('MERCHANT_BUSINESS_NAME', default='Rudra Doorstep Express')

# Custom User Model Configuration
AUTH_USER_MODEL = 'accounts.User'

# Application definition
INSTALLED_APPS = [
    # Django Core Apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party Packages
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # Custom Modular Apps
    'accounts.apps.AccountsConfig',
    'services.apps.ServicesConfig',
    'bookings.apps.BookingsConfig',
    'contact.apps.ContactConfig',
    'reviews.apps.ReviewsConfig',
    'gallery.apps.GalleryConfig',
    'dashboard.apps.DashboardConfig',
]

class DisableCacheMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

MIDDLEWARE = [
    'carwash_backend.settings.DisableCacheMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS Middleware
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'carwash_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
            FRONTEND_DIR,
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'carwash_backend.wsgi.application'

# Database Configuration (Neon PostgreSQL & Dynamic DATABASE_URL support)
DEFAULT_NEON_URL = 'postgresql://neondb_owner:npg_Pe1mU2qfQBvk@ep-odd-tooth-ay5a87mb.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
raw_db_url = config('DATABASE_URL', default=DEFAULT_NEON_URL)
if not raw_db_url or str(raw_db_url).strip() in ('', '""', "''", 'null', 'None'):
    raw_db_url = DEFAULT_NEON_URL

DATABASE_URL = str(raw_db_url).strip()

DATABASES = {
    'default': dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
        ssl_require=True if ('neon.tech' in DATABASE_URL or 'sslmode=require' in DATABASE_URL) else False
    )
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# Simple JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:3000,http://127.0.0.1:3000,http://127.0.0.1:8000,http://localhost:8000',
    cast=Csv()
)
CORS_ALLOW_ALL_ORIGINS = True  # Allows smooth cross-origin API calls during development
CORS_ALLOW_CREDENTIALS = True

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
if FRONTEND_DIR.exists():
    STATICFILES_DIRS.append(FRONTEND_DIR)
STATICFILES_STORAGE = "whitenoise.storage.CompressedStaticFilesStorage"    
WHITENOISE_MAX_AGE = 0
WHITENOISE_INDEX_FILE = True

# Media files (Uploaded User Data)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
