#!/usr/bin/env python3
"""Upload an .aab to Google Play via the Play Developer API (edits).

Authentication: a Google Cloud service account JSON key that has been invited in
Play Console -> Users and permissions with release access to the app. The key is read from
android_code_signing/play_service_account*.json (override: GOOGLE_PLAY_KEY_PATH).
The service account is sviy-dlya-svoih-android-app@poised-charger-515708-g0.iam.gserviceaccount.com. Note that
google_cloud_api_key.txt (an "AIza..." API key) cannot publish apps; the JSON private key of the service account is required.

Usage:
    ./upload_to_google_play.py path/to/app.aab [--track internal] [--status draft]

Default is track=internal, status=draft: the release is created but not rolled out until you
review it in Play Console. Use --status completed to roll out immediately.

Only the Python 3 standard library and the system `openssl` are required.
"""
import argparse
import base64
import glob
import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

from error_log import GoogleApiError, guarded

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SIGNING_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "android_code_signing")
PACKAGE = "com.sviy_dlya_svoih.android"
API = f"https://androidpublisher.googleapis.com/androidpublisher/v3/applications/{PACKAGE}"
UPLOAD_API = f"https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/{PACKAGE}"
SCOPE = "https://www.googleapis.com/auth/androidpublisher"


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def find_key():
    path = os.environ.get("GOOGLE_PLAY_KEY_PATH")
    if not path:
        keys = sorted(glob.glob(os.path.join(SIGNING_DIR, "play_service_account*.json")))
        if not keys:
            sys.exit(f"No play_service_account*.json found in {SIGNING_DIR}. In Google Cloud Console open the service account -> Keys -> Add key -> JSON and save it there (an API key is not enough); or set GOOGLE_PLAY_KEY_PATH.")
        path = keys[0]
    with open(os.path.expanduser(path)) as f:
        return json.load(f)


def request(method, url, token=None, body=None, raw=None, content_type=None, form=None):
    headers = {}
    data = raw
    if body is not None:
        data, content_type = json.dumps(body).encode(), "application/json"
    if form is not None:
        data, content_type = urllib.parse.urlencode(form).encode(), "application/x-www-form-urlencoded"
    if content_type:
        headers["Content-Type"] = content_type
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if method == "POST" and data is None:
        data = b""
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read()
            return json.loads(content) if content else None
    except urllib.error.HTTPError as e:
        raise GoogleApiError(e.code, method, url, e.read().decode(errors="replace")) from None


def get_access_token(key):
    now = int(time.time())
    header = {"alg": "RS256", "typ": "JWT"}
    claims = {"iss": key["client_email"], "scope": SCOPE, "aud": key["token_uri"], "iat": now, "exp": now + 3600}
    signing_input = f"{b64url(json.dumps(header).encode())}.{b64url(json.dumps(claims).encode())}"
    with tempfile.NamedTemporaryFile("w", suffix=".pem") as pem:  # created 0600, deleted on close
        pem.write(key["private_key"])
        pem.flush()
        sig = subprocess.run(["openssl", "dgst", "-sha256", "-sign", pem.name], input=signing_input.encode(),
                             capture_output=True, check=True).stdout
    assertion = f"{signing_input}.{b64url(sig)}"
    resp = request("POST", key["token_uri"], form={
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": assertion})
    return resp["access_token"]


def upload(aab_path, track, status):
    key = find_key()
    print(f"Service account: {key['client_email']}")
    token = get_access_token(key)

    edit = request("POST", f"{API}/edits", token, body={})["id"]
    size = os.path.getsize(aab_path)
    print(f"Uploading {os.path.basename(aab_path)} ({size} bytes) ...")
    with open(aab_path, "rb") as f:
        bundle = request("POST", f"{UPLOAD_API}/edits/{edit}/bundles?uploadType=media", token,
                         raw=f.read(), content_type="application/octet-stream")
    code = bundle["versionCode"]
    print(f"Uploaded: versionCode {code}")

    request("PUT", f"{API}/edits/{edit}/tracks/{track}", token, body={
        "track": track, "releases": [{"versionCodes": [str(code)], "status": status}]})
    request("POST", f"{API}/edits/{edit}:commit", token)
    print(f"Committed to track '{track}' as {status}. Review/roll out in Play Console.")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("aab")
    parser.add_argument("--track", default="internal", help="internal, alpha (closed), beta (open) or production")
    parser.add_argument("--status", default="draft", choices=["draft", "completed", "inProgress", "halted"])
    args = parser.parse_args()
    if not os.path.isfile(args.aab):
        sys.exit(f"File not found: {args.aab}")
    guarded("upload_to_google_play", upload, args.aab, args.track, args.status)


if __name__ == "__main__":
    main()
