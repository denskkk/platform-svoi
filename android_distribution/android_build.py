"""Shared helpers for the Android build scripts (not meant to be run directly)."""
import filecmp
import os
import re
import shutil
import subprocess
import sys

from error_log import guarded

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)
ANDROID_DIR = os.path.join(REPO_ROOT, "android")
SIGNING_DIR = os.path.join(REPO_ROOT, "android_code_signing")
BINARIES_DIR = os.path.join(SCRIPT_DIR, "binaries")


def run(cmd, **kwargs):
    print("+", " ".join(cmd))
    return subprocess.run(cmd, check=True, **kwargs)


def read_version():
    """versionName and versionCode from android/app/build.gradle."""
    with open(os.path.join(ANDROID_DIR, "app", "build.gradle")) as f:
        text = f.read()
    return re.search(r'versionName\s+"([^"]+)"', text).group(1), re.search(r"versionCode\s+(\d+)", text).group(1)


def ensure_signing_files():
    """android_code_signing/ is the source of truth: Gradle reads android/key.properties and android/release-keystore.jks (both gitignored)."""
    for name in ("key.properties", "release-keystore.jks"):
        src, dest = os.path.join(SIGNING_DIR, name), os.path.join(ANDROID_DIR, name)
        if not os.path.isfile(src):
            sys.exit(f"Missing {src}; get the signing files from a team member.")
        if not (os.path.isfile(dest) and filecmp.cmp(src, dest, shallow=False)):
            shutil.copy(src, dest)
            print(f"Copied {name} to android/")


def _sha1(output):
    m = re.search(r"SHA1:\s*([0-9A-F:]+)", output)
    return m.group(1) if m else None


def verify_signature(artifact):
    """Fail unless the AAB/APK is signed with the release key from android_code_signing/ (guards against a debug-signed build)."""
    props = dict(line.split("=", 1) for line in open(os.path.join(SIGNING_DIR, "key.properties")).read().splitlines() if "=" in line)
    env = dict(os.environ, KS_PW=props["storePassword"])  # via env so it isn't visible in `ps`
    expected = _sha1(subprocess.run(
        ["keytool", "-list", "-v", "-keystore", os.path.join(SIGNING_DIR, "release-keystore.jks"), "-alias", props["keyAlias"],
         "-storepass:env", "KS_PW"], capture_output=True, text=True, check=True, env=env).stdout)
    actual = _sha1(subprocess.run(["keytool", "-printcert", "-jarfile", artifact],
                                  capture_output=True, text=True, check=True).stdout)
    if actual != expected:
        sys.exit(f"{artifact} is not signed with the release key (SHA1 {actual or 'none: unsigned'}, expected {expected}).")
    print(f"Signature OK (SHA1 {actual})")


def _build(gradle_task, output_rel, ext, output_prefix):
    """Run `gradle_task` and save the result as binaries/<output_prefix>_<versionName>_<versionCode>.<ext>."""
    ensure_signing_files()
    os.makedirs(BINARIES_DIR, exist_ok=True)
    run(["npx", "cap", "sync", "android"], cwd=REPO_ROOT)  # regenerates gitignored capacitor.config.json and plugins
    run(["./gradlew", gradle_task], cwd=ANDROID_DIR)
    built = os.path.join(ANDROID_DIR, "app", "build", "outputs", output_rel)
    if not os.path.isfile(built):
        sys.exit(f"Gradle finished but {built} was not produced.")
    verify_signature(built)
    name, code = read_version()
    dest = os.path.join(BINARIES_DIR, f"{output_prefix}_{name}_{code}.{ext}")
    shutil.copy(built, dest)
    print(f"\n{ext.upper()} saved to {dest}")
    return dest


def build_aab():
    """Signed App Bundle for Google Play."""
    return guarded("android_build", _build, "bundleRelease", "bundle/release/app-release.aab", "aab", "SviyDlyaSvoih-Play")


def build_apk():
    """Signed APK for direct install (sideloading / testers)."""
    return guarded("android_build", _build, "assembleRelease", "apk/release/app-release.apk", "apk", "SviyDlyaSvoih-Apk")
