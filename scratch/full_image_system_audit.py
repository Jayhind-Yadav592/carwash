import os
import re

root_dir = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"
primary_img_dir = os.path.join(root_dir, "Frontend", "images")
primary_files = set(os.listdir(primary_img_dir)) if os.path.exists(primary_img_dir) else set()

print(f"=== PRIMARY IMAGE DIRECTORY AUDIT ===")
print(f"Path: {primary_img_dir}")
print(f"File Count: {len(primary_files)}")

# 1. Search for any other 'images' or 'img' folders
other_img_dirs = []
for r, dirs, files in os.walk(root_dir):
    if 'venv' in r or '.git' in r:
        continue
    for d in dirs:
        full_d = os.path.join(r, d)
        if d.lower() in ('images', 'img') and os.path.abspath(full_d) != os.path.abspath(primary_img_dir):
            if 'admin' not in full_d.lower() and 'rest_framework' not in full_d.lower():
                other_img_dirs.append(full_d)

print(f"\n=== SECONDARY IMAGE FOLDERS DETECTED: {len(other_img_dirs)} ===")
for d in other_img_dirs:
    print(f"  - {d}")

# 2. Search for all image references in code
image_regex = re.compile(r'["\']?([^"\']+\.(?:jpeg|jpg|png|svg|gif|webp))(?:\?v=\d+)?["\']?', re.IGNORECASE)

issues = []
valid_refs = []

for r, dirs, files in os.walk(root_dir):
    if 'venv' in r or '.git' in r or '__pycache__' in r:
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.css', '.py', '.json')):
            fpath = os.path.join(r, f)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                    for line_num, line in enumerate(fp, 1):
                        matches = image_regex.findall(line)
                        for m in matches:
                            clean_m = m.strip('\'"')
                            if clean_m.startswith('http') or clean_m.startswith('data:'):
                                continue
                            if 'font' in clean_m.lower() or 'bootstrap' in clean_m.lower() or 'fontawesome' in clean_m.lower():
                                continue
                            valid_refs.append((fpath, line_num, clean_m, line.strip()))
                            
                            # Check if reference points to something other than Frontend/images
                            if 'images/' in clean_m or 'img/' in clean_m:
                                basename = os.path.basename(clean_m)
                                if basename not in primary_files and not clean_m.endswith('.svg'):
                                    issues.append((fpath, line_num, clean_m, f"File '{basename}' not found in Frontend/images/"))
            except Exception as e:
                pass

print(f"\n=== TOTAL IMAGE REFERENCES AUDITED: {len(valid_refs)} ===")
print(f"=== BROKEN OR UNMATCHED IMAGE REFERENCES: {len(issues)} ===")
for iss in issues:
    print(f"  [{iss[0]}:{iss[1]}] {iss[2]} -> {iss[3]}")
