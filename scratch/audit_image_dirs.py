import os

root_dir = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"

primary_dir = os.path.join(root_dir, "Frontend", "images")
primary_files = set(os.listdir(primary_dir)) if os.path.exists(primary_dir) else set()

print(f"Primary image directory ({primary_dir}) contains {len(primary_files)} files:")
for f in sorted(primary_files):
    print(f"  - {f}")

image_dirs = []
for r, dirs, files in os.walk(root_dir):
    if 'venv' in r or '.git' in r:
        continue
    for d in dirs:
        if d.lower() in ('images', 'img') and os.path.abspath(os.path.join(r, d)) != os.path.abspath(primary_dir):
            image_dirs.append(os.path.join(r, d))

print(f"\nFound {len(image_dirs)} secondary/duplicate image directories:")
for d in image_dirs:
    files_in_d = os.listdir(d)
    print(f"\nDirectory: {d} ({len(files_in_d)} files)")
    for f in sorted(files_in_d):
        in_primary = f in primary_files
        print(f"  - {f} (In Primary: {in_primary})")
