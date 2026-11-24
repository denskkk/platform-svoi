#!/usr/bin/env python3
"""Build the Debug app, install it on a connected iPhone/iPad and launch it.

Usage (from anywhere):
    ios_run_on_device.py                 # the only connected device
    ios_run_on_device.py -d <UDID|name>  # pick one when several are connected
    ios_run_on_device.py --console       # stay attached and stream the app's output

Needs the device unlocked, paired, in Developer Mode and listed in the Development profile
(ios_code_signing/), plus the matching "Apple Development" certificate in the keychain.
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile

from ios_build import BUNDLE_ID, IOS_APP_DIR, SIGNING_DIR, TEAM_ID, install_profile, prepare_web_assets, run

PROFILE_FILE = "Sviy_Dlya_Svoih_iOS_Development.mobileprovision"
PROFILE_NAME = "Sviy_Dlya_Svoih_iOS_Development"

DERIVED = os.path.join(tempfile.gettempdir(), "svoi-ios-debug")  # kept between runs for incremental builds


def connected_devices():
    with tempfile.NamedTemporaryFile(suffix=".json") as out:
        run(["xcrun", "devicectl", "list", "devices", "--json-output", out.name, "-q"])
        devices = json.load(out)["result"]["devices"]
    return [d for d in devices
            if d["hardwareProperties"].get("reality") == "physical"
            and d["connectionProperties"].get("pairingState") == "paired"
            and d["connectionProperties"].get("tunnelState") != "unavailable"]


def pick_device(wanted):
    devices = connected_devices()
    if wanted:
        devices = [d for d in devices if wanted in (d["hardwareProperties"]["udid"], d["deviceProperties"]["name"])]
    if len(devices) != 1:
        names = ", ".join(f'{d["deviceProperties"]["name"]} ({d["hardwareProperties"]["udid"]})' for d in devices)
        sys.exit(f"Expected exactly one device, found {len(devices)}: {names or 'none'}. Use -d.")
    return devices[0]["hardwareProperties"]["udid"]


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-d", "--device", help="UDID or name of the device")
    ap.add_argument("--console", action="store_true", help="stream the app's stdout/stderr")
    args = ap.parse_args()

    udid = pick_device(args.device)
    install_profile(os.path.join(SIGNING_DIR, PROFILE_FILE))
    prepare_web_assets()
    run(["xcodebuild", "build", "-project", "App.xcodeproj", "-scheme", "App", "-configuration", "Debug",
         "-destination", f"id={udid}", "-derivedDataPath", DERIVED, "CODE_SIGN_STYLE=Manual",
         "CODE_SIGN_IDENTITY=Apple Development", f"DEVELOPMENT_TEAM={TEAM_ID}",
         f"PROVISIONING_PROFILE_SPECIFIER={PROFILE_NAME}", f"PRODUCT_BUNDLE_IDENTIFIER={BUNDLE_ID}"], cwd=IOS_APP_DIR)
    app = os.path.join(DERIVED, "Build", "Products", "Debug-iphoneos", "App.app")
    run(["xcrun", "devicectl", "device", "install", "app", "--device", udid, app])
    run(["xcrun", "devicectl", "device", "process", "launch", "--device", udid, "--terminate-existing"]
        + (["--console"] if args.console else []) + [BUNDLE_ID])
