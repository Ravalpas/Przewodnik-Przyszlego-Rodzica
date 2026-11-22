// Personal data belongs only to this loaded page. No unload handler is needed
// for correctness: closing/reloading creates an entirely new, empty store.
export function createPageStorage(){
 const data=new Map();
 return {get length(){return data.size;},key:index=>[...data.keys()][index]??null,getItem:key=>data.get(String(key))??null,setItem:(key,value)=>data.set(String(key),String(value)),removeItem:key=>data.delete(String(key)),clear:()=>data.clear()};
}
export function clearLegacyPersonalData(storage){
 if(!storage)return;
 for(const key of ['ppm-profile-v1','ppm-profile','ppm-notes-v1','ppm-calendar-notes-v1','ppm-bielik-conversations-v1','ppm-chat-archive-v1','ppm-chat-v1','ppm-calculator-v1','ppm-records-v1','ppm-test-reset'])storage.removeItem(key);
 // Older app revisions used different personal-state suffixes.
 for(let i=storage.length-1;i>=0;i--){const key=storage.key(i);if(/^ppm-(?:profile|notes|chat|family|calculator-v|records-v)/.test(key||''))storage.removeItem(key);}
}
