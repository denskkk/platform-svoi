#!/usr/bin/env python3
"""Build, archive and export a signed Ad Hoc IPA (named with version and build) into ios_distribution/binaries/."""
from ios_build import build_and_export

if __name__ == "__main__":
    build_and_export("Sviy_Dlya_Svoih_iOS_AdHoc.mobileprovision", "Sviy_Dlya_Svoih_iOS_AdHoc",
                     "ad-hoc", "SviyDlyaSvoih-AdHoc")
