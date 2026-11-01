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
    400: "The request was rejected as malformed or invalid.",
    401: "Authentication failed: check the API key (.p8), Key ID and Issuer ID, and that the Mac clock is correct.",
    403: "The API key's role does not allow this operation (App Manager or Admin is required).",
    404: "The resource was not found: check that the app record exists in App Store Connect.",
    409: "Conflict: this version/build number was probably already uploaded; bump the build number.",
    429: "Rate limited by Apple; wait a while and retry.",
}


class AscApiError(Exception):
    """An HTTP 4xx/5xx response from App Store Connect (or its upload host)."""

    def __init__(self, status, method, url, body):
        self.status, self.method = status, method
        self.url = url.split("?", 1)[0]  # drop query: upload URLs are pre-signed
        self.errors = []
        self.raw_body = body
        try:
            self.errors = json.loads(body).get("errors", [])
        except (ValueError, AttributeError):
            pass
        super().__init__(self.describe())

    def describe(self):
        lines = [f"HTTP {self.status} on {self.method} {self.url}"]
        for err in self.errors:
            parts = [err.get("code") or err.get("title") or "error"]
            if err.get("title") and err.get("code"):
                parts.append(err["title"])
            text = " - ".join(parts)
            if err.get("detail"):
                text += f": {err['detail']}"
            pointer = (err.get("source") or {}).get("pointer") or (err.get("source") or {}).get("parameter")
            if pointer:
                text += f" (at {pointer})"
            lines.append(f"  [{err.get('status', self.status)}] {text}")
        if not self.errors and self.raw_body.strip():
            lines.append("  " + self.raw_body.strip()[:1000])
        hint = HTTP_HINTS.get(self.status) or ("Apple server error; retry later." if self.status >= 500 else None)
        if hint:
            lines.append(f"  Hint: {hint}")
        return "\n".join(lines)

    def details(self):
        return {"status": self.status, "method": self.method, "url": self.url,
                "errors": self.errors or self.raw_body[:2000]}


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
    except AscApiError as e:
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
