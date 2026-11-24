#!/usr/bin/env python3
"""Guided App Store screenshot capture from a connected iPhone.

Usage (from anywhere):
    ios_screenshots.py                  # launch the app, then for each screen: you open it, press Enter
    ios_screenshots.py -d <UDID|name>   # pick a device when several are connected
    ios_screenshots.py --only 03 05     # redo just the screens whose names start with these
    ios_screenshots.py --out DIR        # default: materials/app_store/screenshots/v2/source (raw)

iOS can't be tapped from the Mac, so you navigate on the phone. Install the app first with
ios_run_on_device.py. Then run, from the repo root, materials/app_store/compose_screenshots.mjs (FONT_DIR=...) for the
styled iPhone and iPad images.
"""
import argparse
import os
import subprocess

from ios_build import BUNDLE_ID, REPO_ROOT, run
from ios_run_on_device import pick_device

SCREENS = [  # same set and names as materials/google_play/screenshots/v2
    ("01_feed", "News feed"),
    ("02_reels", "Reels"),
    ("03_projects", "Projects"),
    ("04_account", "Account / profile"),
    ("05_create_content_sheet", "The create-content sheet (open it from the + button)"),
    ("06_chat_list", "Messages list"),
]
DEFAULT_OUT = os.path.join(REPO_ROOT, "materials", "app_store", "screenshots", "v2", "source")

if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-d", "--device")
    ap.add_argument("--only", nargs="+", metavar="PREFIX")
    ap.add_argument("--out", default=DEFAULT_OUT)
    args = ap.parse_args()

    udid = pick_device(args.device)
    os.makedirs(args.out, exist_ok=True)
    run(["xcrun", "devicectl", "device", "process", "launch", "--device", udid, "--terminate-existing", BUNDLE_ID])
    for name, hint in SCREENS:
        if args.only and not name.startswith(tuple(args.only)):
            continue
        try:
            input(f"\n[{name}] Open: {hint}. Press Enter to capture (Ctrl-C to stop)... ")
        except (EOFError, KeyboardInterrupt):
            break
        dest = os.path.join(args.out, name + ".png")
        run(["xcrun", "devicectl", "device", "capture", "screenshot", "--device", udid, "--destination", dest])
        subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", dest])
