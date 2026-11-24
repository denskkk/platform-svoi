#!/usr/bin/env python3
"""Bump the iOS build number or version in ios/App/App.xcodeproj/project.pbxproj.

Usage (from the repository root):
    ios_bump.py build [N]                    # CURRENT_PROJECT_VERSION: +1, or set to N
    ios_bump.py version major|minor|patch    # MARKETING_VERSION: bump that part
    ios_bump.py version 1.2.0                # ...or set explicitly
"""
import os
import sys

from bump import bump_build, bump_version

PBXPROJ = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "ios", "App", "App.xcodeproj", "project.pbxproj")
BUILD = r"(CURRENT_PROJECT_VERSION = )(\d+)(;)"
VERSION = r"(MARKETING_VERSION = )([\d.]+)(;)"

if __name__ == "__main__":
    kind, arg = (sys.argv[1:] + [None])[:2]
    if kind == "build":
        bump_build(PBXPROJ, BUILD, arg)
    elif kind == "version" and arg:
        bump_version(PBXPROJ, VERSION, arg)
    else:
        sys.exit(__doc__)
