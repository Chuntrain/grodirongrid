import type { Metadata } from "next";
import { DailyGrid } from "../../daily-grid";
import { DateNav } from "../../date-nav";

type Props={params:Promise<{date:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {date}=await params;return{title:`Gridiron Grid ${date} – NFL Puzzle`,description:`Play the ${date} Gridiron Grid NFL trivia puzzle and compare teams, stats, and career achievements.`,alternates:{canonical:`/game/${date}/`}};}
export default async function Page({params}:Props){const {date}=await params;return <main className="dated-game-page"><header className="archive-header"><a className="brand" href="/"><span className="brand-ball">G</span><span>GRIDIRON<span>GRID</span></span></a><a href="/archive/">All NFL puzzles →</a></header><section><p className="section-kicker">NFL PUZZLE ARCHIVE</p><h1>Gridiron Grid <em>{date}</em></h1><p>This archived grid keeps its original teams, statistical clues, and player pool.</p><DailyGrid date={date}/><DateNav date={date} base="/game/"/></section></main>;}
