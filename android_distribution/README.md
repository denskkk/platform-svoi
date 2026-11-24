# Android distribution

Scripts for building signed Android binaries and uploading them to Google Play.
Run all commands from the repository root.

> **Note:** the upload script only works with the gitignored service account key
> `play_service_account.json` in this folder (see [Getting the secret file](#getting-the-secret-file)).
> The build scripts need the signing files in `android_code_signing/`
> (`key.properties`, `release-keystore.jks`); they are the source of truth and are copied to `android/` automatically when missing or different.
> After each build the script checks that the output is signed with that keystore's release key and fails otherwise.

## Bump build / version

Edits `versionCode` / `versionName` in `android/app/build.gradle`.

```sh
python3 android_distribution/android_bump.py build            # build number +1 (or: build 12)
python3 android_distribution/android_bump.py version patch    # major | minor | patch | X.Y.Z
```

## Build

```sh
# Play Store bundle -> android_distribution/binaries/SviyDlyaSvoih-Play_<versionName>_<versionCode>.aab
python3 android_distribution/android_play_store_build.py

# APK for direct install -> android_distribution/binaries/SviyDlyaSvoih-Apk_<versionName>_<versionCode>.apk
python3 android_distribution/android_apk_build.py
```

Version comes from `versionName` / `versionCode` in `android/app/build.gradle`; bump `versionCode` before every Play upload.

## Upload to Google Play

```sh
python3 android_distribution/upload_to_google_play.py android_distribution/binaries/SviyDlyaSvoih-Play_<version>_<code>.aab
# options: --track internal|alpha|beta|production (default internal), --status draft|completed (default draft)
```

Use the `.aab`, not the APK. The default creates a draft release on the internal track; finish the rollout in Play Console
or pass `--status completed`.

## Files

- `android_bump.py` - build/version bump script (helpers live in `ios_distribution/bump.py`).
- `android_build.py` - shared build logic (`npx cap sync android` + Gradle).
- `android_play_store_build.py` - builds the AAB.
- `android_apk_build.py` - builds the APK.
- `upload_to_google_play.py` - uploads an AAB via the Google Play Developer API.
- `error_log.py` - error handling shared by the scripts; failures are appended to `error_log.json` (gitignored).
- `play_service_account.json` - service account key (gitignored).
- `binaries/` - generated files (gitignored).

## Code signing files

`android_code_signing/` (gitignored except `.gitkeep`) holds `key.properties`, `release-keystore.jks`, `key_finger_prints.txt`
(SHA1/SHA256 for Firebase, Google Sign-In, assetlinks.json) and `google_play_testers.csv`. The key is the Play **upload key**;
back it up with its passwords, because without it you can't ship updates.

## Getting the secret file

Ask a team member for `play_service_account.json` (secure channel, never git), or create one:

1. Google Cloud Console -> create/choose a project -> enable **Google Play Android Developer API**.
2. **IAM -> Service accounts** -> create an account -> **Keys -> Add key -> JSON**; save as `android_distribution/play_service_account.json`.
3. Play Console -> **Users and permissions** -> invite the service account email and grant release permissions for the app
   (`com.sviy_dlya_svoih.android`). It can take a few minutes to take effect.

The app must already exist in Play Console, and the first release must be uploaded manually once.

## Requirements

- Java and the Android SDK (`android/local.properties`), Node (`npx cap`).
- Signing files in `android_code_signing/`.
- For upload: `play_service_account.json`, system `openssl`.
