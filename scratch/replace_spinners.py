import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern for self-closing tags with animate-spin
    # e.g., <Loader2 className="...animate-spin..." />
    # or <div className="...animate-spin..." />
    pattern_self_closing = r'<([a-zA-Z0-9_]+)[^>]*?animate-spin[^>]*?/>'
    
    # Pattern for open-close tags with animate-spin and NO children (or just whitespace)
    # e.g., <div className="...animate-spin..."></div>
    pattern_open_close = r'<([a-zA-Z0-9_]+)[^>]*?animate-spin[^>]*?>\s*</\1>'

    replacement = (
        '<span className="inline-flex items-center justify-center font-bold tracking-widest text-current">\n'
        '  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>\n'
        '  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>\n'
        '  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>\n'
        '</span>'
    )

    new_content = re.sub(pattern_self_closing, replacement, content)
    new_content = re.sub(pattern_open_close, replacement, new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated spinners in {filepath}')

for root, dirs, files in os.walk('d:\\streamit'):
    if 'node_modules' in root or '.next' in root or '.git' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
