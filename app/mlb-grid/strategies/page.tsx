import type {Metadata} from "next";import {SportArticlePage} from "../../sport-content";
export const metadata:Metadata={title:"MLB Grid Strategies – Baseball Trivia Tips",description:"Use career milestones, trades, franchise history, and elimination to solve difficult MLB Grid puzzles.",alternates:{canonical:"/mlb-grid/strategies/"}};
export default function Page(){return <SportArticlePage sport="MLB" type="strategies"/>;}
