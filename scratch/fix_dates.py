import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def repl(m):
        inner = m.group(1)
        # Avoid empty, strings, or double replacing
        if not inner or inner.startswith('"') or inner.startswith("'") or inner.startswith("`"):
            return m.group(0)
        if 'typeof' in inner or 'replace' in inner:
            return m.group(0)
        
        # If the parameter is inside another call, it might be safer to check
        # But this regex should be safe for simple vars.
        return f'new Date(typeof {inner} === "string" ? {inner}.replace(/ /g, "T") : {inner})'

    new_content = re.sub(r'new Date\(([^)]*)\)', repl, content)

    # Also fix youtube iframe autoplay
    if 'youtube.com/embed/' in new_content and 'autoplay=1' in new_content and 'mute=1' not in new_content:
        new_content = new_content.replace('autoplay=1', 'autoplay=1&mute=1')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {filepath}')

for root, dirs, files in os.walk('d:\\streamit\\app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
