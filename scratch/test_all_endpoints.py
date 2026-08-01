import os
import sys
import json
import django
from django.test import Client

sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend")
sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\apps")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carwash_backend.settings")
django.setup()

client = Client()

# Check Booking Serializer Error Details
payload = {
    "service_id": "1",
    "vehicle_type": "SUV",
    "vehicle_brand": "Hyundai",
    "vehicle_model": "Creta",
    "vehicle_number": "AP07BZ2712",
    "address": "Narasaraopet, AP",
    "booking_date": "2026-08-05",
    "booking_time": "10:00 AM",
    "notes": "Test booking"
}
res = client.post('/api/v1/bookings/', data=json.dumps(payload), content_type="application/json")
print(f"POST /api/v1/bookings/ Status: {res.status_code}")
print("Response JSON:", res.json())
