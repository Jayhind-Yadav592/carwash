import os
import sys
import django

# Setup Django Environment
backend_dir = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend"
apps_dir = os.path.join(backend_dir, "apps")
sys.path.insert(0, backend_dir)
sys.path.insert(0, apps_dir)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'carwash_backend.settings')
django.setup()

from services.models import Service

def update_service_prices():
    services = Service.objects.all()
    updated_count = 0
    
    for s in services:
        p = float(s.price)
        name_lower = s.name.lower()
        
        if p == 400.0 or 'foam & water' in name_lower and not 'vacuum' in name_lower:
            s.price = 399.00
            s.save()
            updated_count += 1
            print(f"Updated Service '{s.name}': Rs.{p} -> Rs.399.00")
        elif p == 600.0 or ('foam' in name_lower and 'vacuum' in name_lower and not 'interior' in name_lower):
            s.price = 599.00
            s.save()
            updated_count += 1
            print(f"Updated Service '{s.name}': Rs.{p} -> Rs.599.00")
        elif p == 700.0 or ('complete' in name_lower or 'interior' in name_lower or 'polish' in name_lower):
            s.price = 699.00
            s.save()
            updated_count += 1
            print(f"Updated Service '{s.name}': Rs.{p} -> Rs.699.00")

    print(f"\nTotal Database Service Records Updated: {updated_count}")

if __name__ == '__main__':
    update_service_prices()
