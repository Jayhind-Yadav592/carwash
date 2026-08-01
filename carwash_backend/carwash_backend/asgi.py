import os
import sys
from django.core.asgi import get_asgi_application

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, 'apps'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carwash_backend.settings')

application = get_asgi_application()
