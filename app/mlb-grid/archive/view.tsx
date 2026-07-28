"use client";

import { useMemo, useState } from "react";
import { easternPuzzleDate } from "../../game-data";
import { mlbBoards } from "../mlb-grid";

export function MlbArchive() {
  const [open,setOpen] = useState(0);
  const days=useMemo(()=>{const today=new Date(`${easternPuzzleDate()}T12:00:00Z`);return Array.from({length:14},(_,index)=>{const date=new Date(today);date.setUTCDate(date.getUTCDate()-index-1);const key=date.toISOString().slice(0,10);return {key,board:mlbBoards[(Number(key.slice(-2))+1)%mlbBoards.length]};});},[]);
  return <main className="archive-page"><header className="archive-header"><a className="brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a><a href="/mlb-grid/">← Back to today&apos;s MLB Grid</a></header><section className="archive-hero"><p className="section-kicker">PAST RESULTS</p><h1>MLB Answer Archive</h1><p>Official answers appear after each daily puzzle closes. One accepted player is shown for every square.</p></section><section className="archive-list">{days.map(({key,board},index)=><article className="archive-item" key={key}><button onClick={()=>setOpen(open===index?-1:index)}><span>{String(index+1).padStart(2,"0")}</span><strong>{key}</strong><div>{board.teams.map((team)=><img src={`/mlb/${team.id.toLowerCase()}.png`} alt={team.name} key={team.id}/>)}</div><b>{open===index?"Hide answers −":"View answers +"}</b></button>{open===index&&<div className="archive-answer-grid">{board.teams.map((team)=>board.categories.map((category,column)=><div key={`${team.id}-${category.short}`}><img src={`/mlb/${team.id.toLowerCase()}.png`} alt=""/><span><small>{team.name} × {category.short}</small><strong>{board.answers[team.id][column][0]}</strong></span></div>))}</div>}</article>)}</section></main>;
}
