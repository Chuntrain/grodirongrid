import type { Metadata } from "next";
import { DateNav } from "../../../date-nav";
import { NbaGrid } from "../../nba-grid";

type Props={params:Promise<{date:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {date}=await params;return{title:`NBA Grid ${date} – Basketball Puzzle`,description:`Play the archived NBA Grid for ${date}, with its original teams, career statistics, and nine-player pool.`,alternates:{canonical:`/nba-grid/game/${date}/`}};}
export default async function Page({params}:Props){const {date}=await params;return <main className="dated-game-page nba-dated"><header className="archive-header"><a className="brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a><a href="/nba-grid/archive/">All NBA puzzles →</a></header><section><p className="section-kicker">NBA PUZZLE ARCHIVE</p><h1>NBA Grid <em>{date}</em></h1><p>Replay the exact teams, statistical tests, and nine-player pool from this date.</p><NbaGrid date={date}/><DateNav date={date} base="/nba-grid/game/"/></section></main>;}
