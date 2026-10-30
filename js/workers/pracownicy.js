/* Kod Web Workera: Grafik (pracownicy). Uruchamiany przez js/workers/common.js */
const PRACOWNICY_WORKER_CODE = `
const SHEETS_TO_READ = ['BRYGADZISTA', 'DODATKOWE', 'SPM', 'PL', 'UKR procesy'];
const BUS_TO_SHIFT = { 'A':'AB', 'B':'AB', 'C':'CD', 'D':'CD', '1':'AB', '2':'CD' };

// Schemat A: obcinamy tylko ostatni token jeśli to A/B/C/D/1/2
function collapseProces(grupa) {
  if (!grupa) return '';
  const parts = String(grupa).trim().split(/\\s+/);
  if (parts.length < 2) return grupa;
  const last = parts[parts.length - 1].toUpperCase();
  if (last === 'A' || last === 'B' || last === 'C' || last === 'D' ||
      last === '1' || last === '2') {
    return parts.slice(0, -1).join(' ');
  }
  return grupa;
}

function grafikHeader(v) {
  return String(v ?? '').toLocaleLowerCase('pl').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
function findGrafikHeader(rows) {
  for (let i = 0; i < Math.min(35, rows.length); i++) {
    const h = (rows[i] || []).map(grafikHeader);
    const hasPD = h.some(x => ['pdxxxxx','pd','pd xxxxx','numer pd','pd pracownika','login','user login','user id'].includes(x));
    const hasPerson = h.some(x => ['nazwisko i imie','imie nazwisko','nazwisko imie','imie i nazwisko','pracownik','employee name'].includes(x));
    if (hasPD && hasPerson) return i;
  }
  return -1;
}
function parsePracownicySheet(rows, sheetName) {
  const out = [];
  const hIdx = findGrafikHeader(rows);
  if (hIdx < 0) return out;
  const headers = rows[hIdx].map(grafikHeader);
  const column = (...names) => {for(const n of names){const pos=headers.indexOf(grafikHeader(n));if(pos>=0)return pos;}return -1;};
  const val = (r,...names) => {const pos=column(...names);return pos>=0?(r[pos]??''):'';};
  const extra = ['pl','lpp'].includes(grafikHeader(sheetName));
  // Grafik: M=1. dzień, AQ=31. dzień. AR:AY = podsumowanie z Excela.
  const totalNames = (rows[hIdx] || []).slice(43,51).map(v => String(v ?? '').trim());
  for (const r of rows.slice(hIdx + 1)) {
    if (!r || !r.length) continue;
    const login = String(val(r,'PDXXXXX','PD','PD XXXXX','Numer PD','PD pracownika','Login','USER LOGIN','USER ID')).replace(/\\s+/g,'').toUpperCase();
    if (!/^(PD\\d+|\\d+)$/.test(login)) continue;
    const firma = String(val(r,'Firma','Agencja','Agencja pracy') || '').trim();
    const grupa = String(extra ? val(r,'FUNKCJA DODATKOWA','GRUPA','PROCES','DZIAŁ') : val(r,'GRUPA','FUNKCJA DODATKOWA','PROCES','DZIAŁ') || '').trim();
    const bus = String(val(r,'Autobus','Bus') || '').trim().toUpperCase();
    const shift = BUS_TO_SHIFT[bus] || (['AB','A/B'].includes(bus)?'AB':['CD','C/D'].includes(bus)?'CD':null);
    out.push({login, firma, grupa, bus, shift, proces:collapseProces(grupa),
      name:val(r,'Nazwisko i Imię','Imię Nazwisko','Nazwisko Imię','Imię i nazwisko','Pracownik','Employee name'),
      sex:val(r,'Płeć','Plec'),country:val(r,'K','Kraj'),
      start:val(r,'Pierwszy dzień','Pierwszy dzień w pracy','Data rozpoczęcia'), sourceSheet:sheetName,
      calendar:r.slice(12,43).map(v=>String(v??'').trim()),
      calendarTotals:r.slice(43,51).map((v,i)=>({label:totalNames[i]||['I zmiana','II zmiana','W','UW','L4','NN','X','SUMA'][i],value:v??''}))});
  }
  return out;
}

self.onmessage = function(e) {
  try {
    const { buffer } = e.data;
    self.postMessage({ type: 'progress', stage: 'read', percent: 5 });
    
    const data = new Uint8Array(buffer);
    self.postMessage({ type: 'progress', stage: 'excel', percent: 25 });
    
    const wb = XLSX.read(data, {
      type: 'array', dense: true,
      cellStyles: false, cellNF: false, cellHTML: false,
      cellFormula: false, sheetStubs: false
    });
    
    self.postMessage({ type: 'progress', stage: 'excel', percent: 50 });
    
    const all = [];
    const graphSheets = wb.SheetNames.filter(n=>n.trim().toLocaleUpperCase('pl')!=='REZYGNACJE');
    const total = graphSheets.length || 1;
    let processed = 0;
    for (const sheetName of graphSheets) {
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      all.push(...parsePracownicySheet(rows, sheetName));
      processed++;
      self.postMessage({ type: 'progress', stage: 'parse', percent: Math.floor(processed/total*100) });
    }
    // Never overwrite a valid cached Grafik with an unrecognized workbook.
    if (!all.length) throw Error('Nie znaleziono pracowników. Sprawdź kolumny PD oraz Nazwisko i Imię w grafiku.');

    const resignations=[];
    const rsName=wb.SheetNames.find(name=>name.trim().toUpperCase()==='REZYGNACJE');
    if(rsName){
      const rsRows=XLSX.utils.sheet_to_json(wb.Sheets[rsName],{header:1,defval:''});
      const normalize=v=>String(v??'').toLocaleLowerCase('pl').replace(/\\s+/g,'').trim();
      const h=rsRows.findIndex(row=>row.some(c=>['pd','pdxxxxx'].includes(normalize(c)))&&row.some(c=>normalize(c).includes('nazwisko')));
      if(h>=0){
        const headings=rsRows[h].map(normalize);
        const field=(row,...names)=>{for(const n of names){const j=headings.indexOf(normalize(n));if(j>=0)return row[j];}return '';};
        for(const row of rsRows.slice(h+1)){
          const id=String(field(row,'PD','PDXXXXX')||'').replace(/\\s+/g,'').toUpperCase();
          if(!/^(PD\\d+|\\d+)$/.test(id))continue;
          resignations.push({id,name:field(row,'Imię Nazwisko','Nazwisko i Imię','Nazwisko Imię'),sex:field(row,'Płeć'),country:field(row,'K','Kraj'),firma:field(row,'Firma','Agencja'),grupa:field(row,'GRUPA'),start:field(row,'Pierwszy dzień w pracy','Pierwszy dzień'),end:field(row,'Ostatni dzień w pracy','Ostatni dzień'),location:field(row,'Lokalizacja'),reason:field(row,'Przyczyna'),type:field(row,'Powód'),workedDays:field(row,'Przepracowany okres (dni)','Przepracowany okres','Przepracowane dni')});
        }
      }
    }
    self.postMessage({ type: 'done', records: all, resignations });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
`;
