import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const now=new Date();
  const pages:MetadataRoute.Sitemap=[
    {url:"https://gridirongrid.org/",lastModified:now,changeFrequency:"daily",priority:1},
    {url:"https://gridirongrid.org/archive/",lastModified:now,changeFrequency:"daily",priority:.7},
    {url:"https://gridirongrid.org/how-to-play/",lastModified:now,changeFrequency:"monthly",priority:.7},
    {url:"https://gridirongrid.org/strategies/",lastModified:now,changeFrequency:"monthly",priority:.7},
  ];
  for(const sport of ["nba-grid","mlb-grid"]){
    pages.push(
      {url:`https://gridirongrid.org/${sport}/`,lastModified:now,changeFrequency:"daily",priority:.9},
      {url:`https://gridirongrid.org/${sport}/archive/`,lastModified:now,changeFrequency:"daily",priority:.6},
      {url:`https://gridirongrid.org/${sport}/how-to-play/`,lastModified:now,changeFrequency:"monthly",priority:.7},
      {url:`https://gridirongrid.org/${sport}/strategies/`,lastModified:now,changeFrequency:"monthly",priority:.7},
    );
  }
  for(let index=1;index<=14;index++){
    const day=new Date(now);day.setUTCDate(day.getUTCDate()-index);const date=day.toISOString().slice(0,10);
    pages.push(
      {url:`https://gridirongrid.org/game/${date}/`,lastModified:now,changeFrequency:"never",priority:.55},
      {url:`https://gridirongrid.org/nba-grid/game/${date}/`,lastModified:now,changeFrequency:"never",priority:.5},
      {url:`https://gridirongrid.org/mlb-grid/game/${date}/`,lastModified:now,changeFrequency:"never",priority:.5},
    );
  }
  return pages;
}
