#!/usr/bin/env python3
"""Launch the app on a connected Android device and capture screenshots for the Play listing.

Usage (from the repository root):
    ./android_screenshots.py                  # launch the installed app, then press Enter per screenshot
    ./android_screenshots.py --install        # first install the newest APK from binaries/
    ./android_screenshots.py --apk path.apk   # ...or a specific APK
    ./android_screenshots.py -s SERIAL        # pick a device when several are connected

Type a name before pressing Enter to name the file (e.g. "feed"); "q" quits.
Screenshots are saved as android_distribution/screenshots/<device>_<n>[_<name>].png (gitignored)
at the device's native resolution; Play accepts 320-3840 px per side, max 2:1 aspect ratio.
Only the Python 3 standard library and `adb` (PATH or the SDK from android/local.properties) are required.
"""
import argparse
import glob
import os
import re
import shutil
import subprocess
import sys
import time

from android_build import ANDROID_DIR, BINARIES_DIR, SCRIPT_DIR
from error_log import guarded

PACKAGE = "com.sviy_dlya_svoih.android"
OUT_DIR = os.path.join(SCRIPT_DIR, "screenshots")


def find_adb():
    adb = shutil.which("adb")
    if adb:
        return adb
    try:
        with open(os.path.join(ANDROID_DIR, "local.properties")) as f:
            sdk = re.search(r"^sdk\.dir=(.+)$", f.read(), re.M).group(1)
    except (OSError, AttributeError):
        sys.exit("adb not found: add it to PATH or set sdk.dir in android/local.properties.")
    adb = os.path.join(sdk, "platform-tools", "adb")
    if not os.path.isfile(adb):
        sys.exit(f"adb not found at {adb}.")
    return adb


def adb(args, serial=None, **kwargs):
    cmd = [find_adb()] + (["-s", serial] if serial else []) + args
    return subprocess.run(cmd, check=True, capture_output=True, stdin=subprocess.DEVNULL, **kwargs)  # adb would otherwise swallow our stdin


def pick_device(serial):
    lines = adb(["devices"], text=True).stdout.splitlines()[1:]
    ready = [l.split()[0] for l in lines if l.endswith("\tdevice")]
    if any(l.endswith("\tunauthorized") for l in lines) and not ready:
        sys.exit("Device is unauthorized: accept the USB debugging prompt on the phone.")
    if serial:
        if serial not in ready:
            sys.exit(f"Device {serial} is not connected (connected: {ready or 'none'}).")
        return serial
    if len(ready) != 1:
        sys.exit(f"Expected one connected device, found {ready or 'none'}; use -s SERIAL.")
    return ready[0]


def capture(serial, path):
    png = adb(["exec-out", "screencap", "-p"], serial).stdout
    if not png.startswith(b"\x89PNG"):
        sys.exit("Screenshot failed: device returned no PNG data.")
    with open(path, "wb") as f:
        f.write(png)


def run(args):
    serial = pick_device(args.s)
    model = adb(["shell", "getprop", "ro.product.model"], serial, text=True).stdout.strip().replace(" ", "")
    print(f"Device: {serial} ({model})")

    apk = args.apk or (max(glob.glob(os.path.join(BINARIES_DIR, "*.apk")), key=os.path.getmtime, default=None)
                       if args.install else None)
    if args.install and not apk:
        sys.exit(f"No APK in {BINARIES_DIR}; run android_apk_build.py first.")
    if apk:
        print(f"Installing {apk} ...")
        adb(["install", "-r", apk], serial)

    adb(["shell", "am", "force-stop", PACKAGE], serial)
    started = adb(["shell", "monkey", "-p", PACKAGE, "-c", "android.intent.category.LAUNCHER", "1"], serial,
                  text=True).stdout
    if "No activities found" in started:
        sys.exit(f"{PACKAGE} is not installed on the device; use --install.")
    print("App launched. Navigate to a screen on the device, then press Enter to capture.")

    os.makedirs(OUT_DIR, exist_ok=True)
    n = len(glob.glob(os.path.join(OUT_DIR, f"{model}_*.png")))
    while True:
        try:
            label = input("[Enter = capture, name + Enter = capture with name, q = quit] ").strip()
        except EOFError:
            break
        if label.lower() == "q":
            break
        n += 1
        suffix = "_" + re.sub(r"[^\w-]+", "-", label) if label else ""
        path = os.path.join(OUT_DIR, f"{model}_{n:02d}{suffix}.png")
        capture(serial, path)
        print(f"Saved {path}")
        time.sleep(0.2)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("-s", metavar="SERIAL", help="device serial (adb devices)")
    parser.add_argument("--install", action="store_true", help="install the newest APK from binaries/ first")
    parser.add_argument("--apk", help="install this APK first")
    guarded("android_screenshots", run, parser.parse_args())


if __name__ == "__main__":
    main()
