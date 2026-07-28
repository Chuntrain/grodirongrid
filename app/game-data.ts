export type Team = {
  id: string;
  name: string;
  shortName: string;
  conference: "AFC" | "NFC";
  division: "East" | "North" | "South" | "West";
  color: string;
  accent: string;
};

export type Category = {
  id: "proBowl" | "superBowl" | "rush1000";
  label: string;
  shortLabel: string;
  description: string;
};

export const categories: Category[] = [
  { id: "proBowl", label: "Selected to a Pro Bowl", shortLabel: "Pro Bowl", description: "Was selected to at least one Pro Bowl during his career." },
  { id: "superBowl", label: "Won a Super Bowl", shortLabel: "Super Bowl Champ", description: "Was on the active roster of a Super Bowl champion." },
  { id: "rush1000", label: "1,000+ rushing yards", shortLabel: "1,000 Rush Yds", description: "Recorded at least 1,000 rushing yards in a single regular season." },
];

export const teams: Team[] = [
  { id:"ARI",name:"Arizona Cardinals",shortName:"Cardinals",conference:"NFC",division:"West",color:"#a40227",accent:"#ffffff" },
  { id:"ATL",name:"Atlanta Falcons",shortName:"Falcons",conference:"NFC",division:"South",color:"#a71930",accent:"#000000" },
  { id:"BAL",name:"Baltimore Ravens",shortName:"Ravens",conference:"AFC",division:"North",color:"#29126f",accent:"#9e7c0c" },
  { id:"BUF",name:"Buffalo Bills",shortName:"Bills",conference:"AFC",division:"East",color:"#00338d",accent:"#d50a0a" },
  { id:"CAR",name:"Carolina Panthers",shortName:"Panthers",conference:"NFC",division:"South",color:"#0085ca",accent:"#101820" },
  { id:"CHI",name:"Chicago Bears",shortName:"Bears",conference:"NFC",division:"North",color:"#0b1c3a",accent:"#e64100" },
  { id:"CIN",name:"Cincinnati Bengals",shortName:"Bengals",conference:"AFC",division:"North",color:"#fb4f14",accent:"#000000" },
  { id:"CLE",name:"Cleveland Browns",shortName:"Browns",conference:"AFC",division:"North",color:"#472a08",accent:"#ff3c00" },
  { id:"DAL",name:"Dallas Cowboys",shortName:"Cowboys",conference:"NFC",division:"East",color:"#002a5c",accent:"#b0b7bc" },
  { id:"DEN",name:"Denver Broncos",shortName:"Broncos",conference:"AFC",division:"West",color:"#0a2343",accent:"#fc4c02" },
  { id:"DET",name:"Detroit Lions",shortName:"Lions",conference:"NFC",division:"North",color:"#0076b6",accent:"#b0b7bc" },
  { id:"GB",name:"Green Bay Packers",shortName:"Packers",conference:"NFC",division:"North",color:"#204e32",accent:"#ffb612" },
  { id:"HOU",name:"Houston Texans",shortName:"Texans",conference:"AFC",division:"South",color:"#00143f",accent:"#c41230" },
  { id:"IND",name:"Indianapolis Colts",shortName:"Colts",conference:"AFC",division:"South",color:"#003b75",accent:"#ffffff" },
  { id:"JAX",name:"Jacksonville Jaguars",shortName:"Jaguars",conference:"AFC",division:"South",color:"#007487",accent:"#d7a22a" },
  { id:"KC",name:"Kansas City Chiefs",shortName:"Chiefs",conference:"AFC",division:"West",color:"#e31837",accent:"#ffb612" },
  { id:"LV",name:"Las Vegas Raiders",shortName:"Raiders",conference:"AFC",division:"West",color:"#000000",accent:"#a5acaf" },
  { id:"LAC",name:"Los Angeles Chargers",shortName:"Chargers",conference:"AFC",division:"West",color:"#0080c6",accent:"#ffc20e" },
  { id:"LAR",name:"Los Angeles Rams",shortName:"Rams",conference:"NFC",division:"West",color:"#003594",accent:"#ffd100" },
  { id:"MIA",name:"Miami Dolphins",shortName:"Dolphins",conference:"AFC",division:"East",color:"#008e97",accent:"#fc4c02" },
  { id:"MIN",name:"Minnesota Vikings",shortName:"Vikings",conference:"NFC",division:"North",color:"#4f2683",accent:"#ffc62f" },
  { id:"NE",name:"New England Patriots",shortName:"Patriots",conference:"AFC",division:"East",color:"#002a5c",accent:"#c60c30" },
  { id:"NO",name:"New Orleans Saints",shortName:"Saints",conference:"NFC",division:"South",color:"#d3bc8d",accent:"#000000" },
  { id:"NYG",name:"New York Giants",shortName:"Giants",conference:"NFC",division:"East",color:"#003c7f",accent:"#c9243f" },
  { id:"NYJ",name:"New York Jets",shortName:"Jets",conference:"AFC",division:"East",color:"#115740",accent:"#ffffff" },
  { id:"PHI",name:"Philadelphia Eagles",shortName:"Eagles",conference:"NFC",division:"East",color:"#06424d",accent:"#a5acaf" },
  { id:"PIT",name:"Pittsburgh Steelers",shortName:"Steelers",conference:"AFC",division:"North",color:"#000000",accent:"#ffb612" },
  { id:"SF",name:"San Francisco 49ers",shortName:"49ers",conference:"NFC",division:"West",color:"#aa0000",accent:"#b3995d" },
  { id:"SEA",name:"Seattle Seahawks",shortName:"Seahawks",conference:"NFC",division:"West",color:"#002a5c",accent:"#69be28" },
  { id:"TB",name:"Tampa Bay Buccaneers",shortName:"Buccaneers",conference:"NFC",division:"South",color:"#bd1c36",accent:"#3e3a35" },
  { id:"TEN",name:"Tennessee Titans",shortName:"Titans",conference:"AFC",division:"South",color:"#4495d2",accent:"#001532" },
  { id:"WSH",name:"Washington Commanders",shortName:"Commanders",conference:"NFC",division:"East",color:"#5a1414",accent:"#ffb612" },
];

type AnswerSet = Record<Category["id"], string[]>;

export type PlayerRecord = {
  name: string;
  teams: string[];
  proBowl: boolean;
  superBowl: boolean;
  rush1000: boolean;
};

export const playerDatabase = rawPlayerDatabase as PlayerRecord[];

// A compact, verified starter knowledge base. Each intersection has at least one
// canonical answer, so every generated board is always solvable.
export const answers: Record<string, AnswerSet> = {
  ARI:{proBowl:["Larry Fitzgerald","Kyler Murray"],superBowl:["Emmitt Smith","Dwight Freeney"],rush1000:["Edgerrin James","Adrian Peterson"]},
  ATL:{proBowl:["Julio Jones","Matt Ryan"],superBowl:["Tommy McDonald","Dwight Freeney"],rush1000:["Michael Turner","Warrick Dunn"]},
  BAL:{proBowl:["Ray Lewis","Lamar Jackson"],superBowl:["Ray Lewis","Joe Flacco"],rush1000:["Jamal Lewis","Lamar Jackson"]},
  BUF:{proBowl:["Josh Allen","Jim Kelly"],superBowl:["Von Miller","LeSean McCoy"],rush1000:["O. J. Simpson","LeSean McCoy"]},
  CAR:{proBowl:["Cam Newton","Steve Smith Sr."],superBowl:["Reggie White","Keyshawn Johnson"],rush1000:["Christian McCaffrey","DeAngelo Williams"]},
  CHI:{proBowl:["Walter Payton","Mike Ditka"],superBowl:["Jim McMahon","Richard Dent"],rush1000:["Walter Payton","Matt Forte"]},
  CIN:{proBowl:["Joe Burrow","Ja'Marr Chase"],superBowl:["Terrell Owens","James Harrison"],rush1000:["Corey Dillon","Joe Mixon"]},
  CLE:{proBowl:["Jim Brown","Nick Chubb"],superBowl:["Odell Beckham Jr.","Joe Haden"],rush1000:["Jim Brown","Nick Chubb"]},
  DAL:{proBowl:["Emmitt Smith","Troy Aikman"],superBowl:["Emmitt Smith","Troy Aikman"],rush1000:["Emmitt Smith","Ezekiel Elliott"]},
  DEN:{proBowl:["John Elway","Peyton Manning"],superBowl:["John Elway","Peyton Manning"],rush1000:["Terrell Davis","Clinton Portis"]},
  DET:{proBowl:["Barry Sanders","Calvin Johnson"],superBowl:["Matthew Stafford","Ndamukong Suh"],rush1000:["Barry Sanders","Jahmyr Gibbs"]},
  GB:{proBowl:["Brett Favre","Aaron Rodgers"],superBowl:["Bart Starr","Aaron Rodgers"],rush1000:["Ahman Green","Aaron Jones"]},
  HOU:{proBowl:["Andre Johnson","J. J. Watt"],superBowl:["Ed Reed","Bradley Roby"],rush1000:["Arian Foster","Lamar Miller"]},
  IND:{proBowl:["Peyton Manning","Marvin Harrison"],superBowl:["Peyton Manning","Reggie Wayne"],rush1000:["Edgerrin James","Jonathan Taylor"]},
  JAX:{proBowl:["Tony Boselli","Maurice Jones-Drew"],superBowl:["Jimmy Smith","Malik Jackson"],rush1000:["Fred Taylor","Maurice Jones-Drew"]},
  KC:{proBowl:["Patrick Mahomes","Travis Kelce"],superBowl:["Patrick Mahomes","Travis Kelce"],rush1000:["Priest Holmes","Jamaal Charles"]},
  LV:{proBowl:["Tim Brown","Charles Woodson"],superBowl:["Marcus Allen","Jim Plunkett"],rush1000:["Marcus Allen","Josh Jacobs"]},
  LAC:{proBowl:["LaDainian Tomlinson","Philip Rivers"],superBowl:["Eric Weddle","Dwight Freeney"],rush1000:["LaDainian Tomlinson","Melvin Gordon"]},
  LAR:{proBowl:["Aaron Donald","Cooper Kupp"],superBowl:["Aaron Donald","Matthew Stafford"],rush1000:["Eric Dickerson","Todd Gurley"]},
  MIA:{proBowl:["Dan Marino","Jason Taylor"],superBowl:["Larry Csonka","Bob Griese"],rush1000:["Ricky Williams","Lamar Miller"]},
  MIN:{proBowl:["Randy Moss","Justin Jefferson"],superBowl:["Brett Favre","Percy Harvin"],rush1000:["Adrian Peterson","Dalvin Cook"]},
  NE:{proBowl:["Tom Brady","Rob Gronkowski"],superBowl:["Tom Brady","Rob Gronkowski"],rush1000:["Corey Dillon","Stevan Ridley"]},
  NO:{proBowl:["Drew Brees","Alvin Kamara"],superBowl:["Drew Brees","Reggie Bush"],rush1000:["Deuce McAllister","Mark Ingram II"]},
  NYG:{proBowl:["Lawrence Taylor","Eli Manning"],superBowl:["Eli Manning","Michael Strahan"],rush1000:["Tiki Barber","Saquon Barkley"]},
  NYJ:{proBowl:["Joe Namath","Darrelle Revis"],superBowl:["Joe Namath","Darrelle Revis"],rush1000:["Curtis Martin","Thomas Jones"]},
  PHI:{proBowl:["Brian Dawkins","Jalen Hurts"],superBowl:["Nick Foles","Jason Kelce"],rush1000:["LeSean McCoy","Miles Sanders"]},
  PIT:{proBowl:["Terry Bradshaw","T. J. Watt"],superBowl:["Terry Bradshaw","Ben Roethlisberger"],rush1000:["Franco Harris","Jerome Bettis"]},
  SF:{proBowl:["Joe Montana","Jerry Rice"],superBowl:["Joe Montana","Jerry Rice"],rush1000:["Frank Gore","Christian McCaffrey"]},
  SEA:{proBowl:["Russell Wilson","Walter Jones"],superBowl:["Russell Wilson","Marshawn Lynch"],rush1000:["Marshawn Lynch","Shaun Alexander"]},
  TB:{proBowl:["Derrick Brooks","Mike Evans"],superBowl:["Tom Brady","Derrick Brooks"],rush1000:["Warrick Dunn","Doug Martin"]},
  TEN:{proBowl:["Steve McNair","Derrick Henry"],superBowl:["Malcolm Butler","Logan Ryan"],rush1000:["Eddie George","Derrick Henry"]},
  WSH:{proBowl:["Darrell Green","Art Monk"],superBowl:["Doug Williams","John Riggins"],rush1000:["John Riggins","Clinton Portis"]},
};

function normalizeName(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

const playerIndex = new Map<string, PlayerRecord[]>();
for (const player of playerDatabase) {
  const key = normalizeName(player.name);
  const current = playerIndex.get(key) ?? [];
  current.push(player);
  playerIndex.set(key, current);
}

export function isValidPlayer(name: string, teamId: string, categoryId: Category["id"]) {
  const normalized = normalizeName(name);
  const databaseMatch = (playerIndex.get(normalized) ?? []).some(
    (player) => player.teams.includes(teamId) && player[categoryId],
  );
  if (databaseMatch) return true;
  return answers[teamId][categoryId].some((candidate) => normalizeName(candidate) === normalized);
}

export function playerOptions(teamIds: string[]) {
  const names = new Set<string>();
  for (const player of playerDatabase) {
    if (player.teams.some((team) => teamIds.includes(team))) names.add(player.name);
  }
  for (const teamId of teamIds) {
    for (const category of categories) answers[teamId][category.id].forEach((name) => names.add(name));
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function teamLogo(teamId: string) {
  return `/teams/${teamId.toLowerCase()}.png`;
}

function hashDate(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function easternPuzzleDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const base = `${get("year")}-${get("month")}-${get("day")}`;
  if (Number(get("hour")) >= 20) return base;
  const previous = new Date(`${base}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous.toISOString().slice(0, 10);
}

export function dailyPuzzle(dateKey: string) {
  let seed = hashDate(`gridiron-grid:${dateKey}`);
  const pool = [...teams];
  const selected: Team[] = [];
  while (selected.length < 3) {
    seed = Math.imul(seed ^ (seed >>> 15), 2246822519) >>> 0;
    const index = seed % pool.length;
    selected.push(pool.splice(index, 1)[0]);
  }
  const number = Math.floor((new Date(`${dateKey}T00:00:00Z`).getTime() - new Date("2026-01-01T00:00:00Z").getTime()) / 86400000) + 1;
  return { dateKey, number, teams: selected, categories };
}
import rawPlayerDatabase from "./player-db.json";
