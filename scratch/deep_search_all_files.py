import os

PROJECT_ROOT = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"

search_terms = ["8,400", "8400", "42", "Rajesh", "Srinivas", "TXN-UPI-984210", "RCW-9026", "25200"]

print("=== DEEP SEARCHING ALL FILES IN WORKSPACE FOR DUMMY DATA ===")

found = []
for root, dirs, files in os.walk(PROJECT_ROOT):
    if ".git" in root or ".gemini" in root or "venv" in root or "scratch" in root:
        continue
    for file in files:
        filepath = os.path.join(root, file)
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                for term in search_terms:
                    if term in content:
                        rel_path = os.path.relpath(filepath, PROJECT_ROOT)
                        found.append((rel_path, term))
        except Exception as e:
            pass

if not found:
    print("NO MATCHES FOUND IN LOCAL WORKSPACE!")
else:
    print(f"FOUND {len(found)} MATCHES:")
    for rel_path, term in found:
        print(f"  - {rel_path} contains '{term}'")
