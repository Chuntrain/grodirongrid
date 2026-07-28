"use client";

import { useMemo, useState } from "react";

const teams = [
  { id:"LAL", name:"Lakers", color:"#552583" },
  { id:"BOS", name:"Celtics", color:"#007A33" },
  { id:"GSW", name:"Warriors", color:"#1D428A" },
];
const categories = [
  { short:"TOP 25 POINTS", detail:"Finished or currently ranks among the NBA's 25 highest career scorers." },
  { short:"SCORING CHAMP", detail:"Led the NBA in regular-season points per game for at least one season." },
  { short:"10+ ALL-STARS", detail:"Earned at least ten NBA All-Star selections during his career." },
];
const answers: Record<string,string[][]> = {
  LAL:[
    ["LeBron James","Kobe Bryant","Kareem Abdul-Jabbar","Kevin Durant"],
    ["LeBron James","Kobe Bryant","Kareem Abdul-Jabbar","Kevin Durant","Bob McAdoo"],
    ["LeBron James","Kobe Bryant","Kareem Abdul-Jabbar"],
  ],
  BOS:[
    ["Kevin Garnett"],
    ["Bob McAdoo"],
    ["Larry Bird","Kevin Garnett"],
  ],
  GSW:[
    ["Kevin Durant","Wilt Chamberlain"],
    ["Stephen Curry","Kevin Durant","Wilt Chamberlain"],
    ["Stephen Curry","Kevin Durant","Wilt Chamberlain"],
  ],
};
const pool = ["LeBron James","Kobe Bryant","Kareem Abdul-Jabbar","Kevin Garnett","Bob McAdoo","Larry Bird","Kevin Durant","Stephen Curry","Wilt Chamberlain"];
const normalize = (value:string) => value.toLowerCase().replace(/[^a-z0-9]/g,"");

export function NbaGrid() {
  const [cells,setCells] = useState<(string|null)[]>(Array(9).fill(null));
  const [selected,setSelected] = useState("");
  const [message,setMessage] = useState("Hard mode: place all nine players with no repeats.");
  const available = useMemo(() => pool.filter((name) => !cells.includes(name)), [cells]);

  function place(index:number,name:string) {
    if (!name || cells[index]) return;
    const team = teams[Math.floor(index/3)];
    const categoryIndex = index%3;
    const valid = answers[team.id][categoryIndex].some((candidate) => normalize(candidate) === normalize(name));
    if (!valid) { setMessage(`${name} does not fit that statistical clue. Try another matchup.`); return; }
    const next=[...cells]; next[index]=name; setCells(next); setSelected(""); setMessage("Bucket! That player clears the career threshold.");
  }

  return (
    <div className="nba-game">
      <div className="nba-board">
        <div className="nba-corner">TEAM × STAT</div>
        {categories.map((category)=><div className="nba-category" key={category.short} title={category.detail}><small>HARD</small><span>{category.short}</span><em>?</em></div>)}
        {teams.map((team,row)=><div className="nba-row" key={team.id}>
          <div className="nba-team" style={{borderLeftColor:team.color}}><img src={`/nba/${team.id.toLowerCase()}.png`} alt={`${team.name} logo`} /><span>{team.name}</span></div>
          {[0,1,2].map((column)=>{const index=row*3+column;return <button key={index} onDragOver={(event)=>event.preventDefault()} onDrop={(event)=>{event.preventDefault();place(index,event.dataTransfer.getData("text/plain"))}} onClick={()=>selected&&place(index,selected)}>{cells[index]??<span>+</span>}</button>})}
        </div>)}
      </div>
      <aside className="nba-pool">
        <header><small>9-PLAYER POOL</small><strong>{available.length} left</strong></header>
        {available.map((name)=><button className={selected===name?"picked":""} key={name} draggable onDragStart={(event)=>{event.dataTransfer.setData("text/plain",name);setSelected(name)}} onClick={()=>setSelected(name)}><span>🏀</span><strong>{name}</strong><b>⠿</b></button>)}
      </aside>
      <footer><span>{message}</span><b>{cells.filter(Boolean).length}/9 complete</b></footer>
    </div>
  );
}
