/* Baza MP request preferences. Explicitly allow-listed, never untrusted input. */
(function(){'use strict';
 const KEY='mrOpenReportsMpOptions';
 const AREAS=Object.freeze(['MP*','MP1*','MP2*','MP3*']);
 const BRANDS=Object.freeze(['','HOUSE','SINSAY','CROPP','MOHITO','RESERVED']);
 const DEFAULT=Object.freeze({area:'MP*',brand:'SINSAY'});
 const valid=o=>!!o&&AREAS.includes(o.area)&&BRANDS.includes(o.brand);
 async function load(){try{const r=await chrome.storage.local.get(KEY);return valid(r[KEY])?r[KEY]:{...DEFAULT};}catch{return {...DEFAULT};}}
 async function save(o){if(!valid(o))throw Error('Invalid Baza MP parameters');await chrome.storage.local.set({[KEY]:{area:o.area,brand:o.brand}});}
 const makeChoices=(prefix,type,values)=>`<div class="mr-mp-choices ${type==='area'?'mr-mp-area-choices':'mr-mp-brand-choices'}" role="group" aria-label="${type}">${values.map(value=>`<button type="button" class="mr-mp-choice" data-mp-type="${type}" data-mp-value="${value}" aria-pressed="false" ${type==='brand'&&!value?'data-mr-tr="mpAllBrands"':''}>${value||(type==='brand'?'Wszystkie marki':'')}</button>`).join('')}</div>`;
 const markup=(prefix)=>`<div class="mr-mp-fields"><div class="mr-mp-field"><span class="mr-mp-label" data-mr-tr="mpArea">Typ lokalizacji MP</span><input id="${prefix}-area" type="hidden" value="${DEFAULT.area}">${makeChoices(prefix,'area',AREAS)}</div><div class="mr-mp-field"><span class="mr-mp-label" data-mr-tr="mpBrand">Marka</span><input id="${prefix}-brand" type="hidden" value="${DEFAULT.brand}">${makeChoices(prefix,'brand',BRANDS)}</div><div class="mr-mp-source">Data Source: <b>WMS ECM REPL PODKARPACIE</b></div></div>`;
 function read(root,prefix){return {area:root.querySelector('#'+prefix+'-area')?.value,brand:root.querySelector('#'+prefix+'-brand')?.value};}
 function sync(root,prefix){
   const wrap=root.querySelector('#'+prefix+'-area')?.closest('.mr-mp-fields');
   if(!wrap)return;
   for(const type of ['area','brand']){
     const value=root.querySelector('#'+prefix+'-'+type)?.value;
     wrap.querySelectorAll(`.mr-mp-choice[data-mp-type="${type}"]`).forEach(button=>{
       const selected=button.dataset.mpValue===value;
       button.setAttribute('aria-pressed',String(selected));
     });
   }
 }
 function apply(root,prefix,o){if(!valid(o))return;root.querySelector('#'+prefix+'-area').value=o.area;root.querySelector('#'+prefix+'-brand').value=o.brand;sync(root,prefix);}
 function attach(root,prefix){
   const wrap=root.querySelector('#'+prefix+'-area')?.closest('.mr-mp-fields');
   if(!wrap||wrap.dataset.mpAttached)return;
   wrap.dataset.mpAttached='true';
   wrap.addEventListener('click',event=>{
     const button=event.target.closest('.mr-mp-choice');
     if(!button||!wrap.contains(button))return;
     const type=button.dataset.mpType,value=button.dataset.mpValue;
     if(!(type==='area'?AREAS:BRANDS).includes(value))return;
     const input=root.querySelector('#'+prefix+'-'+type);
     if(!input||input.value===value)return;
     input.value=value;
     sync(root,prefix);
     input.dispatchEvent(new Event('change',{bubbles:true}));
   });
   sync(root,prefix);
 }
 globalThis.MRBridgeMpOptions=Object.freeze({AREAS,BRANDS,DEFAULT,valid,load,save,markup,read,apply,attach});
})();
