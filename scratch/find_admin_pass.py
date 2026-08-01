import os
import sys
import django

sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend")
sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\apps")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carwash_backend.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
admin = User.objects.filter(email='admin@gmail.com').first()

if admin:
    print("Found admin user:", admin.email)
    common_passwords = ['admin', 'admin123', 'Admin@123', 'admin@123', '123456', 'Jay@3354', 'password', 'adminpass', 'admin@gmail.com']
    matched = False
    for p in common_passwords:
        if admin.check_password(p):
            print(f"MATCHED PASSWORD: '{p}'")
            matched = True
            break
    if not matched:
        print("Password is not in common list. Setting password to 'admin123' now...")
        admin.set_password("admin123")
        admin.save()
        print("Password successfully set to 'admin123'!")
else:
    print("Admin user not found. Creating admin user now...")
    admin = User.objects.create_superuser(email="admin@gmail.com", password="admin123")
    print("Created admin user: admin@gmail.com / admin123")
