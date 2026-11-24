#!/usr/bin/env python3
"""Bump the iOS build number or version in ios/App/App.xcodeproj/project.pbxproj.

Usage (from the repository root):
    ios_bump.py build [N]                    # CURRENT_PROJECT_VERSION: +1, or set to N
    ios_bump.py version major|minor|patch    # MARKETING_VERSION: bump that part
    ios_bump.py version 1.2.0                # ...or set explicitly
Also renames matching ipa files in binaries/ to the new version and build number.
"""
import os
import re
import sys

from bump import bump_build, bump_version, rename_binaries

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PBXPROJ = os.path.join(os.path.dirname(SCRIPT_DIR), "ios", "App", "App.xcodeproj", "project.pbxproj")
BINARIES_DIR = os.path.join(SCRIPT_DIR, "binaries")
BUILD = r"(CURRENT_PROJECT_VERSION = )(\d+)(;)"
VERSION = r"(MARKETING_VERSION = )([\d.]+)(;)"



def read_version():
    with open(PBXPROJ) as f:
        text = f.read()
    return re.search(VERSION, text).group(2), re.search(BUILD, text).group(2)


if __name__ == "__main__":
    kind, arg = (sys.argv[1:] + [None])[:2]
    old = read_version()
    if kind == "build":
        bump_build(PBXPROJ, BUILD, arg)
    elif kind == "version" and arg:
        bump_version(PBXPROJ, VERSION, arg)
    else:
        sys.exit(__doc__)
    rename_binaries(BINARIES_DIR, old, read_version())
