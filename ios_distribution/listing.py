"""Shared by upload_listing_to_appstore.py and upload_listing_to_google_play.py (not meant to be run directly)."""
import glob
import os
import re
import sys


def read_blocks(path):
    """Parse '=== Field (≤ N chars) ===' (txt) or '## Field (≤ N chars)' (md) blocks into {field: text}.

    Exits if a block is longer than the limit written in its header, before anything is uploaded.
    """
    with open(path, encoding="utf-8") as f:
        parts = re.split(r"^(?:=== *(.+?) *===|## +(.+?)) *$", f.read(), flags=re.M)
    blocks = {}
    for i in range(1, len(parts), 3):
        header, text = parts[i] or parts[i + 1], parts[i + 2].strip()
        name = re.sub(r"\s*\(.*?\)", "", header)
        limit = re.search(r"≤ *(\d+)", header)
        if limit and len(text) > int(limit.group(1)):
            sys.exit(f"{path}: '{name}' is {len(text)} chars, the limit is {limit.group(1)}.")
        blocks[name] = text
    return blocks


def latest_dir(root):
    """The highest-numbered vN folder in root (screenshots/v1, v2, ...)."""
    dirs = glob.glob(os.path.join(root, "v[0-9]*"))
    if not dirs:
        sys.exit(f"No vN folder in {root}.")
    return max(dirs, key=lambda d: int(os.path.basename(d)[1:]))


def images(folder):
    return sorted(f for ext in ("png", "jpg", "jpeg") for f in glob.glob(os.path.join(folder, f"*.{ext}")))
