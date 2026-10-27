"""Shared helpers for the iOS build scripts (not meant to be run directly)."""
import glob
import json
import os
import plistlib
import shutil
import subprocess
import sys
import tempfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
IOS_APP_DIR = os.path.join(REPO_ROOT, "ios", "App")
SIGNING_DIR = os.path.join(REPO_ROOT, "ios_code_signing")
BINARIES_DIR = os.path.join(SCRIPT_DIR, "binaries")

BUNDLE_ID = "com.sviy-dlya-svoih.ios"
TEAM_ID = "957LXSXH3D"
SIGNING_IDENTITY = "Apple Distribution: Mila Timashova (957LXSXH3D)"
SERVER_URL = "https://sviydlyasvoih.com.ua"
APP_NAME = "Свій для Своїх"


def run(cmd, **kwargs):
    print("+", " ".join(cmd))
    return subprocess.run(cmd, check=True, **kwargs)


def install_profile(profile_path):
    """Copy a .mobileprovision into Xcode's profile folder under its UUID."""
    decoded = subprocess.run(["security", "cms", "-D", "-i", profile_path],
                             capture_output=True, check=True).stdout
    uuid = plistlib.loads(decoded)["UUID"]
    dest_dir = os.path.expanduser("~/Library/MobileDevice/Provisioning Profiles")
    os.makedirs(dest_dir, exist_ok=True)
    shutil.copy(profile_path, os.path.join(dest_dir, f"{uuid}.mobileprovision"))


def prepare_web_assets():
    """Generate the gitignored files Capacitor normally creates with `cap sync`."""
    app_dir = os.path.join(IOS_APP_DIR, "App")
    public_dir = os.path.join(app_dir, "public")
    shutil.rmtree(public_dir, ignore_errors=True)
    shutil.copytree(os.path.join(REPO_ROOT, "out"), public_dir)
    with open(os.path.join(app_dir, "capacitor.config.json"), "w") as f:
        json.dump({"appId": BUNDLE_ID, "appName": APP_NAME, "webDir": "out",
                   "server": {"url": SERVER_URL, "cleartext": False}}, f, ensure_ascii=False)
    with open(os.path.join(app_dir, "config.xml"), "w") as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n'
                '<widget version="1.0.0" xmlns="http://www.w3.org/ns/widgets" '
                'xmlns:cdv="http://cordova.apache.org/ns/1.0">\n  <access origin="*" />\n</widget>\n')


def build_and_export(profile_file, profile_name, export_method, output_name):
    """Archive the app signed with `profile_name`, export it and save into binaries/."""
    install_profile(os.path.join(SIGNING_DIR, profile_file))
    prepare_web_assets()
    os.makedirs(BINARIES_DIR, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="svoi-ios-") as tmp:
        archive = os.path.join(tmp, "App.xcarchive")
        run(["xcodebuild", "archive", "-project", "App.xcodeproj", "-scheme", "App",
             "-configuration", "Release", "-destination", "generic/platform=iOS",
             "-archivePath", archive, "-derivedDataPath", os.path.join(tmp, "dd"),
             "CODE_SIGN_STYLE=Manual", f"CODE_SIGN_IDENTITY={SIGNING_IDENTITY}",
             f"DEVELOPMENT_TEAM={TEAM_ID}", f"PROVISIONING_PROFILE_SPECIFIER={profile_name}",
             f"PRODUCT_BUNDLE_IDENTIFIER={BUNDLE_ID}"], cwd=IOS_APP_DIR)

        options = os.path.join(tmp, "ExportOptions.plist")
        with open(options, "wb") as f:
            plistlib.dump({"method": export_method, "teamID": TEAM_ID, "signingStyle": "manual",
                           "signingCertificate": "Apple Distribution",
                           "provisioningProfiles": {BUNDLE_ID: profile_name},
                           "compileBitcode": False, "uploadSymbols": False}, f)
        export_dir = os.path.join(tmp, "export")
        run(["xcodebuild", "-exportArchive", "-archivePath", archive,
             "-exportOptionsPlist", options, "-exportPath", export_dir])

        ipa = glob.glob(os.path.join(export_dir, "*.ipa"))
        if not ipa:
            sys.exit("Export finished but no .ipa was produced.")
        dest = os.path.join(BINARIES_DIR, output_name)
        shutil.copy(ipa[0], dest)
    print(f"\nIPA saved to {dest}")
    return dest
