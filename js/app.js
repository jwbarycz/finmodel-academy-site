// FinModel Academy — routing, stan użytkownika (localStorage), widoki.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  // ---------- konta (lokalne, do czasu backendu) i stan ----------
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
  const fresh = () => ({ name: '', path: null, level: null, rating: 1000, ratingHist: [], attempts: 0, solved: 0, streak: 0, best: 0, last: null, days: {}, lessons: {}, recent: [], daily: {}, current: null, cases: [],
    history: [], favs: [], rush: {}, games: [], gameRating: 1000, battles: [], battleRating: 1000, vision: 0, arena: {}, bestReview: 0, tutorQs: 0, ctx: null, topicStats: {} });
  let accounts = load('fma_accounts', {}), user = load('fma_session', null), S = fresh();
  if (user && !accounts[user]) user = null;
  const loadState = () => { S = { ...fresh(), ...load('fma_state:' + user, {}) }; };
  if (user) loadState();
  const save = () => { if (user) store('fma_state:' + user, S); };
  async function hashPw(pw, salt) {
    const enc = new TextEncoder(), key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 150000, hash: 'SHA-256' }, key, 256);
    return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const signIn = login => { user = login; store('fma_session', login); loadState(); };
  const signOut = () => { user = null; S = fresh(); store('fma_session', null); location.hash = '#/'; route(); };

  const allLessons = () => Course.flatMap(m => m.lessons);
  const doneCount = () => allLessons().filter(l => S.lessons[l.id]).length;
  const courseDone = () => allLessons().every(l => S.lessons[l.id]);
  const nextLesson = () => allLessons().find(l => !S.lessons[l.id]);
  const moduleOf = id => Course.find(m => m.lessons.some(l => l.id === id));
  const lekcje = n => n === 1 ? 'lekcja' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'lekcje' : 'lekcji';
  const dayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => dayStr();
  const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayStr(d); };
  const liveStreak = () => (S.last === today() || S.last === yesterday()) ? S.streak : 0;
  function bumpStreak() {
    const t = today(); S.days[t] = (S.days[t] || 0) + 1;
    if (S.last !== t) { S.streak = S.last === yesterday() ? S.streak + 1 : 1; S.last = t; S.best = Math.max(S.best, S.streak); toast(`🔥 Seria: ${S.streak} ${S.streak === 1 ? 'dzień' : 'dni'}`); }
    save(); renderNav();
  }
  const elo = (ur, pr, score, k = 32) => Math.round(k * (score - 1 / (1 + Math.pow(10, (pr - ur) / 400))));
  const pct = (a, b) => b ? (a / b * 100).toFixed(1) : 0;
  const bar = (a, b) => `<div class="progress"><i style="width:${pct(a, b)}%"></i></div>`;

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.classList.add('out'), 2200); setTimeout(() => t.remove(), 2700);
  }

  // ---------- motyw ----------
  const root = document.documentElement;
  const setTheme = t => { root.classList.remove('light', 'dark'); root.classList.add(t); root.dataset.theme = t; try { localStorage.setItem('fma_theme', t); } catch { } };
  let theme; try { theme = localStorage.getItem('fma_theme'); } catch { }
  setTheme(theme || root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#theme').addEventListener('click', () => setTheme(root.classList.contains('dark') ? 'light' : 'dark'));
  $('#logout').addEventListener('click', signOut);

  // ---------- pasek boczny i górny ----------
  const closeMenu = () => document.body.classList.remove('nav-open');
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  $('#scrim').addEventListener('click', closeMenu);
  const setTop = html => { $('#crumbs').innerHTML = html; };
  // linki wewnątrz strony (np. do pytań w lekcji) przewijają bez zmiany trasy
  // klik w link do bieżącej strony (np. „Rewanż”, „Jeszcze raz”) uruchamia ją od nowa
  document.addEventListener('click', e => { const a = e.target.closest('a[href^="#/"]'); if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); route(); } });
  app.addEventListener('click', e => { const a = e.target.closest('a[data-jump]'); if (a) { e.preventDefault(); $(a.dataset.jump)?.scrollIntoView({ behavior: 'smooth' }); } });

  // menu jak na chess.com: Graj, Zadania, Ucz się, Trenuj, Oglądaj, Społeczność, Inne
  const NAV = [
    ['Start', [['home', '#/', '⌂', 'Pulpit']]],
    ['Graj', [['graj', '#/graj', '🤖', 'Graj z botem'], ['trener', '#/trener', '🧠', 'Trener AI'], ['warianty', '#/warianty', '🎲', 'Warianty'], ['statystyki', '#/statystyki', '📈', 'Statystyki'], ['historia', '#/historia', '🕘', 'Historia']]],
    ['Zadania', [['zadania', '#/zadania', '♟', 'Zadania z rankingiem'], ['dzienne', '#/zadania/dzienne', '★', 'Zadanie dnia'], ['tematy', '#/tematy', '🏷', 'Zadania tematyczne'], ['rush', '#/rush', '⚡', 'Model Rush'], ['pojedynek', '#/pojedynek', '⚔️', 'Pojedynek']]],
    ['Ucz się', [['kurs', '#/kurs', '▤', 'Lekcje'], ['otwarcia', '#/otwarcia', '♞', 'Drivery branżowe'], ['slownik', '#/slownik', '📖', 'Słownik pojęć']]],
    ['Trenuj', [['kursy', '#/kursy', '🗺', 'Kursy'], ['recenzja', '#/recenzja', '🔍', 'Recenzja modelu'], ['koncowki', '#/koncowki', '🏁', 'Końcówki'], ['cwicz', '#/cwicz', '✏️', 'Ćwicz od pozycji'], ['case', '#/case', '▦', 'Case studies'], ['plan', '#/plan', '🎯', 'Plan treningowy'], ['klasa', '#/klasa', '🏫', 'Klasa']]],
    ['Oglądaj', [['ogladaj', '#/ogladaj', '📺', 'Rozbiory wycen']]],
    ['Społeczność', [['ranking', '#/ranking', '⚑', 'Ranking'], ['arena', '#/arena', '🏟', 'Arena tygodnia'], ['osiagniecia', '#/osiagniecia', '🏅', 'Osiągnięcia']]],
    ['Inne', [['kolekcje', '#/kolekcje', '☆', 'Kolekcje'], ['baza', '#/baza', '🗄', 'Baza zadań'], ['standardy', '#/standardy', '📋', 'Standardy Funduszu'], ['narzedzia', '#/narzedzia', '🧮', 'Narzędzia'], ['orientacja', '#/orientacja', '🎯', 'Orientacja w arkuszu']]],
  ];
  let navOpen = load('fma_nav', { Start: true, Zadania: true });
  const routeKey = () => { const [, a = '', b = ''] = (location.hash || '#/').split('/'); return a === 'zadania' && b === 'dzienne' ? 'dzienne' : a || 'home'; };
  $('#links').addEventListener('click', e => {
    const h = e.target.closest('.sb-group-h'); if (!h) return;
    navOpen[h.dataset.sec] = !navOpen[h.dataset.sec]; store('fma_nav', navOpen); renderNav();
  });

  function renderNav() {
    const ready = !!(user && (S.level || S.path));
    document.body.classList.toggle('bare', !ready);
    if (!ready) return;
    const key = routeKey(), daily = S.daily[today()];
    const badges = { kurs: `${doneCount()}/${allLessons().length}`, dzienne: daily ? (daily.ok ? '✓' : '•') : 'nowe', zadania: S.rating, rush: Math.max(0, ...Object.values(S.rush)) || '', graj: S.gameRating, kolekcje: S.favs.length || '', case: S.cases.length || '' };
    $('#links').innerHTML = NAV.map(([sec, items]) => {
      const active = items.some(i => i[0] === key), open = sec === 'Start' || navOpen[sec] || active;
      return `<div class="sb-group${open ? ' open' : ''}">
        ${sec === 'Start' ? '' : `<button type="button" class="sb-group-h" data-sec="${sec}" aria-expanded="${open}"><span>${sec}</span><span class="chev">${open ? '−' : '+'}</span></button>`}
        ${open ? items.map(([k, href, ic, label]) => `<a href="${href}" class="sb-link${key === k ? ' active' : ''}"><span class="ic">${ic}</span><span>${label}</span>${badges[k] !== undefined && badges[k] !== '' ? `<span class="badge">${badges[k]}</span>` : ''}</a>`).join('') : ''}
      </div>`;
    }).join('');
    const n = nextLesson();
    $('#sbProgress').innerHTML = `<div class="sb-section">Postęp manuala</div>${bar(doneCount(), allLessons().length)}
      <div class="sb-prog-t">${doneCount()} z ${allLessons().length} lekcji${n ? ` · dalej: <a href="#/kurs/${n.id}">${esc(n.title)}</a>` : ' · ukończony 🎓'}</div>`;
    const name = S.name || user, lvl = Data.levels.find(l => l.id === S.level);
    $('#user').innerHTML = `<span class="avatar">${esc(name.trim()[0] || '?').toUpperCase()}</span><span class="sb-user-t"><b>${esc(name)}</b><span>@${esc(user)}${lvl ? ' · ' + lvl.t.toLowerCase() : ''}</span></span>`;
    $('#stats').innerHTML = `<span class="stat" title="Seria dni">🔥 ${liveStreak()}</span><span class="stat" title="Rating zadań">♟ ${S.rating}</span><span class="stat hide-s" title="Rating gry z botami">🤖 ${S.gameRating}</span><span class="stat hide-s" title="Najlepszy Model Rush">⚡ ${Math.max(0, ...Object.values(S.rush))}</span>`;
  }

  // ---------- rejestracja / logowanie ----------
  function viewAuth(mode) {
    const reg = mode === 'register';
    app.innerHTML = `<div class="auth-wrap">
      <section class="auth-hero">
        <span class="logo logo-lg" role="img" aria-label="Fundusz Hossa ProCapital"></span>
        <h1 class="page-header">FinModel Academy</h1>
        <p class="lead">Ćwicz modelowanie finansowe tak, jak wygląda ono w pracy w IB, PE i ER: DCF, WACC, analizę porównawczą, wyszukiwanie danych i budowanie założeń. Wszystko w arkuszu.</p>
        <ul class="feature-list">
          <li><span class="ic">▤</span><span><b>Manual wyceny Funduszu</b>${Course.length} modułów i ${allLessons().length} ${lekcje(allLessons().length)}, od wyboru spółki po raport i aktualizacje.</span></li>
          <li><span class="ic">♟</span><span><b>Zadania jak w szachach</b>Szukasz błędów w modelach, zdobywasz rating i utrzymujesz serię dni.</span></li>
          <li><span class="ic">▦</span><span><b>Case studies</b>Własne modele DCF i comps na danych z SEC EDGAR i GPW.</span></li>
        </ul>
      </section>
      <section class="card auth">
        <div class="seg"><a href="#/" class="${reg ? 'active' : ''}">Załóż konto</a><a href="#/logowanie" class="${reg ? '' : 'active'}">Zaloguj się</a></div>
        <form id="authForm" autocomplete="on">
          ${reg ? `<label>Imię i nazwisko lub pseudonim <span class="muted">(widoczne w rankingu)</span><input name="name" required maxlength="32" autocomplete="name"></label>` : ''}
          <label>Login<input name="login" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9._\\-]+" autocomplete="username" title="3–20 znaków: litery, cyfry, . _ -"></label>
          <label>Hasło<input name="pw" type="password" required minlength="${reg ? 8 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}"></label>
          ${reg ? `<label>Powtórz hasło<input name="pw2" type="password" required autocomplete="new-password"></label>` : ''}
          <button class="primary wide">${reg ? 'Załóż konto' : 'Zaloguj się'}</button>
          <span class="msg" aria-live="polite"></span>
        </form>
        <p class="muted small">Wersja testowa: konto jest zapisane tylko w tej przeglądarce, a hasło jako skrót PBKDF2. Docelowo logowanie przejdzie na serwer Funduszu.</p>
      </section>
    </div>`;
    const f = $('#authForm'), msg = $('.msg', f);
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const login = f.login.value.trim().toLowerCase(), pw = f.pw.value;
      if (reg) {
        if (accounts[login]) { msg.textContent = 'Ten login jest już zajęty.'; return; }
        if (pw !== f.pw2.value) { msg.textContent = 'Hasła się różnią.'; return; }
        const salt = crypto.getRandomValues(new Uint32Array(4)).join('-');
        accounts[login] = { name: f.name.value.trim(), salt, hash: await hashPw(pw, salt), created: Date.now() };
        store('fma_accounts', accounts); signIn(login); S.name = accounts[login].name; save();
      } else {
        const a = accounts[login];
        if (!a || a.hash !== await hashPw(pw, a.salt)) { msg.textContent = 'Nieprawidłowy login lub hasło.'; return; }
        signIn(login);
      }
      location.hash = '#/'; route();
    });
  }

  // ---------- wybór poziomu (jak na chess.com) ----------
  function viewOnboarding() {
    app.innerHTML = `<div class="onb">
      <span class="logo logo-lg" role="img" aria-label="Fundusz Hossa ProCapital"></span>
      <h1 class="page-header">Cześć, ${esc(S.name || user)}!</h1>
      <p class="lead">Jak oceniasz swoje umiejętności w wycenie i modelowaniu? Na tej podstawie dobierzemy początkowy rating, zadania i boty. Rating i tak dopasuje się do Twoich wyników.</p>
      <div class="levels">
        ${Data.levels.map(l => `<button class="card level-card" data-lvl="${l.id}"><span class="lvl-t">${esc(l.t)}</span><span class="path-d">${esc(l.d)}</span><span class="chip">start ♟ ${l.rating}</span></button>`).join('')}
      </div>
    </div>`;
    app.querySelectorAll('.level-card').forEach(b => b.addEventListener('click', () => {
      const l = Data.levels.find(x => x.id === b.dataset.lvl);
      Object.assign(S, { level: l.id, rating: l.rating, gameRating: l.rating, battleRating: l.rating, onboarded: Date.now() }); save();
      location.hash = '#/'; route();
    }));
  }

  // ---------- pulpit ----------
  function viewHome() {
    const total = allLessons().length, done = doneCount(), n = nextLesson(), m = n && moduleOf(n.id);
    const daily = S.daily[today()];
    const days = [...Array(35)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 34 + i); return S.days[dayStr(d)] || 0; });
    setTop('<span>Pulpit</span>');
    const tiles = [['#/graj', '🤖', 'Graj z botem', 'Zbuduj pełny mini-DCF na czas i pokonaj bota.'], ['#/rush', '⚡', 'Model Rush', '3 minuty szybkich obliczeń: FCFF, WACC, TV, mnożniki.'],
      ['#/pojedynek', '⚔️', 'Pojedynek', 'Rush 1 na 1 z innym analitykiem.'], ['#/trener', '🧠', 'Trener AI', 'Zapytaj o dowolny krok wyceny.'],
      ['#/arena', '🏟', 'Arena tygodnia', '8 zadań tygodnia, jedna próba, tabela wyników.'], ['#/plan', '🎯', 'Plan treningowy', 'Twoje słabe strony i co ćwiczyć dalej.']];
    app.innerHTML = `
      <div class="page-head"><h1 class="page-header">${S.history.length || done ? 'Witaj ponownie' : 'Witaj'}, ${esc((S.name || user).split(' ')[0])}</h1>
        <p class="lead">Graj, rozwiązuj zadania, ucz się i trenuj wycenę tak jak w Funduszu.</p></div>
      <div class="dash">
        <section class="card hero-card">
          <div class="eyebrow">${n ? 'Kontynuuj naukę' : 'Lekcje'}</div>
          ${n ? `<h2 class="card-title">${esc(n.title)}</h2><p class="muted">Moduł ${Course.indexOf(m) + 1}: ${esc(m.title)}</p>`
            : `<h2 class="card-title">Manual ukończony 🎓</h2><p class="muted">Wracaj do lekcji, kiedy chcesz odświeżyć standardy Funduszu.</p>`}
          ${bar(done, total)}
          <div class="row-between"><span class="muted small">${done} z ${total} lekcji · ${pct(done, total)}%</span>
            <a class="btn primary" href="#/kurs${n ? '/' + n.id : ''}">${n ? (done ? 'Kontynuuj' : 'Zacznij') + ' →' : 'Otwórz lekcje'}</a></div>
        </section>
        <section class="card daily-card">
          <div class="eyebrow">Zadanie dnia</div>
          <h2 class="card-title">${daily ? (daily.ok ? 'Rozwiązane ✓' : 'Podjęte') : 'Czeka na Ciebie'}</h2>
          <p class="muted">Jedno zadanie w arkuszu dziennie podtrzymuje serię.</p>
          <a class="btn" href="#/zadania/dzienne">${daily ? 'Zobacz' : 'Rozwiąż'} →</a>
        </section>
      </div>
      <div class="stat-row">
        <div class="card stat-card"><div class="k">Seria</div><div class="v">🔥 ${liveStreak()}</div><div class="s">najdłuższa: ${S.best}</div></div>
        <div class="card stat-card"><div class="k">Zadania</div><div class="v">♟ ${S.rating}</div><div class="s">${S.solved}/${S.attempts} rozwiązanych</div></div>
        <div class="card stat-card"><div class="k">Gra z botami</div><div class="v">🤖 ${S.gameRating}</div><div class="s">${S.games.filter(g => g.res === 'w').length} wygranych</div></div>
        <div class="card stat-card"><div class="k">Model Rush</div><div class="v">⚡ ${Math.max(0, ...Object.values(S.rush))}</div><div class="s">najlepszy wynik</div></div>
      </div>
      <div class="tile-grid">${tiles.map(([h, ic, t, d]) => `<a class="card quick-card" href="${h}"><span class="ic-lg">${ic}</span><span><b>${t}</b><span class="muted small">${d}</span></span></a>`).join('')}</div>
      <section class="card">
        <div class="eyebrow">Aktywność · ostatnie 5 tygodni</div>
        <div class="heat">${days.map(v => `<i class="l${Math.min(v, 3)}"></i>`).join('')}</div>
        <div class="heat-legend muted small"><span>mniej</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><span>więcej</span></div>
      </section>`;
  }

  // ---------- zadania (puzzle) ----------
  // wspólny moduł zadania w arkuszu; warianty: blind (tylko formuły), noHelp (bez podpowiedzi, jedno sprawdzenie), timeLimit (sekundy)
  function mountPuzzle(container, puzzle, opts = {}) {
    const book = new Sheet.Book(JSON.parse(JSON.stringify(puzzle.cells)));
    const fav = () => S.favs.some(f => f.id === puzzle.id && f.seed === puzzle.seed);
    container.innerHTML = `
      <p class="brief">${esc(puzzle.brief)}</p>
      <div class="sheet-host"></div>
      <div class="actions">
        <button class="primary" data-act="check">Sprawdź</button>
        ${opts.noHelp ? '' : '<button data-act="hint">Podpowiedź</button><button data-act="solve">Pokaż rozwiązanie</button>'}
        <button data-act="reset">Od nowa</button>
        <button data-act="fav" title="Zapisz w kolekcji">${fav() ? '★ W kolekcji' : '☆ Zapisz'}</button>
        <button data-act="ask" title="Zapytaj trenera AI o to zadanie">🧠 Trener</button>
        ${opts.timeLimit ? '<span class="timer" aria-live="polite"></span>' : ''}
        ${opts.nextLabel ? `<button data-act="next" class="push">${opts.nextLabel}</button>` : ''}
        <span class="msg" aria-live="polite"></span>
      </div>
      <div class="result"></div>
      <details class="keys"><summary>Skróty klawiszowe arkusza</summary><p><kbd>Enter</kbd>/<kbd>F2</kbd> edycja · <kbd>Ctrl/Cmd+C</kbd> <kbd>Ctrl/Cmd+V</kbd> kopiuj/wklej z przesunięciem adresów · <kbd>Shift</kbd>+strzałki zaznaczenie · <kbd>Ctrl/Cmd+\`</kbd> pokaż formuły · podczas pisania formuły klik w komórkę wstawia adres.</p></details>`;
    let bad = new Set(), revealed = false, over = false, checks = 0;
    const view = new Sheet.View($('.sheet-host', container), book, {
      widths: puzzle.widths, start: puzzle.kind === 'build' ? Object.keys(puzzle.fix)[0] : 'B3',
      mark: a => [bad.has(a) ? 'bad' : '', revealed && puzzle.fix[a] ? 'fixed' : ''].join(' ').trim(),
      onChange: () => { bad = new Set(); },
      onMessage: m => { $('.msg', container).textContent = m; },
    });
    if (opts.blind) { view.toggleFormulas(); $('.fx-toggle', container).hidden = true; container.classList.add('blind'); }
    const res = $('.result', container), msg = $('.msg', container);
    const end = () => { over = true; clearInterval(timer); container.querySelectorAll('[data-act=check],[data-act=hint],[data-act=solve]').forEach(b => { b.disabled = true; }); };
    let timer;
    if (opts.timeLimit) {
      const t0 = Date.now(), el = $('.timer', container);
      const tick = () => {
        const left = Math.max(0, opts.timeLimit - Math.floor((Date.now() - t0) / 1000));
        el.textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; el.classList.toggle('low', left <= 15);
        if (!document.body.contains(container)) clearInterval(timer);
        else if (left === 0 && !over) { end(); res.innerHTML = `<div class="note bad"><b>Koniec czasu.</b> ${esc(puzzle.expl)}</div>`; opts.onResult?.(false, { timeout: true }); }
      };
      timer = setInterval(tick, 250); tick();
    }
    container.onclick = e => {
      const act = e.target.closest('[data-act]')?.dataset.act; if (!act) return;
      if (act === 'check' && !over) {
        const r = Puzzles.check(puzzle, book); checks++;
        bad = new Set([...r.problems, ...r.hard]); view.refresh();
        if (r.ok) res.innerHTML = `<div class="note ok"><b>Dobrze!</b> ${esc(puzzle.expl)}</div>`;
        else res.innerHTML = `<div class="note bad"><b>Jeszcze nie.</b> ${r.hard.length ? `W ${r.hard.join(', ')} oczekujemy formuły odwołującej się do komórek, a nie wpisanej liczby. ` : ''}${r.problems.length ? `Nie zgadzają się komórki kontrolne: ${r.problems.join(', ')}.` : ''}</div>`;
        if (r.ok || opts.noHelp) { end(); if (opts.noHelp && !r.ok) res.innerHTML += `<div class="note">${esc(puzzle.expl)}</div>`; }
        opts.onResult?.(r.ok, { hinted: !!res.dataset.hinted, checks });
      }
      if (act === 'hint') { res.dataset.hinted = 1; msg.textContent = ''; res.innerHTML = `<div class="note">💡 ${esc(puzzle.hint)}</div>`; opts.onHint?.(); }
      if (act === 'solve') {
        for (const [a, v] of Object.entries(puzzle.fix)) book.set(a, v);
        revealed = true; bad = new Set(); view.select(view.sel); end();
        res.innerHTML = `<div class="note"><b>Rozwiązanie</b> (zielone komórki): ${Object.entries(puzzle.fix).map(([a, v]) => `<code>${a}: ${esc(v)}</code>`).join(' ')}<br>${esc(puzzle.expl)}</div>`;
        opts.onResult?.(false, { revealed: true });
      }
      if (act === 'reset') { clearInterval(timer); mountPuzzle(container, puzzle, opts); }
      if (act === 'fav') {
        if (fav()) S.favs = S.favs.filter(f => !(f.id === puzzle.id && f.seed === puzzle.seed));
        else S.favs.unshift({ id: puzzle.id, seed: puzzle.seed, title: puzzle.title, topic: puzzle.topic, t: Date.now() });
        save(); e.target.closest('button').textContent = fav() ? '★ W kolekcji' : '☆ Zapisz'; renderNav();
      }
      if (act === 'ask') {
        S.ctx = { label: `Zadanie: ${puzzle.title}`, text: `Uczeń rozwiązuje zadanie „${puzzle.title}” (${puzzle.topic}, ${puzzle.kind === 'fix' ? 'znajdź błąd' : 'zbuduj formuły'}). Treść: ${puzzle.brief} Podpowiedź z platformy: ${puzzle.hint}` };
        save(); location.hash = '#/trener';
      }
      if (act === 'next') { clearInterval(timer); opts.onNext?.(); }
    };
    return { book, view };
  }

  // zapis do historii (ostatnie 300 prób)
  function record(e) {
    S.history.unshift({ t: Date.now(), ...e }); S.history = S.history.slice(0, 300);
    if (e.topic) { const ts = S.topicStats[e.topic] ||= { n: 0, ok: 0 }; ts.n++; if (e.ok) ts.ok++; }
    save();
  }

  function viewPuzzles(mode, date) {
    const daily = mode === 'dzienne', day = date || today(), archive = daily && day !== today();
    let p;
    if (daily) p = Puzzles.daily(day);
    else {
      if (!S.current) { const n = Puzzles.next(S.rating, S.recent, S.topic); S.current = { id: n.id, seed: n.seed, rated: false }; save(); }
      p = Puzzles.instantiate(S.current.id, S.current.seed);
    }
    const ratedAlready = daily ? (archive || !!S.daily[day]) : S.current.rated;
    const strip = daily ? [...Array(14)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); const k = dayStr(d); return `<a href="#/zadania/dzienne/${k}" class="day${k === day ? ' active' : ''}${S.daily[k]?.ok ? ' ok' : ''}" title="${k}">${d.getDate()}</a>`; }).join('') : '';
    setTop(`<span>Zadania</span><span class="sep">/</span><span>${daily ? 'Zadanie dnia' : 'Zadania z rankingiem'}</span>`);
    app.innerHTML = `
      <div class="page-head row-between">
        <div><div class="eyebrow">${daily ? 'Zadanie dnia · ' + new Date(day).toLocaleDateString('pl-PL') : 'Zadania z rankingiem'}</div>
          <h1 class="page-header">${esc(p.title)}</h1>
          <div class="chips"><span class="chip">${esc(p.topic)}</span><span class="chip">${p.kind === 'fix' ? 'znajdź błąd' : 'zbuduj'}</span><span class="chip">♟ ${p.rating}</span>${ratedAlready ? '<span class="chip">bez wpływu na rating</span>' : ''}</div></div>
        <div class="pz-side">
          <div class="mini-stat"><span class="k">Twój rating</span><span class="v">${S.rating}</span></div>
          ${daily ? '' : `<label class="topic">Temat<select id="topic"><option value="">wszystkie</option>${Puzzles.topics.map(t => `<option ${S.topic === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`}
        </div>
      </div>
      ${daily ? `<div class="day-strip">${strip}</div>` : ''}
      <section class="card work-card" id="pz"></section>`;
    let hinted = false;
    const finish = (ok, info) => {
      if (daily) {
        if (archive) { record({ mode: 'Archiwum zadań dnia', id: p.id, seed: p.seed, title: p.title, topic: p.topic, ok }); return; }
        if (!S.daily[day]) { S.daily[day] = { ok }; const d = applyRating(p, ok, hinted); record({ mode: 'Zadanie dnia', id: p.id, seed: p.seed, title: p.title, topic: p.topic, ok, delta: d }); if (ok) bumpStreak(); }
        else if (ok && !S.daily[day].ok) { S.daily[day].ok = true; bumpStreak(); }
        save(); renderNav(); return;
      }
      if (!S.current.rated) { S.current.rated = true; const d = applyRating(p, ok && !info.revealed, hinted); record({ mode: 'Zadania z rankingiem', id: p.id, seed: p.seed, title: p.title, topic: p.topic, ok: ok && !info.revealed, delta: d }); }
      if (ok && !S.current.solvedOnce) { S.current.solvedOnce = true; bumpStreak(); }
      save();
    };
    mountPuzzle($('#pz'), p, {
      nextLabel: daily ? '' : 'Następne zadanie →',
      onHint: () => { hinted = true; },
      onResult: finish,
      onNext: () => { S.recent = [...S.recent, p.id].slice(-8); S.current = null; save(); viewPuzzles(); },
    });
    $('#topic')?.addEventListener('change', e => { S.topic = e.target.value || null; S.current = null; save(); viewPuzzles(); });
  }
  function applyRating(p, ok, hinted) {
    let d = elo(S.rating, p.rating, ok ? 1 : 0); if (ok && hinted) d = Math.round(d / 2);
    S.rating = Math.max(100, S.rating + d); S.attempts++; if (ok) S.solved++;
    S.ratingHist.push({ t: Date.now(), r: S.rating }); S.ratingHist = S.ratingHist.slice(-300);
    toast(`${ok ? '✓' : '✗'} Rating ${d >= 0 ? '+' : ''}${d} → ${S.rating}`); renderNav();
    return d;
  }

  // ---------- kurs ----------
  function viewCourse() {
    const n = nextLesson();
    setTop('<span>Manual wyceny</span>');
    app.innerHTML = `
      <div class="page-head row-between">
        <div><h1 class="page-header">Manual wyceny</h1>
          <p class="lead">Tworzenie wyceny według standardów Funduszu: ${Course.length} modułów i ${allLessons().length} ${lekcje(allLessons().length)}, od wyboru spółki po raport i aktualizacje. Każda lekcja kończy się pytaniami, a większość także ćwiczeniem w arkuszu.</p></div>
        <div class="card mini-progress"><div class="k">Ukończono</div><div class="v">${doneCount()}/${allLessons().length}</div>${bar(doneCount(), allLessons().length)}
          ${n ? `<a class="btn primary" href="#/kurs/${n.id}">Kontynuuj →</a>` : ''}</div>
      </div>
      <div class="modules">
      ${Course.map((m, i) => {
        const d = m.lessons.filter(l => S.lessons[l.id]).length, full = d === m.lessons.length;
        return `<section class="card module${full ? ' done' : ''}">
          <header class="module-head"><span class="num">${full ? '✓' : i + 1}</span>
            <div class="module-t"><h2>${esc(m.title)}</h2><span class="muted small">${d}/${m.lessons.length} ${lekcje(m.lessons.length)}</span></div>
            <div class="module-bar">${bar(d, m.lessons.length)}</div></header>
          <ol class="lesson-list">${m.lessons.map(l => `<li><a class="lrow${S.lessons[l.id] ? ' done' : ''}${n === l ? ' next' : ''}" href="#/kurs/${l.id}">
            <span class="st">${S.lessons[l.id] ? '✓' : n === l ? '→' : '○'}</span><span class="lt">${esc(l.title)}</span>
            ${l.exercise ? '<span class="chip">arkusz</span>' : ''}<span class="go">›</span></a></li>`).join('')}</ol>
        </section>`;
      }).join('')}
      </div>`;
  }
  function viewLesson(id) {
    const all = Course.flatMap(m => m.lessons.map(l => ({ ...l, module: m })));
    const idx = all.findIndex(l => l.id === id); const L = all[idx]; if (!L) return viewCourse();
    const mi = Course.indexOf(L.module), prev = all[idx - 1], next = all[idx + 1];
    const quizOk = new Array(L.quiz.length).fill(false); let exOk = !L.exercise;
    setTop(`<a href="#/kurs">Manual wyceny</a><span class="sep">/</span><span>Moduł ${mi + 1}</span><span class="sep">/</span><span>${esc(L.title)}</span>`);
    app.innerHTML = `
      <div class="lesson-layout">
        <div class="lesson-main">
          <div class="eyebrow">Moduł ${mi + 1} · ${esc(L.module.title)} · lekcja ${idx + 1} z ${all.length}</div>
          <h1 class="page-header">${esc(L.title)}</h1>
          <article class="prose">${L.body}</article>
          ${L.src ? `<p class="src">Na podstawie: ${esc(L.src)}</p>` : ''}
          <h2 id="quiz">Sprawdź się</h2>
          ${L.quiz.map((q, qi) => `<fieldset class="quiz card" data-q="${qi}"><legend>${esc(q.q)}</legend>
            ${q.options.map((o, oi) => `<label class="opt"><input type="radio" name="q${qi}" value="${oi}"><span>${esc(o)}</span></label>`).join('')}
            <div class="qres"></div></fieldset>`).join('')}
          ${L.exercise ? `<h2 id="cwiczenie">Ćwiczenie w arkuszu</h2><section class="card work-card" id="ex"></section>` : ''}
          <nav class="pager">
            ${prev ? `<a class="card pager-card" href="#/kurs/${prev.id}"><span class="muted small">← Poprzednia</span><b>${esc(prev.title)}</b></a>` : '<span></span>'}
            ${next ? `<a class="card pager-card right" href="#/kurs/${next.id}"><span class="muted small">Następna →</span><b>${esc(next.title)}</b></a>`
              : `<a class="card pager-card right" href="#/zadania"><span class="muted small">Koniec manuala →</span><b>Przejdź do zadań</b></a>`}
          </nav>
        </div>
        <aside class="lesson-aside">
          <section class="card">
            <div class="eyebrow">Status lekcji</div>
            <div id="lstatus"></div>
          </section>
          <a class="btn" href="#/trener" id="askLesson">🧠 Zapytaj trenera o tę lekcję</a>
          <section class="card">
            <div class="eyebrow">Moduł ${mi + 1}</div>
            <b class="aside-t">${esc(L.module.title)}</b>
            <ol class="aside-list">${L.module.lessons.map(l => `<li><a href="#/kurs/${l.id}" class="${l.id === id ? 'current' : ''}${S.lessons[l.id] ? ' done' : ''}"><span class="st">${S.lessons[l.id] ? '✓' : l.id === id ? '●' : '○'}</span>${esc(l.title)}</a></li>`).join('')}</ol>
          </section>
        </aside>
      </div>`;
    const status = () => {
      const done = S.lessons[id], left = quizOk.filter(x => !x).length;
      $('#lstatus').innerHTML = `<ul class="checks">
        <li class="${done || !left ? 'ok' : ''}"><span>${done || !left ? '✓' : '○'}</span><a href="#" data-jump="#quiz">Pytania ${done ? L.quiz.length : L.quiz.length - left}/${L.quiz.length}</a></li>
        ${L.exercise ? `<li class="${done || exOk ? 'ok' : ''}"><span>${done || exOk ? '✓' : '○'}</span><a href="#" data-jump="#cwiczenie">Ćwiczenie w arkuszu</a></li>` : ''}
      </ul>${done ? '<span class="chip ok">lekcja ukończona</span>' : '<span class="muted small">Ukończ wszystkie elementy, żeby zaliczyć lekcję.</span>'}`;
      if (quizOk.every(Boolean) && exOk && !S.lessons[id]) {
        S.lessons[id] = Date.now(); save(); bumpStreak();
        toast(courseDone() ? '🎓 Manual ukończony!' : '🎓 Lekcja ukończona');
        renderNav(); status();
      }
    };
    app.querySelectorAll('.quiz').forEach(fs => fs.addEventListener('change', e => {
      const qi = +fs.dataset.q, q = L.quiz[qi], ok = +e.target.value === q.answer;
      quizOk[qi] = quizOk[qi] || ok;
      $('.qres', fs).innerHTML = `<div class="note ${ok ? 'ok' : 'bad'}">${ok ? '✓ ' + esc(q.expl) : '✗ Spróbuj jeszcze raz.'}</div>`;
      status();
    }));
    $('#askLesson').addEventListener('click', () => { S.ctx = { label: `Lekcja: ${L.title}`, text: `Uczeń czyta lekcję „${L.title}” z modułu „${L.module.title}”. Treść lekcji: ${L.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3500)}` }; save(); });
    if (L.exercise) mountPuzzle($('#ex'), Puzzles.instantiate(L.exercise, Puzzles.hash(id)), { onResult: ok => { if (ok) { exOk = true; status(); } } });
    status();
  }

  // ---------- ranking ----------
  function viewRanking(tab = 'rating') {
    const rng = Puzzles.rngFrom(42);
    const names = ['Kasia W.', 'Michał K.', 'Ola P.', 'Bartek Z.', 'Zuza M.', 'Kuba D.', 'Natalia R.', 'Piotr S.', 'Ania L.', 'Tomek G.'];
    const rows = names.map(n => ({ n, rating: 820 + Math.round(rng() * 700), streak: Math.round(rng() * 40), solved: Math.round(rng() * 300), rush: Math.round(rng() * 30), game: 800 + Math.round(rng() * 700) }));
    rows.push({ n: S.name ? `${S.name} (Ty)` : 'Ty', rating: S.rating, streak: liveStreak(), solved: S.solved, rush: Math.max(0, ...Object.values(S.rush)), game: S.gameRating, me: true });
    rows.sort((a, b) => b[tab] - a[tab]);
    const pos = rows.findIndex(r => r.me) + 1;
    setTop('<span>Społeczność</span><span class="sep">/</span><span>Ranking</span>');
    app.innerHTML = `
      <div class="page-head row-between">
        <div><h1 class="page-header">Ranking</h1>
          <p class="lead">Ranking członków Funduszu. <span class="muted">W wersji testowej pozostali uczestnicy są fikcyjni: prawdziwy ranking wymaga backendu z kontami.</span></p></div>
        <div class="card mini-progress"><div class="k">Twoje miejsce</div><div class="v">${pos} / ${rows.length}</div></div>
      </div>
      <div class="seg">${[['rating', 'Zadania'], ['game', 'Gra z botami'], ['rush', 'Model Rush'], ['streak', 'Seria'], ['solved', 'Rozwiązane']].map(([k, l]) => `<a href="#/ranking/${k}" class="${tab === k ? 'active' : ''}">${l}</a>`).join('')}</div>
      <section class="card table-card"><div class="table-container"><table class="rank"><thead><tr><th>#</th><th>Uczestnik</th><th>Zadania</th><th>Gra</th><th>Rush</th><th>Seria</th><th>Rozwiązane</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.n)}</td><td>${r.rating}</td><td>${r.game}</td><td>${r.rush}</td><td>🔥 ${r.streak}</td><td>${r.solved}</td></tr>`).join('')}
      </tbody></table></div></section>`;
  }

  // ---------- case studies ----------
  // Import danych wymaga lokalnego serwera (server.py); w wersji online endpointów /api nie ma.
  async function api(url) {
    try {
      const r = await fetch(url);
      if (!(r.headers.get('content-type') || '').includes('json')) throw new Error('brak API');
      return await r.json();
    } catch {
      return { error: 'Automatyczny import danych działa tylko po uruchomieniu lokalnym (python3 server.py). W wersji online wpisz dane ręcznie albo wybierz spółkę demo.' };
    }
  }
  function viewCases() {
    setTop('<span>Praktyka</span><span class="sep">/</span><span>Case studies</span>');
    app.innerHTML = `
      <div class="page-head"><h1 class="page-header">Case studies</h1>
        <p class="lead">Tryb „singleplayer”: prywatny model na prawdziwych danych. Arkusz ma gotową strukturę DCF, WACC, comps i tabelę wrażliwości. Założenia i uzasadnienia są Twoje.</p></div>
      <div class="case-grid">
        <section class="card">
          <div class="eyebrow">Nowy model</div>
          <form id="newCase" class="newcase">
            <label>Rynek<select name="market"><option value="US">USA: dane z SEC EDGAR</option><option value="GPW">GPW: dane z raportu wpisujesz sam</option><option value="DEMO">Demo: fikcyjna spółka</option></select></label>
            <label>Ticker<input name="ticker" placeholder="np. AAPL / PKN" maxlength="12"></label>
            <label>Nazwa <span class="muted">(opcjonalnie)</span><input name="name" maxlength="60"></label>
            <button class="primary wide">Utwórz model</button> <span class="msg"></span>
          </form>
        </section>
        <section class="cases">
          <div class="eyebrow">Twoje modele</div>
          ${S.cases.length ? S.cases.map(c => `<a class="card case-card" href="#/case/${c.id}"><span class="ic-lg">▦</span><span class="case-t"><b>${esc(c.name)}</b><span class="muted small">${esc(c.market)} · zmieniony ${new Date(c.updated).toLocaleDateString('pl-PL')}</span></span><span class="go">›</span></a>`).join('')
            : '<div class="card empty"><b>Nie masz jeszcze modeli</b><span class="muted small">Zacznij od spółki demo: wybierz „Demo” i kliknij „Utwórz model”.</span></div>'}
        </section>
      </div>`;
    const form = $('#newCase'), msg = $('.msg', form);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const market = form.market.value, ticker = form.ticker.value.trim().toUpperCase(), name = form.name.value.trim();
      let d;
      try {
        if (market === 'DEMO') d = { ...Cases.DEMO };
        else {
          if (!ticker) { msg.textContent = 'Podaj ticker.'; return; }
          msg.textContent = 'Pobieram dane…';
          if (market === 'US') {
            const r = await api(`/api/sec?ticker=${encodeURIComponent(ticker)}`);
            if (r.error) throw new Error(r.error);
            d = { name: name || r.name, ticker, market, cur: 'USD', years: r.years, hist: r.hist, netDebt: r.netDebt, shares: r.shares,
              sources: `SEC EDGAR XBRL (CIK ${r.cik}), koncepty: ${Object.values(r.concepts).filter(Boolean).join(', ')}. Zweryfikuj w 10-K.`,
              netDebtNote: `Dług ${r.debt} − gotówka ${r.cash} (stan ${r.asOf}), bez leasingu. Zweryfikuj w 10-K.` };
            const q = await api(`/api/quote?s=${encodeURIComponent(ticker)}`);
            if (q.close) { d.price = q.close; d.priceNote = `Yahoo Finance, ${q.date} (${q.currency}). Zweryfikuj na gpw.pl / stronie giełdy.`; }
          } else {
            d = { name: name || ticker, ticker, market, cur: 'PLN', years: [], hist: {}, sources: 'Wpisz dane z raportów rocznych (ESPI / strona IR) w niebieskie komórki.' };
            const q = await api(`/api/quote?s=${encodeURIComponent(ticker + '.WA')}`);
            if (q.close) { d.price = q.close; d.priceNote = `Yahoo Finance, ${q.date} (${q.currency}). Zweryfikuj na gpw.pl / stronie giełdy.`; } else msg.textContent = 'Nie udało się pobrać kursu, wpisz go ręcznie.';
          }
        }
      } catch (err) { msg.textContent = err.message || 'Błąd pobierania.'; return; }
      if (name) d.name = name;
      const c = { id: Date.now().toString(36), name: d.name, ticker: d.ticker, market: d.market, updated: Date.now(), cells: Cases.template(d) };
      S.cases.unshift(c); save(); location.hash = `#/case/${c.id}`;
    });
  }
  function viewCase(id) {
    const c = S.cases.find(x => x.id === id); if (!c) return viewCases();
    const book = new Sheet.Book(c.cells);
    setTop(`<a href="#/case">Case studies</a><span class="sep">/</span><span>${esc(c.name)}</span>`);
    app.innerHTML = `
      <div class="page-head row-between">
        <div><div class="eyebrow">Case study · ${esc(c.market)}</div><h1 class="page-header">${esc(c.name)}</h1></div>
        <div class="actions"><button data-act="copy">Kopiuj do Excela</button><button data-act="del" class="danger">Usuń model</button><span class="msg"></span></div>
      </div>
      <div id="sum" class="stat-row three"></div><div id="ff"></div>
      <section class="card work-card">
        <p class="muted small">Niebieskie komórki to dane i założenia. Czarne to formuły. Kolumna L służy do zapisywania źródeł i uzasadnień. Model zapisuje się automatycznie w tej przeglądarce.</p>
        <div class="sheet-host big"></div>
      </section>`;
    const fmt = (v, f) => v == null ? '—' : Sheet.format(v, f);
    const renderSum = () => {
      const s = Cases.summary(book);
      $('#sum').innerHTML = `
        <div class="card stat-card"><div class="k">Wartość / akcję (DCF)</div><div class="v">${fmt(s.dcf, 'num2')}</div><div class="s">kurs: ${fmt(s.price, 'num2')}</div></div>
        <div class="card stat-card"><div class="k">Potencjał</div><div class="v ${s.upside > 0 ? 'pos' : s.upside < 0 ? 'neg' : ''}">${fmt(s.upside, 'pct')}</div><div class="s">EV: ${fmt(s.ev, 'num')}</div></div>
        <div class="card stat-card"><div class="k">WACC / udział TV</div><div class="v">${fmt(s.wacc, 'pct')}</div><div class="s">TV = ${fmt(s.tvShare, 'pct')} EV${s.tvShare > 0.8 ? ' ⚠' : ''}</div></div>`;
      const rs = s.ranges.filter(r => r.lo != null), vals = rs.flatMap(r => [r.lo, r.hi]).concat(s.price ?? []);
      if (!rs.length) { $('#ff').innerHTML = ''; return; }
      const lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.1, x = v => ((v - lo) / (hi - lo) * 100).toFixed(2);
      $('#ff').innerHTML = `<section class="card"><div class="eyebrow">Zakresy wyceny (football field)</div><div class="ff">${rs.map(r => `
        <div class="ff-row"><span class="ff-l">${esc(r.label)}</span><span class="ff-track">
          <i class="ff-bar" style="left:${x(r.lo)}%;width:max(3px,${x(r.hi) - x(r.lo)}%)"></i>
          ${s.price ? `<i class="ff-price" style="left:${x(s.price)}%"></i>` : ''}</span>
          <span class="ff-v">${fmt(r.lo, 'num2')}${r.hi !== r.lo ? ' – ' + fmt(r.hi, 'num2') : ''}</span></div>`).join('')}
        ${s.price ? `<p class="muted small">Pionowa linia to bieżący kurs (${fmt(s.price, 'num2')}).</p>` : ''}</div></section>`;
    };
    let t;
    new Sheet.View($('.sheet-host', app), book, {
      widths: { A: 230, L: 380 }, start: 'G8', padRows: 4,
      onChange: () => { renderSum(); clearTimeout(t); t = setTimeout(() => { c.updated = Date.now(); save(); }, 300); },
      onMessage: m => { $('.actions .msg').textContent = m; },
    });
    renderSum();
    app.querySelector('.actions').addEventListener('click', e => {
      const msg = $('.actions .msg');
      // kopiowanie zamiast pobierania pliku: wklejone do Excela formuły od razu się przeliczają
      if (e.target.dataset.act === 'copy') {
        const { cols, rows } = book.bounds(); const lines = [];
        for (let r = 1; r <= rows; r++) { const row = []; for (let k = 1; k <= cols; k++) row.push(String(book.raw(Sheet.addr(k, r))).replace(/[\t\n]/g, ' ')); lines.push(row.join('\t')); }
        const text = lines.join('\n');
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
          .then(() => { msg.textContent = 'Skopiowano. Wklej do pustego arkusza Excela (komórka A1).'; })
          .catch(() => { msg.textContent = 'Przeglądarka nie pozwoliła skopiować. Zaznacz komórki w arkuszu i użyj Ctrl/Cmd+C.'; });
      }
      // usuwanie w dwóch krokach zamiast okna potwierdzenia
      if (e.target.dataset.act === 'del') {
        if (e.target.dataset.armed) { S.cases = S.cases.filter(x => x.id !== id); save(); location.hash = '#/case'; }
        else { e.target.dataset.armed = 1; e.target.textContent = 'Kliknij ponownie, aby usunąć'; setTimeout(() => { delete e.target.dataset.armed; e.target.textContent = 'Usuń model'; }, 4000); }
      }
    });
  }

  // ---------- API dla pozostałych widoków (features.js) ----------
  window.FMA = {
    get S() { return S; }, get user() { return user; }, save, esc, $, bar, pct, setTop, toast, mountPuzzle, record, renderNav, bumpStreak, elo,
    today, dayStr, lekcje, allLessons, doneCount, nextLesson, liveStreak, api,
  };

  // ---------- router ----------
  function route() {
    const [, a = '', b, c] = (location.hash || '#/').split('/');
    window.scrollTo(0, 0); closeMenu(); document.body.classList.remove('present');
    if (user && !S.level && S.path) S.level = 'mid'; // konta sprzed wyboru poziomu
    renderNav();
    if (!user) viewAuth(a === 'logowanie' ? 'login' : 'register');
    else if (!S.level) viewOnboarding();
    else if (a === 'kurs') b ? viewLesson(b) : viewCourse();
    else if (a === 'zadania') b === 'dzienne' ? viewPuzzles('dzienne', c) : viewPuzzles();
    else if (a === 'ranking') viewRanking(b || 'rating');
    else if (a === 'case') b ? viewCase(b) : viewCases();
    else if (Views[a]) Views[a](app, b, c);
    else viewHome();
    renderNav();
  }
  window.addEventListener('hashchange', route);
  route();
})();
