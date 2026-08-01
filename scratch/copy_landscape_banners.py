import shutil
import os

img1_src = r"C:\Users\admin\.gemini\antigravity\brain\998efe92-cfc3-4a5b-8f47-974a7564f6f7\foam_wash_banner_1785566755950.jpg"
img2_src = r"C:\Users\admin\.gemini\antigravity\brain\998efe92-cfc3-4a5b-8f47-974a7564f6f7\water_wash_banner_1785566774259.jpg"
img3_src = r"C:\Users\admin\.gemini\antigravity\brain\998efe92-cfc3-4a5b-8f47-974a7564f6f7\vacuum_detail_banner_1785566791106.jpg"

target_dirs = [
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\images",
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\pages\images",
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\assets\images",
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\static\images",
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\media\images"
]

filenames = [
    ("car-banner-1.jpg", img1_src),
    ("car-banner-2.jpg", img2_src),
    ("car-banner-3.jpg", img3_src),
    ("car 10.jpeg", img1_src),
    ("car 12.png", img2_src),
    ("car 16.png", img3_src)
]

for d in target_dirs:
    os.makedirs(d, exist_ok=True)
    for name, src in filenames:
        dest = os.path.join(d, name)
        shutil.copy2(src, dest)
        print(f"Copied {name} -> {d}")

print("Landscape banner images deployed to all project directories successfully.")
