import os
import sys
import django

sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend")
sys.path.insert(0, r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\apps")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carwash_backend.settings")
django.setup()

from bookings.models import Booking, Payment, Notification
from contact.models import ContactMessage
from reviews.models import Review
from accounts.models import User

print("=== CLEARING ALL TEST / DUMMY DATABASE RECORDS FROM NEON POSTGRESQL ===")

# Delete all Payments, Notifications, Bookings
pay_count, _ = Payment.objects.all().delete()
print(f"Deleted {pay_count} Payment records.")

notif_count, _ = Notification.objects.all().delete()
print(f"Deleted {notif_count} Notification records.")

book_count, _ = Booking.objects.all().delete()
print(f"Deleted {book_count} Booking records.")

# Delete all Contact Messages & Reviews
contact_count, _ = ContactMessage.objects.all().delete()
print(f"Deleted {contact_count} Contact Messages.")

review_count, _ = Review.objects.all().delete()
print(f"Deleted {review_count} Review records.")

# Keep only Admin user
non_admin_users = User.objects.filter(is_superuser=False, is_staff=False)
user_count, _ = non_admin_users.delete()
print(f"Deleted {user_count} Non-Admin User accounts.")

print("\n=== VERIFYING CLEAN DATABASE STATE ===")
print("Remaining Bookings:", Booking.objects.count())
print("Remaining Payments:", Payment.objects.count())
print("Remaining Notifications:", Notification.objects.count())
print("Remaining Contact Messages:", ContactMessage.objects.count())
print("Remaining Reviews:", Review.objects.count())
print("Remaining Users:", User.objects.count())
