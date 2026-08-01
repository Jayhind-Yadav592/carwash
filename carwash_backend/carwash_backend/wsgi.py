import os
import sys
from django.core.wsgi import get_wsgi_application

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(base_dir, 'apps'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carwash_backend.settings')

application = get_wsgi_application()
