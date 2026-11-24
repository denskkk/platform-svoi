# iOS distribution

Scripts for building signed IPAs and uploading them to App Store Connect.
Run all commands from the repository root.

> **Note:** the upload script only works if the gitignored secret files are present in this folder:
> `AuthKey_A6QSJ3V6JG.p8` and `.env`. If they are missing, see
> [Getting the secret files](#getting-the-secret-files) below. The build scripts also need the
> signing files in `ios_code_signing/` and the distribution certificate with its private key in your keychain.

## Bump build / version

Edits `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION` in `App.xcodeproj/project.pbxproj`.

```sh
python3 ios_distribution/ios_bump.py build            # build number +1 (or: build 12)
python3 ios_distribution/ios_bump.py version patch    # major | minor | patch | X.Y.Z
```

## Build

```sh
# Ad Hoc IPA        -> ios_distribution/binaries/SviyDlyaSvoih-AdHoc_<version>_<build>.ipa
python3 ios_distribution/ios_ad_hoc_build_and_archive.py

# App Store IPA     -> ios_distribution/binaries/SviyDlyaSvoih-AppStore_<version>_<build>.ipa
python3 ios_distribution/ios_app_store_build_and_archive.py
```

The scripts are executable, so `./ios_distribution/ios_app_store_build_and_archive.py` also works.

## Run the debug app on a device

```bash
python3 ios_distribution/ios_run_on_device.py            # build Debug, install, launch
python3 ios_distribution/ios_run_on_device.py --console  # ...and stream app output
python3 ios_distribution/ios_run_on_device.py -d <UDID|name>  # when several devices are connected
```

Needs an unlocked, paired device with Developer Mode on, and the device UDID in `ios_code_signing/Sviy_Dlya_Svoih_iOS_Development.mobileprovision` and its "Apple Development" certificate in the keychain (manual signing, no Xcode login needed).

## Upload to App Store Connect

```sh
python3 ios_distribution/upload_to_appstore.py ios_distribution/binaries/SviyDlyaSvoih-AppStore_<version>_<build>.ipa
```

Use the App Store IPA, not the Ad Hoc one.

## Files

- `ios_bump.py` / `bump.py` - build/version bump script and its shared helpers (also used by Android).
- `ios_build.py` - shared build logic used by the two build scripts.
- `ios_ad_hoc_build_and_archive.py` - builds the Ad Hoc IPA.
- `ios_app_store_build_and_archive.py` - builds the App Store IPA.
- `upload_to_appstore.py` - uploads an IPA via the App Store Connect REST API.
- `error_log.py` - error handling shared by the scripts.
- `error_log.json` - created on failure, see [Errors](#errors) (gitignored).
- `binaries/` - generated IPAs.
- `AuthKey_A6QSJ3V6JG.p8` - App Store Connect API key (gitignored).
- `.env` - holds `ASC_ISSUER_ID` (gitignored).

## Errors

If a script fails (HTTP 4xx/5xx from App Store Connect, network problem, failed `xcodebuild`, missing file), it prints a
readable message and exits with code 1. For API errors the message shows the HTTP status, the request, and Apple's
error code, title and detail, plus a hint for common cases (401, 403, 404, 409, 429, 5xx). Every failure is also
appended to `ios_distribution/error_log.json` (a JSON array with timestamp, source, message and details). The file is
gitignored; auth tokens are never written to it.

## Getting the secret files

These files are gitignored and are not in the repository.

**Easiest way:** ask another team member who already has them to send you `AuthKey_A6QSJ3V6JG.p8` and
`.env`. Share them over a secure channel, never by committing them to git.

**Or get them from the App Store Connect website** (requires an Admin or Account Holder role):

1. Sign in at https://appstoreconnect.apple.com and open **Users and Access -> Integrations -> App Store Connect API**.
2. Open the **Team Keys** tab.
3. **Issuer ID:** copy the value shown at the top of the page. Create `ios_distribution/.env` containing:

   ```
   ASC_ISSUER_ID=<issuer-id>
   ```

4. **API key (`.p8`):** the key `Sviy_Dlya_Svoih_iOS_API_Key` (Key ID `A6QSJ3V6JG`) is listed on the same page.
   Apple lets you download a `.p8` file only once, right after the key is created, so it cannot be downloaded again
   for an existing key. If nobody has the file, click **Generate API Key** (or **+**), name it, give it the
   **App Manager** access role and download `AuthKey_<KEYID>.p8`. Put it in `ios_distribution/`. The script reads
   the Key ID from the file name, so no other change is needed.

The signing certificates and profiles in `ios_code_signing/` can be re-downloaded from
https://developer.apple.com/account -> **Certificates, Identifiers & Profiles**. The private key for the distribution
certificate lives only in the keychain of the Mac that created it. Export it from **Keychain Access** as a `.p12` file
and import it on the other Mac, or ask a team member to do so.

## Requirements

- Xcode with the iOS platform installed.
- Signing certificates in the keychain and profiles in `ios_code_signing/`.
- For upload: the `.p8` key and `.env` with `ASC_ISSUER_ID` in this folder. The app record for `com.sviy-dlya-svoih.ios` must exist in App Store Connect.

## Upload store listing (texts + screenshots)

```
./upload_listing_to_appstore.py [--version X.Y] [--locale uk] [--only texts|screenshots] [--screenshots DIR] [--dry-run]
```

Reads `materials/app_store/listing_texts.txt` and the newest `screenshots/vN` folder (`iphone_6.9/` and `ipad_13/` subfolders), and writes them to the editable App Store version (created if `--version` is given and none exists). Uses the same API key as `upload_to_appstore.py`. Nothing is submitted for review. `What's New` is rejected on an app's first version, so remove that block then.
