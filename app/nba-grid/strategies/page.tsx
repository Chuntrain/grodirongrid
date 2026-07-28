import type {Metadata} from "next";import {SportArticlePage} from "../../sport-content";
export const metadata:Metadata={title:"NBA Grid Strategies – Basketball Trivia Tips",description:"Solve hard NBA Grid puzzles using career scoring, awards, team history, and card elimination.",alternates:{canonical:"/nba-grid/strategies/"}};
export default function Page(){return <SportArticlePage sport="NBA" type="strategies"/>;}
