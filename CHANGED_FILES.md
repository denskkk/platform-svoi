# CHANGED_FILES

| File | What was | What changed | Why | Risk |
| --- | --- | --- | --- | --- |
| `.gitignore` | Did not cover some local secret and Android signing files | Added `.env.*`, `*.jks`, `*.keystore`, `key.properties`, Firebase JSON, and generated Android artifacts | Prevents accidental Git leakage | Low |
| `src/lib/auth.ts` | JWT secrets used fallback values | Removed unsafe default values and added runtime validation | Prevents broken or insecure auth in production | Low |
| `scripts/run-migration.js` | Hardcoded production database URL | Switched to `process.env.DATABASE_URL` with explicit error if missing | Removes committed secrets | Low |
| `.env.example` | Example had placeholder inconsistencies and without mobile URL | Updated to clearer local development defaults | Makes new setup reproducible | Low |
| `README.md` | Missing project documentation | Added full project overview, setup, build, and handover instructions | Makes project easier for developers to build and maintain | Low |
| `HANDOVER.md` | No developer handoff file | Added detailed transfer instructions and security checklist | Prevents missing setup details | Low |
| `PRE_RELEASE_CHECKLIST.md` | No pre-release validation checklist | Added explicit build and QA checklist | Reduces missed deployment steps | Low |
| `AUDIT_REPORT.md` | No formal audit record | Added final status and categorized findings | Makes status explicit for handoff | Low |

## Notes

- This list reflects the sanitized working tree only.
- Public Git history still needs cleanup if the repo had already been pushed with secrets in earlier commits.
