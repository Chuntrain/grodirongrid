"use client";

import { SportDailyGrid, type SportBoard } from "../sport-grid";

export const nbaBoards: SportBoard[] = [
  {
    teams: [
      { id: "LAL", name: "Lakers", color: "#552583" },
      { id: "BOS", name: "Celtics", color: "#007A33" },
      { id: "GSW", name: "Warriors", color: "#1D428A" },
    ],
    categories: [
      { short: "TOP 25 POINTS", detail: "Ranks among the NBA's 25 highest career scorers." },
      { short: "SCORING CHAMP", detail: "Led the NBA in points per game for at least one season." },
      { short: "10+ ALL-STARS", detail: "Earned at least ten NBA All-Star selections." },
    ],
    answers: {
      LAL: [["LeBron James"], ["Kobe Bryant"], ["Kareem Abdul-Jabbar"]],
      BOS: [["Kevin Garnett"], ["Bob McAdoo"], ["Larry Bird"]],
      GSW: [["Kevin Durant"], ["Stephen Curry"], ["Wilt Chamberlain"]],
    },
    pool: [
      "LeBron James",
      "Kobe Bryant",
      "Kareem Abdul-Jabbar",
      "Kevin Garnett",
      "Bob McAdoo",
      "Larry Bird",
      "Kevin Durant",
      "Stephen Curry",
      "Wilt Chamberlain",
    ],
  },
  {
    teams: [
      { id: "CHI", name: "Bulls", color: "#CE1141" },
      { id: "MIA", name: "Heat", color: "#98002E" },
      { id: "BKN", name: "Nets", color: "#000000" },
    ],
    categories: [
      { short: "2,000+ THREES", detail: "Made at least 2,000 regular-season three-pointers." },
      { short: "WON DPOY", detail: "Won NBA Defensive Player of the Year." },
      { short: "WON ROY", detail: "Won NBA Rookie of the Year." },
    ],
    answers: {
      CHI: [["Jamal Crawford"], ["Michael Jordan"], ["Derrick Rose"]],
      MIA: [["Ray Allen"], ["Alonzo Mourning"], ["LeBron James"]],
      BKN: [["James Harden"], ["Kevin Garnett"], ["Vince Carter"]],
    },
    pool: [
      "Jamal Crawford",
      "Michael Jordan",
      "Derrick Rose",
      "Ray Allen",
      "Alonzo Mourning",
      "LeBron James",
      "James Harden",
      "Kevin Garnett",
      "Vince Carter",
    ],
  },
];

export function pickNbaBoard(dateKey: string, boards: SportBoard[] = nbaBoards) {
  const hash = Math.abs([...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0));
  return boards[hash % boards.length];
}

export function NbaGrid({ date }: { date?: string } = {}) {
  return (
    <SportDailyGrid
      sport="NBA"
      brand="NBA Grid"
      boards={nbaBoards}
      pickBoard={pickNbaBoard}
      logoFolder="nba"
      emoji="🏀"
      sitePath="/nba-grid/"
      date={date}
    />
  );
}
