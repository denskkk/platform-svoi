#!/usr/bin/env python3
"""Build, archive and export a signed App Store IPA (named with version and build) into ios_distribution/binaries/."""
from ios_build import build_and_export

if __name__ == "__main__":
    build_and_export("Sviy_Dlya_Svoih_iOS_Distribution.mobileprovision", "Sviy_Dlya_Svoih_iOS_Distribution",
                     "app-store-connect", "SviyDlyaSvoih-AppStore")
