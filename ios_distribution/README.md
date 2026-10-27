# iOS distribution

Scripts for building signed IPAs and uploading them to App Store Connect.
Run all commands from the repository root.

> **Note:** the upload script only works if the gitignored secret files are present in this folder:
> `AuthKey_A6QSJ3V6JG.p8` and `.env`. If they are missing, see
> [Getting the secret files](#getting-the-secret-files) below. The build scripts also need the
> signing files in `ios_code_signing/` and the distribution certificate with its private key in your keychain.

## Build

```sh
# Ad Hoc IPA        -> ios_distribution/binaries/SviyDlyaSvoih-AdHoc_<version>_(<build>).ipa
python3 ios_distribution/ios_ad_hoc_build_and_archive.py

# App Store IPA     -> ios_distribution/binaries/SviyDlyaSvoih-AppStore_<version>_(<build>).ipa
python3 ios_distribution/ios_app_store_build_and_archive.py
```

The scripts are executable, so `./ios_distribution/ios_app_store_build_and_archive.py` also works.

## Upload to App Store Connect

```sh
python3 ios_distribution/upload_to_appstore.py ios_distribution/binaries/SviyDlyaSvoih-AppStore_<version>_(<build>).ipa
```

Use the App Store IPA, not the Ad Hoc one.

## Files

- `ios_build.py` - shared build logic used by the two build scripts.
- `ios_ad_hoc_build_and_archive.py` - builds the Ad Hoc IPA.
- `ios_app_store_build_and_archive.py` - builds the App Store IPA.
- `upload_to_appstore.py` - uploads an IPA via the App Store Connect REST API.
- `binaries/` - generated IPAs.
- `AuthKey_A6QSJ3V6JG.p8` - App Store Connect API key (gitignored).
- `.env` - holds `ASC_ISSUER_ID` (gitignored).

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
