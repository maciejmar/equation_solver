import json
import os
import re
from pathlib import Path

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


PLAY_SCOPE = "https://www.googleapis.com/auth/androidpublisher"


def main():
    package_name = os.environ["PACKAGE_NAME"]
    gradle_path = Path(os.environ["APP_GRADLE_FILE"])
    gradle_text = gradle_path.read_text(encoding="utf-8")
    match = re.search(r"\bversionCode\s+(\d+)", gradle_text)
    if not match:
        raise ValueError(f"Could not read versionCode from {gradle_path}")
    current_code = int(match.group(1))

    service_account = json.loads(os.environ["PLAY_SERVICE_ACCOUNT_JSON"])
    credentials = Credentials.from_service_account_info(
        service_account,
        scopes=[PLAY_SCOPE],
    )
    publisher = build(
        "androidpublisher",
        "v3",
        credentials=credentials,
        cache_discovery=False,
    )

    edit_id = None
    try:
        edit = publisher.edits().insert(packageName=package_name, body={}).execute()
        edit_id = edit["id"]
        response = publisher.edits().tracks().list(
            packageName=package_name,
            editId=edit_id,
        ).execute()
        country_availability = publisher.edits().countryavailability().get(
            packageName=package_name,
            editId=edit_id,
            track="production",
        ).execute()
    except HttpError as exc:
        raise RuntimeError(f"Play track read failed with HTTP {exc.resp.status}") from None
    finally:
        if edit_id:
            try:
                publisher.edits().delete(
                    packageName=package_name,
                    editId=edit_id,
                ).execute()
            except HttpError:
                pass

    tracks = response.get("tracks", [])
    used_codes = set()
    track_summaries = []
    for track in sorted(tracks, key=lambda item: item.get("track", "")):
        releases = track.get("releases", [])
        release_summaries = []
        for release in releases:
            codes = [int(code) for code in release.get("versionCodes", [])]
            used_codes.update(codes)
            release_summaries.append(
                f"{release.get('status', 'unknown')}:{','.join(map(str, codes)) or 'no codes'}"
            )
        track_summaries.append(
            f"{track.get('track', 'unknown')}=[{';'.join(release_summaries) or 'empty'}]"
        )

    highest_code = max(used_codes) if used_codes else None
    if current_code in used_codes:
        code_state = "already used"
    elif highest_code is not None and current_code <= highest_code:
        code_state = "below or equal to an existing track code"
    else:
        code_state = "unused and higher than existing track codes"

    inventory = "; ".join(track_summaries) or "no tracks returned"
    countries = sorted(
        country.get("countryCode", "")
        for country in country_availability.get("countries", [])
        if country.get("countryCode")
    )
    country_summary = (
        f"production country availability: syncWithProduction="
        f"{country_availability.get('syncWithProduction', False)}, "
        f"explicitCountries={len(countries)}, "
        f"restOfWorld={country_availability.get('restOfWorld', False)}"
    )
    message = (
        f"Play package={package_name}; source versionCode={current_code}; "
        f"highest track versionCode={highest_code}; source code is {code_state}; "
        f"{inventory}; {country_summary}"
    )
    print(f"::notice title=Play track preflight::{message}")

    summary_path = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary_path:
        with open(summary_path, "a", encoding="utf-8") as summary_file:
            summary_file.write(
                "### Play track preflight\n\n"
                f"- Package: `{package_name}`\n"
                f"- Source versionCode: `{current_code}`\n"
                f"- Highest tracked versionCode: `{highest_code}`\n"
                f"- Source code status: {code_state}\n"
                f"- Tracks: `{inventory}`\n"
                f"- {country_summary}\n"
            )


if __name__ == "__main__":
    main()
