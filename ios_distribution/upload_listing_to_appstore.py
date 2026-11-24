#!/usr/bin/env python3
"""Upload the App Store listing (name, subtitle, promo text, keywords, description, What's New, screenshots).

Reads materials/app_store/: listing_texts.txt and the newest screenshots/vN folder, whose
iphone_6.9/ and ipad_13/ subfolders become the 6.9" iPhone and 13" iPad sets (file-name order).
Same API key as upload_to_appstore.py. Texts go to the editable version (PREPARE_FOR_SUBMISSION or
rejected); the screenshots of each set are replaced, not appended. Nothing is submitted for review.

Usage:
    ./upload_listing_to_appstore.py                  # uk: texts + screenshots
    ./upload_listing_to_appstore.py --version 1.4    # use (or create) the editable version 1.4
    ./upload_listing_to_appstore.py --only texts     # or: --only screenshots
    ./upload_listing_to_appstore.py --dry-run        # show what would be uploaded

What's New cannot be set on the very first version of an app: delete that block from the texts file then.
"""
import argparse
import hashlib
import os
import sys

from error_log import guarded
from ios_build import BUNDLE_ID, REPO_ROOT
from listing import images, latest_dir, read_blocks
from upload_to_appstore import API, find_api_key, load_env_file, make_token, request

MATERIALS = os.path.join(REPO_ROOT, "materials", "app_store")
VERSION_FIELDS = {"Description": "description", "Keywords": "keywords", "Promotional text": "promotionalText",
                  "What's New in This Version": "whatsNew"}
INFO_FIELDS = {"Name": "name", "Subtitle": "subtitle"}
EDITABLE = "PREPARE_FOR_SUBMISSION,DEVELOPER_REJECTED,REJECTED,METADATA_REJECTED"
LIVE = ("READY_FOR_SALE", "READY_FOR_DISTRIBUTION")
DISPLAY_TYPES = {"iphone_6.9": "APP_IPHONE_69", "ipad_13": "APP_IPAD_PRO_3GEN_129"}  # 13" iPad uses the 12.9" slot


def api(method, path, token, body=None):
    return request(method, API + path, token, body)


def data(kind, attributes, id=None, **parents):
    d = {"type": kind, "attributes": attributes}
    if id:
        d["id"] = id
    if parents:
        d["relationships"] = {k: {"data": {"type": k + "s", "id": v}} for k, v in parents.items()}
    return {"data": d}


def upsert(token, kind, parent, parent_id, locale, attrs):
    """Create or update the localization `locale` (kind e.g. appStoreVersionLocalizations, parent e.g. appStoreVersion)."""
    existing = api("GET", f"/v1/{parent}s/{parent_id}/{kind}", token)["data"]
    cur = next((x for x in existing if x["attributes"]["locale"] == locale), None)
    if cur:
        if attrs:
            api("PATCH", f"/v1/{kind}/{cur['id']}", token, data(kind, attrs, cur["id"]))
        return cur["id"]
    return api("POST", f"/v1/{kind}", token, data(kind, {"locale": locale, **attrs}, **{parent: parent_id}))["data"]["id"]


def editable_version(token, app_id, wanted):
    q = f"filter[platform]=IOS&filter[appStoreState]={EDITABLE}" + (f"&filter[versionString]={wanted}" if wanted else "")
    versions = api("GET", f"/v1/apps/{app_id}/appStoreVersions?{q}", token)["data"]
    if versions:
        return versions[0]["id"]
    if not wanted:
        sys.exit("No editable App Store version. Pass --version X.Y to create one.")
    return api("POST", "/v1/appStoreVersions", token, data("appStoreVersions", {"platform": "IOS", "versionString": wanted}, app=app_id))["data"]["id"]


def upload_screenshots(token, loc_id, display, files):
    sets = api("GET", f"/v1/appStoreVersionLocalizations/{loc_id}/appScreenshotSets", token)["data"]
    cur = next((s for s in sets if s["attributes"]["screenshotDisplayType"] == display), None)
    if cur:
        set_id = cur["id"]
        for old in api("GET", f"/v1/appScreenshotSets/{set_id}/appScreenshots", token)["data"]:
            api("DELETE", f"/v1/appScreenshots/{old['id']}", token)
    else:
        set_id = api("POST", "/v1/appScreenshotSets", token, data(
            "appScreenshotSets", {"screenshotDisplayType": display}, appStoreVersionLocalization=loc_id))["data"]["id"]
    for path in files:  # created one by one, so the set keeps file-name order
        with open(path, "rb") as f:
            blob = f.read()
        shot = api("POST", "/v1/appScreenshots", token, data(
            "appScreenshots", {"fileName": os.path.basename(path), "fileSize": len(blob)}, appScreenshotSet=set_id))["data"]
        for op in shot["attributes"]["uploadOperations"]:
            request(op["method"], op["url"], headers={h["name"]: h["value"] for h in op["requestHeaders"]},
                    raw=blob[op["offset"]:op["offset"] + op["length"]])
        api("PATCH", f"/v1/appScreenshots/{shot['id']}", token, data(
            "appScreenshots", {"uploaded": True, "sourceFileChecksum": hashlib.md5(blob).hexdigest()}, shot["id"]))
        print(f"  {display}: uploaded {os.path.basename(path)}")


def upload(locale, version, texts, info_texts, sets):
    load_env_file()
    key_id, p8_path = find_api_key()
    issuer_id = os.environ.get("ASC_ISSUER_ID") or input("Issuer ID (App Store Connect -> Integrations): ").strip()
    token = make_token(issuer_id, key_id, p8_path)

    apps = api("GET", f"/v1/apps?filter[bundleId]={BUNDLE_ID}", token)["data"]
    if not apps:
        sys.exit(f"No app with bundle id {BUNDLE_ID} found in App Store Connect.")
    app_id = apps[0]["id"]

    if info_texts:
        infos = api("GET", f"/v1/apps/{app_id}/appInfos", token)["data"]
        info = next((i for i in infos if (i["attributes"].get("state") or i["attributes"].get("appStoreState")) not in LIVE), infos[0])
        upsert(token, "appInfoLocalizations", "appInfo", info["id"], locale, info_texts)
        print("Name/subtitle updated.")
    version_id = editable_version(token, app_id, version)
    loc_id = upsert(token, "appStoreVersionLocalizations", "appStoreVersion", version_id, locale, texts)
    if texts:
        print("Version texts updated.")
    for display, files in sets.items():
        upload_screenshots(token, loc_id, display, files)
    print("Done. Review and submit in App Store Connect.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--locale", default="uk", help="App Store locale (default uk)")
    ap.add_argument("--version", help="version string of the editable version (created if missing)")
    ap.add_argument("--texts", default=os.path.join(MATERIALS, "listing_texts.txt"))
    ap.add_argument("--screenshots", help="vN folder with iphone_6.9/ and ipad_13/ (default: newest)")
    ap.add_argument("--only", choices=["texts", "screenshots"])
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    texts, info_texts, sets = {}, {}, {}
    if args.only != "screenshots":
        blocks = read_blocks(args.texts)
        texts = {a: blocks[k] for k, a in VERSION_FIELDS.items() if k in blocks}
        info_texts = {a: blocks[k] for k, a in INFO_FIELDS.items() if k in blocks}
        if "description" not in texts:
            sys.exit(f"{args.texts}: no Description block.")
        for k, v in {**info_texts, **texts}.items():
            print(f"{k}: {v[:60]!r} ({len(v)} chars)")
    if args.only != "texts":
        folder = args.screenshots or latest_dir(os.path.join(MATERIALS, "screenshots"))
        for sub, display in DISPLAY_TYPES.items():
            files = images(os.path.join(folder, sub))
            if len(files) > 10:
                sys.exit(f"{folder}/{sub}: {len(files)} images, App Store Connect allows 10.")
            if files:
                sets[display] = files
                print(f"{display} from {folder}/{sub}: {', '.join(os.path.basename(f) for f in files)}")
        if not sets:
            sys.exit(f"No images in {folder}/{'|'.join(DISPLAY_TYPES)}.")
    if args.dry_run:
        return
    guarded("upload_listing_to_appstore", upload, args.locale, args.version, texts, info_texts, sets)


if __name__ == "__main__":
    main()
