export function scopeCatalog(catalog,scope='zus') {
  if(scope==='all')return catalog;
  const sources=catalog.sources.filter(s=>{try{return ['zus.pl','www.zus.pl'].includes(new URL(s.url).hostname);}catch{return false;}}),ids=new Set(sources.map(s=>s.id));
  return {...catalog,sources,events:catalog.events.filter(e=>ids.has(e.source))};
}
