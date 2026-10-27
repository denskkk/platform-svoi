#!/usr/bin/env python3
"""Upload an .ipa to App Store Connect via the REST API (Build Uploads).

Authentication note: the App Store Connect REST API does NOT accept an Apple ID
email/password. It only accepts a JWT signed with an API key created at
App Store Connect -> Users and Access -> Integrations -> Team Keys
(Issuer ID, Key ID and the downloaded AuthKey_XXXX.p8 file).
The key is read from AuthKey_*.p8 next to this script (Key ID taken from the file
name); the Issuer ID comes from $ASC_ISSUER_ID, .env next to this script, or a prompt. Overrides:
ASC_KEY_PATH, ASC_KEY_ID.

Usage:
    ./upload_to_appstore.py path/to/App.ipa                 # REST API (API key)
    ./upload_to_appstore.py path/to/App.ipa --apple-id      # Apple ID + app-specific
                                                            # password via `xcrun altool`

Only the Python 3 standard library and the system `openssl` / `unzip` / `plutil`
are required.
"""
import argparse
import base64
import getpass
import glob
import json
import os
import plistlib
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
API = "https://api.appstoreconnect.apple.com"


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def der_to_raw_ecdsa(der: bytes, size: int = 32) -> bytes:
    """Convert an ASN.1 DER ECDSA signature to the raw r||s form JWT requires."""
    assert der[0] == 0x30
    idx = 2 if der[1] < 0x80 else 2 + (der[1] & 0x7F)
    parts = []
    for _ in range(2):
        assert der[idx] == 0x02
        length = der[idx + 1]
        value = der[idx + 2 : idx + 2 + length]
        parts.append(value.lstrip(b"\x00").rjust(size, b"\x00"))
        idx += 2 + length
    return b"".join(parts)


def make_token(issuer_id: str, key_id: str, p8_path: str) -> str:
    header = {"alg": "ES256", "kid": key_id, "typ": "JWT"}
    now = int(time.time())
    payload = {"iss": issuer_id, "iat": now, "exp": now + 15 * 60, "aud": "appstoreconnect-v1"}
    signing_input = f"{b64url(json.dumps(header).encode())}.{b64url(json.dumps(payload).encode())}"
    der = subprocess.run(
        ["openssl", "dgst", "-sha256", "-sign", p8_path],
        input=signing_input.encode(), capture_output=True, check=True,
    ).stdout
    return f"{signing_input}.{b64url(der_to_raw_ecdsa(der))}"


def request(method, url, token=None, body=None, headers=None, raw=None):
    hdrs = dict(headers or {})
    data = raw
    if body is not None:
        data = json.dumps(body).encode()
        hdrs["Content-Type"] = "application/json"
    if token:
        hdrs["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            return json.loads(content) if content and resp.headers.get_content_type() == "application/json" else None
    except urllib.error.HTTPError as e:
        sys.exit(f"HTTP {e.code} on {method} {url}\n{e.read().decode(errors='replace')}")


def read_ipa_info(ipa_path):
    with zipfile.ZipFile(ipa_path) as z:
        name = next(n for n in z.namelist() if n.count("/") == 2 and n.endswith(".app/Info.plist"))
        info = plistlib.loads(z.read(name))
    return info["CFBundleIdentifier"], info["CFBundleShortVersionString"], info["CFBundleVersion"]


def load_env_file():
    """Load KEY=VALUE lines from .env next to this script (real env vars win)."""
    path = os.path.join(SCRIPT_DIR, ".env")
    if not os.path.isfile(path):
        return
    with open(path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip("\"'"))


def find_api_key():
    """Locate AuthKey_<KEYID>.p8 next to this script (override with ASC_KEY_PATH)."""
    path = os.environ.get("ASC_KEY_PATH")
    if not path:
        keys = sorted(glob.glob(os.path.join(SCRIPT_DIR, "AuthKey_*.p8")))
        if not keys:
            sys.exit(f"No AuthKey_*.p8 found in {SCRIPT_DIR}; set ASC_KEY_PATH.")
        path = keys[0]
    path = os.path.expanduser(path)
    key_id = os.environ.get("ASC_KEY_ID") or os.path.basename(path)[len("AuthKey_"):-len(".p8")]
    return key_id, path


def upload_rest(ipa_path):
    bundle_id, short_version, build = read_ipa_info(ipa_path)
    print(f"IPA: {bundle_id} {short_version} ({build})")

    key_id, p8_path = find_api_key()
    print(f"API key: {key_id} ({p8_path})")
    issuer_id = os.environ.get("ASC_ISSUER_ID") or input("Issuer ID (App Store Connect -> Integrations): ").strip()
    token = make_token(issuer_id, key_id, p8_path)

    apps = request("GET", f"{API}/v1/apps?filter[bundleId]={bundle_id}", token)
    if not apps["data"]:
        sys.exit(f"No app with bundle id {bundle_id} found in App Store Connect. Create the app record first.")
    app_id = apps["data"][0]["id"]

    upload = request("POST", f"{API}/v1/buildUploads", token, {"data": {
        "type": "buildUploads",
        "attributes": {"cfBundleShortVersionString": short_version, "cfBundleVersion": build, "platform": "IOS"},
        "relationships": {"app": {"data": {"type": "apps", "id": app_id}}},
    }})["data"]

    size = os.path.getsize(ipa_path)
    file_res = request("POST", f"{API}/v1/buildUploadFiles", token, {"data": {
        "type": "buildUploadFiles",
        "attributes": {"fileName": os.path.basename(ipa_path), "fileSize": size,
                       "uti": "com.apple.ipa", "assetType": "ASSET"},
        "relationships": {"buildUpload": {"data": {"type": "buildUploads", "id": upload["id"]}}},
    }})["data"]

    with open(ipa_path, "rb") as f:
        for op in file_res["attributes"]["uploadOperations"]:
            f.seek(op["offset"])
            chunk = f.read(op["length"])
            hdrs = {h["name"]: h["value"] for h in op["requestHeaders"]}
            request(op["method"], op["url"], headers=hdrs, raw=chunk)
            print(f"  uploaded bytes {op['offset']}-{op['offset'] + op['length']} of {size}")

    request("PATCH", f"{API}/v1/buildUploadFiles/{file_res['id']}", token, {"data": {
        "type": "buildUploadFiles", "id": file_res["id"], "attributes": {"uploaded": True},
    }})
    print("Upload committed. Apple will now process the build; check status in App Store Connect / TestFlight.")


def upload_altool(ipa_path):
    apple_id = input("Apple ID email: ").strip()
    password = getpass.getpass("App-specific password (appleid.apple.com): ")
    # Pass the password through the keychain-free env-var reference so it isn't visible in `ps`.
    env = dict(os.environ, ALTOOL_PW=password)
    subprocess.run(
        ["xcrun", "altool", "--upload-app", "--type", "ios", "--file", ipa_path,
         "--username", apple_id, "--password", "@env:ALTOOL_PW"],
        env=env, check=True,
    )


def main():
    load_env_file()
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("ipa")
    parser.add_argument("--apple-id", action="store_true",
                        help="use Apple ID + app-specific password via xcrun altool instead of the REST API")
    args = parser.parse_args()
    if not os.path.isfile(args.ipa):
        sys.exit(f"File not found: {args.ipa}")
    (upload_altool if args.apple_id else upload_rest)(args.ipa)


if __name__ == "__main__":
    main()
