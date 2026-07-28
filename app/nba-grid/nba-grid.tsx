"use client";

import { useEffect, useMemo, useState } from "react";
import { easternPuzzleDate } from "../game-data";

export const nbaBoards = [
  {
    teams:[{id:"LAL",name:"Lakers",color:"#552583"},{id:"BOS",name:"Celtics",color:"#007A33"},{id:"GSW",name:"Warriors",color:"#1D428A"}],
    categories:[
      {short:"TOP 25 POINTS",detail:"Ranks among the NBA's 25 highest career scorers."},
      {short:"SCORING CHAMP",detail:"Led the NBA in points per game for at least one season."},
      {short:"10+ ALL-STARS",detail:"Earned at least ten NBA All-Star selections."},
    ],
    answers:{
      LAL:[["LeBron James"],["Kobe Bryant"],["Kareem Abdul-Jabbar"]],
      BOS:[["Kevin Garnett"],["Bob McAdoo"],["Larry Bird"]],
      GSW:[["Kevin Durant"],["Stephen Curry"],["Wilt Chamberlain"]],
    } as Record<string,string[][]>,
    pool:["LeBron James","Kobe Bryant","Kareem Abdul-Jabbar","Kevin Garnett","Bob McAdoo","Larry Bird","Kevin Durant","Stephen Curry","Wilt Chamberlain"],
  },
  {
    teams:[{id:"CHI",name:"Bulls",color:"#CE1141"},{id:"MIA",name:"Heat",color:"#98002E"},{id:"BKN",name:"Nets",color:"#000000"}],
    categories:[
      {short:"2,000+ THREES",detail:"Made at least 2,000 regular-season three-pointers."},
      {short:"WON DPOY",detail:"Won NBA Defensive Player of the Year."},
      {short:"WON ROY",detail:"Won NBA Rookie of the Year."},
    ],
    answers:{
      CHI:[["Jamal Crawford"],["Michael Jordan"],["Derrick Rose"]],
      MIA:[["Ray Allen"],["Alonzo Mourning"],["LeBron James"]],
      BKN:[["James Harden"],["Kevin Garnett"],["Vince Carter"]],
    } as Record<string,string[][]>,
    pool:["Jamal Crawford","Michael Jordan","Derrick Rose","Ray Allen","Alonzo Mourning","LeBron James","James Harden","Kevin Garnett","Vince Carter"],
  },
];
const normalize = (value:string) => value.toLowerCase().replace(/[^a-z0-9]/g,"");

export function NbaGrid() {
  const dateKey = useMemo(() => easternPuzzleDate(), []);
  const board = nbaBoards[Math.abs([...dateKey].reduce((sum,char)=>sum+char.charCodeAt(0),0)) % nbaBoards.length];
  const [cells,setCells] = useState<(string|null)[]>(Array(9).fill(null));
  const [selected,setSelected] = useState("");
  const [message,setMessage] = useState("Hard mode: place all nine players with no repeats.");
  const available = useMemo(() => board.pool.filter((name) => !cells.includes(name)), [board, cells]);

  useEffect(() => {
    if (cells.every(Boolean)) setMessage("Grid submitted. The official answers will be published here tomorrow.");
  }, [cells]);

  function place(index:number,name:string) {
    if (!name || cells[index]) return;
    const team = board.teams[Math.floor(index/3)];
    const valid = board.answers[team.id][index%3].some((candidate) => normalize(candidate) === normalize(name));
    if (!valid) { setMessage(`${name} does not fit that statistical clue. Try another matchup.`); return; }
    const next=[...cells]; next[index]=name; setCells(next); setSelected(""); setMessage("Bucket! That player clears the career threshold.");
  }

  async function share() {
    const squares = cells.map((cell) => cell ? "🟩" : "⬜");
    const text = `NBA Grid — ${cells.filter(Boolean).length}/9\n${squares.slice(0,3).join("")}\n${squares.slice(3,6).join("")}\n${squares.slice(6,9).join("")}\nhttps://gridirongrid.org/nba-grid/`;
    try {
      if (navigator.share) await navigator.share({ title:"NBA Grid", text });
      else { await navigator.clipboard.writeText(text); setMessage("Result copied with the gridirongrid.org link."); }
    } catch {}
  }

  return (
    <div className="nba-game">
      <div className="nba-board">
        <div className="nba-corner">TEAM × STAT</div>
        {board.categories.map((category)=><div className="nba-category" key={category.short} title={category.detail}><small>HARD</small><span>{category.short}</span><em>?</em></div>)}
        {board.teams.map((team,row)=><div className="nba-row" key={team.id}>
          <div className="nba-team" style={{borderLeftColor:team.color}}><img src={`/nba/${team.id.toLowerCase()}.png`} alt={`${team.name} logo`} /><span>{team.name}</span></div>
          {[0,1,2].map((column)=>{const index=row*3+column;return <button key={index} onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{event.preventDefault();place(index,event.dataTransfer.getData("text/plain"))}} onClick={()=>selected&&place(index,selected)}>{cells[index]??<span>+</span>}</button>})}
        </div>)}
      </div>
      <aside className="nba-pool"><header><small>9-PLAYER POOL</small><strong>{available.length} left</strong></header>{available.map((name)=><button className={selected===name?"picked":""} key={name} draggable onDragStart={(event)=>{event.dataTransfer.setData("text/plain",name);setSelected(name)}} onClick={()=>setSelected(name)}><span>🏀</span><strong>{name}</strong><b>⠿</b></button>)}</aside>
      <footer className="sport-game-footer"><span>{message}</span><b>{cells.filter(Boolean).length}/9 complete · {dateKey}</b><div><a href="/nba-grid/archive/">Past answers</a><button onClick={share}>Share result ↗</button></div></footer>
    </div>
  );
}
