import os
import sys
import django

sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend")
sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\apps")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carwash_backend.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
print("Total Users in DB:", User.objects.count())

admins = User.objects.filter(is_superuser=True) | User.objects.filter(is_staff=True)
print(f"Found {admins.count()} admin/staff users:")
for u in admins:
    print(f"  - Email/Username: '{u.email}' (is_superuser={u.is_superuser}, is_staff={u.is_staff}, role='{getattr(u, 'role', '')}')")
