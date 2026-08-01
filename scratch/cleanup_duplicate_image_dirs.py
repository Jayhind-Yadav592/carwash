import os
import shutil

root_dir = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"
primary_dir = os.path.join(root_dir, "Frontend", "images")

dirs_to_remove = [
    os.path.join(root_dir, "Frontend", "pages", "images"),
    os.path.join(root_dir, "Frontend", "pages", "assets"),
    os.path.join(root_dir, "Frontend", "assets"),
    os.path.join(root_dir, "carwash_backend", "staticfiles", "pages", "images"),
    os.path.join(root_dir, "carwash_backend", "staticfiles", "pages", "assets")
]

deleted_folders = []
deleted_files = []

for d in dirs_to_remove:
    if os.path.exists(d):
        for root, subdirs, files in os.walk(d, topdown=False):
            for f in files:
                filepath = os.path.join(root, f)
                deleted_files.append(filepath)
            for sub in subdirs:
                subpath = os.path.join(root, sub)
                deleted_folders.append(subpath)
        shutil.rmtree(d)
        deleted_folders.append(d)
        print(f"Removed directory tree: {d}")

print(f"\nCleanup complete.")
print(f"Total duplicate folders removed: {len(deleted_folders)}")
print(f"Total duplicate files removed: {len(deleted_files)}")
