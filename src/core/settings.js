export const DEFAULT_SETTINGS={difficulty:1,volume:.6,music:.25,quality:'medium',touch:'auto'};
export function loadSettings(){
  try{const value=JSON.parse(localStorage.getItem('fury-arena-settings')||'{}');return {difficulty:[0,1,2].includes(value.difficulty)?value.difficulty:1,volume:[0,.2,.4,.6,.8,1].includes(value.volume)?value.volume:.6,music:[0,.125,.25,.375,.5].includes(value.music)?value.music:.25,quality:['low','medium','high'].includes(value.quality)?value.quality:'medium',touch:['auto','on','off'].includes(value.touch)?value.touch:'auto'};}catch{return {...DEFAULT_SETTINGS};}
}
export function saveSettings(settings){try{localStorage.setItem('fury-arena-settings',JSON.stringify(settings));}catch{/* Settings remain usable for the session when storage is unavailable. */}}
