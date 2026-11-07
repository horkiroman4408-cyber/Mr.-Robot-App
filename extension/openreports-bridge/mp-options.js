/* Baza MP request preferences. Explicitly allow-listed, never untrusted input. */
(function(){'use strict';
 const KEY='mrOpenReportsMpOptions';
 const AREAS=Object.freeze(['MP*','MP1*','MP2*','MP3*']);
 const BRANDS=Object.freeze(['','HOUSE','SINSAY','CROPP','MOHITO','RESERVED']);
 const DEFAULT=Object.freeze({area:'MP*',brand:'SINSAY'});
 const valid=o=>!!o&&AREAS.includes(o.area)&&BRANDS.includes(o.brand);
 async function load(){try{const r=await chrome.storage.local.get(KEY);return valid(r[KEY])?r[KEY]:{...DEFAULT};}catch{return {...DEFAULT};}}
 async function save(o){if(!valid(o))throw Error('Invalid Baza MP parameters');await chrome.storage.local.set({[KEY]:{area:o.area,brand:o.brand}});}
 const markup=(prefix)=>`<div class="mr-mp-fields"><label><span data-mr-tr="mpArea">Typ lokalizacji MP</span><select id="${prefix}-area"><option>MP*</option><option>MP1*</option><option>MP2*</option><option>MP3*</option></select></label><label><span data-mr-tr="mpBrand">Marka</span><select id="${prefix}-brand"><option value="" data-mr-tr="mpAllBrands">Wszystkie marki</option><option>HOUSE</option><option>SINSAY</option><option>CROPP</option><option>MOHITO</option><option>RESERVED</option></select></label><div class="mr-mp-source">Data Source: <b>WMS ECM REPL PODKARPACIE</b></div></div>`;
 const read=(root,prefix)=>({area:root.querySelector('#'+prefix+'-area')?.value,brand:root.querySelector('#'+prefix+'-brand')?.value});
 const apply=(root,prefix,o)=>{if(!valid(o))return;root.querySelector('#'+prefix+'-area').value=o.area;root.querySelector('#'+prefix+'-brand').value=o.brand;};
 globalThis.MRBridgeMpOptions=Object.freeze({AREAS,BRANDS,DEFAULT,valid,load,save,markup,read,apply});
})();
