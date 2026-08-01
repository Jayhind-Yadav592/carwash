import os
import shutil
import subprocess

PROJECT_ROOT = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "Frontend")
STATICFILES_DIR = os.path.join(PROJECT_ROOT, "carwash_backend", "staticfiles")
BACKEND_DIR = os.path.join(PROJECT_ROOT, "carwash_backend")

print("=== SYNCING CLEAN FRONTEND FILES TO CARWASH_BACKEND/STATICFILES/ ===")

# 1. Sync admin directory
src_admin = os.path.join(FRONTEND_DIR, "admin")
dst_admin = os.path.join(STATICFILES_DIR, "admin")

for root, dirs, files in os.walk(src_admin):
    rel_path = os.path.relpath(root, src_admin)
    target_dir = os.path.join(dst_admin, rel_path)
    os.makedirs(target_dir, exist_ok=True)
    for f in files:
        src_file = os.path.join(root, f)
        dst_file = os.path.join(target_dir, f)
        shutil.copy2(src_file, dst_file)
        print(f"Copied: admin/{os.path.join(rel_path, f)} -> staticfiles/admin/{os.path.join(rel_path, f)}")

# 2. Sync js directory
src_js = os.path.join(FRONTEND_DIR, "js")
dst_js = os.path.join(STATICFILES_DIR, "js")
if os.path.exists(src_js):
    for root, dirs, files in os.walk(src_js):
        rel_path = os.path.relpath(root, src_js)
        target_dir = os.path.join(dst_js, rel_path)
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            src_file = os.path.join(root, f)
            dst_file = os.path.join(target_dir, f)
            shutil.copy2(src_file, dst_file)
            print(f"Copied: js/{os.path.join(rel_path, f)} -> staticfiles/js/{os.path.join(rel_path, f)}")

# 3. Sync pages directory
src_pages = os.path.join(FRONTEND_DIR, "pages")
dst_pages = os.path.join(STATICFILES_DIR, "pages")
if os.path.exists(src_pages):
    for root, dirs, files in os.walk(src_pages):
        rel_path = os.path.relpath(root, src_pages)
        target_dir = os.path.join(dst_pages, rel_path)
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            src_file = os.path.join(root, f)
            dst_file = os.path.join(target_dir, f)
            shutil.copy2(src_file, dst_file)
            print(f"Copied: pages/{os.path.join(rel_path, f)} -> staticfiles/pages/{os.path.join(rel_path, f)}")

# 4. Copy root HTML and JS/CSS files
for root_file in ["index.html", "script.js", "style.css"]:
    src_f = os.path.join(FRONTEND_DIR, root_file)
    dst_f = os.path.join(STATICFILES_DIR, root_file)
    if os.path.exists(src_f):
        shutil.copy2(src_f, dst_f)
        print(f"Copied: {root_file} -> staticfiles/{root_file}")

print("\n=== RUNNING COLLECTSTATIC IN DJANGO ===")
res = subprocess.run(["python", "manage.py", "collectstatic", "--noinput"], cwd=BACKEND_DIR, capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)

print("\n=== VERIFYING DUMMY DATA SCAN ACROSS BACKEND STATICFILES ===")
found_count = 0
terms = ["Rajesh", "Srinivas", "TXN-UPI-984210", "RCW-9026", "25200", "8400"]
for root, dirs, files in os.walk(STATICFILES_DIR):
    for file in files:
        if file.endswith(('.html', '.js', '.css', '.json')) and not root.endswith('rest_framework'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for term in terms:
                    if term in content:
                        found_count += 1
                        print(f"Found '{term}' in {os.path.relpath(filepath, PROJECT_ROOT)}")

print(f"\nFinal Audit Result: {found_count} instances of dummy data in staticfiles.")
