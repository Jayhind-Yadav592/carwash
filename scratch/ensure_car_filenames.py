import shutil
import os

img1_src = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\images\car 10.jpeg"
img2_src = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\images\car 12.png"
img3_src = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\images\car 16.png"

target_dirs = [
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\images",
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\pages\images",
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend\assets\images",
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\static\images",
    r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\carwash_backend\media\images"
]

alias_maps = [
    (img1_src, ["car10.jpg", "car10.jpeg", "car 10.jpeg", "car 10.jpg"]),
    (img2_src, ["car12.jpg", "car12.png", "car 12.png", "car 12.jpg"]),
    (img3_src, ["car16.jpg", "car16.png", "car 16.png", "car 16.jpg"])
]

for d in target_dirs:
    os.makedirs(d, exist_ok=True)
    for src, aliases in alias_maps:
        for alias in aliases:
            dest = os.path.join(d, alias)
            if os.path.abspath(src) != os.path.abspath(dest):
                shutil.copy2(src, dest)
                print(f"Synced {alias} -> {d}")

print("Car image aliases synced successfully.")
