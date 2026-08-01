import os

root_dir = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"

replacements = [
    ("car 10.jpeg", "car 10.jpeg"),
    ("car 12.png", "car 12.png"),
    ("car 16.png", "car 16.png"),
    ("car 10.jpeg", "car 10.jpeg"),
    ("car 12.png", "car 12.png"),
    ("car 16.png", "car 16.png"),
    ("car 10.jpeg", "car 10.jpeg"),
    ("car 12.png", "car 12.png"),
    ("car 16.png", "car 16.png")
]

modified_files = []

for root, dirs, files in os.walk(root_dir):
    if 'venv' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith(('.html', '.js', '.py', '.json')):
            fpath = os.path.join(root, f)
            try:
                with open(fpath, 'r', encoding='utf-8') as fp:
                    content = fp.read()
                
                new_content = content
                for old, new in replacements:
                    new_content = new_content.replace(old, new)
                
                if new_content != content:
                    with open(fpath, 'w', encoding='utf-8') as fp:
                        fp.write(new_content)
                    modified_files.append(fpath)
                    print(f"Updated: {fpath}")
            except Exception as e:
                print(f"Error reading {fpath}: {e}")

print(f"\nTotal files updated: {len(modified_files)}")
