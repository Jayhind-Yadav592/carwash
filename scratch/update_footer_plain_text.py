import glob
import re

html_files = glob.glob('Frontend/**/*.html', recursive=True) + glob.glob('Frontend/*.html')
html_files = sorted(list(set(html_files)))

new_content_snippet = '''<div class="elevateiq-developer-credit">
          <span class="developer-label">Developed & Maintained By</span>
          <span class="developer-brand-text">ElevateIQ Soft Tech</span>
        </div>'''

pattern = re.compile(
    r'<div class="elevateiq-developer-credit">.*?</div>',
    re.MULTILINE | re.DOTALL
)

replaced_count = 0
for f in html_files:
    if f.endswith('admin-login.html'):
        continue
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    
    if 'elevateiq-developer-credit' in content:
        new_content, count = pattern.subn(new_content_snippet, content)
        if count > 0:
            with open(f, 'w', encoding='utf-8') as fp:
                fp.write(new_content)
            replaced_count += 1
            print(f'Standardized ({count} match): {f}')

# Handle admin-login.html separately
with open('Frontend/pages/admin-login.html', 'r', encoding='utf-8') as fp:
    admin_content = fp.read()

admin_pattern = re.compile(r'<div style="margin-top: 1.25rem; border-top: 1px solid var\(--border-color\); padding-top: 0.85rem; text-align: center;">.*?</div>\s*</div>', re.DOTALL)
admin_snippet = '''<div style="margin-top: 1.25rem; border-top: 1px solid var(--border-color); padding-top: 0.85rem; text-align: center;">
        <div class="developer-label" style="font-family: var(--font-body); font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Developed & Maintained By</div>
        <span class="developer-brand-text">ElevateIQ Soft Tech</span>
      </div>'''

new_admin_content, admin_count = admin_pattern.subn(admin_snippet, admin_content)
if admin_count > 0:
    with open('Frontend/pages/admin-login.html', 'w', encoding='utf-8') as fp:
        fp.write(new_admin_content)
    replaced_count += 1
    print(f'Standardized admin-login.html')

print(f'Total standardized HTML files: {replaced_count}')
