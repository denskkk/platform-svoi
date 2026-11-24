#!/usr/bin/env python3
"""Upload the Google Play store listing (title, short/full description, phone screenshots).

Reads materials/google_play/: listing_texts.txt (uk) or listing_en.md (en-US) and the newest
screenshots/vN folder (the images directly inside it, in file-name order). Uses the same service
account as upload_to_google_play.py. Everything goes in one edit; screenshots of that language
are replaced, not appended.

Usage:
    ./upload_listing_to_google_play.py                       # uk: texts + screenshots
    ./upload_listing_to_google_play.py --lang en-US          # English listing texts + screenshots
    ./upload_listing_to_google_play.py --only texts          # or: --only screenshots
    ./upload_listing_to_google_play.py --screenshots ../materials/google_play/screenshots/v1
    ./upload_listing_to_google_play.py --dry-run             # show what would be uploaded
"""
import argparse
import mimetypes
import os
import sys

from error_log import guarded
from upload_to_google_play import API, UPLOAD_API, find_key, get_access_token, request

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ios_distribution"))
from listing import images, latest_dir, read_blocks  # noqa: E402

MATERIALS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "materials", "google_play")
TEXTS = {"uk": "listing_texts.txt", "en-US": "listing_en.md"}
FIELDS = {"App name": "title", "Short description": "shortDescription", "Full description": "fullDescription"}


def upload(lang, texts, shots):
    token = get_access_token(find_key())
    edit = request("POST", f"{API}/edits", token, body={})["id"]
    if texts:
        request("PUT", f"{API}/edits/{edit}/listings/{lang}", token, body={"language": lang, **texts})
        print("Texts updated.")
    if shots:
        request("DELETE", f"{API}/edits/{edit}/listings/{lang}/phoneScreenshots", token)
        for path in shots:
            with open(path, "rb") as f:
                request("POST", f"{UPLOAD_API}/edits/{edit}/listings/{lang}/phoneScreenshots?uploadType=media", token,
                        raw=f.read(), content_type=mimetypes.guess_type(path)[0])
            print("  uploaded", os.path.basename(path))
    request("POST", f"{API}/edits/{edit}:commit", token)
    print("Committed. Review the changes in Play Console.")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--lang", default="uk", help="Play language code (default uk)")
    ap.add_argument("--texts", help="texts file (default depends on --lang)")
    ap.add_argument("--screenshots", help="folder with the images (default: newest vN)")
    ap.add_argument("--only", choices=["texts", "screenshots"])
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    texts = shots = None
    if args.only != "screenshots":
        path = args.texts or TEXTS.get(args.lang) and os.path.join(MATERIALS, TEXTS[args.lang])
        if not path:
            sys.exit(f"No default texts file for {args.lang}; pass --texts.")
        blocks = read_blocks(path)
        missing = [k for k in FIELDS if k not in blocks]
        if missing:
            sys.exit(f"{path}: missing {', '.join(missing)}.")
        texts = {FIELDS[k]: blocks[k] for k in FIELDS}
        for k, v in texts.items():
            print(f"{k}: {v[:60]!r} ({len(v)} chars)")
    if args.only != "texts":
        folder = args.screenshots or latest_dir(os.path.join(MATERIALS, "screenshots"))
        shots = images(folder)
        if not 2 <= len(shots) <= 8:  # Play requires 2-8 phone screenshots
            sys.exit(f"{folder}: found {len(shots)} images, Play needs 2-8.")
        print(f"Screenshots from {folder}: {', '.join(os.path.basename(s) for s in shots)}")
    if args.dry_run:
        return
    guarded("upload_listing_to_google_play", upload, args.lang, texts, shots)


if __name__ == "__main__":
    main()
