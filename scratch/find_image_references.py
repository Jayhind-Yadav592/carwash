import os
import re

root_dir = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"

patterns = [
    r'car\s*2\.(jpeg|jpg|png)',
    r'car\s*3\.(jpeg|jpg|png)',
    r'car\s*4\.(jpeg|jpg|png)',
    r'car\s*10\.(jpeg|jpg|png)',
    r'car\s*12\.(jpeg|jpg|png)',
    r'car\s*16\.(jpeg|jpg|png)',
    r'onerror',
    r'getServices',
    r'renderPackageSelector'
]

matches = []
for root, dirs, files in os.walk(root_dir):
    if 'venv' in root or '.git' in root or '__pycache__' in root:
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.py', '.css', '.json')):
            fpath = os.path.join(root, f)
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                    for i, line in enumerate(fp, 1):
                        for p in patterns:
                            if re.search(p, line, re.IGNORECASE):
                                matches.append(f"{fpath}:{i}: {line.strip()}")
            except Exception as e:
                pass

print(f"Found {len(matches)} matches:")
for m in matches[:100]:
    print(m)
