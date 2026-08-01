import os
import re

root_dir = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"

img_refs = []

for r, dirs, files in os.walk(root_dir):
    if 'venv' in r or '.git' in r:
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.css', '.py')):
            fpath = os.path.join(r, f)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                for i, line in enumerate(fp, 1):
                    if re.search(r'src=["\'][^"\']*(images|img)[^"\']*["\']', line, re.IGNORECASE) or re.search(r'url\(["\']?[^)]*(images|img)[^)]*["\']?\)', line, re.IGNORECASE):
                        img_refs.append(f"{fpath}:{i}: {line.strip()}")

print(f"Found {len(img_refs)} image references across codebase:")
for ref in img_refs:
    print(ref)
