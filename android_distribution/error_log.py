"""Error reporting shared by the distribution scripts.

Errors are printed to stderr and appended to `error_log.json` (a JSON array,
gitignored) in this folder.
"""
import datetime
import json
import os
import subprocess
import sys
import urllib.error

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ERROR_LOG_PATH = os.path.join(SCRIPT_DIR, "error_log.json")

HTTP_HINTS = {
    400: "The request was rejected as malformed or invalid (e.g. versionCode already used, wrong track).",
    401: "Authentication failed: check the service account JSON and that the Mac clock is correct.",
    403: "The service account has no access: invite its email in Play Console -> Users and permissions and grant release access to the app.",
    404: "Not found: check that the app exists in Play Console and the package name matches.",
    409: "Conflict: another edit is in progress or this versionCode was already uploaded; bump versionCode.",
    429: "Rate limited by Google; wait a while and retry.",
}


class GoogleApiError(Exception):
    """An HTTP 4xx/5xx response from Google (OAuth or Play Developer API)."""

    def __init__(self, status, method, url, body):
        self.status, self.method = status, method
        self.url = url.split("?", 1)[0]
        self.raw_body = body
        try:
            err = json.loads(body).get("error")
            self.error = err if isinstance(err, dict) else {"message": err or body[:1000]}
        except (ValueError, AttributeError):
            self.error = {"message": body.strip()[:1000]}
        super().__init__(self.describe())

    def describe(self):
        lines = [f"HTTP {self.status} on {self.method} {self.url}"]
        if self.error.get("message"):
            lines.append(f"  {self.error.get('status', '')} {self.error['message']}".replace("  ", "  ", 1))
        hint = HTTP_HINTS.get(self.status) or ("Google server error; retry later." if self.status >= 500 else None)
        if hint:
            lines.append(f"  Hint: {hint}")
        return "\n".join(lines)

    def details(self):
        return {"status": self.status, "method": self.method, "url": self.url, "error": self.error}


def log_error(source, message, details=None):
    """Append an error entry to error_log.json; never raises."""
    entry = {"timestamp": datetime.datetime.now().astimezone().isoformat(timespec="seconds"),
             "source": source, "message": message}
    if details:
        entry["details"] = details
    try:
        try:
            with open(ERROR_LOG_PATH) as f:
                entries = json.load(f)
        except (OSError, ValueError):
            entries = []
        entries.append(entry)
        with open(ERROR_LOG_PATH, "w") as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"Error written to {ERROR_LOG_PATH}", file=sys.stderr)
    except OSError as e:
        print(f"Could not write error log: {e}", file=sys.stderr)


def guarded(source, func, *args, **kwargs):
    """Run func(*args); on failure print a readable error, log it and exit non-zero."""
    try:
        return func(*args, **kwargs)
    except GoogleApiError as e:
        message, details = str(e), e.details()
    except urllib.error.URLError as e:
        message, details = f"Network error: {e.reason}", {"reason": str(e.reason)}
    except subprocess.CalledProcessError as e:
        output = e.stderr.decode(errors="replace") if isinstance(e.stderr, bytes) else (e.stderr or "")
        message = f"Command failed with exit code {e.returncode}: {' '.join(map(str, e.cmd))}"
        details = {"returncode": e.returncode, "stderr": output[-2000:]}
    except SystemExit as e:
        if e.code in (None, 0) or isinstance(e.code, int):
            raise
        message, details = str(e.code), None  # sys.exit("message")
    except (OSError, KeyError, ValueError, StopIteration) as e:
        message, details = f"{type(e).__name__}: {e}", None
    print(f"\nERROR: {message}", file=sys.stderr)
    log_error(source, message, details)
    sys.exit(1)
