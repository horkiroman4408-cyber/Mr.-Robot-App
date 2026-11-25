/* Code 128 (subset B and optimized numeric subset C). Standalone, offline. */
(function(){
'use strict';
const PATTERNS=["212222","222122","222221","121223","121322","131222","122213","122312","132212","221213","221312","231212","112232","122132","122231","113222","123122","123221","223211","221132","221231","213212","223112","312131","311222","321122","321221","312212","322112","322211","212123","212321","232121","111323","131123","131321","112313","132113","132311","211313","231113","231311","112133","112331","132131","113123","113321","133121","313121","211331","231131","213113","213311","213131","311123","311321","331121","312113","312311","332111","314111","221411","431111","111224","111422","121124","121421","141122","141221","112214","112412","122114","122411","142112","142211","241211","221114","413111","241112","134111","111242","121142","121241","114212","124112","124211","411212","421112","421211","212141","214121","412121","111143","111341","131141","114113","114311","411113","411311","113141","114131","311141","411131","211412","211214","211232","2331112"];
function escapeXml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function encode(value){
 const text=String(value);
 if(!text||text.length>180)throw Error('length');
 if(/[^\x20-\x7E]/.test(text))throw Error('ascii');
 const runAt=i=>{let n=0;while(i+n<text.length&&text.charCodeAt(i+n)>=48&&text.charCodeAt(i+n)<=57)n++;return n;};
 let pos=0,mode=runAt(0)>=4?'C':'B',symbols=[mode==='C'?105:104];
 while(pos<text.length){
  const run=runAt(pos);
  if(mode==='C'){
   if(run>=2){symbols.push(Number(text.slice(pos,pos+2)));pos+=2;continue;}
   symbols.push(100);mode='B';
  }else{
   if(run>=6){symbols.push(99);mode='C';continue;}
   symbols.push(text.charCodeAt(pos)-32);pos++;
  }
 }
 let sum=symbols[0];for(let i=1;i<symbols.length;i++)sum+=i*symbols[i];
 symbols.push(sum%103,106);
 return symbols;
}
function render(text){
 const widths=encode(text).map(v=>PATTERNS[v]);
 const modules=widths.reduce((sum,s)=>sum+[...s].reduce((x,y)=>x+Number(y),0),20);
 const mw=2, barH=88, quiet=10;
 let x=quiet*mw, rects='';
 for(const word of widths){for(let i=0;i<word.length;i++){
  const width=Number(word[i])*mw;
  if(i%2===0)rects+='<rect x="'+x+'" y="12" width="'+width+'" height="'+barH+'"/>';
  x+=width;
 }}
 const width=modules*mw;
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="138" viewBox="0 0 '+width+' 138" role="img" aria-label="Code 128"><rect width="100%" height="100%" fill="#fff"/><g fill="#000">'+rects+'</g><text x="'+(width/2)+'" y="121" font-size="15" font-family="Arial,sans-serif" text-anchor="middle" fill="#000">'+escapeXml(text)+'</text></svg>';
 return {svg,width,height:138};
}
window.MRCode128={render};
})();
