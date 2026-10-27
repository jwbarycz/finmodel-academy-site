// Szybkie zadania (Model Rush, pojedynki): obliczenia na wariantach odpowiedzi z typowymi błędami jako dystraktorami.
const Quick = (() => {
  const { rngFrom } = Puzzles;
  const rnd = (rng, a, b, s = 1) => +(a + Math.floor(rng() * ((b - a) / s + 1)) * s).toFixed(6);
  const n1 = v => v.toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = v => v.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const p1 = v => (v * 100).toLocaleString('pl-PL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';

  // poprawna odpowiedź + dystraktory (różne od poprawnej po sformatowaniu), przetasowane
  function mc(rng, q, right, wrongs, fmt, expl, topic, lvl) {
    const seen = new Set([fmt(right)]), opts = [fmt(right)];
    for (const w of wrongs) { const f = fmt(w); if (!seen.has(f) && Number.isFinite(w)) { seen.add(f); opts.push(f); } if (opts.length === 4) break; }
    let k = 1; while (opts.length < 4) { const f = fmt(right * (1 + 0.13 * k++)); if (!seen.has(f)) { seen.add(f); opts.push(f); } }
    const order = opts.map((o, i) => [o, rng()]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
    return { q, options: order, answer: order.indexOf(fmt(right)), expl, topic, lvl };
  }

  const G = [
    rng => { const ebit = rnd(rng, 80, 400, 5), t = 0.19, da = rnd(rng, 10, 60), cap = rnd(rng, 15, 90), nwc = rnd(rng, 2, 25); const r = ebit * (1 - t) + da - cap - nwc;
      return mc(rng, `EBIT = ${ebit}, t = 19%, D&A = ${da}, CAPEX = ${cap}, ΔKO = +${nwc}. Ile wynosi FCFF?`, r, [ebit * (1 - t) - da - cap - nwc, ebit * (1 - t) + da - cap + nwc, (ebit + da) * (1 - t) - cap - nwc], n1, 'FCFF = EBIT × (1 − t) + D&A − CAPEX − ΔKO.', 'FCFF', 1); },
    rng => { const rf = rnd(rng, 0.04, 0.06, 0.0025), b = rnd(rng, 0.7, 1.5, 0.05), erp = rnd(rng, 0.045, 0.065, 0.0025); const r = rf + b * erp;
      return mc(rng, `rf = ${p1(rf)}, β = ${n2(b)}, ERP = ${p1(erp)}. Koszt kapitału własnego (CAPM)?`, r, [rf + b * (erp - rf), b * erp, rf * b + erp], p1, 'Ke = rf + β × ERP.', 'WACC', 1); },
    rng => { const ke = rnd(rng, 0.09, 0.14, 0.0025), kd = rnd(rng, 0.05, 0.09, 0.0025), w = rnd(rng, 0.1, 0.5, 0.05); const r = ke * (1 - w) + kd * 0.81 * w;
      return mc(rng, `Ke = ${p1(ke)}, Kd = ${p1(kd)} (przed podatkiem), t = 19%, D/(D+E) = ${p1(w)}. WACC?`, r, [ke * (1 - w) + kd * w, ke * w + kd * 0.81 * (1 - w), (ke + kd) / 2], p1, 'WACC = Ke × E/(D+E) + Kd × (1 − t) × D/(D+E).', 'WACC', 2); },
    rng => { const f = rnd(rng, 50, 300, 5), g = rnd(rng, 0.015, 0.03, 0.005), w = rnd(rng, 0.08, 0.11, 0.005); const r = f * (1 + g) / (w - g);
      return mc(rng, `FCFF ostatniego roku = ${f}, g = ${p1(g)}, WACC = ${p1(w)}. TV (Gordon) na koniec okresu?`, r, [f / (w - g), f * (1 + g) / w, f / w], n1, 'TV = FCFFₙ × (1 + g) / (WACC − g).', 'DCF', 2); },
    rng => { const cf = rnd(rng, 100, 500, 10), w = rnd(rng, 0.08, 0.12, 0.01), t = rnd(rng, 2, 5); const r = cf / Math.pow(1 + w, t);
      return mc(rng, `Przepływ ${cf} za ${t} lata, stopa ${p1(w)}. Wartość bieżąca?`, r, [cf / Math.pow(1 + w, t + 1), cf * Math.pow(1 + w, t), cf / (1 + w * t)], n1, 'PV = CF / (1 + r)^t.', 'DCF', 1); },
    rng => { const ev = rnd(rng, 800, 3000, 20), d = rnd(rng, 100, 600, 10), c = rnd(rng, 20, 200, 10), nci = rnd(rng, 0, 80, 10), sh = rnd(rng, 10, 60); const r = (ev - d + c - nci) / sh;
      return mc(rng, `EV = ${ev}, dług = ${d}, gotówka = ${c}, NCI = ${nci}, akcji = ${sh} mln. Wartość na akcję?`, r, [(ev + d - c - nci) / sh, (ev - d + c) / sh, (ev - d - c - nci) / sh], n2, 'Equity = EV − (dług − gotówka) − NCI; potem / liczba akcji.', 'Most do equity', 2); },
    rng => { const a = rnd(rng, 100, 500, 10), g = rnd(rng, 0.04, 0.15, 0.01), n = rnd(rng, 3, 5); const b = a * Math.pow(1 + g, n);
      return mc(rng, `Przychody wzrosły z ${a} do ${n1(b)} w ${n + 1} kolejnych latach (${n + 1} punktów danych). CAGR?`, g, [Math.pow(b / a, 1 / (n + 1)) - 1, (b / a - 1) / n, b / a - 1], p1, 'CAGR = (koniec/początek)^(1/n) − 1, n = liczba okresów (punkty − 1).', 'Przychody', 2); },
    rng => { const m = rnd(rng, 5, 12, 0.5), e = rnd(rng, 40, 200, 5), nd = rnd(rng, 30, 300, 10), sh = rnd(rng, 10, 50); const r = (m * e - nd) / sh;
      return mc(rng, `Mediana EV/EBITDA peerów = ${n1(m)}x, EBITDA = ${e}, dług netto = ${nd}, akcji = ${sh} mln. Cena za akcję?`, r, [m * e / sh, (m * e + nd) / sh, m * (e - nd) / sh], n2, 'EV = mnożnik × EBITDA; equity = EV − dług netto; / akcje.', 'Wycena porównawcza', 2); },
    rng => { const pe = rnd(rng, 8, 22, 0.5), ni = rnd(rng, 20, 150, 5), sh = rnd(rng, 10, 50); const r = pe * ni / sh;
      return mc(rng, `P/E peerów = ${n1(pe)}x, zysk netto spółki = ${ni} mln, akcji = ${sh} mln. Cena z P/E?`, r, [pe * ni, pe / ni * sh, ni / sh / pe], n2, 'Cena = P/E × EPS = P/E × zysk / liczba akcji.', 'Wycena porównawcza', 1); },
    rng => { const bu = rnd(rng, 0.6, 1.2, 0.05), de = rnd(rng, 0.2, 1, 0.05); const r = bu * (1 + 0.81 * de);
      return mc(rng, `βU = ${n2(bu)}, D/E = ${n2(de)}, t = 19%. Beta lewarowana?`, r, [bu * (1 + de), bu / (1 + 0.81 * de), bu], n2, 'βL = βU × (1 + (1 − t) × D/E).', 'WACC', 2); },
    rng => { const p0 = rnd(rng, 300, 900, 10), p1v = p0 + rnd(rng, 20, 120, 5), da = rnd(rng, 20, 90, 5); const r = p1v - p0 + da;
      return mc(rng, `Podstawa amortyzacji: początek ${p0}, koniec ${p1v}; amortyzacja ${da}. CAPEX?`, r, [p1v - p0, p1v - p0 - da, p1v + da], n1, 'CAPEX = PA₁ − PA₀ + amortyzacja.', 'NOPAT → FCFF', 1); },
    rng => { const cogs = rnd(rng, 400, 2000, 20), d = rnd(rng, 30, 90, 5); const r = cogs / 365 * d;
      return mc(rng, `Koszt własny sprzedaży = ${cogs}, DIOH = ${d} dni. Ile wynoszą zapasy?`, r, [cogs * d / 100, cogs / d, cogs / 365 / d * 1000], n1, 'Zapasy = COGS / 365 × DIOH.', 'NOPAT → FCFF', 1); },
    rng => { const pbt = rnd(rng, 100, 400, 10), tax = Math.round(pbt * rnd(rng, 0.12, 0.22, 0.01)); const r = tax / pbt;
      return mc(rng, `Zysk przed opodatkowaniem = ${pbt}, podatek zapłacony (RPP) = ${tax}. Gotówkowa stopa podatkowa?`, r, [0.19, tax / (pbt + tax), (pbt - tax) / pbt], p1, 'Stopa = podatek zapłacony / zysk przed opodatkowaniem.', 'Koszty i podatek', 1); },
    rng => { const dcf = rnd(rng, 30, 120, 0.5), cmp = rnd(rng, 30, 120, 0.5), w = 0.9, px = rnd(rng, 30, 120, 0.5); const r = (dcf * w + cmp * (1 - w)) / px - 1;
      return mc(rng, `DCF = ${n2(dcf)} zł, porównawcza = ${n2(cmp)} zł, wagi 90/10, kurs = ${n2(px)} zł. Potencjał?`, r, [dcf / px - 1, ((dcf + cmp) / 2) / px - 1, px / (dcf * w + cmp * (1 - w)) - 1], p1, 'Cena docelowa = 0,9 × DCF + 0,1 × porównawcza; potencjał = cena docelowa / kurs − 1.', 'Wycena porównawcza', 1); },
    rng => { const xs = [rnd(rng, 8, 14, 0.5), rnd(rng, 8, 14, 0.5), rnd(rng, 8, 14, 0.5), rnd(rng, 30, 60, 1)]; const s = [...xs].sort((a, b) => a - b), med = (s[1] + s[2]) / 2;
      return mc(rng, `EV/EBITDA peerów: ${xs.map(n1).join('; ')}. Którą wartość przyjmiesz jako implikowany mnożnik (standard Funduszu)?`, med, [xs.reduce((a, b) => a + b, 0) / 4, Math.max(...xs), Math.min(...xs)], v => n2(v) + 'x', 'Outlier zawyża średnią arytmetyczną; Fundusz używa mediany lub średniej harmonicznej.', 'Wycena porównawcza', 2); },
    rng => { const f = rnd(rng, 100, 400, 10), part = [0.25, 0.5, 0.75][Math.floor(rng() * 3)], w = rnd(rng, 0.08, 0.11, 0.01); const r = f * part / Math.pow(1 + w, part);
      return mc(rng, `Do końca roku zostało ${p1(part)} roku, a roczny FCFF wynosi ${f}. WACC = ${p1(w)}. PV przepływu za resztę roku?`, r, [f / (1 + w), f * part / (1 + w), f / Math.pow(1 + w, part)], n1, 'Bierzemy tylko pozostałą część FCFF i dyskontujemy o tyle, ile zostało do końca roku.', 'DCF', 3); },
  ];

  // pytania pojęciowe z lekcji manuala (krótkie wersje)
  const concepts = () => Course.flatMap(m => m.lessons.flatMap(l => l.quiz.map(q => ({ ...q, topic: m.title, lvl: 2 }))));

  // strumień zadań: najpierw łatwe obliczenia, potem trudniejsze i pytania z manuala
  function stream(seed) {
    const rng = rngFrom(seed), pool = concepts();
    let i = 0;
    return () => {
      i++;
      const lvl = i < 6 ? 1 : i < 14 ? 2 : 3;
      if (lvl >= 2 && rng() < 0.3) { const q = pool[Math.floor(rng() * pool.length)]; return { ...q }; }
      const cands = G.map(g => g(rng)).filter(q => q.lvl <= lvl);
      return cands[Math.floor(rng() * cands.length)];
    };
  }
  return { stream };
})();
