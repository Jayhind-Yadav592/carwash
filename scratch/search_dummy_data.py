import os
import sys

root_dir = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash\Frontend"

terms = ['Rajesh', 'Srinivas', 'Venkatesh', 'Ramesh', 'Suresh', 'John Doe', 'Demo User', 'RCW-9026', 'TXN-UPI-984210', '25200', '8400', 'Dummy', 'sample']

found = []

for r, dirs, files in os.walk(root_dir):
    for f in files:
        if f.endswith(('.html', '.js', '.css')):
            fpath = os.path.join(r, f)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
                for line_num, line in enumerate(fp, 1):
                    for t in terms:
                        if t.lower() in line.lower():
                            found.append((fpath, line_num, t, line.strip()))

print(f"Found {len(found)} instances of dummy data across Frontend:")
for f in found:
    clean_line = f[3].encode('ascii', 'replace').decode('ascii')
    rel_path = os.path.relpath(f[0], root_dir)
    print(f"  [{rel_path}:{f[1]}] Term '{f[2]}' -> {clean_line[:100]}")
