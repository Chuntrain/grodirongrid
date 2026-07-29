"use client";

import { SportDailyGrid, type SportBoard } from "../sport-grid";

export const mlbBoards: SportBoard[] = [
  {
    teams: [
      { id: "NYY", name: "Yankees", color: "#003087" },
      { id: "LAD", name: "Dodgers", color: "#005A9C" },
      { id: "BOS", name: "Red Sox", color: "#BD3039" },
    ],
    categories: [
      { short: "300+ HOME RUNS", detail: "Hit at least 300 regular-season home runs." },
      { short: "WON LEAGUE MVP", detail: "Won an American League or National League MVP award." },
      { short: "WORLD SERIES CHAMP", detail: "Appeared on a World Series championship roster." },
    ],
    answers: {
      NYY: [["Alex Rodriguez"], ["Aaron Judge"], ["Derek Jeter"]],
      LAD: [["Albert Pujols"], ["Freddie Freeman"], ["Mookie Betts"]],
      BOS: [["Manny Ramirez"], ["Dustin Pedroia"], ["David Ortiz"]],
    },
    pool: [
      "Alex Rodriguez",
      "Aaron Judge",
      "Derek Jeter",
      "Albert Pujols",
      "Freddie Freeman",
      "Mookie Betts",
      "Manny Ramirez",
      "Dustin Pedroia",
      "David Ortiz",
    ],
  },
  {
    teams: [
      { id: "SF", name: "Giants", color: "#FD5A1E" },
      { id: "STL", name: "Cardinals", color: "#C41E3A" },
      { id: "CHC", name: "Cubs", color: "#0E3386" },
    ],
    categories: [
      { short: "2,000+ HITS", detail: "Recorded at least 2,000 regular-season hits." },
      { short: "WON CY YOUNG", detail: "Won at least one Cy Young Award." },
      { short: "100+ STEALS", detail: "Stole at least 100 bases during his MLB career." },
    ],
    answers: {
      SF: [["Willie Mays"], ["Randy Johnson"], ["Barry Bonds"]],
      STL: [["Albert Pujols"], ["Bob Gibson"], ["Lou Brock"]],
      CHC: [["Ernie Banks"], ["Greg Maddux"], ["Tim Raines"]],
    },
    pool: [
      "Willie Mays",
      "Randy Johnson",
      "Barry Bonds",
      "Albert Pujols",
      "Bob Gibson",
      "Lou Brock",
      "Ernie Banks",
      "Greg Maddux",
      "Tim Raines",
    ],
  },
];

export function pickMlbBoard(dateKey: string, boards: SportBoard[] = mlbBoards) {
  return boards[(Number(dateKey.slice(-2)) + 1) % boards.length];
}

export function MlbGrid({ date }: { date?: string } = {}) {
  return (
    <SportDailyGrid
      sport="MLB"
      brand="MLB Grid"
      boards={mlbBoards}
      pickBoard={pickMlbBoard}
      logoFolder="mlb"
      emoji="⚾"
      sitePath="/mlb-grid/"
      date={date}
    />
  );
}
