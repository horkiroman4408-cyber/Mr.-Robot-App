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
  
  for (let i = hIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.every(c => c === '' || c === null || c === undefined)) continue;
    
    const login = String(r[0] || '').trim();
    if (!login || login.toUpperCase() === 'PDXXXXX') continue;
    
    const firma = String(r[1] || '').trim();
    const grupa = String(r[2] || '').trim();
    const bus   = String(r[3] || '').trim().toUpperCase();
    
    // Pomijaj wiersze bez loginu (nagłówki sekcji)
    if (!/^[A-Z0-9]+$/i.test(login)) continue;
    
    const shift  = BUS_TO_SHIFT[bus] || null;
    const proces = collapseProces(grupa);
    
    out.push({
      login, firma, grupa, bus, shift, proces,
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
    
    self.postMessage({ type: 'done', records: all });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
`;
