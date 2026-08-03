import os
import sys
import django

sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend")
sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\apps")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carwash_backend.settings")
django.setup()

from services.models import Service
from accounts.models import User
from bookings.models import Booking
from contact.models import ContactMessage
from reviews.models import Review
from gallery.models import Gallery

print("=== CHECKING SERVICES IN NEON DB ===")
print("Current service count:", Service.objects.count())

DEFAULT_SERVICES = [
    {
        "name": "Foam & Water Wash",
        "price: 399.00,
        "duration": 45,
        "description": "High-pressure foam wash, pressure water rinse, wheel rim cleaning & microfiber hand dry at your doorstep.",
        "image": "../images/car 10.jpeg?v=2"
    },
    {
        "name": "Water & Foam Wash + Vacuum",
        "price": 500.00,
        "duration": 60,
        "description": "Foam & pressure water exterior wash plus complete cabin & trunk vacuum cleaning.",
        "image": "../images/car 12.png?v=2"
    },
    {
        "name": "Complete Wash + Vacuum + Interior + Tyre Polish",
        "price: 599.00,
        "duration": 75,
        "description": "Complete foam & water wash, full interior sanitization, dashboard dressing, seat steam cleaning & deep black tyre polish.",
        "image": "../images/car 16.png?v=2"
    }
]

for s_data in DEFAULT_SERVICES:
    srv, created = Service.objects.get_or_create(
        name=s_data["name"],
        defaults={
            "price": s_data["price"],
            "duration": s_data["duration"],
            "description": s_data["description"],
            "image": s_data["image"]
        }
    )
    if created:
        print(f"Created Service: {srv.name} (ID: {srv.id})")
    else:
        srv.price = s_data["price"]
        srv.duration = s_data["duration"]
        srv.description = s_data["description"]
        srv.image = s_data["image"]
        srv.save()
        print(f"Updated Service: {srv.name} (ID: {srv.id})")

print("Service count after sync:", Service.objects.count())

print("\n=== CHECKING ADMIN USERS ===")
admin = User.objects.filter(email='admin@gmail.com').first()
if not admin:
    admin = User.objects.create_superuser(email='admin@gmail.com', password='admin123', full_name='Admin User', role='admin')
    print("Created Admin User: admin@gmail.com / admin123")
else:
    admin.is_staff = True
    admin.is_superuser = True
    admin.role = 'admin'
    admin.set_password('admin123')
    admin.save()
    print("Updated Admin User: admin@gmail.com / admin123")

print("\n=== BACKEND DATA AUDIT SUMMARY ===")
print("Users count:", User.objects.count())
print("Services count:", Service.objects.count())
print("Bookings count:", Booking.objects.count())
print("Contact Messages count:", ContactMessage.objects.count())
print("Reviews count:", Review.objects.count())
print("Gallery Items count:", Gallery.objects.count())
