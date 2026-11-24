"""Version-bump helpers shared by ios_bump.py and android_bump.py (not meant to be run directly)."""
import os
import re
import sys


def _edit(path, pattern, change):
    """Apply change(old) -> new to every match of pattern (groups: prefix, value, suffix); all matches must agree."""
    with open(path) as f:
        text = f.read()
    olds = {m.group(2) for m in re.finditer(pattern, text)}
    if len(olds) != 1:
        sys.exit(f"Expected one consistent value in {path}, found: {sorted(olds) or 'none'}")
    old = olds.pop()
    new = change(old)
    with open(path, "w") as f:
        f.write(re.sub(pattern, lambda m: m.group(1) + new + m.group(3), text))
    print(f"{old} -> {new}")


def bump_build(path, pattern, arg=None):
    def change(old):
        if arg is None:
            return str(int(old) + 1)
        if not arg.isdigit() or int(arg) <= int(old):
            sys.exit(f"Build number must be an integer greater than the current {old}.")
        return arg
    _edit(path, pattern, change)


def next_version(old, arg):
    if re.fullmatch(r"\d+(\.\d+){1,2}", arg):
        return arg
    if arg not in ("major", "minor", "patch"):
        sys.exit("Version must be major, minor, patch or X.Y[.Z].")
    major, minor, patch = (list(map(int, old.split("."))) + [0, 0])[:3]
    return {"major": f"{major + 1}.0.0", "minor": f"{major}.{minor + 1}.0", "patch": f"{major}.{minor}.{patch + 1}"}[arg]


def bump_version(path, pattern, arg):
    _edit(path, pattern, lambda old: next_version(old, arg))


def rename_binaries(binaries_dir, old, new):
    """Rename binaries/*_<oldName>_<oldCode>.* to the new version and build number."""
    for f in sorted(os.listdir(binaries_dir)) if os.path.isdir(binaries_dir) else []:
        stem, ext = os.path.splitext(f)
        prefix, name, code = stem.rsplit("_", 2) if stem.count("_") >= 2 else (None, None, None)
        if (name, code) == old:
            dest = f"{prefix}_{new[0]}_{new[1]}{ext}"
            if os.path.exists(os.path.join(binaries_dir, dest)):
                sys.exit(f"Cannot rename {f}: {dest} already exists.")
            os.rename(os.path.join(binaries_dir, f), os.path.join(binaries_dir, dest))
            print(f"Renamed {f} -> {dest} (contents still carry the old version)")


if __name__ == "__main__":
    assert next_version("1.3", "patch") == "1.3.1"
    assert next_version("1.0.9", "minor") == "1.1.0"
    assert next_version("1.0.9", "major") == "2.0.0"
    assert next_version("1.0.9", "2.5") == "2.5"
    print("ok")
