#!/usr/bin/env python3
"""Create/check homepage-only WOFF2 subsets from pinned Google Fonts sources.

Uses the same fontTools.subset engine as pyftsubset. Build dependencies live in
a disposable venv; the Astro site needs no Python or remote font service.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import string
import sys
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REVISION = "cc39c4c2c304bc368c9b7c311ea2bcc6013299fe"
UPSTREAM = "https://raw.githubusercontent.com/google/fonts/" + REVISION + "/ofl/"
CACHE = ROOT / ".tmp/starbook-fonts/sources"
OUTPUT = ROOT / "public/fonts/starbook"
TEXT_FILES = [
    "src/pages/index.astro",
    "src/data/starbook.ts",
    "src/components/starbook/Polaroid.astro",
    "docs/redesign/starbook/reference.dc.html",
]
FONTTOOLS_VERSION = "4.59.0"
BROTLI_VERSION = "1.1.0"
FAMILIES = [
    {
        "id": "NotoSerifSC",
        "family": "Noto Serif SC",
        "cssFamily": "Starbook Noto Serif SC",
        "source": "notoserifsc/NotoSerifSC%5Bwght%5D.ttf",
        "sourceSHA256": "050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9",
        "license": "notoserifsc/OFL.txt",
        "licenseSHA256": "5e0da210fb04058a8c0087985d2d456b931c2579811a49655721d3cf0c36b6d6",
        "weights": [600, 900],
        "filePrefix": "noto-serif-sc",
    },
    {
        "id": "Cinzel",
        "family": "Cinzel",
        "cssFamily": "Starbook Cinzel",
        "source": "cinzel/Cinzel%5Bwght%5D.ttf",
        "sourceSHA256": "f4d83d34d1f6c741193e4acf4b3dff9531e5a67b6aa65228d00a7db72a4e0f34",
        "license": "cinzel/OFL.txt",
        "licenseSHA256": "f2b3029aba64c378bf0963b62945eee15e564fe4330b934c8f2eb058282b5e83",
        "weights": [600, 700],
        "filePrefix": "cinzel",
    },
    {
        "id": "LongCang",
        "family": "Long Cang",
        "cssFamily": "Starbook Long Cang",
        "source": "longcang/LongCang-Regular.ttf",
        "sourceSHA256": "e5bf2c3f24ef2327c6f136d8f73e2f9dfdf44896fdbeb35a9515f44777bb91bc",
        "license": "longcang/OFL.txt",
        "licenseSHA256": "603546b7219a94bb59bf8294458194a5010119486354092b66a09a3fd61aeacc",
        "weights": [400],
        "filePrefix": "long-cang",
    },
]


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def corpus():
    # A conservative union includes source literals, every dynamic task body,
    # all reference wording and 0–9 (so the completed count can change to 0–8).
    # Keeping printable ASCII also preserves punctuation and Latin labels.
    text = " ".join((ROOT / filename).read_text() for filename in TEXT_FILES)
    characters = set(char for char in text if char.isprintable())
    characters.update(string.ascii_letters + string.digits + string.punctuation + " ")
    return "".join(sorted(characters))


def source_file(filename, relative_url, expected, allow_download):
    path = CACHE / filename
    if not path.exists():
        if not allow_download:
            raise ValueError("Missing cached source: " + str(path) + "; run with --download")
        CACHE.mkdir(parents=True, exist_ok=True)
        request = Request(UPSTREAM + relative_url, headers={"User-Agent": "Astria-Starbook-Font-Subset/1.0"})
        with urlopen(request, timeout=90) as response:
            path.write_bytes(response.read())
    if sha256(path.read_bytes()) != expected:
        raise ValueError("Source hash mismatch: " + str(path))
    return path


def build(allow_download):
    import brotli
    import fontTools
    from fontTools import subset
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont

    if fontTools.__version__ != FONTTOOLS_VERSION or brotli.__version__ != BROTLI_VERSION:
        raise ValueError("Use pinned fonttools==" + FONTTOOLS_VERSION + " brotli==" + BROTLI_VERSION)
    text = corpus()
    requested = {ord(char) for char in text}
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "upstream": "https://github.com/google/fonts",
        "revision": REVISION,
        "fontToolsVersion": FONTTOOLS_VERSION,
        "brotliVersion": BROTLI_VERSION,
        "sourceTextFiles": TEXT_FILES,
        "corpusSHA256": sha256(text.encode()),
        "corpusCharacters": text,
        "license": "SIL Open Font License 1.1; no Reserved Font Names declared in these upstream license headers",
        "fallback": "Long Cang has no arrow glyphs. Use Starbook Noto Serif SC after Starbook Long Cang in the handwritten font stack.",
        "faces": [],
    }
    for family in FAMILIES:
        source = source_file(family["id"] + ".ttf", family["source"], family["sourceSHA256"], allow_download)
        license_path = source_file(family["id"] + "-OFL.txt", family["license"], family["licenseSHA256"], allow_download)
        (OUTPUT / ("OFL-" + family["id"] + ".txt")).write_bytes(license_path.read_bytes())
        for weight in family["weights"]:
            font = TTFont(source, recalcTimestamp=False)
            supported = requested.intersection(font.getBestCmap())
            options = subset.Options()
            options.name_IDs = ["*"]
            options.name_languages = ["*"]
            options.name_legacy = True
            options.layout_features = ["*"]
            options.recalc_timestamp = False
            subsetter = subset.Subsetter(options=options)
            subsetter.populate(unicodes=supported)
            subsetter.subset(font)
            if "fvar" in font:
                limits = {axis.axisTag: weight if axis.axisTag == "wght" else axis.defaultValue for axis in font["fvar"].axes}
                # Cinzel's upstream STAT has no named AxisValue for 600.
                # Keep source name records; CSS declares each exact weight and
                # instancing sets OS/2.usWeightClass without guessing names.
                font = instantiateVariableFont(font, limits, inplace=True)
            font.recalcTimestamp = False
            font.flavor = "woff2"
            filename = family["filePrefix"] + "-" + str(weight) + ".woff2"
            target = OUTPUT / filename
            font.save(target)
            with TTFont(target) as result:
                actual = set(result.getBestCmap())
                if not supported.issubset(actual):
                    raise ValueError("Subset lost supported characters: " + filename)
                if "fvar" in result or result["OS/2"].usWeightClass != weight:
                    raise ValueError("Expected a static font with the requested weight: " + filename)
                # Copyright/license name records are retained, not replaced by
                # the CSS alias. No source declares a Reserved Font Name.
                manifest["faces"].append({
                    "file": filename,
                    "family": family["family"],
                    "cssFamily": family["cssFamily"],
                    "weight": weight,
                    "bytes": target.stat().st_size,
                    "sha256": sha256(target.read_bytes()),
                    "sourceURL": UPSTREAM + family["source"],
                    "sourceSHA256": family["sourceSHA256"],
                    "sourceVersion": result["name"].getDebugName(5),
                    "licenseFile": "OFL-" + family["id"] + ".txt",
                    "licenseSHA256": family["licenseSHA256"],
                    "characters": "".join(chr(point) for point in sorted(supported)),
                    "copyright": result["name"].getDebugName(0),
                })
            print(filename + ": " + str(target.stat().st_size) + " bytes, " + str(len(supported)) + " codepoints")
    (OUTPUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    check()


def check():
    from fontTools.ttLib import TTFont

    manifest = json.loads((OUTPUT / "manifest.json").read_text())
    if manifest["revision"] != REVISION:
        raise ValueError("Unexpected font source revision")
    text = corpus()
    requested = {ord(char) for char in text}
    cjk = {point for point in requested if 0x3400 <= point <= 0x9FFF}
    latin = {ord(char) for char in "ASTRIA EORZEA A WIDER SKY0123456789"}
    maps = {}
    for face in manifest["faces"]:
        target = OUTPUT / face["file"]
        if sha256(target.read_bytes()) != face["sha256"]:
            raise ValueError("Font output hash changed: " + face["file"])
        if sha256((OUTPUT / face["licenseFile"]).read_bytes()) != face["licenseSHA256"]:
            raise ValueError("Font license hash changed: " + face["licenseFile"])
        with TTFont(target) as font:
            actual = set(font.getBestCmap())
            maps[face["file"]] = actual
            if not {ord(char) for char in face["characters"]}.issubset(actual):
                raise ValueError("Manifest characters missing in cmap: " + face["file"])
            expected = latin if face["family"] == "Cinzel" else cjk | {ord(char) for char in string.digits}
            missing = expected - actual
            if missing:
                raise ValueError("Current homepage needs new glyphs in " + face["file"] + ": " + "".join(chr(point) for point in sorted(missing)))
    for filename in ("noto-serif-sc-600.woff2", "noto-serif-sc-900.woff2"):
        missing = requested - maps[filename]
        if missing:
            raise ValueError("Noto fallback must cover the complete corpus in " + filename + ": " + "".join(chr(point) for point in sorted(missing)))
    print("Coverage passed: " + str(len(requested)) + " printable codepoints, " + str(len(cjk)) + " Chinese characters; dynamic digits and arrows included.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Download pinned source fonts/licenses if the temporary cache is missing")
    parser.add_argument("--check", action="store_true", help="Only verify current page/reference coverage and committed files, without fetching sources")
    args = parser.parse_args()
    try:
        if args.check:
            check()
        else:
            build(args.download)
    except (ValueError, FileNotFoundError, ModuleNotFoundError) as error:
        print("Font subset error: " + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
