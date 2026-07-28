import type { Metadata } from "next";
import { DateNav } from "../../../date-nav";
import { MlbGrid } from "../../mlb-grid";

type Props={params:Promise<{date:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {date}=await params;return{title:`MLB Grid ${date} – Baseball Puzzle`,description:`Play the archived MLB Grid for ${date}, with its original clubs, career statistics, and nine-player pool.`,alternates:{canonical:`/mlb-grid/game/${date}/`}};}
export default async function Page({params}:Props){const {date}=await params;return <main className="dated-game-page mlb-dated"><header className="archive-header"><a className="brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a><a href="/mlb-grid/archive/">All MLB puzzles →</a></header><section><p className="section-kicker">MLB PUZZLE ARCHIVE</p><h1>MLB Grid <em>{date}</em></h1><p>Replay the exact clubs, career tests, and nine-player pool from this date.</p><MlbGrid date={date}/><DateNav date={date} base="/mlb-grid/game/"/></section></main>;}
