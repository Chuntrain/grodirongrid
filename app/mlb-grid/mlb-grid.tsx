"use client";

import { useEffect, useMemo, useState } from "react";
import { easternPuzzleDate } from "../game-data";

export const mlbBoards = [
  {
    teams:[{id:"NYY",name:"Yankees",color:"#003087"},{id:"LAD",name:"Dodgers",color:"#005A9C"},{id:"BOS",name:"Red Sox",color:"#BD3039"}],
    categories:[
      {short:"300+ HOME RUNS",detail:"Hit at least 300 regular-season home runs."},
      {short:"WON LEAGUE MVP",detail:"Won an American League or National League MVP award."},
      {short:"WORLD SERIES CHAMP",detail:"Appeared on a World Series championship roster."},
    ],
    answers:{
      NYY:[["Alex Rodriguez"],["Aaron Judge"],["Derek Jeter"]],
      LAD:[["Albert Pujols"],["Freddie Freeman"],["Mookie Betts"]],
      BOS:[["Manny Ramirez"],["Dustin Pedroia"],["David Ortiz"]],
    } as Record<string,string[][]>,
    pool:["Alex Rodriguez","Aaron Judge","Derek Jeter","Albert Pujols","Freddie Freeman","Mookie Betts","Manny Ramirez","Dustin Pedroia","David Ortiz"],
  },
  {
    teams:[{id:"SF",name:"Giants",color:"#FD5A1E"},{id:"STL",name:"Cardinals",color:"#C41E3A"},{id:"CHC",name:"Cubs",color:"#0E3386"}],
    categories:[
      {short:"2,000+ HITS",detail:"Recorded at least 2,000 regular-season hits."},
      {short:"WON CY YOUNG",detail:"Won at least one Cy Young Award."},
      {short:"100+ STEALS",detail:"Stole at least 100 bases during his MLB career."},
    ],
    answers:{
      SF:[["Willie Mays"],["Randy Johnson"],["Barry Bonds"]],
      STL:[["Albert Pujols"],["Bob Gibson"],["Lou Brock"]],
      CHC:[["Ernie Banks"],["Greg Maddux"],["Tim Raines"]],
    } as Record<string,string[][]>,
    pool:["Willie Mays","Randy Johnson","Barry Bonds","Albert Pujols","Bob Gibson","Lou Brock","Ernie Banks","Greg Maddux","Tim Raines"],
  },
];
const normalize = (value:string) => value.toLowerCase().replace(/[^a-z0-9]/g,"");

export function MlbGrid() {
  const dateKey = useMemo(() => easternPuzzleDate(), []);
  const board = mlbBoards[(Number(dateKey.slice(-2)) + 1) % mlbBoards.length];
  const [cells,setCells] = useState<(string|null)[]>(Array(9).fill(null));
  const [selected,setSelected] = useState("");
  const [message,setMessage] = useState("Drag one of the nine players into the right statistical matchup.");
  const available = useMemo(() => board.pool.filter((name) => !cells.includes(name)), [board, cells]);

  useEffect(() => {
    if (cells.every(Boolean)) setMessage("Grid submitted. The official answers will be published here tomorrow.");
  }, [cells]);

  function place(index:number,name:string) {
    if (!name || cells[index]) return;
    const team = board.teams[Math.floor(index/3)];
    const valid = board.answers[team.id][index%3].some((candidate) => normalize(candidate) === normalize(name));
    if (!valid) { setMessage(`${name} does not match that MLB career clue.`); return; }
    const next=[...cells]; next[index]=name; setCells(next); setSelected(""); setMessage("Safe! That player fits both the club and the stat.");
  }

  async function share() {
    const squares = cells.map((cell) => cell ? "🟩" : "⬜");
    const text = `MLB Grid — ${cells.filter(Boolean).length}/9\n${squares.slice(0,3).join("")}\n${squares.slice(3,6).join("")}\n${squares.slice(6,9).join("")}\nhttps://gridirongrid.org/mlb-grid/`;
    try {
      if (navigator.share) await navigator.share({ title:"MLB Grid", text });
      else { await navigator.clipboard.writeText(text); setMessage("Result copied with the gridirongrid.org link."); }
    } catch {}
  }

  return (
    <div className="nba-game mlb-game">
      <div className="nba-board">
        <div className="nba-corner">CLUB × STAT</div>
        {board.categories.map((category)=><div className="nba-category" key={category.short} title={category.detail}><small>HARD</small><span>{category.short}</span><em>?</em></div>)}
        {board.teams.map((team,row)=><div className="nba-row" key={team.id}>
          <div className="nba-team" style={{borderLeftColor:team.color}}><img src={`/mlb/${team.id.toLowerCase()}.png`} alt={`${team.name} logo`} /><span>{team.name}</span></div>
          {[0,1,2].map((column)=>{const index=row*3+column;return <button key={index} onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{event.preventDefault();place(index,event.dataTransfer.getData("text/plain"))}} onClick={()=>selected&&place(index,selected)}>{cells[index]??<span>+</span>}</button>})}
        </div>)}
      </div>
      <aside className="nba-pool"><header><small>9-PLAYER POOL</small><strong>{available.length} left</strong></header>{available.map((name)=><button className={selected===name?"picked":""} key={name} draggable onDragStart={(event)=>{event.dataTransfer.setData("text/plain",name);setSelected(name)}} onClick={()=>setSelected(name)}><span>⚾</span><strong>{name}</strong><b>⠿</b></button>)}</aside>
      <footer className="sport-game-footer"><span>{message}</span><b>{cells.filter(Boolean).length}/9 complete · {dateKey}</b><div><a href="/mlb-grid/archive/">Past answers</a><button onClick={share}>Share result ↗</button></div></footer>
    </div>
  );
}
