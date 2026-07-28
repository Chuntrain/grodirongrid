"""Build the compact Gridiron Grid player index from nflverse CC-BY-4.0 data."""

from __future__ import annotations

import csv
import io
import json
import urllib.request
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "app" / "player-db.json"
HEADERS = {"User-Agent": "GridironGrid/1.0"}

TEAM_ALIASES = {
    "OAK": "LV", "SD": "LAC", "STL": "LAR", "JAC": "JAX",
    "LA": "LAR", "WSH": "WSH",
}
CURRENT_TEAMS = {
    "ARI","ATL","BAL","BUF","CAR","CHI","CIN","CLE","DAL","DEN","DET","GB",
    "HOU","IND","JAX","KC","LV","LAC","LAR","MIA","MIN","NE","NO","NYG",
    "NYJ","PHI","PIT","SF","SEA","TB","TEN","WSH",
}
CHAMPIONS = {
    1999:"LAR", 2000:"BAL", 2001:"NE", 2002:"TB", 2003:"NE", 2004:"NE",
    2005:"PIT", 2006:"IND", 2007:"NYG", 2008:"PIT", 2009:"NO", 2010:"GB",
    2011:"NYG", 2012:"BAL", 2013:"SEA", 2014:"NE", 2015:"DEN", 2016:"NE",
    2017:"PHI", 2018:"NE", 2019:"KC", 2020:"TB", 2021:"LAR", 2022:"KC",
    2023:"KC", 2024:"PHI",
}


def rows(url: str):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=60) as response:
        text = io.TextIOWrapper(response, encoding="utf-8-sig", newline="")
        yield from csv.DictReader(text)


def team_id(value: str) -> str:
    value = (value or "").upper()
    return TEAM_ALIASES.get(value, value)


def main():
    records = defaultdict(lambda: {
        "name": "", "teams": set(), "proBowl": False,
        "superBowl": False, "rush1000": False, "pass4000": False,
        "receive1000": False, "sacks10": False,
    })
    player_names: dict[str, str] = {}

    # Draft history supplies long-range Pro Bowl totals and stable player IDs.
    draft_url = "https://github.com/nflverse/nflverse-data/releases/download/draft_picks/draft_picks.csv"
    for row in rows(draft_url):
        player_id = row.get("gsis_id") or f"pfr:{row.get('pfr_player_id', '')}"
        name = row.get("pfr_player_name", "").strip()
        team = team_id(row.get("team", ""))
        if not player_id or not name:
            continue
        player_names[player_id] = name
        record = records[player_id]
        record["name"] = name
        if team in CURRENT_TEAMS:
            record["teams"].add(team)
        try:
            record["proBowl"] = int(float(row.get("probowls") or 0)) > 0
        except ValueError:
            pass

    # Season rosters provide multi-team career history and champion rosters.
    for season in range(1999, 2026):
        url = f"https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_{season}.csv"
        try:
            roster_rows = rows(url)
            for row in roster_rows:
                player_id = row.get("gsis_id") or f"pfr:{row.get('pfr_id', '')}"
                name = (row.get("full_name") or row.get("football_name") or "").strip()
                team = team_id(row.get("team", ""))
                if not player_id or not name or team not in CURRENT_TEAMS:
                    continue
                player_names[player_id] = name
                record = records[player_id]
                record["name"] = name
                record["teams"].add(team)
                if CHAMPIONS.get(season) == team:
                    record["superBowl"] = True
        except Exception as exc:
            print(f"Skipping roster {season}: {exc}")

    # Season stats identify every 1,000-yard rusher in the nflverse era.
    for season in range(1999, 2026):
        url = f"https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_reg_{season}.csv"
        try:
            for row in rows(url):
                def number(key):
                    try:
                        return float(row.get(key) or 0)
                    except ValueError:
                        return 0
                rushing = number("rushing_yards")
                passing = number("passing_yards")
                receiving = number("receiving_yards")
                sacks = number("def_sacks")
                if max(rushing / 1000, passing / 4000, receiving / 1000, sacks / 10) < 1:
                    continue
                player_id = row.get("player_id", "")
                name = (row.get("player_display_name") or row.get("player_name") or "").strip()
                team = team_id(row.get("recent_team", ""))
                if not player_id or not name:
                    continue
                player_names[player_id] = name
                record = records[player_id]
                record["name"] = name
                record["rush1000"] = record["rush1000"] or rushing >= 1000
                record["pass4000"] = record["pass4000"] or passing >= 4000
                record["receive1000"] = record["receive1000"] or receiving >= 1000
                record["sacks10"] = record["sacks10"] or sacks >= 10
                if team in CURRENT_TEAMS:
                    record["teams"].add(team)
        except Exception as exc:
            print(f"Skipping stats {season}: {exc}")

    compact = []
    for record in records.values():
        if not record["name"] or not record["teams"]:
            continue
        if not any(record[key] for key in ("proBowl","superBowl","rush1000","pass4000","receive1000","sacks10")):
            continue
        compact.append({
            "name": record["name"],
            "teams": sorted(record["teams"]),
            "proBowl": record["proBowl"],
            "superBowl": record["superBowl"],
            "rush1000": record["rush1000"],
            "pass4000": record["pass4000"],
            "receive1000": record["receive1000"],
            "sacks10": record["sacks10"],
        })

    compact.sort(key=lambda item: item["name"])
    OUTPUT.write_text(json.dumps(compact, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {len(compact)} qualifying players to {OUTPUT}")


if __name__ == "__main__":
    main()
