#!/usr/bin/env python3
"""Build a signed Google Play App Bundle (named with version and versionCode) into android_distribution/binaries/."""
from android_build import build_aab

if __name__ == "__main__":
    build_aab()
