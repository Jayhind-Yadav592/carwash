import os
import re

PROJECT_ROOT = r"c:\Users\admin\Documents\ElevateIQ_tech\Rudra car wash 2\Rudra car wash"

def audit_and_replace():
    modified_files = []
    
    # Text file extensions to scan
    valid_exts = ('.html', '.js', '.css', '.py', '.json', '.md', '.txt')
    
    # Specific price replacement patterns
    replacements = [
        # Currency symbol variations
        (r'₹\s*400\.00', '₹399.00'),
        (r'₹\s*600\.00', '₹599.00'),
        (r'₹\s*700\.00', '₹699.00'),
        (r'₹\s*400\b', '₹399'),
        (r'₹\s*600\b', '₹599'),
        (r'₹\s*700\b', '₹699'),
        
        # Plain price values in JS/JSON/Python arrays or string literals
        (r"priceFormatted\s*=\s*'400\.00'", "priceFormatted = '399.00'"),
        (r"priceFormatted\s*=\s*'600\.00'", "priceFormatted = '599.00'"),
        (r"priceFormatted\s*=\s*'700\.00'", "priceFormatted = '699.00'"),
        (r"value=[\"']400[\"']", 'value="399"'),
        (r"value=[\"']600[\"']", 'value="599"'),
        (r"value=[\"']700[\"']", 'value="699"'),
        (r"price[\"']?\s*:\s*400\b", 'price: 399'),
        (r"price[\"']?\s*:\s*600\b", 'price: 599'),
        (r"price[\"']?\s*:\s*700\b", 'price: 699'),
        (r"\(₹399\)", '(₹399)'),
        (r"\(₹599\)", '(₹599)'),
        (r"\(₹699\)", '(₹699)'),
        (r"₹399", '₹399'),
        (r"₹599", '₹599'),
        (r"₹699", '₹699'),
    ]

    for root, dirs, files in os.walk(PROJECT_ROOT):
        # Skip node_modules, .git, venv, brain
        if any(skip in root for skip in ['.git', 'node_modules', 'venv', '.gemini', '__pycache__']):
            continue

        for file in files:
            if file.endswith(valid_exts):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    for pattern, repl in replacements:
                        new_content = re.sub(pattern, repl, new_content)
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        modified_files.append(os.path.relpath(filepath, PROJECT_ROOT))
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")
                    
    print(f"Total modified files: {len(modified_files)}")
    for mf in modified_files:
        print(f" - {mf}")

if __name__ == '__main__':
    audit_and_replace()
