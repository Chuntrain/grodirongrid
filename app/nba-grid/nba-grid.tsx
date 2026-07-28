"use client";

import { useMemo, useState } from "react";

const teams = [
  { id:"LAL", name:"Lakers", color:"#552583" },
  { id:"BOS", name:"Celtics", color:"#007A33" },
  { id:"GSW", name:"Warriors", color:"#1D428A" },
];
const categories = ["NBA Champion", "NBA All-Star", "League MVP"];
const answers: Record<string,string[][]> = {
  LAL:[
    ["LeBron James","Anthony Davis","Magic Johnson","Kobe Bryant","Shaquille O'Neal"],
    ["LeBron James","Anthony Davis","Magic Johnson","Kobe Bryant","Pau Gasol"],
    ["LeBron James","Magic Johnson","Kobe Bryant","Shaquille O'Neal","Kareem Abdul-Jabbar"],
  ],
  BOS:[
    ["Jayson Tatum","Jaylen Brown","Kevin Garnett","Paul Pierce","Larry Bird"],
    ["Jayson Tatum","Jaylen Brown","Kevin Garnett","Paul Pierce","Larry Bird"],
    ["Larry Bird","Bill Russell","Kevin Garnett","Bob McAdoo","Shaquille O'Neal"],
  ],
  GSW:[
    ["Stephen Curry","Klay Thompson","Kevin Durant","Draymond Green","Andre Iguodala"],
    ["Stephen Curry","Klay Thompson","Kevin Durant","Draymond Green","Chris Paul"],
    ["Stephen Curry","Kevin Durant","Wilt Chamberlain","Chris Paul","Bob McAdoo"],
  ],
};
const pool = ["LeBron James","Anthony Davis","Magic Johnson","Kobe Bryant","Shaquille O'Neal","Kareem Abdul-Jabbar","Jayson Tatum","Jaylen Brown","Kevin Garnett","Paul Pierce","Larry Bird","Bill Russell","Stephen Curry","Klay Thompson","Kevin Durant","Draymond Green","Andre Iguodala","Chris Paul"];
const normalize = (value:string) => value.toLowerCase().replace(/[^a-z0-9]/g,"");

export function NbaGrid() {
  const [cells,setCells] = useState<(string|null)[]>(Array(9).fill(null));
  const [selected,setSelected] = useState("");
  const [message,setMessage] = useState("Drag a player from the pool into the NBA grid.");
  const available = useMemo(() => pool.filter((name) => !cells.includes(name)), [cells]);

  function place(index:number,name:string) {
    if (!name || cells[index]) return;
    const team = teams[Math.floor(index/3)];
    const category = index%3;
    const valid = answers[team.id][category].some((candidate) => normalize(candidate) === normalize(name));
    if (!valid) { setMessage(`${name} does not fit that square. Try another matchup.`); return; }
    const next=[...cells]; next[index]=name; setCells(next); setSelected(""); setMessage("Bucket! That player fits both clues.");
  }

  return (
    <div className="nba-game">
      <div className="nba-board">
        <div className="nba-corner">TEAM × FEAT</div>
        {categories.map((category)=><div className="nba-category" key={category}>{category}</div>)}
        {teams.map((team,row)=><div className="nba-row" key={team.id}>
          <div className="nba-team" style={{borderLeftColor:team.color}}><img src={`/nba/${team.id.toLowerCase()}.png`} alt={`${team.name} logo`} /><span>{team.name}</span></div>
          {[0,1,2].map((column)=>{const index=row*3+column;return <button key={index} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();place(index,e.dataTransfer.getData("text/plain"))}} onClick={()=>selected&&place(index,selected)}>{cells[index]??<span>+</span>}</button>})}
        </div>)}
      </div>
      <aside className="nba-pool"><header><small>PLAYER POOL</small><strong>{available.length} cards</strong></header>{available.map((name)=><button className={selected===name?"picked":""} key={name} draggable onDragStart={(e)=>{e.dataTransfer.setData("text/plain",name);setSelected(name)}} onClick={()=>setSelected(name)}><span>🏀</span><strong>{name}</strong><b>⠿</b></button>)}</aside>
      <footer><span>{message}</span><b>{cells.filter(Boolean).length}/9 complete</b></footer>
    </div>
  );
}
