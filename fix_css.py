import re

with open("apps/automatick-docs/src/styles/docs.css", "r") as f:
    css = f.read()

# 1. Typography
# Swiss grid: All sans
css = css.replace("var(--font-serif)", "var(--font-sans)")

# Remove opsz settings completely
css = re.sub(r"font-variation-settings:\s*'opsz'\s*\d+;", "", css)

# Make headers stronger
css = css.replace("font-weight: 500;", "font-weight: 600;") # Makes h1, h2, etc. 600 weight

# 2. Syntax highlighting (Light)
# key: was #a02800 -> #0055ff (blue)
css = css.replace("color: #a02800;", "color: #0055ff;")
# fn / attr: was #2b6e8f -> #ff0055 (pink-red)
css = css.replace("color: #2b6e8f;", "color: #ff0055;")
# str: was #3d6b4b -> #00cc44 (green)
css = css.replace("color: #3d6b4b;", "color: #00cc44;")
# num: was #c9a227 -> #ffaa00 (orange)
css = css.replace("color: #c9a227;", "color: #ffaa00;")
# comp: was #6a4c93 -> #9900ff (purple)
css = css.replace("color: #6a4c93;", "color: #9900ff;")

# Syntax highlighting (Dark)
# tok-key
css = css.replace("color: #e47a4a;", "color: #88b3ff;")
# tok-fn / tok-attr
css = css.replace("color: #88bcd4;", "color: #ff88aa;")
# tok-str
css = css.replace("color: #88ae95;", "color: #55ff88;")
# tok-num
css = css.replace("color: #e0c267;", "color: #ffd480;")
# tok-comp
css = css.replace("color: #ae95c9;", "color: #cc88ff;")

# 3. Hardcoded border radiuses
css = css.replace("border-radius: 2px;", "border-radius: 0;")
css = css.replace("border-radius: 4px;", "border-radius: 0;")
css = css.replace("border-radius: 6px;", "border-radius: 0;")

# 4. Remove emojis
css = css.replace("'▶'", "'+'")

# 5. Fix italic comments in syntax to be normal for rigorous look
css = css.replace("font-style: italic;", "font-style: normal;")

with open("apps/automatick-docs/src/styles/docs.css", "w") as f:
    f.write(css)
