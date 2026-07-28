import os
import glob
import re

css_files = []
for root, dirs, files in os.walk("apps/automatick-docs/src"):
    for file in files:
        if file.endswith(".css"):
            css_files.append(os.path.join(root, file))

for filepath in css_files:
    with open(filepath, "r") as f:
        content = f.read()

    # Replace hardcoded colors
    content = content.replace("#efeadd", "var(--bg2)")
    content = content.replace("#f7f3ea", "var(--bg1)")
    content = content.replace("#d7451e", "var(--accent)")
    content = content.replace("#0e1116", "var(--fg1)")

    # Replace all border-radius hardcodes
    content = re.sub(r"border-radius:\s*[1-9]px;", "border-radius: 0;", content)

    with open(filepath, "w") as f:
        f.write(content)
