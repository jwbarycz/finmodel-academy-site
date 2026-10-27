// Zadania arkuszowe: każdy szablon losuje liczby i zwraca arkusz z błędem (fix) albo luką do uzupełnienia (build).
const Puzzles = (() => {
  const { addr, numToCol } = Sheet;

  const rngFrom = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hash = s => [...String(s)].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;
  const rnd = (rng, min, max, step = 1) => +(min + Math.floor(rng() * ((max - min) / step + 1)) * step).toFixed(6);
  const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
  const r1 = v => Math.round(v * 10) / 10;

  function builder() {
    const cells = {};
    const set = (a, v, o = {}) => { cells[a] = { v: String(v), ...o }; };
    // wiersz z etykietą w kolumnie A i wartościami od kolumny B; wartość może być funkcją (kolumna, poprzednia kolumna, indeks)
    const row = (r, label, vals, o = {}) => {
      if (label != null) set('A' + r, label, { b: o.bold, h: o.h });
      vals.forEach((v, i) => { if (v == null) return; const c = numToCol(2 + i); set(c + r, typeof v === 'function' ? v(c, numToCol(1 + i), i) : v, o); });
    };
    return { cells, set, row };
  }
  const clone = cells => JSON.parse(JSON.stringify(cells));
  // wprowadza błędy; poprawne formuły trafiają do "fix"
  const withBugs = (cells, bugs) => { const c = clone(cells), fix = {}; for (const [a, v] of Object.entries(bugs)) { fix[a] = c[a].v; c[a].v = v; } return { cells: c, fix }; };
  // usuwa formuły do uzupełnienia; komórki docelowe dostają podświetlenie
  const withGaps = (cells, addrs) => { const c = clone(cells), fix = {}; for (const a of addrs) { fix[a] = c[a].v; c[a] = { ...c[a], v: '', t: true }; } return { cells: c, fix }; };
  const cols5 = ['B', 'C', 'D', 'E', 'F'];
  const each = f => Object.fromEntries(cols5.map((c, i) => [c, f(c, i)]));
  const rowMap = (r, f) => Object.fromEntries(cols5.map((c, i) => [c + r, f(c, cols5[i - 1] || 'A', i)]));

  // ---------- mini-DCF ----------
  function dcfBase(rng) {
    const pl = rng() < 0.5, cur = pl ? 'PLN' : 'USD';
    const rev0 = rnd(rng, 400, 2400, 20), tax = pl ? 0.19 : 0.21;
    const wacc = rnd(rng, 0.08, 0.115, 0.005), g = rnd(rng, 0.015, 0.03, 0.005);
    let rev = rev0; const R = [], EBIT = [], DA = [], CAPEX = [], NWC = [];
    const margin = rnd(rng, 0.1, 0.24, 0.01);
    for (let i = 0; i < 5; i++) {
      const prev = rev; rev = r1(rev * (1 + rnd(rng, 0.03, 0.12, 0.01)));
      R.push(rev); EBIT.push(r1(rev * (margin + rnd(rng, -0.01, 0.01, 0.005))));
      DA.push(r1(rev * rnd(rng, 0.03, 0.06, 0.005))); CAPEX.push(r1(rev * rnd(rng, 0.04, 0.075, 0.005)));
      NWC.push(r1((rev - prev) * rnd(rng, 0.08, 0.2, 0.02)));
    }
    const b = builder();
    b.set('A1', `Mini-DCF (${cur} mln)`, { b: true, h: true });
    b.row(2, 'Rok prognozy (t)', [1, 2, 3, 4, 5], { b: true, h: true, fmt: 'year' });
    b.row(3, 'Przychody', R, { in: true, fmt: 'num' });
    b.row(4, 'EBIT', EBIT, { in: true, fmt: 'num' });
    b.row(5, 'Podatek od EBIT', cols5.map(c => `=-${c}4*$I$2`), { fmt: 'num' });
    b.row(6, 'NOPAT', cols5.map(c => `=${c}4+${c}5`), { fmt: 'num', b: true });
    b.row(7, 'Amortyzacja (D&A)', DA, { in: true, fmt: 'num' });
    b.row(8, 'Capex', CAPEX, { in: true, fmt: 'num' });
    b.row(9, 'Zmiana NWC (wzrost = +)', NWC, { in: true, fmt: 'num' });
    b.row(10, 'FCFF', cols5.map(c => `=${c}6+${c}7-${c}8-${c}9`), { fmt: 'num', b: true });
    b.row(11, 'Czynnik dyskontowy', cols5.map(c => `=1/(1+$I$3)^${c}2`), { fmt: 'num2' });
    b.row(12, 'PV FCFF', cols5.map(c => `=${c}10*${c}11`), { fmt: 'num' });
    const side = [
      ['Stopa podatkowa', tax, 'pct', true], ['WACC', wacc, 'pct', true], ['Wzrost rezydualny (g)', g, 'pct', true],
      ['Dług netto', r1(rev0 * rnd(rng, 0.1, 0.5, 0.05)), 'num', true], ['Liczba akcji (mln)', rnd(rng, 20, 160, 2), 'num', true], null,
      ['Suma PV FCFF', '=SUM(B12:F12)', 'num'], ['Wartość rezydualna (TV)', '=F10*(1+I4)/(I3-I4)', 'num'],
      ['PV TV', '=I9*F11', 'num'], ['Wartość przedsiębiorstwa (EV)', '=I8+I10', 'num', false, true],
      ['Wartość kapitału własnego', '=I11-I5', 'num'], ['Wartość na akcję', '=I12/I6', 'num2', false, true],
    ];
    b.set('H1', 'Założenia i wycena', { b: true, h: true }); b.set('I1', '', { h: true });
    side.forEach((s, i) => { if (!s) return; b.set('H' + (i + 2), s[0], { b: s[4] }); b.set('I' + (i + 2), s[1], { fmt: s[2], in: s[3], b: s[4] }); });
    return { cells: b.cells, cur };
  }
  const dcfView = { widths: { A: 200, H: 210, I: 100 }, checks: ['I11', 'I13'] };

  // ---------- WACC ----------
  function waccBase(rng) {
    const b = builder();
    const E = rnd(rng, 800, 6000, 50), D = r1(E * rnd(rng, 0.15, 0.8, 0.05)), bookE = r1(E * rnd(rng, 0.3, 0.6, 0.05));
    b.set('A1', 'Kalkulacja WACC', { b: true, h: true }); b.set('B1', '', { h: true }); b.set('C1', 'Źródło / komentarz', { h: true, b: true });
    const rows = [
      ['Stopa wolna od ryzyka (rf)', rnd(rng, 0.035, 0.06, 0.0025), 'pct', 'Rentowność 10-letnich obligacji skarbowych'],
      ['Beta lewarowana', rnd(rng, 0.7, 1.5, 0.05), 'num2', 'Regresja / spółki porównywalne'],
      ['Premia za ryzyko rynkowe (ERP)', rnd(rng, 0.045, 0.065, 0.0025), 'pct', 'Premia ponad rf — nie stopa zwrotu z rynku'],
      ['Koszt kapitału własnego (Ke)', '=B2+B3*B4', 'pct', 'CAPM'],
      ['Koszt długu przed podatkiem (Kd)', rnd(rng, 0.05, 0.09, 0.0025), 'pct', 'Rentowność obligacji / marża kredytu'],
      ['Stopa podatkowa', pick(rng, [0.19, 0.21]), 'pct', ''],
      ['Koszt długu po podatku', '=B6*(1-B7)', 'pct', 'Tarcza podatkowa'],
      ['Kapitalizacja rynkowa (E)', E, 'num', 'Kurs × liczba akcji'],
      ['Dług (wartość rynkowa, D)', D, 'num', ''],
      ['Waga kapitału E/(D+E)', '=B9/(B9+B10)', 'pct', ''],
      ['Waga długu D/(D+E)', '=B10/(B9+B10)', 'pct', ''],
      ['WACC', '=B5*B11+B8*B12', 'pct', ''],
      ['Kapitał własny księgowy', bookE, 'num', 'Z bilansu — tylko informacyjnie'],
    ];
    rows.forEach(([l, v, fmt, note], i) => {
      const r = i + 2, isF = String(v).startsWith('=');
      b.set('A' + r, l, { b: r === 13 }); b.set('B' + r, v, { fmt, in: !isF, b: r === 13 }); if (note) b.set('C' + r, note, { note: true });
    });
    return { cells: b.cells };
  }
  const waccView = { widths: { A: 250, B: 100, C: 330 }, checks: ['B13'] };

  // ---------- Comps ----------
  function compsBase(rng, outlier = false) {
    const b = builder();
    const names = ['Alfa', 'Beta', 'Gamma', 'Delta', 'Epsilon'];
    b.row(1, 'Spółka', ['EV', 'EBITDA', 'Kapitalizacja', 'Zysk netto', 'EV/EBITDA', 'P/E'], { b: true, h: true });
    b.set('A1', 'Spółka', { b: true, h: true });
    names.forEach((n, i) => {
      const r = i + 2, ebitda = rnd(rng, 80, 900, 5);
      let mult = rnd(rng, 6, 11, 0.1); if (outlier && i === 4) mult = rnd(rng, 24, 32, 0.5);
      const ev = r1(ebitda * mult), mcap = r1(ev * rnd(rng, 0.6, 0.9, 0.05)), ni = r1(mcap / rnd(rng, 9, 18, 0.5));
      b.row(r, `${n} S.A.`, [ev, ebitda, mcap, ni], { in: true, fmt: 'num' });
      b.set('F' + r, `=B${r}/C${r}`, { fmt: 'x' }); b.set('G' + r, `=D${r}/E${r}`, { fmt: 'x' });
    });
    b.set('A7', 'Mediana', { b: true }); b.set('F7', '=MEDIAN(F2:F6)', { fmt: 'x', b: true }); b.set('G7', '=MEDIAN(G2:G6)', { fmt: 'x', b: true });
    const t = [
      ['Analizowana spółka', '', null], ['EBITDA (LTM)', rnd(rng, 100, 600, 5), 'num'], ['Zysk netto (LTM)', rnd(rng, 40, 300, 5), 'num'],
      ['Dług netto', rnd(rng, 50, 900, 10), 'num'], ['Liczba akcji (mln)', rnd(rng, 10, 90, 1), 'num'],
      ['Implikowana EV', '=F7*B10', 'num'], ['Cena / akcję z EV/EBITDA', '=(B14-B12)/B13', 'num2'], ['Cena / akcję z P/E', '=G7*B11/B13', 'num2'],
    ];
    t.forEach(([l, v, fmt], i) => { const r = i + 9; b.set('A' + r, l, { b: i === 0 || r >= 15, h: i === 0 }); if (v !== '') b.set('B' + r, v, { fmt, in: typeof v === 'number', b: r >= 15 }); });
    return { cells: b.cells };
  }
  const compsView = { widths: { A: 220 }, checks: ['B15', 'B16'] };

  // ---------- dynamika / CAGR / NWC ----------
  function growthBase(rng) {
    const b = builder(), y0 = rnd(rng, 2019, 2021);
    let v = rnd(rng, 300, 2000, 10); const R = [];
    for (let i = 0; i < 5; i++) { R.push(r1(v)); v *= 1 + rnd(rng, -0.04, 0.18, 0.01); }
    b.row(1, 'Rok', [0, 1, 2, 3, 4].map(i => y0 + i), { b: true, h: true, fmt: 'year' });
    b.row(2, 'Przychody', R, { in: true, fmt: 'num' });
    b.row(3, 'Dynamika r/r', [null, ...cols5.slice(1).map((c, i) => `=${c}2/${cols5[i]}2-1`)], { fmt: 'pct' });
    b.set('A5', `CAGR ${y0}–${y0 + 4}`, { b: true }); b.set('B5', '=(F2/B2)^(1/4)-1', { fmt: 'pct', b: true });
    b.set('A6', 'Średnia dynamika r/r', {}); b.set('B6', '=AVERAGE(C3:F3)', { fmt: 'pct' });
    return { cells: b.cells };
  }
  function nwcBase(rng) {
    const b = builder(); let v = rnd(rng, 500, 3000, 50); const R = [];
    for (let i = 0; i < 5; i++) { R.push(r1(v)); v *= 1 + rnd(rng, 0.02, 0.14, 0.01); }
    b.row(1, 'Rok', [1, 2, 3, 4, 5], { b: true, h: true, fmt: 'year' });
    b.row(2, 'Przychody', R, { in: true, fmt: 'num' });
    b.row(3, 'NWC (poziom)', cols5.map(c => `=${c}2*$B$6`), { fmt: 'num' });
    b.row(4, 'Zmiana NWC (inwestycja = +)', [null, ...cols5.slice(1).map((c, i) => `=${c}3-${cols5[i]}3`)], { fmt: 'num', b: true });
    b.set('A6', 'NWC jako % przychodów', {}); b.set('B6', rnd(rng, 0.08, 0.22, 0.01), { in: true, fmt: 'pct' });
    b.set('A8', 'Suma zmian NWC (lata 2–5)', { b: true }); b.set('B8', '=SUM(C4:F4)', { fmt: 'num', b: true });
    return { cells: b.cells };
  }
  function betaBase(rng) {
    const b = builder();
    const rows = [
      ['Beta lewarowana spółki porównywalnej', rnd(rng, 0.8, 1.6, 0.05), 'num2'], ['D/E spółki porównywalnej', rnd(rng, 0.2, 1.2, 0.05), 'num2'],
      ['Stopa podatkowa', pick(rng, [0.19, 0.21]), 'pct'], ['Beta nielewarowana (aktywów)', '=B2/(1+(1-B4)*B3)', 'num2'],
      ['Docelowe D/E analizowanej spółki', rnd(rng, 0.1, 0.9, 0.05), 'num2'], ['Beta relewarowana', '=B5*(1+(1-B4)*B6)', 'num2'],
    ];
    b.set('A1', 'Beta — formuła Hamady', { b: true, h: true }); b.set('B1', '', { h: true });
    rows.forEach(([l, v, fmt], i) => { const isF = String(v).startsWith('='); b.set('A' + (i + 2), l, { b: isF }); b.set('B' + (i + 2), v, { fmt, in: !isF, b: isF }); });
    return { cells: b.cells };
  }

  // ---------- szablony zadań ----------
  const T = [];
  const add = (id, topic, rating, kind, title, make, opt = {}) => T.push({ id, topic, rating, kind, title, make, pool: opt.pool !== false });

  add('dcf-da-sign', 'DCF', 950, 'fix', 'Amortyzacja w FCFF', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withBugs(base.cells, rowMap(10, c => `=${c}6-${c}7-${c}8-${c}9`)),
      brief: 'Analityk twierdzi, że wycena wychodzi „podejrzanie nisko”. Znajdź błąd w wyliczeniu przepływów i popraw formuły.',
      hint: 'Przyjrzyj się wierszowi FCFF (10). Czy amortyzacja to wydatek gotówkowy?',
      expl: 'FCFF = NOPAT + D&A − Capex − ΔNWC. Amortyzacja obniża EBIT, ale nie jest wypływem gotówki, więc dodajemy ją z powrotem.' };
  });
  add('dcf-abs-ref', 'Excel', 1150, 'fix', 'Zgubione $ przy kopiowaniu', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withBugs(base.cells, rowMap(11, (c, p, i) => `=1/(1+${numToCol(9 + i)}3)^${c}2`)),
      brief: 'Ktoś napisał czynnik dyskontowy w B11 i przeciągnął go w prawo. Coś się rozjechało — napraw wiersz 11. Tip: popraw B11, skopiuj (Ctrl/Cmd+C), zaznacz C11:F11 i wklej.',
      hint: 'Kliknij C11 — podświetlone komórki pokazują, do czego odwołuje się formuła.',
      expl: 'Odwołanie do WACC musi być bezwzględne ($I$3). Bez $ kopiowanie przesuwa adres na puste komórki (J3, K3…), więc czynnik dyskontowy wynosi 1.' };
  });
  add('dcf-tv-growth', 'DCF', 1150, 'fix', 'Model Gordona', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withBugs(base.cells, { I9: '=F10/(I3-I4)' }),
      brief: 'Wartość rezydualna liczona jest modelem Gordona na koniec roku 5. Sprawdź formułę TV.',
      hint: 'TV w roku 5 = przepływ z roku 6 / (WACC − g).',
      expl: 'TV₅ = FCFF₅ × (1 + g) / (WACC − g). Bez (1 + g) bierzesz przepływ z roku 5 zamiast 6 i zaniżasz TV.' };
  });
  add('dcf-tv-discount', 'DCF', 1250, 'fix', 'Dyskontowanie TV', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withBugs(base.cells, { I10: '=I9/(1+I3)^6' }),
      brief: 'Wartość rezydualna jest policzona poprawnie na koniec roku 5, ale EV wydaje się za niskie. Znajdź błąd.',
      hint: 'Na koniec którego roku przypada TV z modelu Gordona?',
      expl: 'TV z modelu Gordona to wartość na koniec roku 5, więc dyskontujemy ją o 5 okresów — tym samym czynnikiem co FCFF₅ (F11).' };
  });
  add('dcf-bridge', 'DCF', 850, 'fix', 'Most EV → equity', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withBugs(base.cells, { I12: '=I11+I5' }),
      brief: 'Sprawdź przejście od wartości przedsiębiorstwa do wartości dla akcjonariuszy.',
      hint: 'EV przypada wszystkim dawcom kapitału. Co należy się wierzycielom?',
      expl: 'Equity value = EV − dług netto. Dług netto należy się wierzycielom, więc pomniejsza wartość dla akcjonariuszy.' };
  });
  add('dcf-sum-range', 'Excel', 900, 'fix', 'Ucięty zakres SUM', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withBugs(base.cells, { I8: '=SUM(B12:E12)' }),
      brief: 'Suma zdyskontowanych przepływów nie zgadza się z ręcznym sprawdzeniem. Znajdź przyczynę.',
      hint: 'Ile lat prognozy ma model?',
      expl: 'Zakres SUM musi obejmować wszystkie 5 lat (B12:F12). Ucięte zakresy to jeden z najczęstszych błędów w modelach.' };
  });
  add('dcf-tax-ebitda', 'DCF', 1100, 'fix', 'Podatek od czego?', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withBugs(base.cells, rowMap(5, c => `=-(${c}4+${c}7)*$I$2`)),
      brief: 'NOPAT wygląda na zbyt niski. Popraw wyliczenie podatku.',
      hint: 'NOPAT = EBIT × (1 − t). Od jakiej pozycji liczymy podatek operacyjny?',
      expl: 'Podatek operacyjny liczymy od EBIT, nie od EBITDA — amortyzacja jest kosztem podatkowym (tarcza podatkowa).' };
  });
  add('dcf-nwc-sign', 'DCF', 1100, 'fix', 'Kapitał obrotowy', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withBugs(base.cells, rowMap(10, c => `=${c}6+${c}7-${c}8+${c}9`)),
      brief: 'Firma szybko rośnie, a FCFF rośnie razem z inwestycjami w kapitał obrotowy. Coś tu nie gra.',
      hint: 'Wiersz 9 to wzrost NWC — czy wzrost zapasów i należności daje gotówkę, czy ją pochłania?',
      expl: 'Wzrost NWC wiąże gotówkę, więc odejmujemy go od FCFF. Znak w wierszu 9 jest opisany: wzrost = +.' };
  });
  add('dcf-mid-year', 'DCF', 1350, 'fix', 'Konwencja połowy roku', rng => {
    const base = dcfBase(rng);
    const fixed = clone(base.cells); for (const c of cols5) fixed[c + '11'].v = `=1/(1+$I$3)^(${c}2-0.5)`;
    const r = withBugs(fixed, rowMap(11, c => `=1/(1+$I$3)^${c}2`));
    return { ...dcfView, ...r,
      brief: 'Komitet inwestycyjny wymaga konwencji połowy roku (mid-year) dla przepływów operacyjnych. TV zostaw tak, jak jest (dyskontowane czynnikiem z F11). Dostosuj model.',
      hint: 'Przepływy wpływają średnio w połowie roku — o ile okresów dyskontujesz przepływ z roku t?',
      expl: 'W konwencji mid-year wykładnik to t − 0,5: =1/(1+$I$3)^(B2-0.5). Przepływy wpływają równomiernie w ciągu roku, więc są średnio o pół roku „bliżej”.' };
  });
  add('dcf-double', 'DCF', 1450, 'fix', 'Dwa błędy naraz', rng => {
    const base = dcfBase(rng);
    const pool = [{ I12: '=I11+I5' }, { I8: '=SUM(B12:E12)' }, { I9: '=F10/(I3-I4)' }, rowMap(10, c => `=${c}6-${c}7-${c}8-${c}9`), { I10: '=I9/(1+I3)^6' }];
    const a = Math.floor(rng() * pool.length); let b2 = Math.floor(rng() * (pool.length - 1)); if (b2 >= a) b2++;
    return { ...dcfView, ...withBugs(base.cells, { ...pool[a], ...pool[b2] }),
      brief: 'Ten model ma dwa niezależne błędy. Znajdź i popraw oba.',
      hint: 'Przejdź model od góry: FCFF → dyskontowanie → suma → TV → most do equity. Ctrl/Cmd+` pokazuje wszystkie formuły.',
      expl: 'Przy przeglądzie modelu idź zawsze tym samym szlakiem: przepływy, dyskontowanie, sumy, TV, most do equity, liczba akcji.' };
  });
  add('dcf-build-fcff', 'DCF', 900, 'build', 'Zbuduj wiersz FCFF', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withGaps(base.cells, cols5.map(c => c + '10')),
      brief: 'Uzupełnij wiersz FCFF (B10:F10) na podstawie wierszy powyżej. Wystarczy jedna formuła w B10 skopiowana w prawo.',
      hint: 'FCFF = NOPAT + D&A − Capex − zmiana NWC.',
      expl: 'FCFF = NOPAT + D&A − Capex − ΔNWC. To przepływ dostępny dla wszystkich dawców kapitału, dlatego dyskontujemy go WACC.' };
  });
  add('dcf-build-tv', 'DCF', 1050, 'build', 'Zbuduj TV i EV', rng => {
    const base = dcfBase(rng);
    return { ...dcfView, ...withGaps(base.cells, ['I9', 'I10', 'I11']),
      brief: 'Policz wartość rezydualną (Gordon), jej wartość bieżącą i EV.',
      hint: 'TV = FCFF₅ × (1+g)/(WACC−g); PV TV = TV × czynnik dyskontowy roku 5; EV = suma PV + PV TV.',
      expl: 'Model Gordona zakłada stały wzrost g od roku 6. TV często stanowi 60–80% EV — dlatego założenia g i WACC są kluczowe.' };
  });

  const waccBug = (id, rating, title, bugs, brief, hint, expl) => add(id, 'WACC', rating, 'fix', title, rng => ({ ...waccView, ...withBugs(waccBase(rng).cells, bugs), brief, hint, expl }));
  waccBug('wacc-pretax', 1000, 'Tarcza podatkowa', { B13: '=B5*B11+B6*B12' },
    'WACC wygląda na zawyżony. Znajdź błąd.', 'Który koszt długu powinien wejść do WACC?',
    'Do WACC bierzemy koszt długu po podatku, bo odsetki obniżają podstawę opodatkowania.');
  waccBug('wacc-book', 1200, 'Wagi księgowe', { B11: '=B14/(B14+B10)', B12: '=B10/(B14+B10)' },
    'Struktura kapitału w WACC jest policzona dziwnie. Popraw wagi.', 'Wagi w WACC opierają się na wartościach rynkowych czy księgowych?',
    'Wagi WACC liczymy z wartości rynkowych (kapitalizacja, rynkowa wartość długu) — tak, jak inwestor mógłby dziś odkupić firmę.');
  waccBug('wacc-capm', 1150, 'Premia czy stopa zwrotu?', { B5: '=B2+B3*(B4-B2)' },
    'Koszt kapitału własnego wyszedł nienaturalnie niski. Sprawdź CAPM — zwróć uwagę na opis w kolumnie C.', 'B4 to premia za ryzyko, a nie oczekiwana stopa zwrotu z rynku.',
    'Ke = rf + β × ERP. Odejmowanie rf ma sens tylko wtedy, gdy B4 jest stopą zwrotu z rynku (Rm), a nie premią (Rm − rf).');
  add('wacc-build', 'WACC', 800, 'build', 'Zbuduj CAPM i WACC', rng => ({ ...waccView, ...withGaps(waccBase(rng).cells, ['B5', 'B8', 'B13']),
    brief: 'Uzupełnij koszt kapitału własnego (CAPM), koszt długu po podatku i WACC.',
    hint: 'Ke = rf + β·ERP; Kd po podatku = Kd·(1 − t); WACC = Ke·E/(D+E) + Kd·(1 − t)·D/(D+E).',
    expl: 'WACC to średnia ważona kosztu kapitału własnego i kosztu długu po podatku, z wagami rynkowymi.' }));

  add('comps-pe', 'Wycena porównawcza', 1000, 'fix', 'Zły mianownik P/E', rng => ({ ...compsView,
    ...withBugs(compsBase(rng).cells, Object.fromEntries([2, 3, 4, 5, 6].map(r => ['G' + r, `=D${r}/C${r}`]))),
    brief: 'Mnożnik P/E w tabeli wygląda podejrzanie nisko. Popraw kolumnę G.', hint: 'P/E = kapitalizacja / ?',
    expl: 'P/E = kapitalizacja / zysk netto. Mnożniki equity (P/E) łączymy z miarami dla akcjonariuszy, mnożniki EV (EV/EBITDA) — z miarami dla wszystkich dawców kapitału.' }));
  add('comps-bridge', 'Wycena porównawcza', 1050, 'fix', 'Cena z EV/EBITDA', rng => ({ ...compsView, ...withBugs(compsBase(rng).cells, { B15: '=B14/B13' }),
    brief: 'Cena z EV/EBITDA jest wyraźnie wyższa niż z P/E. Sprawdź, czy wycena jest spójna.', hint: 'Implikowana EV to jeszcze nie wartość dla akcjonariuszy.',
    expl: 'Z mnożnika EV/EBITDA otrzymujesz EV. Aby dojść do ceny akcji, odejmij dług netto i podziel przez liczbę akcji.' }));
  add('comps-range', 'Excel', 900, 'fix', 'Zgubiony peer', rng => ({ ...compsView, ...withBugs(compsBase(rng).cells, { F7: '=MEDIAN(F2:F5)', G7: '=MEDIAN(G2:G5)' }),
    brief: 'Grupa porównawcza ma 5 spółek. Upewnij się, że statystyki biorą pod uwagę wszystkie.', hint: 'Sprawdź zakresy w wierszu 7.',
    expl: 'Zakres musi obejmować całą grupę (F2:F6). Po dodaniu spółki do tabeli zawsze sprawdź, czy formuły zbiorcze ją „widzą”.' }));
  add('comps-mean', 'Wycena porównawcza', 950, 'fix', 'Outlier w grupie', rng => ({ ...compsView, ...withBugs(compsBase(rng, true).cells, { F7: '=AVERAGE(F2:F6)' }),
    brief: 'Epsilon S.A. ma jednorazowo zaniżoną EBITDA, przez co jej EV/EBITDA jest nietypowy. Polityka zespołu: statystyka odporna na outliery. Popraw F7.', hint: 'Która miara tendencji centralnej jest odporna na wartości skrajne?',
    expl: 'Mediana jest odporna na wartości skrajne, średnia nie. W praktyce pokazuje się zwykle medianę oraz kwartyle.' }));
  add('comps-build', 'Wycena porównawcza', 1000, 'build', 'Wycena mnożnikowa', rng => ({ ...compsView, ...withGaps(compsBase(rng).cells, ['B14', 'B15', 'B16']),
    brief: 'Na podstawie median policz implikowaną EV oraz cenę za akcję z EV/EBITDA i z P/E.', hint: 'EV = mediana EV/EBITDA × EBITDA; cena = (EV − dług netto) / akcje; cena z P/E = mediana P/E × zysk netto / akcje.',
    expl: 'Dwa mnożniki dają dwie wyceny. Różnica zwykle wynika ze struktury kapitału i pozycji poniżej EBITDA (amortyzacja, odsetki, podatki).' }));

  add('growth-cagr', 'Excel', 1150, 'fix', 'CAGR — ile okresów?', rng => ({ widths: { A: 200 }, checks: ['B5'], ...withBugs(growthBase(rng).cells, { B5: '=(F2/B2)^(1/5)-1' }),
    brief: 'CAGR przychodów jest policzony błędnie. Popraw formułę w B5.', hint: 'Pięć lat danych to ile okresów wzrostu?',
    expl: 'CAGR = (koniec/początek)^(1/n) − 1, gdzie n to liczba okresów, a nie lat w tabeli. Dla 5 punktów danych n = 4.' }));
  add('growth-yoy', 'Excel', 800, 'fix', 'Dynamika r/r', rng => ({ widths: { A: 200 }, checks: ['C3', 'D3', 'E3', 'F3'],
    ...withBugs(growthBase(rng).cells, Object.fromEntries(['C', 'D', 'E', 'F'].map((c, i) => [c + '3', `=${cols5[i]}2/${c}2-1`]))),
    brief: 'Dynamika r/r ma odwrócone znaki — przychody rosną, a dynamika jest ujemna. Popraw wiersz 3.', hint: 'Dynamika = bieżący / poprzedni − 1.',
    expl: 'Dynamika r/r = Xₜ / Xₜ₋₁ − 1. Odwrócenie licznika i mianownika daje błędny znak i wartość.' }));
  add('nwc-build', 'NOPAT → FCFF', 1250, 'build', 'Zmiana kapitału obrotowego', rng => ({ widths: { A: 240 }, checks: ['B8'], ...withGaps(nwcBase(rng).cells, ['B3', 'C3', 'D3', 'E3', 'F3', 'C4', 'D4', 'E4', 'F4']),
    brief: 'Wersja uproszczona: NWC jako stały % przychodów (B6). Fundusz tego podejścia już nie stosuje i prognozuje dni rotacji, ale ono dobrze pokazuje mechanikę. Policz poziom NWC (wiersz 3) i jego zmianę (wiersz 4).', hint: 'Poziom NWC = przychody × $B$6; zmiana = NWCₜ − NWCₜ₋₁.',
    expl: 'Do FCFF trafia zmiana NWC, nie jego poziom. Szybszy wzrost przychodów oznacza większe zapotrzebowanie na kapitał obrotowy.' }));
  add('beta-hamada', 'WACC', 1450, 'build', 'Odlewarowanie bety', rng => ({ widths: { A: 300, B: 100 }, checks: ['B5', 'B7'], ...withGaps(betaBase(rng).cells, ['B5', 'B7']),
    brief: 'Odlewaruj betę spółki porównywalnej (formuła Hamady), a następnie zrelewaruj ją do docelowej struktury kapitału.', hint: 'βu = βL / (1 + (1 − t)·D/E);  βL = βu · (1 + (1 − t)·D/E).',
    expl: 'Beta spółek porównywalnych zawiera ich ryzyko finansowe. Odlewarowanie usuwa je, a relewarowanie nakłada strukturę kapitału analizowanej spółki.' }));

  // ---------- szablony wg standardów Funduszu (Minipodręcznik, Checklista DCF, uwagi z recenzji) ----------
  const fc = ['C', 'D', 'E', 'F'];
  const label = (b, r, text, o = {}) => b.set('A' + r, text, o);

  add('rev-stores', 'Przychody', 1000, 'build', 'Sklepy × przychód na sklep', rng => {
    const b = builder(), y0 = 2025;
    let stores = rnd(rng, 400, 2500, 10), rps = rnd(rng, 4, 9, 0.1);
    b.row(1, 'Rok', [`${y0}A`, `${y0 + 1}P`, `${y0 + 2}P`, `${y0 + 3}P`, `${y0 + 4}P`], { b: true, h: true });
    label(b, 2, 'Liczba sklepów (koniec roku)'); b.set('B2', stores, { in: true, fmt: 'int' });
    label(b, 3, 'Otwarcia netto'); fc.forEach((c, i) => b.set(c + '3', rnd(rng, 80, 300, 5) - i * 15, { in: true, fmt: 'int' }));
    fc.forEach((c, i) => b.set(c + '2', `=${cols5[i]}2+${c}3`, { fmt: 'int' }));
    label(b, 4, 'LFL (przychód na sklep r/r)'); fc.forEach(c => b.set(c + '4', rnd(rng, 0.01, 0.05, 0.005), { in: true, fmt: 'pct' }));
    label(b, 5, 'Przychód na średni sklep [mln]'); b.set('B5', rps, { in: true, fmt: 'num2' });
    fc.forEach((c, i) => b.set(c + '5', `=${cols5[i]}5*(1+${c}4)`, { fmt: 'num2' }));
    label(b, 6, 'Średnia liczba sklepów w roku'); b.set('B6', stores - rnd(rng, 50, 150, 5), { in: true, fmt: 'num' });
    fc.forEach((c, i) => b.set(c + '6', `=(${cols5[i]}2+${c}2)/2`, { fmt: 'num' }));
    label(b, 7, 'Przychody [mln]', { b: true }); cols5.forEach(c => b.set(c + '7', `=${c}6*${c}5`, { fmt: 'num', b: true }));
    return { widths: { A: 250 }, checks: ['C7', 'F7'], ...withGaps(b.cells, [...fc.map(c => c + '6'), ...fc.map(c => c + '7')]),
      brief: 'Prognozujesz sieć handlową, tak jak w wycenie Dino. Uzupełnij średnią liczbę sklepów (wiersz 6) i przychody (wiersz 7). Sklep otwarty w trakcie roku pracuje średnio pół roku, dlatego przychód liczymy od średniej liczby sklepów.',
      hint: 'Średnia liczba sklepów = (stan na koniec poprzedniego roku + stan na koniec bieżącego) / 2. Przychody = średnia liczba sklepów × przychód na średni sklep.',
      expl: 'Przychód wynika z driverów operacyjnych: liczby sklepów i przychodu na sklep, który rośnie o LFL. W dobrym modelu każdy driver ma osobny wiersz z uzasadnieniem, na przykład tempo otwarć z komunikacji zarządu i LFL z inflacji żywności według raportu NBP.' };
  });

  add('rev-quarterly', 'Przychody', 1150, 'fix', 'Prognoza kwartalna r/r', rng => {
    const b = builder(); const season = [0.85, 0.95, 1.0, 1.25]; const base = rnd(rng, 150, 900, 5);
    b.row(1, 'Kwartał', ['Q1 25', 'Q2 25', 'Q3 25', 'Q4 25', 'Q1 26', 'Q2 26', 'Q3 26P', 'Q4 26P'], { b: true, h: true });
    const ly = season.map(s => r1(base * s * (1 + rnd(rng, -0.03, 0.03, 0.01))));
    label(b, 2, 'Przychody'); ly.forEach((v, i) => b.set(cols5.concat(['G', 'H', 'I'])[i] + '2', v, { in: true, fmt: 'num' }));
    b.set('F2', r1(ly[0] * (1 + rnd(rng, 0.04, 0.12, 0.01))), { in: true, fmt: 'num' }); b.set('G2', r1(ly[1] * (1 + rnd(rng, 0.04, 0.12, 0.01))), { in: true, fmt: 'num' });
    b.set('H2', '=D2*(1+H3)', { fmt: 'num' }); b.set('I2', '=E2*(1+I3)', { fmt: 'num' });
    label(b, 3, 'Dynamika r/r (ten sam kwartał)'); b.set('F3', '=F2/B2-1', { fmt: 'pct' }); b.set('G3', '=G2/C2-1', { fmt: 'pct' });
    b.set('H3', rnd(rng, 0.04, 0.1, 0.005), { in: true, fmt: 'pct' }); b.set('I3', rnd(rng, 0.04, 0.1, 0.005), { in: true, fmt: 'pct' });
    label(b, 5, 'Przychody 2026 (suma kwartałów)', { b: true }); b.set('B5', '=SUM(F2:I2)', { fmt: 'num', b: true });
    return { widths: { A: 240 }, checks: ['H2', 'I2', 'B5'], ...withBugs(b.cells, { H2: '=G2*(1+H3)', I2: '=H2*(1+I3)' }),
      brief: 'Spółka ma silną sezonowość, bo Q4 to sezon świąteczny. Do końca roku obrotowego Fundusz prognozuje kwartalnie, ale coś jest nie tak z Q3 i Q4 2026. Popraw formuły.',
      hint: 'Standard Funduszu: kwartał prognozujemy r/r względem tego samego kwartału poprzedniego roku (Q3 26 od Q3 25), a nie od kwartału poprzedniego.',
      expl: 'Prognoza r/r dla tego samego kwartału automatycznie zachowuje sezonowość. Liczenie od poprzedniego kwartału przenosi słaby lub mocny sezon na kolejne kwartały i zniekształca wynik roczny.' };
  });

  add('tax-cash', 'Koszty i podatek', 1150, 'build', 'Gotówkowa stopa podatkowa', rng => {
    const b = builder();
    b.row(1, 'Rok', ['2023A', '2024A', '2025A', '2026P', '2027P'], { b: true, h: true });
    label(b, 2, 'Zysk przed opodatkowaniem'); const pbt = [0, 1, 2].map(() => rnd(rng, 80, 400, 5));
    pbt.forEach((v, i) => b.set(cols5[i] + '2', v, { in: true, fmt: 'num' }));
    label(b, 3, 'Podatek zapłacony (RPP)'); pbt.forEach((v, i) => b.set(cols5[i] + '3', r1(v * rnd(rng, 0.12, 0.2, 0.01)), { in: true, fmt: 'num' }));
    label(b, 4, 'Gotówkowa stopa opodatkowania'); ['B', 'C', 'D'].forEach(c => b.set(c + '4', `=${c}3/${c}2`, { fmt: 'pct' }));
    label(b, 6, 'Stopa w prognozie (średnia 3 lat)', { b: true }); b.set('B6', '=AVERAGE(B4:D4)', { fmt: 'pct', b: true });
    label(b, 8, 'EBIT'); ['B', 'C', 'D'].forEach((c, i) => b.set(c + '8', r1(pbt[i] * 1.1), { in: true, fmt: 'num' }));
    b.set('E8', rnd(rng, 100, 400, 5), { in: true, fmt: 'num' }); b.set('F8', -rnd(rng, 20, 80, 5), { in: true, fmt: 'num' });
    label(b, 9, 'Podatek od EBIT'); b.set('E9', '=-MAX(E8,0)*$B$6', { fmt: 'num' }); b.set('F9', '=-MAX(F8,0)*$B$6', { fmt: 'num' });
    label(b, 10, 'NOPAT', { b: true }); b.set('E10', '=E8+E9', { fmt: 'num', b: true }); b.set('F10', '=F8+F9', { fmt: 'num', b: true });
    return { widths: { A: 260 }, checks: ['B6', 'E10', 'F10'], ...withGaps(b.cells, ['B4', 'C4', 'D4', 'B6', 'E9', 'F9']),
      brief: 'Policz historyczną gotówkową stopę opodatkowania (wiersz 4) i jej średnią (B6), a potem podatek od EBIT w prognozie. Uwaga: w 2027 spółka ma stratę operacyjną.',
      hint: 'Stopa = podatek zapłacony / zysk przed opodatkowaniem. Ujemnego EBIT nie opodatkowujemy: podatek = −MAX(EBIT; 0) × stopa.',
      expl: 'Gotówkowa stopa podatkowa często różni się od 19% CIT przez ulgi, strukturę grupy i podatek odroczony. Gdy historia jest niestabilna albo spółka ma straty, Fundusz przyjmuje 19% lub średnią branżową. Nie wolno dodawać „ujemnego podatku” od straty operacyjnej.' };
  });

  add('nopat-pbt', 'Koszty i podatek', 900, 'fix', 'EBIT czy zysk przed opodatkowaniem?', rng => {
    const b = builder();
    b.row(1, 'Rok', ['2026P', '2027P', '2028P', '2029P', '2030P'], { b: true, h: true });
    label(b, 2, 'Przychody'); let rev = rnd(rng, 500, 2000, 10); cols5.forEach(c => { b.set(c + '2', r1(rev), { in: true, fmt: 'num' }); rev *= 1.06; });
    label(b, 3, 'Zysk z działalności operacyjnej (EBIT)'); cols5.forEach(c => b.set(c + '3', `=${c}2*${rnd(rng, 0.08, 0.15, 0.01)}`, { fmt: 'num' }));
    label(b, 4, 'Przychody/koszty finansowe netto'); cols5.forEach(c => b.set(c + '4', -rnd(rng, 5, 40, 1), { in: true, fmt: 'num' }));
    label(b, 5, 'Zysk przed opodatkowaniem'); cols5.forEach(c => b.set(c + '5', `=${c}3+${c}4`, { fmt: 'num' }));
    b.set('A7', 'Arkusz NOPAT', { b: true, h: true });
    label(b, 8, 'EBIT do NOPAT'); cols5.forEach(c => b.set(c + '8', `=${c}3`, { fmt: 'num' }));
    label(b, 9, 'Podatek (stopa w I2)'); cols5.forEach(c => b.set(c + '9', `=-${c}8*$I$2`, { fmt: 'num' }));
    label(b, 10, 'NOPAT', { b: true }); cols5.forEach(c => b.set(c + '10', `=${c}8+${c}9`, { fmt: 'num', b: true }));
    b.set('H2', 'Stopa podatkowa'); b.set('I2', 0.19, { in: true, fmt: 'pct' });
    return { widths: { A: 260, H: 140 }, checks: ['B10', 'F10'], ...withBugs(b.cells, rowMap(8, c => `=${c}5`)),
      brief: 'Ten błąd recenzent znalazł w prawdziwej wycenie Funduszu: NOPAT wychodzi zbyt nisko. Popraw wiersz 8.',
      hint: 'NOPAT to wynik operacyjny po podatku. Który wiersz RZiS zawiera już koszty finansowe?',
      expl: 'NOPAT = EBIT × (1 − t). Zysk przed opodatkowaniem zawiera już koszty odsetkowe, a te w DCF ujmuje WACC przez koszt długu. Odejmowanie ich w przepływach liczyłoby finansowanie dwa razy.' };
  });

  add('ebit-hardcoded', 'Excel', 950, 'fix', 'EBIT wpisany ręcznie', rng => {
    const b = builder();
    b.row(1, 'Rok', ['2026P', '2027P', '2028P', '2029P', '2030P'], { b: true, h: true });
    let rev = rnd(rng, 600, 2400, 10);
    label(b, 2, 'Przychody'); cols5.forEach(c => { b.set(c + '2', r1(rev), { in: true, fmt: 'num' }); rev *= 1.05; });
    const sh = [['Koszt własny sprzedaży', 0.6], ['Koszty sprzedaży', 0.15], ['Koszty ogólnego zarządu', 0.08], ['Pozostałe koszty operacyjne netto', 0.01]];
    sh.forEach(([l, p], k) => { label(b, 3 + k, l); cols5.forEach(c => b.set(c + (3 + k), `=${c}2*${(p + rnd(rng, -0.01, 0.01, 0.005)).toFixed(3)}`, { fmt: 'num' })); });
    label(b, 7, 'EBIT', { b: true }); cols5.forEach(c => b.set(c + '7', `=${c}2-${c}3-${c}4-${c}5-${c}6`, { fmt: 'num', b: true }));
    const tmp = new Sheet.Book(clone(b.cells));
    const bugs = Object.fromEntries(cols5.map((c, i) => [c + '7', String(Math.round(tmp.value(c + '7') * (i === 2 ? 1.08 : 1)))]));
    return { widths: { A: 260 }, checks: ['B7', 'D7', 'F7'], ...withBugs(b.cells, bugs),
      brief: 'Recenzja modelu wykazała, że EBIT „nie zgadza się z sumą pozycji”. Sprawdź wiersz 7 (Ctrl/Cmd+` pokaże, gdzie są liczby, a gdzie formuły) i napraw go.',
      hint: 'EBIT = przychody − wszystkie koszty operacyjne. W modelu Funduszu liczby muszą wynikać z obliczeń, a nie być wpisane ręcznie.',
      expl: 'Liczby wpisane ręcznie w miejscu formuł („hardcode”) przestają reagować na zmiany założeń i łatwo w nich o literówkę. Standard Funduszu mówi wprost: „W Excelu nie kopiujemy wartości; musi być widać, że liczby wynikają z Waszych obliczeń”.' };
  });

  add('da-base', 'NOPAT → FCFF', 1250, 'build', 'Podstawa amortyzacji', rng => {
    const b = builder();
    b.row(1, 'Bilans [mln]', ['2024A', '2025A'], { b: true, h: true });
    const rows = [['Rzeczowe aktywa trwałe netto', 800, 3000], ['w tym: grunty', 60, 300], ['w tym: środki trwałe w budowie', 40, 250], ['w tym: zaliczki na środki trwałe', 0, 20], ['WNiP podlegające amortyzacji', 20, 150], ['Aktywa z tytułu prawa do użytkowania', 50, 300]];
    const vB = rows.map(([l, lo, hi], k) => { label(b, 2 + k, l); const v = rnd(rng, lo, hi, 5); b.set('B' + (2 + k), v, { in: true, fmt: 'num' }); b.set('C' + (2 + k), r1(v * rnd(rng, 1.03, 1.15, 0.01)), { in: true, fmt: 'num' }); return v; });
    const baseB = vB[0] - vB[1] - vB[2] - vB[3] + vB[4] + vB[5];
    label(b, 8, 'Podstawa amortyzacji', { b: true }); ['B', 'C'].forEach(c => b.set(c + '8', `=${c}2-${c}3-${c}4-${c}5+${c}6+${c}7`, { fmt: 'num', b: true }));
    label(b, 9, 'Amortyzacja (RZiS 2025)'); b.set('C9', r1(baseB * rnd(rng, 0.06, 0.12, 0.005)), { in: true, fmt: 'num' });
    label(b, 10, 'Stopa amortyzacji (% podstawy na początek roku)', { b: true }); b.set('C10', '=C9/B8', { fmt: 'pct', b: true });
    return { widths: { A: 330 }, checks: ['B8', 'C8', 'C10'], ...withGaps(b.cells, ['B8', 'C8', 'C10']),
      brief: 'Zbuduj podstawę amortyzacji według definicji Funduszu (wiersz 8) i policz historyczną stopę amortyzacji (C10).',
      hint: 'Podstawa = RAT netto − grunty − środki trwałe w budowie − zaliczki + WNiP amortyzowane + aktywa z prawa do użytkowania. Stopa = amortyzacja / podstawa na początek roku (B8).',
      expl: 'Amortyzujemy tylko to, co się zużywa. Grunty, środki trwałe w budowie, zaliczki i WNiP o nieokreślonym okresie użytkowania nie podlegają amortyzacji. Leasing (prawo do użytkowania) już tak. Typowa stopa to 3–30% podstawy rocznie. Fundusz nie ma jeszcze ostatecznego standardu, czy liczyć ją od początku okresu, czy od średniej.' };
  });

  add('capex-identity', 'NOPAT → FCFF', 1100, 'build', 'CAPEX z tożsamości', rng => {
    const b = builder();
    b.row(1, 'Rok', ['2025A', '2026P', '2027P', '2028P', '2029P'], { b: true, h: true });
    let rev = rnd(rng, 800, 3000, 10);
    label(b, 2, 'Przychody'); cols5.forEach(c => { b.set(c + '2', r1(rev), { in: true, fmt: 'num' }); rev *= 1 + rnd(rng, 0.03, 0.09, 0.01); });
    label(b, 3, 'Podstawa amortyzacji / przychody'); fc.forEach(c => b.set(c + '3', rnd(rng, 0.25, 0.4, 0.01), { in: true, fmt: 'pct' }));
    label(b, 4, 'Podstawa amortyzacji'); b.set('B4', r1(b.cells.B2.v * 0.32), { in: true, fmt: 'num' }); fc.forEach(c => b.set(c + '4', `=${c}2*${c}3`, { fmt: 'num' }));
    label(b, 5, 'Amortyzacja'); fc.forEach((c, i) => b.set(c + '5', `=${cols5[i]}4*$I$2`, { fmt: 'num' }));
    label(b, 6, 'CAPEX', { b: true }); fc.forEach((c, i) => b.set(c + '6', `=${c}4-${cols5[i]}4+${c}5`, { fmt: 'num', b: true }));
    label(b, 7, 'CAPEX / amortyzacja'); fc.forEach(c => b.set(c + '7', `=${c}6/${c}5`, { fmt: 'num2' }));
    b.set('H2', 'Stopa amortyzacji'); b.set('I2', rnd(rng, 0.07, 0.12, 0.005), { in: true, fmt: 'pct' });
    return { widths: { A: 260, H: 140 }, checks: ['C6', 'F6'], ...withGaps(b.cells, fc.map(c => c + '6')),
      brief: 'Podstawę amortyzacji prognozujesz jako % przychodów, a amortyzację jako % podstawy z początku roku. Policz CAPEX (wiersz 6) tak, żeby równanie podstawy się zgadzało.',
      hint: 'CAPEX = PA₁ − PA₀ + amortyzacja (podstawa na koniec − podstawa na początek + amortyzacja roku).',
      expl: 'Standard Funduszu: CAPEX = zmiana podstawy amortyzacji + amortyzacja. Nie bierzemy CAPEX z przepływów inwestycyjnych, bo nie zawierają leasingów. Sprawdź też wiersz 7: w ostatnim roku prognozy CAPEX nie może być niższy od amortyzacji.' };
  });

  add('nwc-days', 'NOPAT → FCFF', 1300, 'build', 'Kapitał obrotowy z DIOH, DSO i DPO', rng => {
    const b = builder();
    b.row(1, 'Rok', ['2026P', '2027P', '2028P', '2029P', '2030P'], { b: true, h: true });
    let rev = rnd(rng, 800, 3000, 10); const gm = rnd(rng, 0.25, 0.45, 0.01);
    label(b, 2, 'Przychody'); cols5.forEach(c => { b.set(c + '2', r1(rev), { in: true, fmt: 'num' }); rev *= 1.05; });
    label(b, 3, 'Koszt własny sprzedaży'); cols5.forEach(c => b.set(c + '3', `=${c}2*${(1 - gm).toFixed(2)}`, { fmt: 'num' }));
    const d0 = [rnd(rng, 40, 90), rnd(rng, 20, 60), rnd(rng, 30, 70)];
    [['DIOH (dni zapasów)', 0], ['DSO (dni należności)', 1], ['DPO (dni zobowiązań)', 2]].forEach(([l, k]) => {
      label(b, 4 + k, l); cols5.forEach((c, i) => b.set(c + (4 + k), d0[k] + (i < 3 ? i : 2) * (k === 2 ? 1 : -1), { in: true, fmt: 'int' }));
    });
    label(b, 7, 'Zapasy'); cols5.forEach(c => b.set(c + '7', `=${c}3/365*${c}4`, { fmt: 'num' }));
    label(b, 8, 'Należności handlowe'); cols5.forEach(c => b.set(c + '8', `=${c}2/365*${c}5`, { fmt: 'num' }));
    label(b, 9, 'Zobowiązania nieoprocentowane'); cols5.forEach(c => b.set(c + '9', `=${c}3/365*${c}6`, { fmt: 'num' }));
    label(b, 10, 'Kapitał obrotowy netto', { b: true }); cols5.forEach(c => b.set(c + '10', `=${c}7+${c}8-${c}9`, { fmt: 'num', b: true }));
    label(b, 11, 'Zmiana KO (do FCFF ze znakiem −)'); fc.forEach((c, i) => b.set(c + '11', `=${c}10-${cols5[i]}10`, { fmt: 'num' }));
    return { widths: { A: 280 }, checks: ['B10', 'F10', 'F11'], ...withGaps(b.cells, [7, 8, 9, 10].flatMap(r => cols5.map(c => c + r))),
      brief: 'Fundusz nie prognozuje KO jako % przychodów. Prognozuje dni rotacji i „odwraca” wzór. Uzupełnij zapasy, należności, zobowiązania i KO (wiersze 7–10). Wystarczy jedna kolumna, a resztę skopiujesz.',
      hint: 'Zapasy = COGS/365 × DIOH; należności = przychody/365 × DSO; zobowiązania = COGS/365 × DPO; KO = zapasy + należności − zobowiązania.',
      expl: 'Dni rotacji mają sens biznesowy, na przykład krótszy transport z Azji skraca DIOH, a nowe warunki T+60 u dostawcy wydłużają DPO. Checklista: w dwóch ostatnich latach prognozy wskaźniki się nie zmieniają, a z czasem zbiegają do średnich branżowych.' };
  });

  add('nwc-cit', 'NOPAT → FCFF', 1000, 'fix', 'Podatek w kapitale obrotowym', rng => {
    const b = builder();
    b.row(1, 'Rok', ['2025A', '2026P', '2027P', '2028P', '2029P'], { b: true, h: true });
    const items = [['Zapasy', 100, 500, 1], ['Należności handlowe', 80, 400, 1], ['Należności z tytułu CIT', 2, 30, 0], ['Zobowiązania handlowe', 90, 450, 1], ['Zobowiązania z tytułu CIT', 2, 30, 0]];
    items.forEach(([l, lo, hi, g], k) => { label(b, 2 + k, l); let v = rnd(rng, lo, hi, 1); cols5.forEach(c => { b.set(c + (2 + k), r1(v), { in: true, fmt: 'num' }); v *= g ? 1.06 : 1 + rnd(rng, -0.4, 0.6, 0.1); }); });
    label(b, 7, 'Kapitał obrotowy netto', { b: true }); cols5.forEach(c => b.set(c + '7', `=${c}2+${c}3-${c}5`, { fmt: 'num', b: true }));
    label(b, 8, 'Zmiana KO'); fc.forEach((c, i) => b.set(c + '8', `=${c}7-${cols5[i]}7`, { fmt: 'num' }));
    return { widths: { A: 240 }, checks: ['B7', 'F7', 'F8'], ...withBugs(b.cells, rowMap(7, c => `=${c}2+${c}3+${c}4-${c}5-${c}6`)),
      brief: 'Zmiana KO skacze z roku na rok, choć biznes rośnie równo. Popraw definicję kapitału obrotowego w wierszu 7.',
      hint: 'Z kapitału obrotowego wyłączamy rozrachunki z tytułu podatku dochodowego.',
      expl: 'KO = zapasy + należności − zobowiązania nieoprocentowane (operacyjne), bez CIT. Podatek jest już w NOPAT, więc dodatkowe ujęcie w KO liczy go podwójnie i wprowadza szum. Ten błąd poprawiano w aktualizacji jednej z wycen Funduszu.' };
  });

  add('stub-discount', 'DCF', 1350, 'fix', 'Wycena w trakcie roku', rng => {
    const b = builder();
    b.row(1, 'Rok', ['2026P', '2027P', '2028P', '2029P', '2030P'], { b: true, h: true });
    label(b, 2, 'FCFF (cały rok)'); let f = rnd(rng, 60, 300, 2); cols5.forEach(c => { b.set(c + '2', r1(f), { in: true, fmt: 'num' }); f *= 1 + rnd(rng, 0.03, 0.1, 0.01); });
    label(b, 3, 'Część roku po dacie wyceny'); b.set('B3', '=$I$2', { fmt: 'pct' }); fc.forEach(c => b.set(c + '3', 1, { fmt: 'pct' }));
    label(b, 4, 'Lata od daty wyceny (koniec okresu)'); b.set('B4', '=B3', { fmt: 'num2' }); fc.forEach((c, i) => b.set(c + '4', `=${cols5[i]}4+${c}3`, { fmt: 'num2' }));
    label(b, 5, 'Czynnik dyskontowy'); cols5.forEach(c => b.set(c + '5', `=1/(1+$I$3)^${c}4`, { fmt: 'num2' }));
    label(b, 6, 'PV FCFF'); cols5.forEach(c => b.set(c + '6', `=${c}2*${c}3*${c}5`, { fmt: 'num' }));
    b.set('H2', 'Pozostała część 2026'); b.set('I2', pick(rng, [0.25, 0.5, 0.75]), { in: true, fmt: 'pct' });
    b.set('H3', 'WACC'); b.set('I3', rnd(rng, 0.085, 0.115, 0.005), { in: true, fmt: 'pct' });
    b.set('H5', 'Suma PV FCFF', { b: true }); b.set('I5', '=SUM(B6:F6)', { fmt: 'num', b: true });
    return { widths: { A: 260, H: 170 }, checks: ['I5'], ...withBugs(b.cells, { B4: '=1', B6: '=B2*B5' }),
      brief: 'Wyceniasz spółkę w trakcie 2026 roku, a kwartały przed datą wyceny już się wydarzyły (I2 to pozostała część roku). Model dyskontuje jednak cały 2026 jak pełny rok. Popraw wycenę.',
      hint: 'Checklista: „Jeśli ostatnie dane są na Q2, dyskontujemy tylko Q3–Q4”. Z 2026 bierzesz tylko pozostałą część FCFF, a pierwszy okres dyskontowy trwa tyle, ile zostało do końca roku.',
      expl: 'Nie dyskontujemy przepływów historycznych, czyli już zrealizowanych. Wycena Dino robi to tak: 0,25 × FCFF bieżącego roku, a czynnik dyskontowy liczony jest od dnia wyceny. Każdy kolejny rok jest wtedy dyskontowany o ułamek roku + kolejne pełne lata.' };
  });

  const bridgeBase = rng => {
    const b = builder();
    b.set('A1', 'Most EV → wartość na akcję [mln PLN]', { b: true, h: true }); b.set('B1', '', { h: true });
    const ev = rnd(rng, 800, 4000, 10);
    const rows = [['Wartość przedsiębiorstwa (EV z DCF)', ev], ['Kredyty i pożyczki', r1(ev * rnd(rng, 0.05, 0.2, 0.01))], ['Obligacje', r1(ev * rnd(rng, 0, 0.1, 0.01))],
      ['Zobowiązania z tytułu leasingu', r1(ev * rnd(rng, 0.03, 0.12, 0.01))], ['Zobowiązania handlowe', r1(ev * rnd(rng, 0.08, 0.2, 0.01))],
      ['Gotówka i ekwiwalenty', r1(ev * rnd(rng, 0.03, 0.12, 0.01))], ['Udziały niekontrolujące (NCI)', r1(ev * rnd(rng, 0.02, 0.06, 0.005))], ['Liczba akcji [mln]', rnd(rng, 10, 120, 1)]];
    rows.forEach(([l, v], k) => { label(b, 2 + k, l); b.set('B' + (2 + k), v, { in: true, fmt: 'num' }); });
    label(b, 11, 'Dług netto', { b: true }); b.set('B11', '=B3+B4+B5-B7', { fmt: 'num', b: true });
    label(b, 12, 'Wartość kapitału własnego (akcjonariusze dominujący)'); b.set('B12', '=B2-B11-B8', { fmt: 'num' });
    label(b, 13, 'Wartość na akcję [PLN]', { b: true }); b.set('B13', '=B12/B9', { fmt: 'num2', b: true });
    return b.cells;
  };
  const bridgeView = { widths: { A: 360, B: 110 }, checks: ['B13'] };
  add('bridge-payables', 'DCF', 1000, 'fix', 'Co jest długiem?', rng => ({ ...bridgeView, ...withBugs(bridgeBase(rng), { B11: '=B3+B4+B5+B6-B7' }),
    brief: 'Sprawdź dług netto w moście od EV do wartości na akcję.', hint: 'Od EV odejmujemy tylko zobowiązania finansowe (oprocentowane). Zobowiązania handlowe są już w kapitale obrotowym.',
    expl: 'Checklista Funduszu: od EV odejmujemy wyłącznie kredyty, pożyczki, leasingi i obligacje. Zobowiązania handlowe są pozycją operacyjną, ujętą w zmianie KO, więc odjęcie ich drugi raz zaniża wycenę.' }));
  add('bridge-leases', 'DCF', 1100, 'fix', 'Leasing w długu', rng => ({ ...bridgeView, ...withBugs(bridgeBase(rng), { B11: '=B3+B4-B7' }),
    brief: 'Spółka raportuje według MSSF 16, a aktywa z prawa do użytkowania są w podstawie amortyzacji i CAPEX. Czy dług netto jest spójny z resztą modelu?', hint: 'Jeśli leasing generuje CAPEX i amortyzację w FCFF, jego zobowiązanie musi być w długu.',
    expl: 'Leasing to odpływ gotówki, więc musimy go uwzględnić: albo jako dług (zobowiązania leasingowe w długu netto, RoU w podstawie amortyzacji), albo jako koszt w FCFF. Nigdy jako ani jedno, ani drugie.' }));
  add('bridge-nci', 'DCF', 1150, 'fix', 'Udziały mniejszości', rng => ({ ...bridgeView, ...withBugs(bridgeBase(rng), { B12: '=B2-B11' }),
    brief: 'Spółka nie ma 100% udziałów w części spółek zależnych. Wycena na akcję wydaje się zawyżona. Znajdź przyczynę.', hint: 'Skonsolidowane FCFF zawiera 100% przepływów spółek zależnych. Ile z tego należy do akcjonariuszy spółki dominującej?',
    expl: 'Pominięcie NCI zawyża wycenę przypadającą na akcjonariuszy dominujących. Najprościej odjąć NCI z bilansu. Dokładniej można wycenić spółkę zależną mnożnikiem EV/EBITDA i odjąć część należącą do mniejszości.' }));

  add('comps-harmonic', 'Wycena porównawcza', 1150, 'build', 'Średnia harmoniczna i wagi', rng => {
    const b = builder();
    b.row(1, 'Spółka', ['P/E', 'EV/EBITDA', 'P/S'], { b: true, h: true }); b.set('A1', 'Spółka', { b: true, h: true });
    ['Peer A', 'Peer B', 'Peer C', 'Peer D'].forEach((n, k) => {
      const r = 2 + k; label(b, r, n); b.set('B' + r, rnd(rng, 10, 26, 0.1), { in: true, fmt: 'x' }); b.set('C' + r, rnd(rng, 6, 13, 0.1), { in: true, fmt: 'x' }); b.set('D' + r, rnd(rng, 0.4, 2.5, 0.05), { in: true, fmt: 'x' });
    });
    label(b, 6, 'Mnożnik analizowanej spółki'); b.set('B6', rnd(rng, 10, 22, 0.1), { in: true, fmt: 'x' }); b.set('C6', rnd(rng, 6, 11, 0.1), { in: true, fmt: 'x' }); b.set('D6', rnd(rng, 0.5, 2, 0.05), { in: true, fmt: 'x' });
    label(b, 7, 'Waga mnożnika'); b.set('B7', 0.4, { in: true, fmt: 'pct' }); b.set('C7', 0.4, { in: true, fmt: 'pct' }); b.set('D7', 0.2, { in: true, fmt: 'pct' });
    label(b, 8, 'Implikowany mnożnik (harmoniczna)', { b: true }); ['B', 'C', 'D'].forEach(c => b.set(c + '8', `=HARMEAN(${c}2:${c}5)`, { fmt: 'x', b: true }));
    label(b, 9, 'Implikowana cena'); ['B', 'C', 'D'].forEach(c => b.set(c + '9', `=$B$11*${c}8/${c}6`, { fmt: 'num2' }));
    label(b, 11, 'Bieżący kurs'); b.set('B11', rnd(rng, 20, 200, 0.5), { in: true, fmt: 'num2' });
    label(b, 12, 'Cena z wyceny porównawczej', { b: true }); b.set('B12', '=SUMPRODUCT(B9:D9,B7:D7)', { fmt: 'num2', b: true });
    return { widths: { A: 260 }, checks: ['B8', 'B12'], ...withGaps(b.cells, ['B8', 'C8', 'D8', 'B9', 'C9', 'D9', 'B12']),
      brief: 'Odtwórz wycenę porównawczą tak, jak w wycenie Dino: implikowane mnożniki jako średnia harmoniczna peerów, implikowana cena i średnia ważona.',
      hint: 'HARMEAN(B2:B5). Implikowana cena = kurs × mnożnik implikowany / mnożnik spółki ($B$11*B8/B6). Cena końcowa = SUMPRODUCT(ceny; wagi).',
      expl: 'Średnia arytmetyczna przy wartościach skrajnych zawyża wycenę, więc Fundusz używa mediany albo średniej harmonicznej (która z kolei ma tendencję do zaniżania). Wagi dobierasz do branży, np. P/E 30%, P/S 10%, PEG 10%, EV/FCF 20%, EV/EBITDA 30%. Skrót „kurs × mnożnik peerów / mnożnik spółki” jest dokładny dla mnożników kapitałowych (P/E, P/S). Dla mnożników EV dokładniej jest policzyć implikowane EV − dług netto.' };
  });

  add('target-weights', 'Wycena porównawcza', 850, 'build', 'Cena docelowa', rng => {
    const b = builder();
    const rows = [['Wartość na akcję z DCF', rnd(rng, 30, 150, 0.5), 'num2', true], ['Wartość na akcję z wyceny porównawczej', rnd(rng, 30, 150, 0.5), 'num2', true],
      ['Waga DCF', pick(rng, [0.7, 0.8, 0.9]), 'pct', true], ['Waga wyceny porównawczej', '=1-B4', 'pct'], ['Cena docelowa', '=B2*B4+B3*B5', 'num2'],
      ['Bieżący kurs', rnd(rng, 30, 150, 0.5), 'num2', true], ['Potencjał (upside/downside)', '=B6/B7-1', 'pct']];
    b.set('A1', 'Cena docelowa', { b: true, h: true }); b.set('B1', '', { h: true });
    rows.forEach(([l, v, fmt, inp], k) => { label(b, 2 + k, l, { b: k === 4 || k === 6 }); b.set('B' + (2 + k), v, { fmt, in: !!inp, b: k === 4 || k === 6 }); });
    return { widths: { A: 300, B: 110 }, checks: ['B6', 'B8'], ...withGaps(b.cells, ['B6', 'B8']),
      brief: 'Połącz DCF i wycenę porównawczą w cenę docelową według wag (B4, B5) i policz potencjał względem bieżącego kursu.',
      hint: 'Cena docelowa = DCF × waga DCF + porównawcza × waga porównawczej. Potencjał = cena docelowa / kurs − 1.',
      expl: 'W wycenach Funduszu DCF zwykle dominuje, np. 90/10 albo 80/20, a waga porównawczej zależy od jakości grupy peerów. Przy słabej grupie można też zastosować dyskonto do wyceny porównawczej. Ujemny potencjał to nie porażka: rekomendacje „trzymaj” i „sprzedaj” są w Funduszu równie pożądane.' };
  });

  add('wacc-kd', 'WACC', 1000, 'build', 'Koszt długu', rng => {
    const b = builder();
    b.set('A1', 'Koszt długu', { b: true, h: true }); b.set('B1', '', { h: true }); b.set('C1', 'Źródło', { b: true, h: true });
    const rows = [['Stopa wolna od ryzyka (PL 10Y)', rnd(rng, 0.045, 0.06, 0.0025), 'pct', 'Rentowność obligacji skarbowych, z datą'], ['Marża kredytowa spółki', rnd(rng, 0.01, 0.04, 0.0025), 'pct', 'Zwykle 1–4% (obligacje porównywalnych spółek)'],
      ['Koszt długu przed podatkiem', '=B2+B3', 'pct', 'Metoda 1: rf + marża'], ['Stopa podatkowa', 0.19, 'pct', ''], ['Koszt długu po podatku', '=B4*(1-B5)', 'pct', 'Tarcza podatkowa'], null,
      ['Koszty odsetkowe (noty, ostatnie 12 mies.)', rnd(rng, 10, 80, 1), 'num', 'Kredyty + obligacje + leasing'], ['Średni dług oprocentowany', rnd(rng, 150, 900, 5), 'num', 'Średnia z początku i końca okresu'],
      ['Koszt długu z not (metoda 2)', '=B8/B9', 'pct', 'Kontrola: czy metoda 1 jest realistyczna?']];
    rows.forEach((x, k) => { if (!x) return; const [l, v, fmt, nt] = x, r = 2 + k, isF = String(v).startsWith('='); label(b, r, l); b.set('B' + r, v, { fmt, in: !isF }); if (nt) b.set('C' + r, nt, { note: true }); });
    return { widths: { A: 300, B: 100, C: 330 }, checks: ['B4', 'B6', 'B10'], ...withGaps(b.cells, ['B4', 'B6', 'B10']),
      brief: 'Oszacuj koszt długu dwiema metodami ze standardu Funduszu i policz koszt po podatku.',
      hint: 'Kd = rf + marża; Kd po podatku = Kd × (1 − t); kontrolnie: koszty odsetkowe / średni dług.',
      expl: 'Najdokładniej jest wziąć rentowność obligacji spółki (np. WIBOR + marża z Catalyst) albo dodać marżę do stopy wolnej od ryzyka. Bez obligacji marżę szacujesz z porównywalnych emitentów, zwykle w przedziale 1–4%. Checklista pyta: „Czy koszt długu jest zgodny z oprocentowaniem kredytów i leasingów w spółce?”. Stąd kontrola z not.' };
  });

  // pełny mini-DCF do gry z botem: wszystkie formuły do zbudowania od zera
  add('dcf-full', 'DCF', 1300, 'build', 'Pełny mini-DCF', rng => {
    const base = dcfBase(rng);
    const gaps = [5, 6, 10, 11, 12].flatMap(r => cols5.map(c => c + r)).concat(['I8', 'I9', 'I10', 'I11', 'I12', 'I13']);
    return { ...dcfView, checks: ['I11', 'I13'], ...withGaps(base.cells, gaps),
      brief: 'Zbuduj cały model: podatek od EBIT, NOPAT, FCFF, czynniki dyskontowe, PV, sumę PV, TV (Gordon), PV TV, EV, equity i wartość na akcję. Dane wejściowe są niebieskie.',
      hint: 'Kolejność: podatek = −EBIT × $I$2 → NOPAT → FCFF = NOPAT + D&A − CAPEX − ΔNWC → DF = 1/(1+$I$3)^t → PV → SUM → TV = F10×(1+g)/(WACC−g) → PV TV → EV → − dług netto → / akcje.',
      expl: 'To pełny szkielet DCF. W prawdziwym modelu każdy z tych wierszy jest zasilany z osobnych arkuszy prognoz.' };
  }, { pool: false });

  const byId = Object.fromEntries(T.map(t => [t.id, t]));
  function instantiate(id, seed) {
    const t = byId[id]; const p = t.make(rngFrom(seed));
    return { ...p, id, seed, topic: t.topic, rating: t.rating, kind: t.kind, title: t.title };
  }

  // sprawdzenie: wartości komórek kontrolnych == wartości w poprawnym arkuszu, bez wpisywania liczb „na sztywno”
  function check(puzzle, book) {
    const solved = new Sheet.Book({ ...clone(puzzle.cells), ...Object.fromEntries(Object.entries(puzzle.fix).map(([a, v]) => [a, { ...puzzle.cells[a], v }])) });
    const problems = [];
    for (const a of puzzle.checks) {
      const want = solved.value(a), got = book.value(a);
      if (typeof got !== 'number' || Math.abs(got - want) > Math.max(1e-6, Math.abs(want) * 1e-4)) problems.push(a);
    }
    const hard = Object.keys(puzzle.fix).filter(a => !/^=.*[A-Z]+\d/.test(book.raw(a)));
    return { ok: !problems.length && !hard.length, problems, hard, expected: Object.fromEntries(puzzle.checks.map(a => [a, solved.value(a)])) };
  }

  // dobór zadania do ratingu (jak taktyki na chess.com): podobny poziom, unikamy powtórek
  function next(rating, recent = [], topic = null) {
    const inTopic = T.filter(t => t.pool && (!topic || t.topic === topic));
    const fresh = inTopic.filter(t => !recent.slice(-4).includes(t.id));
    const pool = fresh.length ? fresh : inTopic;
    const scored = pool.map(t => ({ t, d: Math.abs(t.rating - rating) + Math.random() * 250 })).sort((a, b) => a.d - b.d);
    return instantiate(scored[0].t.id, Math.floor(Math.random() * 1e9));
  }
  const daily = day => { const h = hash('daily' + day); return instantiate(T[h % T.length].id, h); };

  return { list: T, byId, instantiate, check, next, daily, topics: [...new Set(T.map(t => t.topic))], hash, rngFrom };
})();
