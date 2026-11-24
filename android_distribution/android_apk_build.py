#!/usr/bin/env python3
"""Build a signed release APK for direct install (named with version and versionCode) into android_distribution/binaries/."""
from android_build import build_apk

if __name__ == "__main__":
    build_apk()
