#!/usr/bin/env python3
"""Bump the Android versionCode (build number) or versionName in android/app/build.gradle.

Usage (from the repository root):
    android_bump.py build [N]                    # versionCode: +1, or set to N
    android_bump.py version major|minor|patch    # versionName: bump that part
    android_bump.py version 1.4                  # ...or set explicitly
"""
import os
import sys

# bump.py lives in ios_distribution/ so the two platforms share one implementation
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ios_distribution"))
from android_build import BINARIES_DIR, read_version  # noqa: E402
from bump import bump_build, bump_version  # noqa: E402

GRADLE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "android", "app", "build.gradle")
BUILD = r"(versionCode )(\d+)()"
VERSION = r'(versionName ")([\d.]+)(")'


def rename_binaries(old, new):
    """Rename binaries/*_<oldName>_<oldCode>.* to the new version and build number."""
    for f in sorted(os.listdir(BINARIES_DIR)) if os.path.isdir(BINARIES_DIR) else []:
        stem, ext = os.path.splitext(f)
        prefix, name, code = stem.rsplit("_", 2) if stem.count("_") >= 2 else (None, None, None)
        if (name, code) == old:
            dest = f"{prefix}_{new[0]}_{new[1]}{ext}"
            if os.path.exists(os.path.join(BINARIES_DIR, dest)):
                sys.exit(f"Cannot rename {f}: {dest} already exists.")
            os.rename(os.path.join(BINARIES_DIR, f), os.path.join(BINARIES_DIR, dest))
            print(f"Renamed {f} -> {dest} (contents still carry the old version)")


if __name__ == "__main__":
    kind, arg = (sys.argv[1:] + [None])[:2]
    old = read_version()
    if kind == "build":
        bump_build(GRADLE, BUILD, arg)
    elif kind == "version" and arg:
        bump_version(GRADLE, VERSION, arg)
    else:
        sys.exit(__doc__)
    rename_binaries(old, read_version())
