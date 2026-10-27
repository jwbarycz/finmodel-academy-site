// Case studies „singleplayer”: pełny arkusz DCF + comps + wrażliwość, zasilony danymi z SEC / Stooq lub wpisany ręcznie.
const Cases = (() => {
  const H = ['B', 'C', 'D', 'E', 'F'], P = ['G', 'H', 'I', 'J', 'K'];
  const r1 = v => v == null ? null : Math.round(v * 10) / 10;

  // fikcyjna spółka do ćwiczeń — dane zmyślone, nie dotyczą żadnej realnej firmy
  const DEMO = {
    name: 'Wiślana Logistyka S.A. (spółka fikcyjna)', ticker: 'WLG', market: 'DEMO', cur: 'PLN',
    years: [2021, 2022, 2023, 2024, 2025],
    hist: { revenue: [812, 905, 978, 1064, 1151], ebit: [71, 84, 88, 101, 112], da: [38, 42, 47, 51, 55], capex: [52, 61, 66, 70, 74] },
    netDebt: 210, shares: 24, price: 31.5, netIncome: 74,
    peers: [['Peer A (fikc.)', 1450, 182, 1180, 98], ['Peer B (fikc.)', 820, 101, 640, 51], ['Peer C (fikc.)', 2300, 265, 1700, 140], ['Peer D (fikc.)', 610, 84, 520, 39]],
    sources: 'Dane fikcyjne do ćwiczeń.',
  };

  function template(d) {
    const cells = {};
    const set = (a, v, o = {}) => { if (v === null || v === undefined) return; cells[a] = { v: String(v), ...o }; };
    const note = (r, text) => set('L' + r, text, { note: true });
    const head = (r, text) => { set('A' + r, text, { h: true, b: true }); for (const c of [...H, ...P, 'L']) set(c + r, '', { h: true }); };
    const pl = d.market === 'GPW';
    const n = d.years?.length || 0, off = 5 - n; // dane historyczne wyrównane do kolumny F
    const hv = (key, i) => (i - off >= 0 && d.hist?.[key]) ? r1(d.hist[key][i - off]) : null;
    const lastYear = n ? +d.years[n - 1] : new Date().getFullYear() - 1;

    set('A1', `${d.name}${d.ticker ? ` (${d.ticker})` : ''}`, { b: true, h: true }); for (const c of [...H, ...P]) set(c + '1', '', { h: true });
    set('L1', 'Źródło / uzasadnienie', { b: true, h: true });
    set('A2', 'Waluta / jednostka'); set('B2', `${d.cur} mln`); note(2, d.sources || 'Uzupełnij źródło danych (raport roczny, strona, data).');
    set('A3', 'Rok', { b: true, h: true });
    H.forEach((c, i) => set(c + '3', i - off >= 0 ? `${d.years[i - off]}A` : `R−${4 - i}`, { b: true, h: true }));
    P.forEach((c, i) => set(c + '3', `${lastYear + i + 1}P`, { b: true, h: true }));
    set('A4', 'Okres dyskontowy (t)'); P.forEach((c, i) => set(c + '4', i + 1, { fmt: 'year' }));

    // stopy wzrostu i marże domyślne z historii
    const rev = H.map((c, i) => hv('revenue', i)), ebit = H.map((c, i) => hv('ebit', i));
    const valid = rev.map((v, i) => [v, i]).filter(([v]) => v > 0);
    let cagr = valid.length >= 2 ? Math.pow(valid.at(-1)[0] / valid[0][0], 1 / (valid.at(-1)[1] - valid[0][1])) - 1 : 0.05;
    cagr = Math.min(Math.max(cagr, 0), 0.15);
    const lastM = rev[4] && ebit[4] != null ? ebit[4] / rev[4] : 0.12;
    const avg = key => { const v = H.map((c, i) => [hv(key, i), rev[i]]).filter(([x, r]) => x != null && r); return v.length ? v.reduce((s, [x, r]) => s + x / r, 0) / v.length : null; };
    const g = 0.025;

    head(6, 'Prognoza FCFF');
    set('A7', 'Przychody', { b: true }); H.forEach((c, i) => set(c + '7', hv('revenue', i) ?? '', { in: true, fmt: 'num' }));
    P.forEach((c, i) => set(c + '7', `=${i ? P[i - 1] : 'F'}7*(1+${c}8)`, { fmt: 'num', b: true }));
    set('A8', 'Dynamika r/r'); H.slice(1).forEach((c, i) => set(c + '8', `=IFERROR(${c}7/${H[i]}7-1,"")`, { fmt: 'pct' }));
    P.forEach((c, i) => set(c + '8', Math.round((cagr + (g + 0.01 - cagr) * i / 4) * 1000) / 1000, { in: true, fmt: 'pct' }));
    note(8, 'Uzasadnij: driver wzrostu (rynek × udział, wolumen × cena), guidance zarządu, konsensus.');
    set('A9', 'EBIT'); H.forEach((c, i) => set(c + '9', hv('ebit', i) ?? '', { in: true, fmt: 'num' }));
    P.forEach(c => set(c + '9', `=${c}7*${c}10`, { fmt: 'num' }));
    set('A10', 'Marża EBIT'); H.forEach(c => set(c + '10', `=IFERROR(${c}9/${c}7,"")`, { fmt: 'pct' }));
    P.forEach(c => set(c + '10', Math.round(lastM * 1000) / 1000, { in: true, fmt: 'pct' }));
    note(10, 'Uzasadnij: historia marż, dźwignia operacyjna, presja kosztowa, peerzy.');
    set('A11', 'Podatek od EBIT'); P.forEach(c => set(c + '11', `=-${c}9*$B$25`, { fmt: 'num' }));
    set('A12', 'NOPAT', { b: true }); P.forEach(c => set(c + '12', `=${c}9+${c}11`, { fmt: 'num', b: true }));
    set('A13', 'Amortyzacja (D&A)'); H.forEach((c, i) => set(c + '13', hv('da', i) ?? '', { in: true, fmt: 'num' }));
    P.forEach(c => set(c + '13', `=${c}7*$B$26`, { fmt: 'num' }));
    set('A14', 'Capex (wartość dodatnia)'); H.forEach((c, i) => set(c + '14', hv('capex', i) ?? '', { in: true, fmt: 'num' }));
    P.forEach(c => set(c + '14', `=${c}7*$B$27`, { fmt: 'num' }));
    set('A15', 'Zmiana NWC (wzrost = +)'); P.forEach((c, i) => set(c + '15', `=(${c}7-${i ? P[i - 1] : 'F'}7)*$B$28`, { fmt: 'num' }));
    set('A16', 'FCFF', { b: true }); P.forEach(c => set(c + '16', `=${c}12+${c}13-${c}14-${c}15`, { fmt: 'num', b: true }));
    set('A17', 'D&A / przychody'); H.forEach(c => set(c + '17', `=IFERROR(${c}13/${c}7,"")`, { fmt: 'pct' }));
    set('A18', 'Capex / przychody'); H.forEach(c => set(c + '18', `=IFERROR(${c}14/${c}7,"")`, { fmt: 'pct' }));

    head(20, 'Dyskontowanie');
    set('A21', 'Czynnik dyskontowy'); P.forEach(c => set(c + '21', `=1/(1+$B$40)^${c}4`, { fmt: 'num2' }));
    set('A22', 'PV FCFF'); P.forEach(c => set(c + '22', `=${c}16*${c}21`, { fmt: 'num' }));

    head(24, 'Założenia globalne');
    const glob = [
      [25, 'Stopa podatkowa', pl ? 0.19 : 0.21, 'pct', pl ? 'CIT 19% — sprawdź efektywną stopę z raportu.' : 'Federalny 21% + stanowe — sprawdź efektywną stopę w 10-K.'],
      [26, 'D&A % przychodów', Math.round((avg('da') ?? 0.04) * 1000) / 1000, 'pct', 'Domyślnie średnia historyczna.'],
      [27, 'Capex % przychodów', Math.round((avg('capex') ?? 0.05) * 1000) / 1000, 'pct', 'Spójność: przy wzroście capex ≥ D&A.'],
      [28, 'NWC % przyrostu przychodów', 0.1, 'pct', 'Oszacuj z bilansu: (należności + zapasy − zobowiązania handlowe) / przychody.'],
      [29, 'Wzrost rezydualny (g)', g, 'pct', 'Nie wyżej niż długoterminowy nominalny wzrost PKB.'],
    ];
    glob.forEach(([r, l, v, fmt, nt]) => { set('A' + r, l); set('B' + r, v, { in: true, fmt }); note(r, nt); });

    head(31, 'WACC');
    const rf = pl ? 0.055 : 0.045;
    const w = [
      [32, 'Stopa wolna od ryzyka (rf)', rf, 'pct', true, `WARTOŚĆ PRZYKŁADOWA — wpisz aktualną rentowność 10Y obligacji ${pl ? 'skarbowych PL' : 'US Treasury'}.`],
      [33, 'Premia za ryzyko rynkowe (ERP)', 0.055, 'pct', true, 'Np. zestawienia Damodarana — podaj datę aktualizacji.'],
      [34, 'Beta lewarowana', 1, 'num2', true, 'Odlewarowana mediana peerów, zrelewarowana (Hamada).'],
      [35, 'Premia za ryzyko kraju (CRP)', pl ? 0.01 : 0, 'pct', true, pl ? 'Dla PL zwykle niewielka — źródło?' : ''],
      [36, 'Koszt kapitału własnego (Ke)', '=B32+B34*B33+B35', 'pct', false, ''],
      [37, 'Koszt długu przed podatkiem', rf + 0.02, 'pct', true, 'Rentowność obligacji spółki / marża kredytu + stopa bazowa.'],
      [38, 'Koszt długu po podatku', '=B37*(1-B25)', 'pct', false, ''],
      [39, 'Udział długu D/(D+E)', 0.2, 'pct', true, 'Wagi rynkowe lub docelowa struktura kapitału.'],
      [40, 'WACC', '=B36*(1-B39)+B38*B39', 'pct', false, ''],
    ];
    w.forEach(([r, l, v, fmt, inp, nt]) => { set('A' + r, l, { b: r === 40 }); set('B' + r, v, { in: inp, fmt, b: r === 40 }); if (nt) note(r, nt); });

    head(42, 'Wycena DCF');
    const val = [
      [43, 'Suma PV FCFF', '=SUM(G22:K22)', 'num'], [44, 'Wartość rezydualna (TV)', '=K16*(1+B29)/(B40-B29)', 'num'],
      [45, 'PV TV', '=B44*K21', 'num'], [46, 'Wartość przedsiębiorstwa (EV)', '=B43+B45', 'num', true],
      [47, 'Udział TV w EV', '=B45/B46', 'pct'], [48, 'Dług netto', d.netDebt ?? '', 'num', false, true],
      [49, 'Wartość kapitału własnego', '=B46-B48', 'num'], [50, 'Liczba akcji (mln)', d.shares ?? '', 'num2', false, true],
      [51, 'Wartość na akcję (DCF)', '=B49/B50', 'num2', true], [52, 'Bieżący kurs', d.price ?? '', 'num2', false, true],
      [53, 'Potencjał wzrostu / spadku', '=B51/B52-1', 'pct', true],
    ];
    val.forEach(([r, l, v, fmt, bold, inp]) => { set('A' + r, l, { b: bold }); set('B' + r, v, { fmt, b: bold, in: inp }); });
    note(48, d.netDebtNote || 'Dług oprocentowany (+ leasing wg MSSF 16) − gotówka, z ostatniego bilansu.');
    note(50, 'Liczba akcji rozwodniona.'); note(52, d.priceNote || 'Kurs z gpw.pl / Stooq / Yahoo — z datą.');

    head(55, 'Analiza porównawcza');
    ['Spółka', 'EV', 'EBITDA', 'Kapitalizacja', 'Zysk netto', 'EV/EBITDA', 'P/E'].forEach((t, i) => set(String.fromCharCode(65 + i) + '56', t, { b: true }));
    for (let r = 57; r <= 61; r++) {
      const p = d.peers?.[r - 57];
      set('A' + r, p ? p[0] : '', { in: true }); ['B', 'C', 'D', 'E'].forEach((c, k) => set(c + r, p ? p[k + 1] : '', { in: true, fmt: 'num' }));
      set('F' + r, `=IFERROR(B${r}/C${r},"")`, { fmt: 'x' }); set('G' + r, `=IFERROR(D${r}/E${r},"")`, { fmt: 'x' });
    }
    note(57, 'Peerzy: ten sam biznes, geografia, skala. Dane LTM lub NTM — spójnie.');
    set('A62', 'Mediana', { b: true }); set('F62', '=IFERROR(MEDIAN(F57:F61),"")', { fmt: 'x', b: true }); set('G62', '=IFERROR(MEDIAN(G57:G61),"")', { fmt: 'x', b: true });
    set('A63', 'EBITDA spółki (ost. rok)'); set('B63', '=F9+F13', { fmt: 'num' });
    set('A64', 'Implikowana EV'); set('B64', '=IFERROR(F62*B63,"")', { fmt: 'num' });
    set('A65', 'Cena z EV/EBITDA', { b: true }); set('B65', '=IFERROR((B64-B48)/B50,"")', { fmt: 'num2', b: true });
    set('A66', 'Zysk netto spółki (ost. rok)'); set('B66', d.netIncome ?? '', { in: true, fmt: 'num' });
    set('A67', 'Cena z P/E', { b: true }); set('B67', '=IFERROR(G62*B66/B50,"")', { fmt: 'num2', b: true });

    head(69, 'Wrażliwość: wartość na akcję (WACC w wierszach × g w kolumnach)');
    set('A70', 'WACC \\ g', { b: true });
    const steps = [-0.01, -0.005, 0, 0.005, 0.01];
    H.forEach((c, i) => set(c + '70', `=$B$29${steps[i] < 0 ? '' : '+'}${steps[i]}`, { fmt: 'pct', b: true }));
    steps.forEach((s, k) => {
      const r = 71 + k;
      set('A' + r, `=$B$40${s < 0 ? '' : '+'}${s}`, { fmt: 'pct', b: true });
      H.forEach(c => set(c + r, `=IFERROR((NPV($A${r},$G$16:$K$16)+$K$16*(1+${c}$70)/($A${r}-${c}$70)/(1+$A${r})^$K$4-$B$48)/$B$50,"")`, { fmt: 'num2' }));
    });

    head(77, 'Notatki i teza inwestycyjna');
    set('A78', 'Wpisz tezę, kluczowe ryzyka i katalizatory w kolumnie L lub tutaj.', { note: true });
    return cells;
  }

  // dane do podsumowania (pasek nad arkuszem + zakresy wyceny)
  function summary(book) {
    const v = a => { const x = book.value(a); return typeof x === 'number' && Number.isFinite(x) ? x : null; };
    const sens = []; for (let r = 71; r <= 75; r++) for (const c of H) { const x = v(c + r); if (x != null) sens.push(x); }
    return {
      dcf: v('B51'), price: v('B52'), upside: v('B53'), wacc: v('B40'), tvShare: v('B47'), ev: v('B46'),
      ranges: [
        { label: 'DCF (wrażliwość WACC × g)', lo: sens.length ? Math.min(...sens) : null, hi: sens.length ? Math.max(...sens) : null, mid: v('B51') },
        { label: 'Comps EV/EBITDA', lo: v('B65'), hi: v('B65'), mid: v('B65') },
        { label: 'Comps P/E', lo: v('B67'), hi: v('B67'), mid: v('B67') },
      ],
    };
  }

  return { template, summary, DEMO };
})();
