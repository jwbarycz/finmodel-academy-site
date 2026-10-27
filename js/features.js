// Sekcje platformy wzorowane na chess.com, przeniesione na wycenę i modelowanie w Excelu.
// Każdy widok dostaje kontener #app i argumenty z adresu (#/sekcja/arg1/arg2).
const Views = (() => {
  const F = () => window.FMA;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rand = () => Math.floor(Math.random() * 1e9);
  const head = (eyebrow, title, lead = '', side = '') => `<div class="page-head row-between"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1 class="page-header">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div>${side}</div>`;
  const top = (...parts) => F().setTop(parts.map((p, i) => (i ? '<span class="sep">/</span>' : '') + (Array.isArray(p) ? `<a href="${p[1]}">${esc(p[0])}</a>` : `<span>${esc(p)}</span>`)).join(''));
  const fmt = (v, d = 1) => Number.isFinite(v) ? v.toLocaleString('pl-PL', { minimumFractionDigits: d, maximumFractionDigits: d }) : '—';
  const pctf = (v, d = 1) => Number.isFinite(v) ? fmt(v * 100, d) + '%' : '—';
  const timeAgo = t => new Date(t).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const card = (href, ic, t, d, extra = '') => `<a class="card quick-card" href="${href}"><span class="ic-lg">${ic}</span><span><b>${esc(t)}</b><span class="muted small">${esc(d)}</span>${extra}</span></a>`;

  // wspólny ekran ćwiczenia bez wpływu na rating
  function practice(app, p, { mode, eyebrow, opts = {}, onNext, back }) {
    app.innerHTML = head(eyebrow || mode, esc(p.title), '', back ? `<a class="btn" href="${back}">← Wróć</a>` : '') +
      `<div class="chips" style="margin:-10px 0 16px"><span class="chip">${esc(p.topic)}</span><span class="chip">${p.kind === 'fix' ? 'znajdź błąd' : 'zbuduj'}</span><span class="chip">♟ ${p.rating}</span><span class="chip">bez wpływu na rating</span></div>
      <section class="card work-card" id="pz"></section>`;
    let done = false;
    F().mountPuzzle(app.querySelector('#pz'), p, {
      ...opts, nextLabel: onNext ? 'Następne →' : '',
      onResult: (ok, info) => {
        if (!done) { done = true; F().record({ mode, id: p.id, seed: p.seed, title: p.title, topic: p.topic, ok: ok && !info.revealed }); }
        if (ok && !info.revealed) F().bumpStreak();
        opts.onResult?.(ok, info);
      },
      onNext,
    });
  }

  // ================= GRAJ =================
  // Graj z botem: pełny mini-DCF na czas; wygrywa dokładniejszy model
  function graj(app, botId) {
    const S = F().S, bot = Data.bots.find(b => b.id === botId);
    if (!bot) {
      top('Graj', 'Graj z botem');
      const rec = id => { const g = S.games.filter(x => x.bot === id); return `${g.filter(x => x.res === 'w').length}W ${g.filter(x => x.res === 'd').length}R ${g.filter(x => x.res === 'l').length}P`; };
      app.innerHTML = head('Graj', 'Graj z botem', 'Partia to pełny mini-DCF zbudowany od zera na czas. Bot też liczy swoją wycenę. Wygrywa ten, kto odda dokładniejszą wartość na akcję przed końcem zegara.',
        `<div class="card mini-progress"><div class="k">Twój rating gry</div><div class="v">🤖 ${S.gameRating}</div></div>`) +
        `<div class="bot-grid">${Data.bots.map(b => `<a class="card bot-card" href="#/graj/${b.id}"><span class="bot-ic">${b.ic}</span><b>${esc(b.name)}</b><span class="chip">♟ ${b.rating}</span><span class="muted small">${esc(b.d)}</span><span class="muted small">⏱ ${b.mins} min · bilans: ${rec(b.id)}</span></a>`).join('')}</div>
        <section class="card"><div class="eyebrow">Ostatnie partie</div>${S.games.length ? `<table class="rank"><tbody>${S.games.slice(0, 8).map(g => `<tr><td>${timeAgo(g.t)}</td><td>${esc(Data.bots.find(b => b.id === g.bot)?.name || g.bot)}</td><td>${{ w: '✅ wygrana', d: '🤝 remis', l: '❌ przegrana' }[g.res]}</td><td>Twój błąd ${pctf(g.ue, 2)} · bot ${pctf(g.be, 2)}</td><td>${g.delta >= 0 ? '+' : ''}${g.delta}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">Nie masz jeszcze partii. Zacznij od Stażysty Stasia.</p>'}</section>`;
      return;
    }
    top(['Graj z botem', '#/graj'], bot.name);
    const p = Puzzles.instantiate('dcf-full', rand()), limit = bot.mins * 60;
    const botErr = Math.abs(bot.err * (Math.random() + Math.random() - 1) * 1.7) + bot.err * 0.15, botTime = limit * (0.55 + Math.random() * 0.35);
    app.innerHTML = `<div class="match">
        <div class="player"><span class="avatar">${esc((S.name || F().user)[0] || '?').toUpperCase()}</span><div><b>${esc(S.name || F().user)}</b><span class="muted small">🤖 ${S.gameRating}</span></div></div>
        <span class="vs">vs</span>
        <div class="player right"><div><b>${esc(bot.name)}</b><span class="muted small">♟ ${bot.rating}</span></div><span class="bot-ic">${bot.ic}</span></div>
      </div>
      <div class="card bot-status"><span class="eyebrow">Postęp bota</span><div class="progress"><i id="botBar" style="width:0%"></i></div><span id="botMsg" class="muted small">Bot buduje model…</span></div>
      <section class="card work-card" id="pz"></section>`;
    const t0 = Date.now(); let finished = false;
    const iv = setInterval(() => {
      if (!document.body.contains(app.querySelector('#botBar'))) return clearInterval(iv);
      const el = (Date.now() - t0) / 1000, pr = Math.min(1, el / botTime);
      app.querySelector('#botBar').style.width = (pr * 100).toFixed(1) + '%';
      if (pr >= 1) app.querySelector('#botMsg').textContent = 'Bot oddał model. Liczy się dokładność, więc dokończ swój spokojnie (do końca czasu).';
    }, 300);
    F().mountPuzzle(app.querySelector('#pz'), p, {
      noHelp: true, timeLimit: limit,
      onResult: (ok, info) => {
        if (finished) return; finished = true; clearInterval(iv);
        const S2 = F().S, r = Puzzles.check(p, new Sheet.Book(JSON.parse(JSON.stringify(p.cells))));
        let ue = 1;
        if (ok) ue = 0;
        else if (!info.timeout) {
          const got = parseFloat(String(app.querySelector('td[data-a="I13"]')?.textContent || '').replace(/,/g, ''));
          const want = r.expected.I13; ue = Number.isFinite(got) && want ? Math.abs(got - want) / Math.abs(want) : 1;
        }
        const res = ue < 1e-4 && botErr < 5e-4 ? 'd' : ue < botErr ? 'w' : ue === botErr ? 'd' : 'l';
        const delta = F().elo(S2.gameRating, bot.rating, res === 'w' ? 1 : res === 'd' ? 0.5 : 0, 24);
        S2.gameRating = Math.max(100, S2.gameRating + delta);
        S2.games.unshift({ t: Date.now(), bot: bot.id, res, ue, be: botErr, delta }); S2.games = S2.games.slice(0, 100);
        F().record({ mode: 'Gra z botem', id: p.id, seed: p.seed, title: `vs ${bot.name}`, topic: 'DCF', ok: res === 'w', delta });
        if (res === 'w') F().bumpStreak();
        F().save(); F().renderNav();
        app.querySelector('#botMsg').innerHTML = `<b>${{ w: '✅ Wygrana!', d: '🤝 Remis', l: '❌ Przegrana' }[res]}</b> Błąd Twojej wyceny: ${pctf(ue, 2)} · błąd bota: ${pctf(botErr, 2)} · rating gry ${delta >= 0 ? '+' : ''}${delta} → ${S2.gameRating}. <a href="#/graj/${bot.id}">Rewanż</a> · <a href="#/graj">Inny bot</a>`;
        app.querySelector('#botBar').style.width = '100%';
      },
    });
  }

  // Trener AI
  let chat = [];
  function trener(app) {
    const S = F().S, cfg = Tutor.load();
    top('Graj', 'Trener AI');
    const render = () => {
      const box = app.querySelector('#chat');
      box.innerHTML = chat.length ? chat.map(m => `<div class="msg-row ${m.role}"><div class="bubble">${m.role === 'assistant' ? md(m.content) : esc(m.content).replace(/\n/g, '<br>')}</div></div>`).join('')
        : `<div class="empty-chat"><span class="ic-lg">🧠</span><b>Zapytaj o dowolny krok wyceny</b><span class="muted small">Trener zna manual i standardy Funduszu. Przy zadaniach prowadzi podpowiedziami zamiast podawać gotowe rozwiązanie.</span></div>`;
      box.scrollTop = box.scrollHeight;
    };
    const md = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[\[([a-z0-9]+)\|([^\]]+)\]\]/g, '<a href="#/kurs/$1">$2</a>').replace(/\n/g, '<br>');
    app.innerHTML = head('Graj', 'Trener AI', 'Odpowiednik gry z trenerem: tłumaczy, zadaje pytania naprowadzające i sprawdza Twoje rozumowanie.',
      `<span class="chip ${Tutor.ready(cfg) ? 'ok' : ''}">${Tutor.ready(cfg) ? '● połączony z modelem AI' : '○ tryb offline'}</span>`) + `
      <div class="tutor-layout">
        <section class="card chat-card">
          ${S.ctx ? `<div class="ctx-chip">📎 ${esc(S.ctx.label)} <button type="button" id="ctxClear" class="link-x" aria-label="Usuń kontekst">×</button></div>` : ''}
          <div id="chat" class="chat"></div>
          <form id="ask" class="ask"><textarea id="q" rows="2" placeholder="Np. Dlaczego CAPEX liczymy z podstawy amortyzacji, a nie z RPP?"></textarea><button class="primary">Wyślij</button></form>
          <div class="chips sugg">${['Wyjaśnij różnicę między FCFF a FCFE', 'Jak zrelewarować betę sektora?', 'Kiedy TV to za duża część EV?', 'Jak prognozować kapitał obrotowy?'].map(s => `<button type="button" class="chip">${s}</button>`).join('')}</div>
        </section>
        <aside class="card">
          <div class="eyebrow">Ustawienia trenera</div>
          <form id="cfg" class="newcase">
            <label>Adres API<input id="apiUrl" type="url" autocomplete="off" placeholder="https://…/v1" value="${esc(cfg.url || '')}"></label>
            <label>Model<input id="apiModel" autocomplete="off" placeholder="nazwa modelu u dostawcy" value="${esc(cfg.model || '')}"></label>
            <label>Klucz API<input id="apiKey" type="password" autocomplete="off" placeholder="${cfg.key ? '•••••• zapisany' : 'jeśli dostawca wymaga'}"></label>
            <button class="primary wide">Zapisz</button>
            ${Tutor.ready(cfg) ? '<button type="button" id="forget" class="wide">Odłącz model</button>' : ''}
          </form>
          <p class="muted small">Działa z każdym API w standardzie „chat completions” (także z modelem uruchomionym lokalnie). Dostawca musi zezwalać na zapytania z przeglądarki. Ustawienia i klucz zostają tylko w tej przeglądarce, a koszt zapytań pokrywa właściciel klucza. Bez podłączonego modelu trener odpowiada w trybie offline, fragmentami manuala i słownika.</p>
          <button type="button" id="reset" class="wide">Nowa rozmowa</button>
        </aside>
      </div>`;
    render();
    const send = async text => {
      if (!text.trim()) return;
      chat.push({ role: 'user', content: text.trim() }); chat.push({ role: 'assistant', content: '…' }); render();
      try { chat[chat.length - 1].content = await Tutor.ask(chat.slice(0, -1), F().S.ctx?.text); F().S.tutorQs++; F().save(); }
      catch (e) { chat[chat.length - 1].content = `Nie udało się połączyć z modelem: ${e?.message || e}. Sprawdź adres, model i klucz w ustawieniach.`; }
      render();
    };
    app.querySelector('#ask').addEventListener('submit', e => { e.preventDefault(); const q = app.querySelector('#q'); send(q.value); q.value = ''; });
    app.querySelector('#q').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); app.querySelector('#ask').requestSubmit(); } });
    app.querySelectorAll('.sugg .chip').forEach(b => b.addEventListener('click', () => send(b.textContent)));
    app.querySelector('#cfg').addEventListener('submit', e => { e.preventDefault(); const k = app.querySelector('#apiKey').value.trim(); Tutor.save({ url: app.querySelector('#apiUrl').value.trim(), model: app.querySelector('#apiModel').value.trim(), key: k || cfg.key }); trener(app); });
    app.querySelector('#forget')?.addEventListener('click', () => { Tutor.save({}); trener(app); });
    app.querySelector('#reset').addEventListener('click', () => { chat = []; render(); });
    app.querySelector('#ctxClear')?.addEventListener('click', () => { F().S.ctx = null; F().save(); trener(app); });
  }

  // Warianty
  function warianty(app, id) {
    const v = Data.variants.find(x => x.id === id);
    if (!v) {
      top('Graj', 'Warianty');
      app.innerHTML = head('Graj', 'Warianty', 'Zadania w zmienionych zasadach. Bez wpływu na rating, ale świetne na trening nawyków.') +
        `<div class="tile-grid">${Data.variants.map(x => card('#/warianty/' + x.id, x.ic, x.t, x.d)).join('')}</div>`;
      return;
    }
    top(['Warianty', '#/warianty'], v.t);
    const p = id === 'double' ? Puzzles.instantiate('dcf-double', rand()) : Puzzles.next(F().S.rating, F().S.recent);
    practice(app, p, { mode: `Wariant: ${v.t}`, eyebrow: `Wariant · ${v.t}`, back: '#/warianty', onNext: () => warianty(app, id),
      opts: { blind: id === 'blind', noHelp: id === 'hard', timeLimit: id === 'clock' ? 90 : 0 } });
  }

  // Statystyki
  function statystyki(app) {
    const S = F().S; top('Graj', 'Statystyki');
    const h = S.ratingHist.length ? S.ratingHist : [{ t: Date.now(), r: S.rating }];
    const rs = h.map(x => x.r), lo = Math.min(...rs) - 20, hi = Math.max(...rs) + 20, W = 640, H = 180;
    const pts = h.map((x, i) => `${(h.length === 1 ? W / 2 : i / (h.length - 1) * W).toFixed(1)},${(H - (x.r - lo) / (hi - lo) * H).toFixed(1)}`).join(' ');
    const games = S.games, bat = S.battles, cnt = (a, r) => a.filter(x => x.res === r).length;
    const topics = Object.entries(S.topicStats).sort((a, b) => b[1].n - a[1].n);
    app.innerHTML = head('Graj', 'Statystyki', 'Twoje wyniki ze wszystkich trybów.') + `
      <div class="stat-row">
        <div class="card stat-card"><div class="k">Rating zadań</div><div class="v">${S.rating}</div><div class="s">szczyt: ${Math.max(S.rating, ...rs)}</div></div>
        <div class="card stat-card"><div class="k">Skuteczność</div><div class="v">${S.attempts ? pctf(S.solved / S.attempts, 0) : '—'}</div><div class="s">${S.solved}/${S.attempts} zadań rankingowych</div></div>
        <div class="card stat-card"><div class="k">Gra z botami</div><div class="v">${S.gameRating}</div><div class="s">${cnt(games, 'w')}W ${cnt(games, 'd')}R ${cnt(games, 'l')}P</div></div>
        <div class="card stat-card"><div class="k">Pojedynki</div><div class="v">${S.battleRating}</div><div class="s">${cnt(bat, 'w')}W ${cnt(bat, 'd')}R ${cnt(bat, 'l')}P</div></div>
      </div>
      <section class="card"><div class="eyebrow">Rating zadań w czasie</div>
        <svg class="chart" viewBox="-40 -10 ${W + 50} ${H + 30}" role="img" aria-label="Wykres ratingu">
          <line x1="0" y1="${H}" x2="${W}" y2="${H}" class="axis"/><text x="-6" y="4" class="lbl" text-anchor="end">${hi - 20}</text><text x="-6" y="${H}" class="lbl" text-anchor="end">${lo + 20}</text>
          <polyline points="${pts}" class="line"/>${h.length === 1 ? `<circle cx="${W / 2}" cy="${H / 2}" r="4" class="dot"/>` : ''}
        </svg>${h.length < 2 ? '<p class="muted small">Rozwiąż kilka zadań z rankingiem, żeby zobaczyć wykres.</p>' : ''}</section>
      <div class="dash dash-2">
        <section class="card"><div class="eyebrow">Skuteczność według tematu</div>${topics.length ? topics.map(([t, s]) => `<div class="topic-row"><span>${esc(t)}</span><div class="progress"><i style="width:${(s.ok / s.n * 100).toFixed(0)}%"></i></div><span class="muted small">${s.ok}/${s.n}</span></div>`).join('') : '<p class="muted">Brak danych.</p>'}</section>
        <section class="card"><div class="eyebrow">Rekordy</div><table class="rank"><tbody>
          <tr><td>Model Rush 3 min</td><td>${S.rush['3'] || 0}</td></tr><tr><td>Model Rush 5 min</td><td>${S.rush['5'] || 0}</td></tr><tr><td>Model Rush przetrwanie</td><td>${S.rush.surv || 0}</td></tr>
          <tr><td>Orientacja w arkuszu</td><td>${S.vision || 0}</td></tr><tr><td>Najlepsza recenzja modelu</td><td>${S.bestReview || 0}/100</td></tr>
          <tr><td>Najdłuższa seria</td><td>${S.best} dni</td></tr><tr><td>Ukończone lekcje</td><td>${F().doneCount()}/${F().allLessons().length}</td></tr></tbody></table></section>
      </div>`;
  }

  // Historia prób
  function historia(app) {
    const S = F().S; top('Graj', 'Historia');
    app.innerHTML = head('Graj', 'Historia', 'Twoje ostatnie zadania, partie i rundy. Każde zadanie możesz powtórzyć z tymi samymi liczbami.') +
      `<section class="card table-card">${S.history.length ? `<div class="table-container"><table class="rank"><thead><tr><th>Kiedy</th><th>Tryb</th><th>Zadanie</th><th>Temat</th><th>Wynik</th><th>Δ</th><th></th></tr></thead><tbody>
      ${S.history.map(x => `<tr><td>${timeAgo(x.t)}</td><td>${esc(x.mode)}</td><td>${esc(x.title)}</td><td>${esc(x.topic || '')}</td><td>${x.score !== undefined ? x.score + ' pkt' : x.ok ? '✅' : '❌'}</td><td>${x.delta !== undefined ? (x.delta >= 0 ? '+' : '') + x.delta : ''}</td><td>${x.id && Puzzles.byId[x.id] ? `<a href="#/baza/${x.id}/${x.seed}">Powtórz</a>` : ''}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="muted" style="padding:12px">Historia jest pusta. Rozwiąż pierwsze zadanie.</p>'}</section>`;
  }

  // ================= ZADANIA =================
  let themeFilter = { topic: '', kind: '', band: '' };
  function tematy(app, topicArg) {
    if (topicArg) themeFilter.topic = decodeURIComponent(topicArg);
    top('Zadania', 'Zadania tematyczne');
    const bands = { '': 'każda', easy: 'do 950', mid: '950–1200', hard: 'powyżej 1200' };
    const match = () => Puzzles.list.filter(t => t.pool && (!themeFilter.topic || t.topic === themeFilter.topic) && (!themeFilter.kind || t.kind === themeFilter.kind)
      && (!themeFilter.band || (themeFilter.band === 'easy' ? t.rating <= 950 : themeFilter.band === 'mid' ? t.rating > 950 && t.rating <= 1200 : t.rating > 1200)));
    const list = match();
    app.innerHTML = head('Zadania', 'Zadania tematyczne', 'Wybierz temat, typ i trudność. Zadania bez wpływu na rating, z nowymi liczbami za każdym razem.') + `
      <section class="card filters">
        <label class="topic">Temat<select id="fTopic"><option value="">wszystkie</option>${Puzzles.topics.map(t => `<option ${themeFilter.topic === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>
        <label class="topic">Typ<select id="fKind"><option value="">oba</option><option value="fix" ${themeFilter.kind === 'fix' ? 'selected' : ''}>znajdź błąd</option><option value="build" ${themeFilter.kind === 'build' ? 'selected' : ''}>zbuduj</option></select></label>
        <label class="topic">Trudność<select id="fBand">${Object.entries(bands).map(([k, l]) => `<option value="${k}" ${themeFilter.band === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <button class="primary" id="go" ${list.length ? '' : 'disabled'}>Start (${list.length} typów zadań)</button>
      </section>
      <div id="tz"></div>`;
    ['fTopic', 'fKind', 'fBand'].forEach((id, i) => app.querySelector('#' + id).addEventListener('change', e => { themeFilter[['topic', 'kind', 'band'][i]] = e.target.value; tematy(app); }));
    const go = () => { const ts = match(); const t = ts[Math.floor(Math.random() * ts.length)]; const box = app.querySelector('#tz'); practice(box, Puzzles.instantiate(t.id, rand()), { mode: 'Zadania tematyczne', eyebrow: 'Zadanie tematyczne', onNext: go }); box.scrollIntoView({ behavior: 'smooth' }); };
    app.querySelector('#go').addEventListener('click', go);
  }

  // silnik szybkich rund: Rush i Pojedynek
  function quickRound(app, { seconds, strikesMax, onQuestion, onEnd, opponent }) {
    const next = Quick.stream(rand());
    let score = 0, strikes = 0, q = next(), t0 = Date.now(), over = false, mistakes = [], opp = { score: 0, strikes: 0, at: Date.now() + 4000 + Math.random() * 6000 };
    const box = app.querySelector('#round');
    const draw = () => {
      box.innerHTML = `<div class="round-bar"><span class="big">${score}</span><span class="muted small">punktów</span>
          <span class="strikes">${[0, 1, 2].map(i => `<i class="${i < strikes ? 'x' : ''}">✕</i>`).join('')}</span>
          ${opponent ? `<span class="opp">${esc(opponent.name)}: <b id="oppScore">${opp.score}</b></span>` : ''}
          <span class="timer" id="clock"></span></div>
        <div class="q-card"><div class="eyebrow">${esc(q.topic)}</div><p class="q">${esc(q.q)}</p>
          <div class="answers">${q.options.map((o, i) => `<button type="button" data-i="${i}"><kbd>${i + 1}</kbd> ${esc(o)}</button>`).join('')}</div></div>`;
    };
    // runda porzucona (przejście na inną stronę) kończy się bez zapisu wyniku
    const finish = () => { if (over) return; over = true; clearInterval(iv); document.removeEventListener('keydown', onKey); if (document.body.contains(box)) onEnd({ score, mistakes, opp }); };
    const answer = i => {
      if (over) return;
      const ok = i === q.answer;
      if (ok) score++; else { strikes++; mistakes.push(q); }
      onQuestion?.(ok);
      if (strikesMax && strikes >= strikesMax) return finish();
      q = next(); draw();
    };
    const onKey = e => { if (!document.body.contains(box)) return document.removeEventListener('keydown', onKey); if (['1', '2', '3', '4'].includes(e.key)) answer(+e.key - 1); };
    box.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (b) answer(+b.dataset.i); });
    document.addEventListener('keydown', onKey);
    const iv = setInterval(() => {
      if (!document.body.contains(box)) return finish();
      if (opponent && Date.now() >= opp.at && !over) {
        if (Math.random() < opponent.acc) opp.score++; else opp.strikes++;
        opp.at = Date.now() + (opponent.speed * (0.6 + Math.random() * 0.8)) * 1000;
        const el = box.querySelector('#oppScore'); if (el) el.textContent = opp.score;
      }
      const el = box.querySelector('#clock'); if (!el) return;
      if (seconds) { const left = Math.max(0, seconds - Math.floor((Date.now() - t0) / 1000)); el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; el.classList.toggle('low', left <= 15); if (!left) finish(); }
      else el.textContent = `⏱ ${Math.floor((Date.now() - t0) / 1000)} s`;
    }, 200);
    draw();
  }
  const review = mistakes => mistakes.length ? `<section class="card"><div class="eyebrow">Do powtórki</div>${mistakes.slice(0, 8).map(m => `<div class="rev"><b>${esc(m.q)}</b><span>✓ ${esc(m.options[m.answer])}</span><span class="muted small">${esc(m.expl)}</span></div>`).join('')}</section>` : '';

  function rush(app, mode) {
    const S = F().S, modes = { '3': ['3 minuty', 180, 3], '5': ['5 minut', 300, 3], surv: ['Przetrwanie', 0, 3] };
    if (!modes[mode]) {
      top('Zadania', 'Model Rush');
      app.innerHTML = head('Zadania', 'Model Rush', 'Szybkie obliczenia i pytania z manuala: FCFF, WACC, TV, most do equity, mnożniki. Trzy błędy kończą rundę. Odpowiadaj klawiszami 1–4.') +
        `<div class="tile-grid">${Object.entries(modes).map(([k, [t, s]]) => card('#/rush/' + k, k === 'surv' ? '♾' : '⚡', t, s ? `Jak najwięcej poprawnych odpowiedzi w ${t}.` : 'Bez limitu czasu, gra trwa do trzeciego błędu.', `<span class="chip">rekord: ${S.rush[k] || 0}</span>`)).join('')}</div>`;
      return;
    }
    const [t, sec, strikes] = modes[mode];
    top(['Model Rush', '#/rush'], t);
    app.innerHTML = head('Model Rush', t) + '<section class="card" id="round"></section>';
    quickRound(app, { seconds: sec, strikesMax: strikes, onEnd: ({ score, mistakes }) => {
      const S2 = F().S, rec = score > (S2.rush[mode] || 0); S2.rush[mode] = Math.max(score, S2.rush[mode] || 0);
      F().record({ mode: 'Model Rush', title: t, topic: '', ok: true, score }); if (score >= 5) F().bumpStreak(); F().save(); F().renderNav();
      app.querySelector('#round').innerHTML = `<div class="end"><span class="big">${score}</span><b>${rec ? '🏆 Nowy rekord!' : 'Koniec rundy'}</b><span class="muted">Rekord: ${S2.rush[mode]}</span><div class="actions"><a class="btn primary" href="#/rush/${mode}">Jeszcze raz</a><a class="btn" href="#/rush">Inny tryb</a></div></div>`;
      app.insertAdjacentHTML('beforeend', review(mistakes));
    } });
  }

  function pojedynek(app, start) {
    const S = F().S, names = ['Kasia W.', 'Michał K.', 'Ola P.', 'Bartek Z.', 'Zuza M.', 'Kuba D.', 'Natalia R.', 'Piotr S.'];
    top('Zadania', 'Pojedynek');
    if (start !== 'start') {
      const b = S.battles, cnt = r => b.filter(x => x.res === r).length;
      app.innerHTML = head('Zadania', 'Pojedynek', 'Trzy minuty szybkich zadań przeciwko innemu analitykowi. Wygrywa ten, kto zdobędzie więcej punktów.',
        `<div class="card mini-progress"><div class="k">Rating pojedynków</div><div class="v">⚔️ ${S.battleRating}</div><span class="muted small">${cnt('w')}W ${cnt('d')}R ${cnt('l')}P</span></div>`) +
        `<section class="card center"><span class="ic-lg">⚔️</span><p>Dobierzemy rywala o podobnym ratingu. W wersji testowej rywale są symulowani, a prawdziwe pojedynki wymagają serwera.</p><a class="btn primary" href="#/pojedynek/start">Szukaj rywala</a></section>`;
      return;
    }
    const oppR = S.battleRating + Math.round((Math.random() - 0.5) * 200), opponent = { name: names[Math.floor(Math.random() * names.length)], rating: oppR, acc: Math.min(0.93, Math.max(0.5, 0.6 + (oppR - 1000) / 2000)), speed: Math.max(5, 11 - (oppR - 800) / 200) };
    app.innerHTML = head('Pojedynek', `Ty vs ${esc(opponent.name)}`, '', `<span class="chip">rywal ♟ ${oppR}</span>`) + '<section class="card" id="round"></section>';
    quickRound(app, { seconds: 180, strikesMax: 0, opponent, onEnd: ({ score, mistakes, opp }) => {
      const S2 = F().S, res = score > opp.score ? 'w' : score === opp.score ? 'd' : 'l';
      const delta = F().elo(S2.battleRating, oppR, res === 'w' ? 1 : res === 'd' ? 0.5 : 0, 24);
      S2.battleRating = Math.max(100, S2.battleRating + delta); S2.battles.unshift({ t: Date.now(), res, score, opp: opp.score, delta }); S2.battles = S2.battles.slice(0, 100);
      F().record({ mode: 'Pojedynek', title: `vs ${opponent.name}`, topic: '', ok: res === 'w', score, delta }); if (res === 'w') F().bumpStreak(); F().save(); F().renderNav();
      app.querySelector('#round').innerHTML = `<div class="end"><span class="big">${score} : ${opp.score}</span><b>${{ w: '✅ Wygrana!', d: '🤝 Remis', l: '❌ Przegrana' }[res]}</b><span class="muted">Rating pojedynków ${delta >= 0 ? '+' : ''}${delta} → ${S2.battleRating}</span><div class="actions"><a class="btn primary" href="#/pojedynek">Kolejny pojedynek</a></div></div>`;
      app.insertAdjacentHTML('beforeend', review(mistakes));
    } });
  }

  // ================= UCZ SIĘ =================
  const sectorDrill = { retail: 'rev-stores', fmcg: 'rev-quarterly', saas: 'growth-cagr', constr: 'nwc-days', health: 'beta-hamada', exch: 'comps-harmonic', ecom: 'nwc-days', realestate: 'capex-identity' };
  function otwarcia(app, id) {
    const s = Data.sectors.find(x => x.id === id);
    if (!s) {
      top('Ucz się', 'Drivery branżowe');
      app.innerHTML = head('Ucz się', 'Drivery branżowe', 'Odpowiednik otwarć szachowych: sprawdzone schematy prognozy dla typowych branż z portfela Funduszu. Zanim zbudujesz model, sprawdź, jak „otwiera się” daną branżę.') +
        `<div class="tile-grid">${Data.sectors.map(x => card('#/otwarcia/' + x.id, '♞', x.t, x.model, `<span class="muted small">np. ${esc(x.ex)}</span>`)).join('')}</div>`;
      return;
    }
    top(['Drivery branżowe', '#/otwarcia'], s.t);
    const list = xs => `<ul class="clean">${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    app.innerHTML = head('Drivery branżowe', esc(s.t), esc(s.model), `<a class="btn primary" href="#/baza/${sectorDrill[s.id]}">Ćwicz →</a>`) + `
      <div class="dash dash-2">
        <section class="card"><div class="eyebrow">Drivery przychodów</div>${s.drivers.map(d => `<pre class="formula">${esc(d)}</pre>`).join('')}</section>
        <section class="card"><div class="eyebrow">Kluczowe KPI</div>${list(s.kpi)}<div class="eyebrow" style="margin-top:14px">Przykłady z GPW</div><p>${esc(s.ex)}</p></section>
      </div>
      <div class="dash dash-2">
        <section class="card"><div class="eyebrow">CAPEX i kapitał obrotowy</div><p>${esc(s.capex)}</p></section>
        <section class="card callout err"><b>Typowe pułapki</b>${list(s.traps)}</section>
      </div>`;
  }

  function slownik(app) {
    top('Ucz się', 'Słownik pojęć');
    app.innerHTML = head('Ucz się', 'Słownik pojęć', `${Data.glossary.length} pojęć z wyceny i standardów Funduszu.`) +
      `<input id="gq" class="search" type="search" placeholder="Szukaj pojęcia, np. WACC, NCI, stub…"><section class="card gloss" id="gl"></section>`;
    const draw = q => {
      const n = s => s.toLowerCase();
      const xs = Data.glossary.filter(([t, d]) => !q || n(t + ' ' + d).includes(n(q)));
      app.querySelector('#gl').innerHTML = xs.length ? xs.map(([t, d]) => `<div class="term"><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join('') : '<p class="muted">Brak wyników.</p>';
    };
    app.querySelector('#gq').addEventListener('input', e => draw(e.target.value)); draw('');
  }

  // ================= TRENUJ =================
  function kursy(app, id) {
    const S = F().S, c = Data.courses.find(x => x.id === id);
    const lessonsOf = x => x.lessons || (x.steps ? x.steps.flatMap(s => s[1]) : F().allLessons().map(l => l.id));
    const prog = x => { const ls = lessonsOf(x); return [ls.filter(l => S.lessons[l]).length, ls.length]; };
    const title = lid => F().allLessons().find(l => l.id === lid)?.title || lid;
    const drillLink = d => { const [k, a] = d.split(':'); const map = { recenzja: ['🔍 Recenzja modelu', '#/recenzja'], graj: ['🤖 Graj z botem', '#/graj'], rush: ['⚡ Model Rush', '#/rush'], pojedynek: ['⚔️ Pojedynek', '#/pojedynek'], koncowki: ['🏁 Końcówki', '#/koncowki'], tematy: [`🏷 Zadania: ${a}`, `#/tematy/${encodeURIComponent(a || '')}`] }; const [l, h] = map[k]; return `<a class="btn" href="${h}">${l}</a>`; };
    if (!c) {
      top('Trenuj', 'Kursy');
      app.innerHTML = head('Trenuj', 'Kursy', 'Uporządkowane ścieżki przez lekcje i treningi, zależnie od celu.') +
        `<div class="modules">${Data.courses.map(x => { const [d, n] = prog(x); return `<a class="card module-link" href="#/kursy/${x.id}"><b>${esc(x.t)}</b><span class="muted small">${esc(x.d)}</span>${F().bar(d, n)}<span class="muted small">${d}/${n} lekcji</span></a>`; }).join('')}</div>`;
      return;
    }
    top(['Kursy', '#/kursy'], c.t);
    const [d, n] = prog(c);
    const lrow = lid => `<li><a class="lrow${S.lessons[lid] ? ' done' : ''}" href="#/kurs/${lid}"><span class="st">${S.lessons[lid] ? '✓' : '○'}</span><span class="lt">${esc(title(lid))}</span><span class="go">›</span></a></li>`;
    app.innerHTML = head('Kurs', esc(c.t), esc(c.d), `<div class="card mini-progress"><div class="k">Postęp</div><div class="v">${d}/${n}</div>${F().bar(d, n)}</div>`) +
      (c.steps ? c.steps.map(([t, ls]) => `<section class="card module"><header class="module-head"><span class="num">${ls.every(l => S.lessons[l]) ? '✓' : '•'}</span><div class="module-t"><h2>${esc(t)}</h2></div></header><ol class="lesson-list">${ls.map(lrow).join('')}</ol></section>`).join('')
        : `<section class="card module"><ol class="lesson-list">${lessonsOf(c).map(lrow).join('')}</ol></section>`) +
      (c.drills.length ? `<section class="card"><div class="eyebrow">Trening w tym kursie</div><div class="actions">${c.drills.map(drillLink).join('')}</div></section>` : '');
  }

  // Recenzja modelu (odpowiednik analizy partii): automatyczny przegląd case study według checklisty Funduszu
  function reviewCase(c) {
    const b = new Sheet.Book(JSON.parse(JSON.stringify(c.cells))), v = a => { const x = b.value(a); return typeof x === 'number' ? x : null; };
    const s = Cases.summary(b), out = [];
    const add = (lvl, t, d, cell) => out.push({ lvl, t, d, cell });
    const g = v('B29'), w = v('B40');
    if (w == null) add('err', 'Brak WACC', 'Uzupełnij parametry kosztu kapitału (B32–B39).', 'B40');
    else if (w < 0.06 || w > 0.15) add('warn', 'Nietypowy WACC', `WACC = ${pctf(w)}. Dla spółek z GPW zwykle 8–12%. Sprawdź rf, betę i ERP (z datami).`, 'B40'); else add('ok', 'WACC w typowym zakresie', `WACC = ${pctf(w)}.`, 'B40');
    if (g != null && w != null && g >= w) add('err', 'g ≥ WACC', 'Model Gordona wymaga g < WACC.', 'B29');
    else if (g > 0.03) add('warn', 'Wysokie g', `g = ${pctf(g)}. Standard Funduszu: ok. 2,5%, nie więcej niż długoterminowy wzrost nominalny.`, 'B29'); else if (g != null) add('ok', 'g zgodne ze standardem', `g = ${pctf(g)}.`, 'B29');
    const lastG = v('K8'); if (lastG != null && g != null && Math.abs(lastG - g) > 0.01) add('warn', 'Ostatni rok ≠ g', `Wzrost przychodów w ostatnim roku (${pctf(lastG)}) różni się od g (${pctf(g)}) o ponad 1 p.p. Wydłuż prognozę albo wygaś wzrost.`, 'K8'); else if (lastG != null) add('ok', 'Wzrost zbiega do g', 'Ostatni rok prognozy jest spójny z wartością rezydualną.', 'K8');
    const capex = v('K14'), da = v('K13'); if (capex != null && da != null && capex < da) add('err', 'CAPEX < amortyzacja w ostatnim roku', `CAPEX ${fmt(capex)} < D&A ${fmt(da)}. Majątek się kurczy, a FCFF w TV jest zawyżone.`, 'K14'); else if (capex != null) add('ok', 'CAPEX ≥ amortyzacja', 'Ostatni rok uwzględnia reinwestycje.', 'K14');
    if (s.tvShare != null && s.tvShare > 0.8) add('err', 'TV to ponad 80% EV', `Udział TV = ${pctf(s.tvShare)}. Wycena wisi na jednym założeniu.`, 'B47'); else if (s.tvShare > 0.7) add('warn', 'Wysoki udział TV', `Udział TV = ${pctf(s.tvShare)} (praktycy: maks. 50–70%).`, 'B47'); else if (s.tvShare != null) add('ok', 'Udział TV rozsądny', `${pctf(s.tvShare)} EV.`, 'B47');
    if (v('B48') == null) add('err', 'Brak długu netto', 'Uzupełnij dług netto z ostatniego raportu (z leasingiem i gotówką).', 'B48');
    if (!v('B50')) add('err', 'Brak liczby akcji', 'Bez liczby akcji nie ma wartości na akcję.', 'B50');
    if (!v('B52')) add('warn', 'Brak bieżącego kursu', 'Dodaj kurs z datą, żeby policzyć potencjał.', 'B52');
    const formulaRows = [7, 9, 11, 12, 13, 14, 15, 16, 21, 22], cols = ['G', 'H', 'I', 'J', 'K'];
    const hard = formulaRows.flatMap(r => cols.map(c2 => c2 + r)).filter(a => b.raw(a) !== '' && !String(b.raw(a)).startsWith('='));
    if (hard.length) add('err', 'Liczby wpisane ręcznie w prognozie', `Komórki ${hard.slice(0, 6).join(', ')}${hard.length > 6 ? '…' : ''} powinny być formułami.`, hard[0]); else add('ok', 'Prognoza liczona formułami', 'Brak wartości wpisanych na stałe.', 'G16');
    const mid = v('D73'); if (mid != null && s.dcf != null && Math.abs(mid - s.dcf) > 0.01) add('warn', 'Wrażliwość niespójna z modelem', 'Środek tabeli wrażliwości różni się od wartości z DCF.', 'D73');
    if (v('F62') == null) add('warn', 'Brak wyceny porównawczej', 'Uzupełnij peerów (wiersze 57–61), żeby mieć drugą metodę.', 'A57');
    const notes = ['L8', 'L10', 'L32'].filter(a => !String(b.raw(a)).trim()); if (notes.length) add('warn', 'Brak uzasadnień', 'Uzupełnij źródła i uzasadnienia w kolumnie L.', notes[0]);
    const score = Math.max(0, 100 - 15 * out.filter(x => x.lvl === 'err').length - 5 * out.filter(x => x.lvl === 'warn').length);
    return { out, score };
  }
  function recenzja(app, id) {
    const S = F().S; top('Trenuj', 'Recenzja modelu');
    const c = S.cases.find(x => x.id === id);
    if (!c) {
      app.innerHTML = head('Trenuj', 'Recenzja modelu', 'Odpowiednik analizy partii: automatyczny przegląd Twojego case study według checklisty DCF Funduszu, z oceną i listą błędów.') +
        (S.cases.length ? `<div class="cases">${S.cases.map(x => `<a class="card case-card" href="#/recenzja/${x.id}"><span class="ic-lg">🔍</span><span class="case-t"><b>${esc(x.name)}</b><span class="muted small">${esc(x.market)}</span></span><span class="go">›</span></a>`).join('')}</div>`
          : `<div class="card empty"><b>Nie masz jeszcze modelu do recenzji</b><span class="muted small">Utwórz case study (np. spółkę demo), a potem wróć tutaj.</span><a class="btn primary" href="#/case">Utwórz model →</a></div>`);
      return;
    }
    const r = reviewCase(c); S.bestReview = Math.max(S.bestReview || 0, r.score); F().save();
    const ic = { ok: '✓', warn: '?!', err: '??' };
    app.innerHTML = head('Recenzja modelu', esc(c.name), '', `<a class="btn" href="#/case/${c.id}">Otwórz model</a>`) + `
      <div class="stat-row three">
        <div class="card stat-card"><div class="k">Ocena modelu</div><div class="v ${r.score >= 85 ? 'pos' : r.score < 60 ? 'neg' : ''}">${r.score}/100</div><div class="s">jak dokładność w analizie partii</div></div>
        <div class="card stat-card"><div class="k">Błędy</div><div class="v neg">${r.out.filter(x => x.lvl === 'err').length}</div><div class="s">?? do poprawy przed Komitetem</div></div>
        <div class="card stat-card"><div class="k">Nieścisłości</div><div class="v">${r.out.filter(x => x.lvl === 'warn').length}</div><div class="s">?! do sprawdzenia</div></div>
      </div>
      <section class="card">${r.out.sort((a, b) => ({ err: 0, warn: 1, ok: 2 }[a.lvl] - { err: 0, warn: 1, ok: 2 }[b.lvl])).map(x => `<div class="rv ${x.lvl}"><span class="rv-ic">${ic[x.lvl]}</span><div><b>${esc(x.t)}</b> <span class="chip">${x.cell}</span><p class="muted small">${esc(x.d)}</p></div></div>`).join('')}</section>`;
  }

  function koncowki(app, id) {
    const S = F().S; S.endgame ||= {};
    top('Trenuj', 'Końcówki');
    if (!id) {
      const done = Data.endgame.filter(e => S.endgame[e]).length;
      app.innerHTML = head('Trenuj', 'Końcówki modelu', 'Odpowiednik końcówek szachowych: koniec modelu, na którym najłatwiej przegrać wycenę. Wartość rezydualna, dyskontowanie w trakcie roku, most do equity i cena docelowa.',
        `<div class="card mini-progress"><div class="k">Opanowane</div><div class="v">${done}/${Data.endgame.length}</div>${F().bar(done, Data.endgame.length)}</div>`) +
        `<section class="card module"><ol class="lesson-list">${Data.endgame.map(e => { const t = Puzzles.byId[e]; return `<li><a class="lrow${S.endgame[e] ? ' done' : ''}" href="#/koncowki/${e}"><span class="st">${S.endgame[e] ? '✓' : '○'}</span><span class="lt">${esc(t.title)}</span><span class="chip">♟ ${t.rating}</span><span class="go">›</span></a></li>`; }).join('')}</ol></section>`;
      return;
    }
    const nextOpen = () => Data.endgame.find(e => !S.endgame[e] && e !== id);
    practice(app, Puzzles.instantiate(id, rand()), { mode: 'Końcówki', eyebrow: 'Końcówka modelu', back: '#/koncowki',
      opts: { onResult: ok => { if (ok) { S.endgame[id] = Date.now(); F().save(); } } },
      onNext: () => { const n = nextOpen(); location.hash = n ? '#/koncowki/' + n : '#/koncowki'; } });
  }

  function cwicz(app, id) {
    const S = F().S;
    if (id === 'arkusz') {
      top(['Ćwicz od pozycji', '#/cwicz'], 'Pusty arkusz');
      app.innerHTML = head('Ćwicz', 'Pusty arkusz', 'Wolny arkusz do własnych obliczeń i szkiców modelu. Zapisuje się automatycznie w tej przeglądarce.', '<button class="btn" id="clr">Wyczyść</button>') + '<section class="card work-card"><div class="sheet-host big"></div></section>';
      S.sandbox ||= {};
      const book = new Sheet.Book(S.sandbox);
      new Sheet.View(app.querySelector('.sheet-host'), book, { cols: 14, rows: 40, widths: { A: 180 }, start: 'A1', onChange: () => F().save() });
      app.querySelector('#clr').addEventListener('click', () => { S.sandbox = {}; F().save(); cwicz(app, 'arkusz'); });
      return;
    }
    top('Trenuj', 'Ćwicz od pozycji');
    const builds = Puzzles.list.filter(t => t.kind === 'build');
    app.innerHTML = head('Trenuj', 'Ćwicz od pozycji', 'Odpowiednik gry od wybranej pozycji: dostajesz częściowo zbudowany model i kończysz go sam. Bez wpływu na rating.') +
      `<div class="tile-grid">${card('#/cwicz/arkusz', '📄', 'Pusty arkusz', 'Wolny arkusz z formułami do własnych szkiców.')}${builds.map(t => card('#/baza/' + t.id, '✏️', t.title, `${t.topic} · ♟ ${t.rating}`)).join('')}</div>`;
  }

  // Plan treningowy (odpowiednik Insights / Aimchess)
  function plan(app) {
    const S = F().S; top('Trenuj', 'Plan treningowy');
    const ts = Object.entries(S.topicStats).filter(([, s]) => s.n >= 2).map(([t, s]) => ({ t, ...s, r: s.ok / s.n }));
    const weak = [...ts].sort((a, b) => a.r - b.r).slice(0, 2), strong = [...ts].sort((a, b) => b.r - a.r)[0];
    const hours = Array(24).fill(0).map(() => ({ n: 0, ok: 0 })); S.history.forEach(h => { const x = hours[new Date(h.t).getHours()]; x.n++; if (h.ok) x.ok++; });
    const bestH = hours.map((x, i) => ({ i, r: x.n >= 3 ? x.ok / x.n : -1 })).sort((a, b) => b.r - a.r)[0];
    const n = F().nextLesson(), daily = S.daily[F().today()];
    const todo = [
      !daily && ['★', 'Rozwiąż zadanie dnia', '#/zadania/dzienne'],
      n && ['▤', `Przerób lekcję: ${n.title}`, '#/kurs/' + n.id],
      ...weak.map(w => ['🏷', `Trenuj słaby temat: ${w.t} (${pctf(w.r, 0)})`, '#/tematy/' + encodeURIComponent(w.t)]),
      !(S.rush['3'] >= 10) && ['⚡', 'Model Rush 3 min: celuj w 10 punktów', '#/rush/3'],
      !S.games.some(g => g.res === 'w') && ['🤖', 'Wygraj pierwszą partię z botem', '#/graj'],
      !S.cases.length && ['▦', 'Zbuduj pierwszy case study i przepuść go przez recenzję', '#/case'],
    ].filter(Boolean);
    app.innerHTML = head('Trenuj', 'Plan treningowy', 'Analiza Twoich wyników i lista rzeczy, które dziś dadzą najwięcej.') + `
      <div class="dash dash-2">
        <section class="card"><div class="eyebrow">Na dziś</div><ol class="todo">${todo.map(([ic, t, h]) => `<li><a href="${h}"><span>${ic}</span>${esc(t)}</a></li>`).join('')}</ol></section>
        <section class="card"><div class="eyebrow">Wnioski</div>
          ${ts.length ? `<p>Najsłabszy temat: <b>${esc(weak[0].t)}</b> (${pctf(weak[0].r, 0)} skuteczności).</p><p>Najmocniejszy temat: <b>${esc(strong.t)}</b> (${pctf(strong.r, 0)}).</p>` : '<p class="muted">Rozwiąż kilka zadań z różnych tematów, żeby zobaczyć analizę.</p>'}
          ${bestH.r >= 0 ? `<p>Najlepiej idzie Ci około <b>${bestH.i}:00</b>.</p>` : ''}
          ${weak.length ? `<div class="eyebrow" style="margin-top:12px">Lekcje do powtórki</div><ul class="clean">${weak.flatMap(w => (Data.topicLessons[w.t] || []).map(id => `<li><a href="#/kurs/${id}">${esc(F().allLessons().find(l => l.id === id)?.title || id)}</a></li>`)).join('')}</ul>` : ''}
        </section>
      </div>`;
  }

  // Klasa: tryb prezentacji na spotkania Funduszu
  function klasa(app, what) {
    top('Trenuj', 'Klasa');
    if (!what) {
      app.innerHTML = head('Trenuj', 'Klasa', 'Tryb prezentacji na spotkania Funduszu: zadanie na dużym ekranie, wspólny zegar i odsłonięcie rozwiązania na końcu.') +
        `<div class="tile-grid">${card('#/klasa/dzienne', '★', 'Zadanie dnia na ekranie', 'Cała sala rozwiązuje to samo zadanie.')}${card('#/klasa/losowe', '🎲', 'Losowe zadanie', 'Zadanie o średniej trudności z dowolnego tematu.')}${card('#/klasa/koncowka', '🏁', 'Końcówka modelu', 'Zadanie z TV, dyskontowania albo mostu.')}</div>`;
      return;
    }
    const p = what === 'dzienne' ? Puzzles.daily(F().today()) : what === 'koncowka' ? Puzzles.instantiate(Data.endgame[Math.floor(Math.random() * Data.endgame.length)], rand()) : Puzzles.next(1100, []);
    document.body.classList.add('present');
    app.innerHTML = `<div class="present-bar"><b>Klasa · ${esc(p.title)}</b><span class="chip">${esc(p.topic)}</span><a class="btn" href="#/klasa">Zakończ prezentację</a></div><section class="card work-card" id="pz"></section>`;
    F().mountPuzzle(app.querySelector('#pz'), p, { timeLimit: 300 });
  }

  // ================= OGLĄDAJ =================
  function ogladaj(app) {
    const w = Data.walkthrough; top('Oglądaj', 'Rozbiory wycen');
    app.innerHTML = head('Oglądaj', esc(w.t), esc(w.d)) + `<ol class="timeline">${w.steps.map(([t, d], i) => `<li class="card"><span class="num">${i + 1}</span><div><b>${esc(t)}</b><p>${esc(d)}</p></div></li>`).join('')}</ol>`;
  }

  // ================= SPOŁECZNOŚĆ =================
  const isoWeek = () => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7); const w1 = new Date(d.getFullYear(), 0, 4); return `${d.getFullYear()}-T${1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7)}`; };
  function arena(app, idx) {
    const S = F().S, wk = isoWeek(), seed = Puzzles.hash('arena' + wk), rng = Puzzles.rngFrom(seed);
    const pool = Puzzles.list.filter(t => t.pool), set = [...Array(8)].map((_, i) => Puzzles.instantiate(pool[Math.floor(rng() * pool.length)].id, seed + i));
    const st = S.arena[wk] ||= { done: {}, score: 0 };
    top('Społeczność', 'Arena tygodnia');
    if (idx !== undefined && set[idx] && st.done[idx] === undefined) {
      const p = set[idx];
      app.innerHTML = head(`Arena ${wk} · zadanie ${+idx + 1}/8`, esc(p.title), 'Jedna próba, bez podpowiedzi, 3 minuty.', '<a class="btn" href="#/arena">← Arena</a>') + '<section class="card work-card" id="pz"></section>';
      F().mountPuzzle(app.querySelector('#pz'), p, { noHelp: true, timeLimit: 180, onResult: ok => {
        st.done[idx] = !!ok; if (ok) st.score += Math.round(p.rating / 10); F().record({ mode: 'Arena tygodnia', id: p.id, seed: p.seed, title: p.title, topic: p.topic, ok }); if (ok) F().bumpStreak(); F().save();
        app.querySelector('.result').insertAdjacentHTML('beforeend', '<a class="btn primary" href="#/arena">Wróć do areny →</a>');
      } });
      return;
    }
    const lr = Puzzles.rngFrom(seed + 1), names = ['Kasia W.', 'Michał K.', 'Ola P.', 'Bartek Z.', 'Zuza M.', 'Kuba D.', 'Natalia R.', 'Piotr S.'];
    const board = names.map(n => ({ n, s: Math.round(lr() * 600) })).concat([{ n: (S.name || F().user) + ' (Ty)', s: st.score, me: true }]).sort((a, b) => b.s - a.s);
    app.innerHTML = head('Społeczność', `Arena tygodnia ${wk}`, 'Osiem zadań tygodnia, ta sama pula dla wszystkich. Każde zadanie ma jedną próbę i 3 minuty. Punkty = rating zadania / 10.',
      `<div class="card mini-progress"><div class="k">Twoje punkty</div><div class="v">🏟 ${st.score}</div></div>`) + `
      <div class="dash dash-2">
        <section class="card module"><ol class="lesson-list">${set.map((p, i) => `<li>${st.done[i] === undefined ? `<a class="lrow" href="#/arena/${i}"><span class="st">${i + 1}</span><span class="lt">${esc(p.title)}</span><span class="chip">♟ ${p.rating}</span><span class="go">›</span></a>` : `<span class="lrow ${st.done[i] ? 'done' : ''}"><span class="st">${st.done[i] ? '✓' : '✗'}</span><span class="lt">${esc(p.title)}</span><span class="chip">${st.done[i] ? '+' + Math.round(p.rating / 10) : '0'} pkt</span></span>`}</li>`).join('')}</ol></section>
        <section class="card table-card"><table class="rank"><thead><tr><th>#</th><th>Uczestnik</th><th>Punkty</th></tr></thead><tbody>${board.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.n)}</td><td>${r.s}</td></tr>`).join('')}</tbody></table><p class="muted small" style="padding:8px">Pozostali uczestnicy są w wersji testowej fikcyjni.</p></section>
      </div>`;
  }

  function osiagniecia(app) {
    const S = F().S, n = F().allLessons().length; top('Społeczność', 'Osiągnięcia');
    const got = Data.achievements.filter(a => a[4](S, n)).length;
    app.innerHTML = head('Społeczność', 'Osiągnięcia', `Zdobyte: ${got} z ${Data.achievements.length}.`) +
      `<div class="badge-grid">${Data.achievements.map(([id, ic, t, d, f]) => { const ok = f(S, n); return `<div class="card badge-card${ok ? ' got' : ''}"><span class="bic">${ok ? ic : '🔒'}</span><b>${esc(t)}</b><span class="muted small">${esc(d)}</span></div>`; }).join('')}</div>`;
  }

  // ================= INNE =================
  function kolekcje(app) {
    const S = F().S; top('Inne', 'Kolekcje');
    app.innerHTML = head('Inne', 'Kolekcje', 'Zadania zapisane przyciskiem ☆, z tymi samymi liczbami.') +
      (S.favs.length ? `<div class="cases">${S.favs.map((f, i) => `<div class="card case-card"><span class="ic-lg">★</span><a class="case-t" href="#/baza/${f.id}/${f.seed}"><b>${esc(f.title)}</b><span class="muted small">${esc(f.topic)} · zapisane ${timeAgo(f.t)}</span></a><button type="button" data-rm="${i}">Usuń</button></div>`).join('')}</div>`
        : '<div class="card empty"><b>Kolekcja jest pusta</b><span class="muted small">W dowolnym zadaniu kliknij „☆ Zapisz”.</span></div>');
    app.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => { S.favs.splice(+b.dataset.rm, 1); F().save(); F().renderNav(); kolekcje(app); }));
  }

  function baza(app, id, seed) {
    if (id && Puzzles.byId[id]) {
      const t = Puzzles.byId[id]; top(['Baza zadań', '#/baza'], t.title);
      practice(app, Puzzles.instantiate(id, seed ? +seed : rand()), { mode: 'Baza zadań', eyebrow: 'Baza zadań', back: '#/baza', onNext: () => { location.hash = `#/baza/${id}/${rand()}`; } });
      return;
    }
    top('Inne', 'Baza zadań');
    app.innerHTML = head('Inne', 'Baza zadań', `Wszystkie ${Puzzles.list.length} typy zadań. Każde otwarcie losuje nowe liczby.`) +
      `<input id="bq" class="search" type="search" placeholder="Filtruj po nazwie lub temacie…"><section class="card table-card"><table class="rank"><thead><tr><th>Zadanie</th><th>Temat</th><th>Typ</th><th>Rating</th><th></th></tr></thead><tbody id="bt"></tbody></table></section>`;
    const draw = q => { app.querySelector('#bt').innerHTML = Puzzles.list.filter(t => !q || (t.title + t.topic).toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.rating - b.rating).map(t => `<tr><td>${esc(t.title)}</td><td>${esc(t.topic)}</td><td>${t.kind === 'fix' ? 'znajdź błąd' : 'zbuduj'}</td><td>${t.rating}</td><td><a href="#/baza/${t.id}">Otwórz</a></td></tr>`).join(''); };
    app.querySelector('#bq').addEventListener('input', e => draw(e.target.value)); draw('');
  }

  function standardy(app) {
    top('Inne', 'Standardy Funduszu');
    app.innerHTML = head('Inne', 'Standardy Funduszu', 'Zasady gry: terminy, format modelu, metodyka, raport i portfel. Pełna lista kontrolna jest w ostatniej lekcji manuala.', '<a class="btn primary" href="#/kurs/z4">Checklista DCF →</a>') +
      `<div class="modules">${Data.standards.map(([t, xs]) => `<section class="card"><div class="eyebrow">${esc(t)}</div><ul class="clean">${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')}</div>`;
  }

  // Narzędzia: kalkulatory
  const CALCS = [
    { id: 'wacc', t: 'WACC', in: [['rf', 'Stopa wolna od ryzyka [%]', 5.5], ['beta', 'Beta lewarowana', 1.0], ['erp', 'ERP [%]', 5.5], ['crp', 'CRP [%]', 0], ['kd', 'Kd przed podatkiem [%]', 7.5], ['t', 'Stopa podatkowa [%]', 19], ['w', 'D/(D+E) [%]', 20]],
      out: x => { const ke = x.rf + x.beta * x.erp + x.crp, kd = x.kd * (1 - x.t / 100); return [['Koszt kapitału własnego', ke, '%'], ['Koszt długu po podatku', kd, '%'], ['WACC', ke * (1 - x.w / 100) + kd * x.w / 100, '%']]; } },
    { id: 'beta', t: 'Beta (Hamada)', in: [['bl', 'Beta lewarowana peera', 1.1], ['de', 'D/E peera', 0.5], ['t', 'Stopa podatkowa [%]', 19], ['de2', 'Docelowe D/E spółki', 0.3]],
      out: x => { const bu = x.bl / (1 + (1 - x.t / 100) * x.de); return [['Beta nielewarowana', bu, ''], ['Beta zrelewarowana', bu * (1 + (1 - x.t / 100) * x.de2), '']]; } },
    { id: 'tv', t: 'Wartość rezydualna', in: [['f', 'FCFF ostatniego roku', 100], ['g', 'g [%]', 2.5], ['w', 'WACC [%]', 9.5], ['n', 'Lata prognozy (n)', 5]],
      out: x => { const tv = x.f * (1 + x.g / 100) / ((x.w - x.g) / 100); return [['TV na koniec roku n', tv, ''], ['PV TV', tv / Math.pow(1 + x.w / 100, x.n), '']]; } },
    { id: 'cagr', t: 'CAGR', in: [['a', 'Wartość początkowa', 100], ['b', 'Wartość końcowa', 150], ['n', 'Liczba okresów', 4]], out: x => [['CAGR', (Math.pow(x.b / x.a, 1 / x.n) - 1) * 100, '%']] },
    { id: 'bridge', t: 'EV → cena za akcję', in: [['ev', 'EV', 1000], ['d', 'Dług oprocentowany (z leasingiem)', 250], ['c', 'Gotówka', 80], ['nci', 'NCI', 0], ['sh', 'Liczba akcji [mln]', 20], ['px', 'Bieżący kurs', 40]],
      out: x => { const eq = x.ev - (x.d - x.c) - x.nci, p = eq / x.sh; return [['Dług netto', x.d - x.c, ''], ['Wartość kapitału własnego', eq, ''], ['Wartość na akcję', p, ''], ['Potencjał', (p / x.px - 1) * 100, '%']]; } },
    { id: 'impl', t: 'Implikowane g z wyceny', in: [['tv', 'TV', 1500], ['f', 'FCFF ostatniego roku', 100], ['w', 'WACC [%]', 9.5]], out: x => [['Implikowane g', (x.tv * x.w / 100 - x.f) / (x.tv + x.f) * 100, '%']] },
  ];
  function narzedzia(app, id) {
    const c = CALCS.find(x => x.id === id) || CALCS[0]; top('Inne', 'Narzędzia');
    app.innerHTML = head('Inne', 'Narzędzia', 'Kalkulatory do szybkiej kontroli liczb z modelu.') +
      `<div class="seg">${CALCS.map(x => `<a href="#/narzedzia/${x.id}" class="${x === c ? 'active' : ''}">${x.t}</a>`).join('')}</div>
      <div class="dash dash-2"><section class="card"><form class="newcase" id="calc">${c.in.map(([k, l, d]) => `<label>${esc(l)}<input name="${k}" type="number" step="any" value="${d}"></label>`).join('')}</form></section><section class="card" id="cout"></section></div>`;
    const f = app.querySelector('#calc');
    const draw = () => { const x = Object.fromEntries(c.in.map(([k]) => [k, parseFloat(f[k].value)])); app.querySelector('#cout').innerHTML = `<div class="eyebrow">Wynik</div>` + c.out(x).map(([l, v, u]) => `<div class="calc-row"><span>${esc(l)}</span><b>${Number.isFinite(v) ? fmt(v, u === '%' ? 2 : v > 100 ? 1 : 3) + (u === '%' ? '%' : '') : '—'}</b></div>`).join(''); };
    f.addEventListener('input', draw); draw();
  }

  // Orientacja w arkuszu (odpowiednik treningu orientacji na szachownicy)
  function orientacja(app, mode) {
    const S = F().S; top('Inne', 'Orientacja w arkuszu');
    if (!['klik', 'adres'].includes(mode)) {
      app.innerHTML = head('Inne', 'Orientacja w arkuszu', 'Szybkie poruszanie się po adresach komórek to podstawa pracy w Excelu i czytania cudzych modeli. 30 sekund, jak najwięcej trafień.', `<div class="card mini-progress"><div class="k">Rekord</div><div class="v">🎯 ${S.vision || 0}</div></div>`) +
        `<div class="tile-grid">${card('#/orientacja/klik', '👆', 'Kliknij komórkę', 'Widzisz adres, np. D7. Kliknij właściwą komórkę.')}${card('#/orientacja/adres', '🔤', 'Podaj adres', 'Podświetlona komórka: wybierz jej adres.')}</div>`;
      return;
    }
    const C = 8, R = 12, L = i => String.fromCharCode(65 + i);
    let score = 0, target, t0 = Date.now(), over = false;
    app.innerHTML = head('Orientacja w arkuszu', mode === 'klik' ? 'Kliknij komórkę' : 'Podaj adres') + `<section class="card"><div class="round-bar"><span class="big" id="vs">0</span><span class="muted small">trafień</span><span class="target" id="vt"></span><span class="timer" id="vc"></span></div><div class="vgrid-wrap"><table class="vgrid"><thead><tr><th></th>${[...Array(C)].map((_, i) => `<th>${L(i)}</th>`).join('')}</tr></thead><tbody>${[...Array(R)].map((_, r) => `<tr><th>${r + 1}</th>${[...Array(C)].map((_, c) => `<td data-a="${L(c)}${r + 1}"></td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="answers" id="vo"></div></section>`;
    const pick = () => `${L(Math.floor(Math.random() * C))}${1 + Math.floor(Math.random() * R)}`;
    const nextT = () => {
      target = pick(); app.querySelectorAll('.vgrid td').forEach(td => td.className = '');
      if (mode === 'klik') app.querySelector('#vt').textContent = target;
      else {
        app.querySelector(`td[data-a="${target}"]`).className = 'hl';
        const opts = new Set([target]); while (opts.size < 4) { const c = target.charCodeAt(0) - 65 + Math.round((Math.random() - 0.5) * 4), r = +target.slice(1) + Math.round((Math.random() - 0.5) * 4); if (c >= 0 && c < C && r >= 1 && r <= R) opts.add(L(c) + r); }
        app.querySelector('#vo').innerHTML = [...opts].sort(() => Math.random() - 0.5).map(o => `<button type="button" data-o="${o}">${o}</button>`).join('');
      }
    };
    const hit = a => { if (over) return; const ok = a === target; if (ok) score++; app.querySelector('#vs').textContent = score; const td = app.querySelector(`td[data-a="${a}"]`); if (td && !ok) { td.className = 'miss'; } nextT(); };
    app.querySelector('.vgrid').addEventListener('click', e => { const td = e.target.closest('td'); if (td && mode === 'klik') hit(td.dataset.a); });
    app.querySelector('#vo').addEventListener('click', e => { const b = e.target.closest('[data-o]'); if (b) hit(b.dataset.o); });
    const iv = setInterval(() => {
      const el = app.querySelector('#vc'); if (!el) return clearInterval(iv);
      const left = Math.max(0, 30 - Math.floor((Date.now() - t0) / 1000)); el.textContent = `⏱ ${left} s`;
      if (!left) { over = true; clearInterval(iv); const rec = score > (S.vision || 0); S.vision = Math.max(score, S.vision || 0); F().record({ mode: 'Orientacja w arkuszu', title: mode === 'klik' ? 'Kliknij komórkę' : 'Podaj adres', ok: true, score }); F().save();
        app.querySelector('.card').insertAdjacentHTML('beforeend', `<div class="end"><b>${rec ? '🏆 Nowy rekord: ' : 'Wynik: '}${score}</b><div class="actions"><a class="btn primary" href="#/orientacja">Jeszcze raz</a></div></div>`); }
    }, 200);
    nextT();
  }

  return { graj, trener, warianty, statystyki, historia, tematy, rush, pojedynek, otwarcia, slownik, kursy, recenzja, koncowki, cwicz, plan, klasa, ogladaj, arena, osiagniecia, kolekcje, baza, standardy, narzedzia, orientacja };
})();
