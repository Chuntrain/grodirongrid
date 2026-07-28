export function DateNav({ date, base }: { date:string; base:string }) {
  const current=new Date(`${date}T12:00:00Z`);
  const previous=new Date(current); previous.setUTCDate(previous.getUTCDate()-1);
  const next=new Date(current); next.setUTCDate(next.getUTCDate()+1);
  const format=(value:Date)=>value.toISOString().slice(0,10);
  return <nav className="date-nav" aria-label="Puzzle date navigation"><a href={`${base}${format(previous)}/`}>← Previous day</a><strong>{date}</strong><a href={`${base}${format(next)}/`}>Next day →</a></nav>;
}
