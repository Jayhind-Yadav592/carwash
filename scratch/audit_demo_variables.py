import os

PROJECT_ROOT = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"

search_terms = [
    "dashboardData",
    "defaultStats",
    "demoData",
    "mockData",
    "sampleData",
    "fakeData",
    "8400",
    "8,400",
    "42",
    "18",
    "156",
    "245",
    "45,250"
]

print("=== AUDITING PROJECT FOR DEMO VARIABLES & INITIAL HARDCODED STATES ===")

matches = []
for root, dirs, files in os.walk(PROJECT_ROOT):
    if ".git" in root or "venv" in root or ".gemini" in root or "scratch" in root:
        continue
    for file in files:
        if file.endswith(('.js', '.html', '.css', '.py')):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                for line_idx, line in enumerate(lines, 1):
                    for term in search_terms:
                        if term in line:
                            rel_p = os.path.relpath(filepath, PROJECT_ROOT)
                            matches.append((rel_p, line_idx, term, line.strip()))

if not matches:
    print("NO DEMO VARIABLES OR STATIC DUMMY STRINGS FOUND ANYWHERE!")
else:
    print(f"FOUND {len(matches)} MATCHES:")
    for rel_p, line_idx, term, line_content in matches:
        print(f"[{rel_p}:L{line_idx}] Match '{term}': {line_content[:120]}")
