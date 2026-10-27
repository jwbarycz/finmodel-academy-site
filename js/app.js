// FinModel Academy — routing, stan użytkownika (localStorage), widoki.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const app = $('#app');
  // ---------- konta (lokalne, do czasu backendu) i stan ----------
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const store = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
  const fresh = () => ({ name: '', path: null, level: null, rating: 1000, ratingHist: [], attempts: 0, solved: 0, streak: 0, best: 0, last: null, days: {}, lessons: {}, recent: [], daily: {}, current: null, cases: [] });
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

  // ścieżka „kurs od zera”: zadania, case i ranking czekają na ukończenie kursu
  const allLessons = () => Course.flatMap(m => m.lessons);
  const courseDone = () => allLessons().every(l => S.lessons[l.id]);
  const lekcje = n => n === 1 ? 'lekcja' : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 'lekcje' : 'lekcji';
  const isLocked = sec => S.path === 'course' && !courseDone() && ['zadania', 'case', 'ranking'].includes(sec);
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

  function renderNav() {
    const ready = user && S.path;
    $('#stats').innerHTML = ready ? `<span title="Seria dni">🔥 ${liveStreak()}</span><span title="Rating zadań">♟ ${S.rating}</span>` : '';
    $('#links').innerHTML = !ready ? '' : [['kurs', 'kurs'], ['zadania', 'zadania'], ['case', 'case'], ['ranking', 'ranking']]
      .map(([k, l]) => isLocked(k) ? `<span class="locked-link" title="Odblokujesz po ukończeniu kursu">🔒${l}</span>` : `<a href="#/${k}">${l}</a>`).join('&nbsp;/&nbsp;');
    $('#user').innerHTML = user ? `<span class="muted">${esc(S.name || user)}</span> <button type="button" id="logout" class="link-btn">wyloguj</button>` : '';
    $('#logout')?.addEventListener('click', signOut);
    const h = location.hash || '#/';
    document.querySelectorAll('.right-nav a').forEach(a => a.classList.toggle('active', h.startsWith(a.getAttribute('href')) && (a.getAttribute('href') !== '#/' || h === '#/')));
  }

  // ---------- rejestracja / logowanie ----------
  function viewAuth(mode) {
    const reg = mode === 'register';
    app.innerHTML = `
      <h1 class="page-header">FinModel Academy</h1>
      <p class="lead">Ćwicz modelowanie finansowe tak, jak wygląda ono w pracy w IB, PE i ER: DCF, WACC, analizę porównawczą, wyszukiwanie danych i budowanie założeń. Wszystko w arkuszu.</p>
      <ul class="list features">
        <li><b>Manual wyceny Funduszu</b>: ${Course.length} modułów i ${allLessons().length} ${lekcje(allLessons().length)}, od wyboru spółki po raport i aktualizacje, na bazie materiałów Funduszu.</li>
        <li><b>Zadania jak w szachach</b>: szukasz błędów w modelach, zdobywasz rating i utrzymujesz serię dni.</li>
        <li><b>Case studies</b>: własne modele na danych z SEC EDGAR i GPW.</li>
      </ul>
      <div class="auth">
        <p class="tabs"><a href="#/" class="${reg ? 'active' : ''}">Załóż konto</a> <a href="#/logowanie" class="${reg ? '' : 'active'}">Zaloguj się</a></p>
        <form id="authForm" autocomplete="on">
          ${reg ? `<label>Imię i nazwisko lub pseudonim (widoczne w rankingu)<input name="name" required maxlength="32" autocomplete="name"></label>` : ''}
          <label>Login<input name="login" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9._\\-]+" autocomplete="username" title="3–20 znaków: litery, cyfry, . _ -"></label>
          <label>Hasło<input name="pw" type="password" required minlength="${reg ? 8 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}"></label>
          ${reg ? `<label>Powtórz hasło<input name="pw2" type="password" required autocomplete="new-password"></label>` : ''}
          <button class="primary">${reg ? 'Załóż konto' : 'Zaloguj się'}</button> <span class="msg" aria-live="polite"></span>
        </form>
        <p class="muted small">Wersja testowa: konto jest zapisane tylko w tej przeglądarce. Hasło jest przechowywane jako skrót PBKDF2. Docelowo logowanie przejdzie na serwer funduszu.</p>
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

  // ---------- wybór ścieżki ----------
  function viewOnboarding() {
    const levels = [
      ['basic', 1000, 'Znam teorię DCF i WACC, mam mało praktyki'],
      ['mid', 1200, 'Mam za sobą pierwsze modele, np. w funduszu albo na praktykach'],
      ['pro', 1400, 'Modeluję zawodowo albo startuję w case competitions'],
    ];
    app.innerHTML = `
      <h1 class="page-header">Cześć, ${esc(S.name || user)}!</h1>
      <p class="lead">Od czego zaczynasz? Wybór ustawi Twoją ścieżkę i początkowy rating.</p>
      <div class="paths">
        <button class="path" data-path="course">
          <span class="path-t">Kurs od zera</span>
          <span class="path-d">Prowadzimy Cię krok po kroku przez manual wyceny Funduszu: ${Course.length} modułów i ${allLessons().length} ${lekcje(allLessons().length)} z ćwiczeniami w arkuszu. Zadania, case studies i ranking odblokują się po ukończeniu kursu.</span>
        </button>
        <button class="path" data-path="free">
          <span class="path-t">Znam podstawy, od razu do praktyki</span>
          <span class="path-d">Masz dostęp do wszystkiego: zadań z ratingiem, case studies i rankingu. Do kursu możesz wracać w dowolnym momencie.</span>
        </button>
      </div>
      <form id="levelForm" class="level" hidden>
        <h2>Jak oceniasz swój poziom?</h2>
        ${levels.map(([k, r, l], i) => `<label><input type="radio" name="lvl" value="${k}" ${i ? '' : 'checked'}> ${esc(l)} <span class="chip">start ♟ ${r}</span></label>`).join('')}
        <p><button class="primary">Zaczynamy</button></p>
      </form>`;
    const start = (path, level) => {
      S.path = path; S.level = level; S.rating = (levels.find(x => x[0] === level) || [, 1000])[1]; S.onboarded = Date.now(); save();
      location.hash = path === 'course' ? '#/kurs/' + allLessons()[0].id : '#/'; route();
    };
    app.querySelectorAll('.path').forEach(b => b.addEventListener('click', () => {
      app.querySelectorAll('.path').forEach(x => x.classList.toggle('chosen', x === b));
      if (b.dataset.path === 'course') start('course', null);
      else { $('#levelForm').hidden = false; $('#levelForm').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    }));
    $('#levelForm').addEventListener('submit', e => { e.preventDefault(); start('free', e.target.lvl.value); });
  }

  // ---------- sekcja zablokowana ----------
  function viewLocked(sec) {
    const names = { zadania: 'Zadania', case: 'Case studies', ranking: 'Ranking' };
    const done = allLessons().filter(l => S.lessons[l.id]).length, total = allLessons().length, next = allLessons().find(l => !S.lessons[l.id]);
    app.innerHTML = `
      <h1 class="page-header">🔒 ${names[sec]}</h1>
      <p class="lead">Ta sekcja odblokuje się po ukończeniu kursu. Na ścieżce „kurs od zera” najpierw budujemy fundamenty.</p>
      <div class="progress"><i style="width:${(done / total * 100).toFixed(1)}%"></i></div>
      <p class="muted">${done}/${total} lekcji ukończonych</p>
      ${next ? `<p><a href="#/kurs/${next.id}">Kontynuuj: ${esc(next.title)} →</a></p>` : ''}`;
  }

  // ---------- widok: start ----------
  function viewHome() {
    if (S.path === 'course' && !courseDone()) return viewCourseHome();
    const total = Course.flatMap(m => m.lessons).length, done = Object.keys(S.lessons).length;
    const dailyDone = S.daily[today()];
    const days = [...Array(28)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 27 + i); return S.days[dayStr(d)] || 0; });
    const nextLesson = Course.flatMap(m => m.lessons).find(l => !S.lessons[l.id]);
    app.innerHTML = `
      <h1 class="page-header">FinModel Academy</h1>
      <p class="lead">Nauka modelowania finansowego dla studenckiego funduszu: DCF, WACC, comps, dane i założenia. Ćwiczysz w arkuszu, jak w pracy w IB, PE i ER.</p>
      <div class="tiles">
        <div class="tile"><div class="k">Seria</div><div class="v">🔥 ${liveStreak()}</div><div class="s">najdłuższa: ${S.best}</div></div>
        <div class="tile"><div class="k">Rating</div><div class="v">${S.rating}</div><div class="s">${S.solved}/${S.attempts} rozwiązanych</div></div>
        <div class="tile"><div class="k">Kurs</div><div class="v">${done}/${total}</div><div class="s">lekcji ukończonych</div></div>
      </div>
      <div class="heat" title="Aktywność z ostatnich 28 dni">${days.map(n => `<i class="l${Math.min(n, 3)}"></i>`).join('')}</div>
      <h2>Co dziś?</h2>
      <ul class="list">
        <li><a href="#/zadania/dzienne">Zadanie dnia</a> ${dailyDone ? (dailyDone.ok ? '<span class="chip ok">rozwiązane</span>' : '<span class="chip">podjęte</span>') : '<span class="chip hot">nowe</span>'}: jedno zadanie, które podtrzymuje serię.</li>
        <li><a href="#/zadania">Trening</a>: zadania dobierane do Twojego ratingu. Szukasz błędów w formułach albo budujesz brakujące fragmenty modelu.</li>
        <li><a href="#/kurs${nextLesson ? '/' + nextLesson.id : ''}">Kurs od zera</a>${nextLesson ? `: następna lekcja to „${esc(nextLesson.title)}”` : ': ukończony 🎓'}.</li>
        <li><a href="#/case">Case studies</a>: własny model DCF i comps na danych z SEC EDGAR, GPW albo na spółce demo.</li>
      </ul>`;
  }

  // strona startowa na ścieżce „kurs od zera”: tylko kurs, reszta czeka
  function viewCourseHome() {
    const total = allLessons().length, done = allLessons().filter(l => S.lessons[l.id]).length;
    const next = allLessons().find(l => !S.lessons[l.id]);
    app.innerHTML = `
      <h1 class="page-header">${done ? 'Wracamy do nauki' : 'Zaczynamy kurs'}</h1>
      <p class="lead">${done ? `Masz za sobą ${done} z ${total} lekcji.` : 'Pierwsza lekcja zajmie około 10 minut.'} Każda ukończona lekcja przedłuża Twoją serię dni.</p>
      <div class="progress"><i style="width:${(done / total * 100).toFixed(1)}%"></i></div>
      <p><a class="cta" href="#/kurs/${next.id}">${done ? 'Kontynuuj' : 'Zacznij'}: ${esc(next.title)} →</a></p>
      <div class="tiles">
        <div class="tile"><div class="k">Seria</div><div class="v">🔥 ${liveStreak()}</div><div class="s">najdłuższa: ${S.best}</div></div>
        <div class="tile"><div class="k">Kurs</div><div class="v">${done}/${total}</div><div class="s">lekcji ukończonych</div></div>
      </div>
      <h2>Program</h2>
      ${Course.map((m, i) => `<h3>${i + 1}. ${esc(m.title)}</h3><ul class="list">${m.lessons.map(l =>
        `<li>${S.lessons[l.id] ? '✓' : l === next ? '→' : '○'} ${S.lessons[l.id] || l === next ? `<a href="#/kurs/${l.id}">${esc(l.title)}</a>` : esc(l.title)}</li>`).join('')}</ul>`).join('')}
      <h2>Po ukończeniu kursu</h2>
      <ul class="list locked-list"><li>🔒 Zadania z ratingiem i zadanie dnia</li><li>🔒 Case studies na danych z SEC EDGAR i GPW</li><li>🔒 Ranking funduszu</li></ul>`;
  }

  // ---------- zadania (puzzle) ----------
  function mountPuzzle(container, puzzle, opts = {}) {
    const book = new Sheet.Book(JSON.parse(JSON.stringify(puzzle.cells)));
    container.innerHTML = `
      <p class="brief">${esc(puzzle.brief)}</p>
      <div class="sheet-host"></div>
      <div class="actions">
        <button class="primary" data-act="check">Sprawdź</button>
        <button data-act="hint">Podpowiedź</button>
        <button data-act="solve">Pokaż rozwiązanie</button>
        <button data-act="reset">Od nowa</button>
        ${opts.nextLabel ? `<button data-act="next">${opts.nextLabel}</button>` : ''}
        <span class="msg" aria-live="polite"></span>
      </div>
      <div class="result"></div>
      <p class="keys">Skróty: <kbd>Enter</kbd>/<kbd>F2</kbd> edycja · <kbd>Ctrl/Cmd+C</kbd> <kbd>Ctrl/Cmd+V</kbd> kopiuj/wklej z przesunięciem adresów · <kbd>Shift</kbd>+strzałki zaznaczenie · <kbd>Ctrl/Cmd+\`</kbd> pokaż formuły · podczas pisania formuły klik w komórkę wstawia adres.</p>`;
    let bad = new Set(), revealed = false;
    const view = new Sheet.View($('.sheet-host', container), book, {
      widths: puzzle.widths, start: puzzle.kind === 'build' ? Object.keys(puzzle.fix)[0] : 'B3',
      mark: a => [bad.has(a) ? 'bad' : '', revealed && puzzle.fix[a] ? 'fixed' : ''].join(' ').trim(),
      onChange: () => { bad = new Set(); },
      onMessage: m => { $('.msg', container).textContent = m; },
    });
    const res = $('.result', container), msg = $('.msg', container);
    container.onclick = e => {
      const act = e.target.dataset?.act; if (!act) return;
      if (act === 'check') {
        const r = Puzzles.check(puzzle, book);
        bad = new Set([...r.problems, ...r.hard]); view.refresh();
        if (r.ok) res.innerHTML = `<div class="note ok"><b>Dobrze!</b> ${esc(puzzle.expl)}</div>`;
        else res.innerHTML = `<div class="note bad"><b>Jeszcze nie.</b> ${r.hard.length ? `W ${r.hard.join(', ')} oczekujemy formuły odwołującej się do komórek, a nie wpisanej liczby. ` : ''}${r.problems.length ? `Nie zgadzają się komórki kontrolne: ${r.problems.join(', ')}.` : ''}</div>`;
        opts.onResult?.(r.ok, { hinted: !!res.dataset.hinted });
      }
      if (act === 'hint') { res.dataset.hinted = 1; msg.textContent = ''; res.innerHTML = `<div class="note">💡 ${esc(puzzle.hint)}</div>`; opts.onHint?.(); }
      if (act === 'solve') {
        for (const [a, v] of Object.entries(puzzle.fix)) book.set(a, v);
        revealed = true; bad = new Set(); view.select(view.sel);
        res.innerHTML = `<div class="note"><b>Rozwiązanie</b> (zielone komórki): ${Object.entries(puzzle.fix).map(([a, v]) => `<code>${a}: ${esc(v)}</code>`).join(' ')}<br>${esc(puzzle.expl)}</div>`;
        opts.onResult?.(false, { revealed: true });
      }
      if (act === 'reset') mountPuzzle(container, puzzle, opts);
      if (act === 'next') opts.onNext?.();
    };
    return { book, view };
  }

  function viewPuzzles(mode) {
    const daily = mode === 'dzienne';
    let p, slot;
    if (daily) { p = Puzzles.daily(today()); slot = S.daily[today()]; }
    else {
      if (!S.current) { const n = Puzzles.next(S.rating, S.recent, S.topic); S.current = { id: n.id, seed: n.seed, rated: false }; save(); }
      p = Puzzles.instantiate(S.current.id, S.current.seed);
    }
    const ratedAlready = daily ? !!slot : S.current.rated;
    app.innerHTML = `
      <h1 class="page-header">${daily ? 'Zadanie dnia' : 'Trening'}</h1>
      <div class="pz-head">
        <div><h2 class="pz-title">${esc(p.title)}</h2>
          <span class="chip">${esc(p.topic)}</span> <span class="chip">${p.kind === 'fix' ? 'znajdź błąd' : 'zbuduj'}</span> <span class="chip">♟ ${p.rating}</span>
          ${ratedAlready ? '<span class="chip">bez wpływu na rating</span>' : ''}</div>
        ${daily ? '' : `<label class="topic">Temat <select id="topic"><option value="">wszystkie</option>${Puzzles.topics.map(t => `<option ${S.topic === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`}
      </div>
      <div id="pz"></div>`;
    let hinted = false;
    const finish = (ok, info) => {
      if (daily) {
        if (!S.daily[today()]) { S.daily[today()] = { ok }; applyRating(p, ok, hinted); if (ok) bumpStreak(); }
        else if (ok && !S.daily[today()].ok) { S.daily[today()].ok = true; bumpStreak(); }
        save(); return;
      }
      if (!S.current.rated) { S.current.rated = true; applyRating(p, ok && !info.revealed, hinted); }
      if (ok && !S.current.solvedOnce) { S.current.solvedOnce = true; bumpStreak(); }
      save();
    };
    mountPuzzle($('#pz'), p, {
      nextLabel: daily ? '' : 'Następne →',
      onHint: () => { hinted = true; },
      onResult: finish,
      onNext: () => { S.recent = [...S.recent, p.id].slice(-8); S.current = null; save(); viewPuzzles(); },
    });
    $('#topic')?.addEventListener('change', e => { S.topic = e.target.value || null; S.current = null; save(); viewPuzzles(); });
  }
  function applyRating(p, ok, hinted) {
    let d = elo(S.rating, p.rating, ok ? 1 : 0); if (ok && hinted) d = Math.round(d / 2);
    S.rating = Math.max(100, S.rating + d); S.attempts++; if (ok) S.solved++;
    S.ratingHist.push({ t: Date.now(), r: S.rating }); S.ratingHist = S.ratingHist.slice(-200);
    toast(`${ok ? '✓' : '✗'} Rating ${d >= 0 ? '+' : ''}${d} → ${S.rating}`); renderNav();
  }

  // ---------- kurs ----------
  function viewCourse() {
    app.innerHTML = `<h1 class="page-header">Kurs od zera</h1>
      <p class="lead">Manual tworzenia wyceny według standardów Funduszu: ${Course.length} modułów i ${allLessons().length} ${lekcje(allLessons().length)}, od wyboru spółki po raport i aktualizacje. Każda lekcja kończy się pytaniami, a większość także ćwiczeniem w arkuszu.</p>
      ${Course.map((m, i) => {
        const d = m.lessons.filter(l => S.lessons[l.id]).length;
        return `<h2>${i + 1}. ${esc(m.title)} <span class="muted">${d}/${m.lessons.length}</span></h2>
        <ul class="list">${m.lessons.map(l => `<li>${S.lessons[l.id] ? '✓' : '○'} <a href="#/kurs/${l.id}">${esc(l.title)}</a>${l.exercise ? ' <span class="chip">arkusz</span>' : ''}</li>`).join('')}</ul>`;
      }).join('')}`;
  }
  function viewLesson(id) {
    const all = Course.flatMap(m => m.lessons.map(l => ({ ...l, module: m })));
    const idx = all.findIndex(l => l.id === id); const L = all[idx]; if (!L) return viewCourse();
    const quizOk = new Array(L.quiz.length).fill(false); let exOk = !L.exercise;
    app.innerHTML = `<p class="crumbs"><a href="#/kurs">Kurs</a> / ${esc(L.module.title)}</p>
      <h1 class="page-header">${esc(L.title)}</h1>
      <article class="prose">${L.body}</article>
      ${L.src ? `<p class="src">Na podstawie: ${esc(L.src)}</p>` : ''}
      <h2>Sprawdź się</h2>
      ${L.quiz.map((q, qi) => `<fieldset class="quiz" data-q="${qi}"><legend>${esc(q.q)}</legend>
        ${q.options.map((o, oi) => `<label><input type="radio" name="q${qi}" value="${oi}"> ${esc(o)}</label>`).join('')}
        <div class="qres"></div></fieldset>`).join('')}
      ${L.exercise ? `<h2>Ćwiczenie w arkuszu</h2><div id="ex"></div>` : ''}
      <div class="lesson-foot"><span id="lstatus"></span>
        ${all[idx + 1] ? `<a href="#/kurs/${all[idx + 1].id}">Następna: ${esc(all[idx + 1].title)} →</a>` : '<a href="#/zadania">Kurs ukończony. Przejdź do treningu →</a>'}</div>`;
    const status = () => {
      const ok = quizOk.every(Boolean) && exOk;
      $('#lstatus').innerHTML = S.lessons[id] ? '<span class="chip ok">lekcja ukończona</span>' : ok ? '' : `<span class="muted">Do ukończenia: ${quizOk.filter(x => !x).length} pyt.${exOk ? '' : ' + ćwiczenie'}</span>`;
      if (ok && !S.lessons[id]) {
        S.lessons[id] = Date.now(); save(); bumpStreak();
        if (S.path === 'course' && courseDone()) { toast('🎓 Kurs ukończony! Odblokowano zadania, case studies i ranking'); renderNav(); }
        else toast('🎓 Lekcja ukończona');
        status();
      }
    };
    app.querySelectorAll('.quiz').forEach(fs => fs.addEventListener('change', e => {
      const qi = +fs.dataset.q, q = L.quiz[qi], ok = +e.target.value === q.answer;
      quizOk[qi] = quizOk[qi] || ok;
      $('.qres', fs).innerHTML = `<div class="note ${ok ? 'ok' : 'bad'}">${ok ? '✓ ' + esc(q.expl) : '✗ Spróbuj jeszcze raz.'}</div>`;
      status();
    }));
    if (L.exercise) mountPuzzle($('#ex'), Puzzles.instantiate(L.exercise, Puzzles.hash(id)), { onResult: ok => { if (ok) { exOk = true; status(); } } });
    status();
  }

  // ---------- ranking ----------
  function viewRanking(tab = 'rating') {
    const rng = Puzzles.rngFrom(42);
    const names = ['Kasia W.', 'Michał K.', 'Ola P.', 'Bartek Z.', 'Zuza M.', 'Kuba D.', 'Natalia R.', 'Piotr S.', 'Ania L.', 'Tomek G.'];
    const rows = names.map(n => ({ n, rating: 820 + Math.round(rng() * 700), streak: Math.round(rng() * 40), solved: Math.round(rng() * 300) }));
    rows.push({ n: S.name ? `${S.name} (Ty)` : 'Ty', rating: S.rating, streak: liveStreak(), solved: S.solved, me: true });
    rows.sort((a, b) => b[tab] - a[tab]);
    app.innerHTML = `<h1 class="page-header">Ranking</h1>
      <p class="lead">Ranking funduszu. <span class="muted">W wersji testowej pozostali uczestnicy są fikcyjni: prawdziwy ranking wymaga backendu z kontami.</span></p>
      <p class="tabs">${[['rating', 'Rating'], ['streak', 'Seria'], ['solved', 'Rozwiązane']].map(([k, l]) => `<a href="#/ranking/${k}" class="${tab === k ? 'active' : ''}">${l}</a>`).join(' ')}</p>
      <div class="table-container"><table class="rank"><thead><tr><th>#</th><th>Uczestnik</th><th>Rating</th><th>Seria</th><th>Rozwiązane</th></tr></thead><tbody>
      ${rows.map((r, i) => `<tr class="${r.me ? 'me' : ''}"><td>${i + 1}</td><td>${esc(r.n)}</td><td>${r.rating}</td><td>🔥 ${r.streak}</td><td>${r.solved}</td></tr>`).join('')}
      </tbody></table></div>`;
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
    app.innerHTML = `<h1 class="page-header">Case studies</h1>
      <p class="lead">Tryb „singleplayer”: prywatny model na prawdziwych danych. Arkusz ma gotową strukturę DCF, WACC, comps i tabelę wrażliwości. Założenia i uzasadnienia są Twoje.</p>
      <h2>Nowy case</h2>
      <form id="newCase" class="newcase">
        <label>Rynek <select name="market"><option value="US">USA: dane z SEC EDGAR</option><option value="GPW">GPW: kurs pobierany automatycznie, dane z raportu wpisujesz sam</option><option value="DEMO">Demo: fikcyjna spółka</option></select></label>
        <label>Ticker <input name="ticker" placeholder="np. AAPL / PKN" maxlength="12"></label>
        <label>Nazwa (opcjonalnie) <input name="name" maxlength="60"></label>
        <button class="primary">Utwórz model</button> <span class="msg"></span>
      </form>
      <h2>Twoje modele</h2>
      ${S.cases.length ? `<ul class="list">${S.cases.map(c => `<li><a href="#/case/${c.id}">${esc(c.name)}</a> <span class="chip">${esc(c.market)}</span> <span class="muted">${new Date(c.updated).toLocaleDateString('pl-PL')}</span></li>`).join('')}</ul>` : '<p class="muted">Brak modeli. Zacznij od spółki demo albo wpisz ticker.</p>'}`;
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
    app.innerHTML = `<p class="crumbs"><a href="#/case">Case studies</a> / ${esc(c.market)}</p>
      <h1 class="page-header">${esc(c.name)}</h1>
      <div id="sum" class="tiles"></div><div id="ff"></div>
      <p class="muted small">Niebieskie komórki to dane i założenia. Czarne to formuły. Kolumna L służy do zapisywania źródeł i uzasadnień. Model zapisuje się automatycznie w tej przeglądarce.</p>
      <div class="sheet-host big"></div>
      <div class="actions"><button data-act="copy">Kopiuj do Excela</button><button data-act="del" class="danger">Usuń model</button><span class="msg"></span></div>`;
    const fmt = (v, f) => v == null ? '—' : Sheet.format(v, f);
    const renderSum = () => {
      const s = Cases.summary(book);
      $('#sum').innerHTML = `
        <div class="tile"><div class="k">Wartość / akcję (DCF)</div><div class="v">${fmt(s.dcf, 'num2')}</div><div class="s">kurs: ${fmt(s.price, 'num2')}</div></div>
        <div class="tile"><div class="k">Potencjał</div><div class="v ${s.upside > 0 ? 'pos' : s.upside < 0 ? 'neg' : ''}">${fmt(s.upside, 'pct')}</div><div class="s">EV: ${fmt(s.ev, 'num')}</div></div>
        <div class="tile"><div class="k">WACC / udział TV</div><div class="v">${fmt(s.wacc, 'pct')}</div><div class="s">TV = ${fmt(s.tvShare, 'pct')} EV${s.tvShare > 0.8 ? ' ⚠' : ''}</div></div>`;
      const rs = s.ranges.filter(r => r.lo != null), vals = rs.flatMap(r => [r.lo, r.hi]).concat(s.price ?? []);
      if (!rs.length) { $('#ff').innerHTML = ''; return; }
      const lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.1, x = v => ((v - lo) / (hi - lo) * 100).toFixed(2);
      $('#ff').innerHTML = `<h3>Zakresy wyceny (football field)</h3><div class="ff">${rs.map(r => `
        <div class="ff-row"><span class="ff-l">${esc(r.label)}</span><span class="ff-track">
          <i class="ff-bar" style="left:${x(r.lo)}%;width:max(3px,${x(r.hi) - x(r.lo)}%)"></i>
          ${s.price ? `<i class="ff-price" style="left:${x(s.price)}%"></i>` : ''}</span>
          <span class="ff-v">${fmt(r.lo, 'num2')}${r.hi !== r.lo ? ' – ' + fmt(r.hi, 'num2') : ''}</span></div>`).join('')}
        ${s.price ? `<p class="muted small">Pionowa linia to bieżący kurs (${fmt(s.price, 'num2')}).</p>` : ''}</div>`;
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
      // kopiowanie zamiast pobierania pliku: działa też w wersji online, a wklejone do Excela formuły od razu się przeliczają
      if (e.target.dataset.act === 'copy') {
        const { cols, rows } = book.bounds(); const lines = [];
        for (let r = 1; r <= rows; r++) { const row = []; for (let k = 1; k <= cols; k++) row.push(String(book.raw(Sheet.addr(k, r))).replace(/[\t\n]/g, ' ')); lines.push(row.join('\t')); }
        const text = lines.join('\n');
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
          .then(() => { msg.textContent = 'Skopiowano. Wklej do pustego arkusza Excela (komórka A1).'; })
          .catch(() => { msg.textContent = 'Przeglądarka nie pozwoliła skopiować. Zaznacz komórki w arkuszu i użyj Ctrl/Cmd+C.'; });
      }
      // usuwanie w dwóch krokach (okna potwierdzenia są blokowane w wersji online)
      if (e.target.dataset.act === 'del') {
        if (e.target.dataset.armed) { S.cases = S.cases.filter(x => x.id !== id); save(); location.hash = '#/case'; }
        else { e.target.dataset.armed = 1; e.target.textContent = 'Kliknij ponownie, aby usunąć'; setTimeout(() => { delete e.target.dataset.armed; e.target.textContent = 'Usuń model'; }, 4000); }
      }
    });
  }

  // ---------- router ----------
  function route() {
    const [, a, b] = (location.hash || '#/').split('/');
    window.scrollTo(0, 0);
    if (!user) viewAuth(a === 'logowanie' ? 'login' : 'register');
    else if (!S.path) viewOnboarding();
    else if (isLocked(a)) viewLocked(a);
    else if (a === 'kurs') b ? viewLesson(b) : viewCourse();
    else if (a === 'zadania') viewPuzzles(b);
    else if (a === 'ranking') viewRanking(b || 'rating');
    else if (a === 'case') b ? viewCase(b) : viewCases();
    else viewHome();
    renderNav();
  }
  window.addEventListener('hashchange', route);
  route();
})();
