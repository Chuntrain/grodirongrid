"use client";

import { useEffect, useMemo, useState } from "react";
import { easternPuzzleDate } from "../../game-data";
import { nbaBoards } from "../nba-grid";

export function NbaArchive() {
  const [open,setOpen] = useState(0);
  const days = useMemo(() => {
    const today=new Date(`${easternPuzzleDate()}T12:00:00Z`);
    return Array.from({length:14},(_,index)=>{
      const date=new Date(today); date.setUTCDate(date.getUTCDate()-index-1);
      const key=date.toISOString().slice(0,10);
      const board=nbaBoards[Math.abs([...key].reduce((sum,char)=>sum+char.charCodeAt(0),0))%nbaBoards.length];
      return {key,board};
    });
  },[]);
  useEffect(()=>{const requested=new URLSearchParams(window.location.search).get("answers");const index=days.findIndex(({key})=>key===requested);if(index>=0)setOpen(index);},[days]);
  return <SportArchive title="NBA Answer Archive" sport="NBA" days={days} open={open} setOpen={setOpen} logoFolder="nba" />;
}

function SportArchive({title,sport,days,open,setOpen,logoFolder}:{title:string;sport:string;days:{key:string;board:(typeof nbaBoards)[number]}[];open:number;setOpen:(value:number)=>void;logoFolder:string}) {
  return <main className="archive-page"><header className="archive-header"><a className="brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a><a href={`/${sport.toLowerCase()}-grid/`}>← Back to today&apos;s {sport} Grid</a></header><section className="archive-hero"><p className="section-kicker">PAST RESULTS</p><h1>{title}</h1><p>Official answers appear after each daily puzzle closes. One accepted player is shown for every square.</p></section><section className="archive-list">{days.map(({key,board},index)=><article className="archive-item" key={key} id={key}><button onClick={()=>setOpen(open===index?-1:index)}><span>{String(index+1).padStart(2,"0")}</span><strong>{key}</strong><div>{board.teams.map((team)=><img src={`/${logoFolder}/${team.id.toLowerCase()}.png`} alt={team.name} key={team.id}/>)}</div><b>{open===index?"Hide answers −":"View answers +"}</b></button>{open===index&&<><div className="archive-answer-grid">{board.teams.map((team)=>board.categories.map((category,column)=><div key={`${team.id}-${category.short}`}><img src={`/${logoFolder}/${team.id.toLowerCase()}.png`} alt=""/><span><small>{team.name} × {category.short}</small><strong>{board.answers[team.id][column][0]}</strong></span></div>))}</div><a className="archive-play-link" href={`/nba-grid/game/${key}/`}>Play this archived grid →</a></>}</article>)}</section></main>;
}
