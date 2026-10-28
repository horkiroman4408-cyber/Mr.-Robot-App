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

function parsePracownicySheet(rows, sheetName) {
  const out = [];
  // Znajdź wiersz nagłówka (kolumna A === 'PDXXXXX')
  let hIdx = -1;
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const a = String(rows[i][0] || '').trim().toUpperCase();
    if (a === 'PDXXXXX') { hIdx = i; break; }
  }
  if (hIdx === -1) return out;
  
  const headers = rows[hIdx].map(v=>String(v??'').trim().toLocaleLowerCase('pl').replace(/\\s+/g,' '));
  const column=(...names)=>{for(const n of names){const pos=headers.indexOf(n.toLocaleLowerCase('pl'));if(pos>=0)return pos;}return -1;};
  const val=(r,...names)=>{const pos=column(...names);return pos>=0?r[pos]:'';};
  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === '' || c === null || c === undefined)) continue;
    
    const login = String(val(r,'PDXXXXX','PD') || r[0] || '').trim();
    if (!login || login.toUpperCase() === 'PDXXXXX') continue;
    
    const firma = String(val(r,'Firma','Agencja') || r[1] || '').trim();
    const grupa = String(val(r,'Grupa','Funkcja dodatkowa') || r[2] || '').trim();
    const bus   = String(val(r,'Autobus') || r[3] || '').trim().toUpperCase();
    
    // Pomijaj wiersze bez loginu (nagłówki sekcji)
    if (!/^[A-Z0-9]+$/i.test(login)) continue;
    
    const shift  = BUS_TO_SHIFT[bus] || null;
    const proces = collapseProces(grupa);
    
    out.push({
      login, firma, grupa, bus, shift, proces,
      name: val(r,'Nazwisko i Imię','Imię Nazwisko','Nazwisko Imię'),
      sex:val(r,'Płeć'), country:val(r,'K'), start:val(r,'Pierwszy dzień','Pierwszy dzień w pracy'),
      sourceSheet: sheetName
    });
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
    const total = SHEETS_TO_READ.length;
    let processed = 0;
    
    for (const sheetName of SHEETS_TO_READ) {
      if (!wb.SheetNames.includes(sheetName)) {
        processed++;
        self.postMessage({ type: 'progress', stage: 'parse', percent: Math.floor(processed/total*100) });
        continue;
      }
      const sheet = wb.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const parsed = parsePracownicySheet(rows, sheetName);
      all.push(...parsed);
      processed++;
      self.postMessage({ type: 'progress', stage: 'parse', percent: Math.floor(processed/total*100) });
    }
    
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
