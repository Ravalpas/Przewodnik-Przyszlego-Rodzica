export function d1Store(db) {
  return {
    read:async()=>{const row=await db.prepare('SELECT payload FROM ppm_monitor WHERE id = ?').bind('state').first();return row?JSON.parse(row.payload):null;},
    write:async state=>{await db.prepare('INSERT INTO ppm_monitor (id,payload) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload').bind('state',JSON.stringify(state)).run();},
    acquire:async()=>{
      const payload=JSON.stringify({expires:Date.now()+180000,token:crypto.randomUUID()});
      const row=await db.prepare("INSERT INTO ppm_monitor (id,payload) VALUES ('lease',?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload WHERE json_extract(ppm_monitor.payload,'$.expires') < ? RETURNING payload").bind(payload,Date.now()).first();
      return row?.payload===payload?payload:null;
    },
    release:async lease=>{await db.prepare("DELETE FROM ppm_monitor WHERE id='lease' AND payload=?").bind(lease).run();}
  };
}
