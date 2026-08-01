import glob
import re

html_files = glob.glob('Frontend/**/*.html', recursive=True) + glob.glob('Frontend/*.html')
html_files = sorted(list(set(html_files)))

new_content_snippet = '''<div class="elevateiq-developer-credit">
          <span class="developer-label">Developed & Maintained By</span>
          <a href="https://elevateiq.tech" target="_blank" class="developer-brand-text" title="ELEVETEIQ Soft TECH">ELEVETEIQ Soft TECH</a>
        </div>'''

pattern = re.compile(
    r'<div class="elevateiq-developer-credit">\s*<span class="developer-label">Developed (?:&amp;|&) Maintained By</span>\s*<a [^>]+><img [^>]+></a>\s*</div>',
    re.MULTILINE | re.DOTALL
)

replaced_count = 0
for f in html_files:
    with open(f, 'r', encoding='utf-8') as fp:
        content = fp.read()
    
    if 'elevateiq-developer-credit' in content:
        new_content, count = pattern.subn(new_content_snippet, content)
        if count > 0:
            with open(f, 'w', encoding='utf-8') as fp:
                fp.write(new_content)
            replaced_count += 1
            print(f'Updated ({count} match): {f}')
        else:
            print(f'No regex match in: {f}')

print(f'Total updated HTML files: {replaced_count}')
