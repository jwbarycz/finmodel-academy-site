// Uproszczony arkusz: parser formuł, przeliczanie, widok siatki z edycją jak w Excelu.
const Sheet = (() => {
  // ---------- adresy ----------
  const colToNum = s => [...s].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  const numToCol = n => { let s = ''; while (n > 0) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; };
  const addr = (c, r) => numToCol(c) + r;
  const parseAddr = a => { const m = /^\$?([A-Z]{1,3})\$?(\d+)$/.exec(a); return m ? { c: colToNum(m[1]), r: +m[2] } : null; };

  class FErr { constructor(code) { this.err = code; } }
  const E = code => new FErr(code);
  const isErr = v => v instanceof FErr;

  // ---------- tokenizer ----------
  const TOKEN = /\s*(?:(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|("(?:[^"]|"")*")|(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}\$?\d+)?)|([A-ZĄĆĘŁŃÓŚŹŻ][A-Z0-9.ĄĆĘŁŃÓŚŹŻ]*)(?=\s*\()|(<=|>=|<>|[-+*/^&=<>(),;%]))/y;

  function tokenize(src) {
    const out = []; TOKEN.lastIndex = 0;
    src = src.split(/("[^"]*")/).map((p, k) => k % 2 ? p : p.toUpperCase()).join('');
    while (TOKEN.lastIndex < src.length) {
      const start = TOKEN.lastIndex;
      const m = TOKEN.exec(src);
      if (!m) { if (/^\s*$/.test(src.slice(start))) break; throw E('#NAME?'); }
      if (m[1]) out.push({ t: 'num', v: parseFloat(m[1]) });
      else if (m[2]) out.push({ t: 'str', v: m[2].slice(1, -1).replace(/""/g, '"') });
      else if (m[3]) out.push({ t: 'ref', v: m[3] });
      else if (m[4]) out.push({ t: 'fn', v: m[4] });
      else out.push({ t: 'op', v: m[5] === ';' ? ',' : m[5] });
    }
    return out;
  }

  // ---------- parser (zstępujący) ----------
  function parse(src) {
    const tk = tokenize(src); let i = 0;
    const peek = () => tk[i]; const isOp = v => tk[i] && tk[i].t === 'op' && tk[i].v === v;
    const expect = v => { if (!isOp(v)) throw E('#NAME?'); i++; };
    const bin = (next, ops) => () => {
      let l = next();
      while (tk[i] && tk[i].t === 'op' && ops.includes(tk[i].v)) { const op = tk[i++].v; l = { t: 'bin', op, l, r: next() }; }
      return l;
    };
    const primary = () => {
      const t = tk[i++];
      if (!t) throw E('#NAME?');
      if (t.t === 'num') return { t: 'num', v: t.v };
      if (t.t === 'str') return { t: 'str', v: t.v };
      if (t.t === 'ref') {
        const [a, b] = t.v.replace(/\$/g, '').split(':');
        return b ? { t: 'range', a: parseAddr(a), b: parseAddr(b) } : { t: 'ref', a };
      }
      if (t.t === 'fn') {
        expect('('); const args = [];
        if (!isOp(')')) { do { args.push(cmp()); } while (isOp(',') && ++i); }
        expect(')'); return { t: 'fn', n: t.v, args };
      }
      if (t.v === '(') { const e = cmp(); expect(')'); return e; }
      if (t.v === '-') return { t: 'neg', e: unary() };
      if (t.v === '+') return unary();
      throw E('#NAME?');
    };
    const postfix = () => { let e = primary(); while (isOp('%')) { i++; e = { t: 'pct', e }; } return e; };
    const unary = () => { if (isOp('-')) { i++; return { t: 'neg', e: unary() }; } if (isOp('+')) { i++; return unary(); } return postfix(); };
    const pow = bin(unary, ['^']);
    const mul = bin(pow, ['*', '/']);
    const add = bin(mul, ['+', '-']);
    const cat = bin(add, ['&']);
    const cmp = bin(cat, ['=', '<>', '<', '>', '<=', '>=']);
    const ast = cmp();
    if (i < tk.length) throw E('#NAME?');
    return ast;
  }

  // ---------- ewaluacja ----------
  const num = v => {
    if (isErr(v)) return v;
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'boolean') return v ? 1 : 0;
    return E('#VALUE!');
  };
  const flat = (args, book) => args.flatMap(a => a.t === 'range' ? rangeVals(a, book) : [evalNode(a, book)]);
  const rangeVals = (n, book) => {
    const out = [];
    for (let r = Math.min(n.a.r, n.b.r); r <= Math.max(n.a.r, n.b.r); r++)
      for (let c = Math.min(n.a.c, n.b.c); c <= Math.max(n.a.c, n.b.c); c++) out.push(book.value(addr(c, r)));
    return out;
  };
  const nums = (args, book) => {
    const vals = flat(args, book); const err = vals.find(isErr); if (err) return err;
    return vals.filter(v => typeof v === 'number');
  };
  const agg = f => (args, book) => { const v = nums(args, book); return isErr(v) ? v : f(v); };

  const FN = {
    SUM: agg(v => v.reduce((a, b) => a + b, 0)),
    AVERAGE: agg(v => v.length ? v.reduce((a, b) => a + b, 0) / v.length : E('#DIV/0!')),
    MIN: agg(v => v.length ? Math.min(...v) : 0),
    MAX: agg(v => v.length ? Math.max(...v) : 0),
    COUNT: agg(v => v.length),
    MEDIAN: agg(v => {
      if (!v.length) return E('#NUM!');
      const s = [...v].sort((a, b) => a - b), m = s.length >> 1;
      return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
    }),
    HARMEAN: agg(v => !v.length ? E('#NUM!') : v.some(x => x <= 0) ? E('#NUM!') : v.length / v.reduce((a, b) => a + 1 / b, 0)),
    SUMPRODUCT: (args, book) => {
      const cols = args.map(a => a.t === 'range' ? rangeVals(a, book) : [evalNode(a, book)]);
      const err = cols.flat().find(isErr); if (err) return err;
      if (cols.some(c => c.length !== cols[0].length)) return E('#VALUE!');
      return cols[0].reduce((s, _, k) => s + cols.reduce((p, c) => p * (typeof c[k] === 'number' ? c[k] : 0), 1), 0);
    },
    NPV: (args, book) => {
      const rate = num(evalNode(args[0], book)); if (isErr(rate)) return rate;
      const v = nums(args.slice(1), book); if (isErr(v)) return v;
      return v.reduce((acc, cf, k) => acc + cf / Math.pow(1 + rate, k + 1), 0);
    },
    IF: (args, book) => {
      const c = evalNode(args[0], book); if (isErr(c)) return c;
      return evalNode(c && c !== 0 ? args[1] : (args[2] || { t: 'num', v: 0 }), book);
    },
    IFERROR: (args, book) => { const v = evalNode(args[0], book); return isErr(v) ? evalNode(args[1], book) : v; },
    ABS: (args, book) => { const v = num(evalNode(args[0], book)); return isErr(v) ? v : Math.abs(v); },
    SQRT: (args, book) => { const v = num(evalNode(args[0], book)); return isErr(v) ? v : v < 0 ? E('#NUM!') : Math.sqrt(v); },
    ROUND: (args, book) => {
      const v = num(evalNode(args[0], book)), d = num(evalNode(args[1] || { t: 'num', v: 0 }, book));
      if (isErr(v)) return v; if (isErr(d)) return d; const p = Math.pow(10, d); return Math.round(v * p) / p;
    },
    POWER: (args, book) => {
      const a = num(evalNode(args[0], book)), b = num(evalNode(args[1], book));
      return isErr(a) ? a : isErr(b) ? b : Math.pow(a, b);
    },
    AND: (args, book) => { const v = flat(args, book); return v.find(isErr) || v.every(x => !!x); },
    OR: (args, book) => { const v = flat(args, book); return v.find(isErr) || v.some(x => !!x); },
  };
  // polskie nazwy funkcji z Excela
  Object.assign(FN, { SUMA: FN.SUM, ŚREDNIA: FN.AVERAGE, MEDIANA: FN.MEDIAN, JEŻELI: FN.IF, ZAOKR: FN.ROUND, POTĘGA: FN.POWER, ILE: FN.COUNT, 'ŚREDNIA.HARMONICZNA': FN.HARMEAN, 'SUMA.ILOCZYNÓW': FN.SUMPRODUCT });

  function evalNode(n, book) {
    switch (n.t) {
      case 'num': case 'str': return n.v;
      case 'ref': return book.value(n.a);
      case 'range': return E('#VALUE!');
      case 'neg': { const v = num(evalNode(n.e, book)); return isErr(v) ? v : -v; }
      case 'pct': { const v = num(evalNode(n.e, book)); return isErr(v) ? v : v / 100; }
      case 'fn': { const f = FN[n.n]; return f ? f(n.args, book) : E('#NAME?'); }
      case 'bin': {
        const l = evalNode(n.l, book), r = evalNode(n.r, book);
        if (isErr(l)) return l; if (isErr(r)) return r;
        if (n.op === '&') return `${l ?? ''}${r ?? ''}`;
        if (['=', '<>', '<', '>', '<=', '>='].includes(n.op)) {
          const a = l ?? 0, b = r ?? 0;
          return { '=': a === b, '<>': a !== b, '<': a < b, '>': a > b, '<=': a <= b, '>=': a >= b }[n.op];
        }
        const a = num(l), b = num(r); if (isErr(a)) return a; if (isErr(b)) return b;
        switch (n.op) {
          case '+': return a + b; case '-': return a - b; case '*': return a * b;
          case '/': return b === 0 ? E('#DIV/0!') : a / b;
          case '^': { const p = Math.pow(a, b); return Number.isFinite(p) ? p : E('#NUM!'); }
        }
      }
    }
    return E('#VALUE!');
  }

  const literal = raw => {
    if (raw === undefined || raw === null) return null;
    const s = String(raw).trim(); if (s === '') return null;
    const m = /^(-?[\d\s]*[.,]?\d+)\s*(%?)$/.exec(s);
    if (m) { const v = parseFloat(m[1].replace(/\s/g, '').replace(',', '.')); return m[2] ? v / 100 : v; }
    return s;
  };

  const astCache = new Map();
  class Book {
    constructor(cells = {}) { this.cells = cells; this.recalc(); }
    raw(a) { return this.cells[a]?.v ?? ''; }
    isFormula(a) { return String(this.raw(a)).startsWith('='); }
    recalc() { this.cache = {}; this.stack = new Set(); }
    set(a, v) { if (v === '' || v == null) { if (this.cells[a]) { this.cells[a].v = ''; } } else (this.cells[a] ||= {}).v = String(v); this.recalc(); }
    value(a) {
      if (a in this.cache) return this.cache[a];
      if (this.stack.has(a)) return E('#CIRC!');
      const raw = this.raw(a); let v;
      if (typeof raw === 'string' && raw.startsWith('=')) {
        this.stack.add(a);
        try {
          let ast = astCache.get(raw);
          if (!ast) { ast = parse(raw.slice(1)); astCache.set(raw, ast); }
          v = evalNode(ast, this);
          if (Array.isArray(v)) v = E('#VALUE!');
        } catch (e) { v = isErr(e) ? e : E('#NAME?'); }
        this.stack.delete(a);
      } else v = literal(raw);
      this.cache[a] = v; return v;
    }
    bounds() {
      let mc = 1, mr = 1;
      for (const a of Object.keys(this.cells)) { const p = parseAddr(a); if (p) { mc = Math.max(mc, p.c); mr = Math.max(mr, p.r); } }
      return { cols: mc, rows: mr };
    }
  }

  // przesunięcie adresów względnych przy kopiowaniu (z uwzględnieniem $)
  const REF_RE = /(?<![A-Z0-9_.$])(\$?)([A-Z]{1,3})(\$?)(\d+)(?![A-Z0-9(])/g;
  function shiftFormula(f, dc, dr) {
    if (!String(f).startsWith('=')) return f;
    return f.split(/("[^"]*")/).map((part, k) => k % 2 ? part : part.toUpperCase().replace(REF_RE, (m, ac, col, ar, row) => {
      const c = ac ? colToNum(col) : colToNum(col) + dc, r = ar ? +row : +row + dr;
      return c < 1 || r < 1 ? '#REF!' : `${ac}${numToCol(c)}${ar}${r}`;
    })).join('');
  }

  // komórki, do których odwołuje się formuła (do podświetlania poprzedników)
  function refsIn(f) {
    const out = new Set(); if (!String(f).startsWith('=')) return out;
    const s = f.toUpperCase().replace(/"[^"]*"/g, '');
    for (const m of s.matchAll(/\$?([A-Z]{1,3})\$?(\d+)(?::\$?([A-Z]{1,3})\$?(\d+))?/g)) {
      if (!m[3]) { out.add(m[1] + m[2]); continue; }
      const a = { c: colToNum(m[1]), r: +m[2] }, b = { c: colToNum(m[3]), r: +m[4] };
      for (let r = Math.min(a.r, b.r); r <= Math.max(a.r, b.r) && out.size < 400; r++)
        for (let c = Math.min(a.c, b.c); c <= Math.max(a.c, b.c); c++) out.add(addr(c, r));
    }
    return out;
  }

  // ---------- formatowanie ----------
  const nf = (v, d) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  function format(v, fmt) {
    if (isErr(v)) return v.err;
    if (v === null || v === undefined) return '';
    if (typeof v === 'boolean') return v ? 'PRAWDA' : 'FAŁSZ';
    if (typeof v !== 'number') return v;
    if (!Number.isFinite(v)) return '#NUM!';
    if (Math.abs(v) < 1e-9) v = 0;
    switch (fmt) {
      case 'pct': return nf(v * 100, 1) + '%';
      case 'x': return nf(v, 1) + 'x';
      case 'int': return nf(Math.round(v), 0);
      case 'num2': return nf(v, 2);
      case 'num': return nf(v, 1);
      case 'year': return String(v);
      default: return Number.isInteger(v) ? nf(v, 0) : nf(v, Math.abs(v) >= 100 ? 1 : Math.abs(v) >= 1 ? 2 : 3);
    }
  }

  // ---------- widok ----------
  class View {
    constructor(el, book, opts = {}) {
      this.el = el; this.book = book; this.opts = opts;
      const b = book.bounds();
      this.cols = Math.max(opts.cols || 0, b.cols + (opts.padCols ?? 1));
      this.rows = Math.max(opts.rows || 0, b.rows + (opts.padRows ?? 2));
      this.sel = { c: 1, r: 1 }; this.anchor = null; this.editing = null; this.showFormulas = false; this.clip = null;
      this.build(); this.select(opts.start ? parseAddr(opts.start) : { c: 2, r: 2 }, false, false);
    }
    locked(a) { return this.opts.locked ? this.opts.locked(a) : false; }
    build() {
      const w = this.opts.widths || {};
      let h = `<div class="fx"><span class="fx-addr"></span><span class="fx-label">fx</span><input class="fx-input" spellcheck="false" autocomplete="off"><button class="fx-toggle" type="button" title="Pokaż formuły (Ctrl+\`)">=ƒ</button></div>`;
      h += `<div class="grid-wrap" tabindex="0"><table class="grid"><colgroup><col style="width:40px">`;
      for (let c = 1; c <= this.cols; c++) h += `<col style="width:${w[numToCol(c)] || 92}px">`;
      h += `</colgroup><thead><tr><th class="corner"></th>`;
      for (let c = 1; c <= this.cols; c++) h += `<th>${numToCol(c)}</th>`;
      h += `</tr></thead><tbody>`;
      for (let r = 1; r <= this.rows; r++) {
        h += `<tr><th>${r}</th>`;
        for (let c = 1; c <= this.cols; c++) h += `<td data-a="${addr(c, r)}"></td>`;
        h += `</tr>`;
      }
      this.el.innerHTML = h + `</tbody></table></div>`;
      this.el.classList.add('sheet');
      this.wrap = this.el.querySelector('.grid-wrap');
      this.fxAddr = this.el.querySelector('.fx-addr'); this.fx = this.el.querySelector('.fx-input');
      this.tds = {}; this.el.querySelectorAll('td').forEach(td => { this.tds[td.dataset.a] = td; });
      this.wire(); this.refresh();
    }
    refresh() {
      const prec = this.book.isFormula(addr(this.sel.c, this.sel.r)) ? refsIn(this.book.raw(addr(this.sel.c, this.sel.r))) : new Set();
      const [r0, r1, c0, c1] = this.rect();
      for (const [a, td] of Object.entries(this.tds)) {
        if (this.editing === a) continue;
        const cell = this.book.cells[a] || {}, v = this.book.value(a), p = parseAddr(a);
        td.textContent = this.showFormulas && this.book.isFormula(a) ? cell.v : format(v, cell.fmt);
        td.className = [
          typeof v === 'number' || (this.showFormulas && this.book.isFormula(a)) ? 'n' : '',
          cell.in ? 'in' : '', cell.b ? 'b' : '', cell.h ? 'h' : '', cell.t ? 'target' : '', cell.note ? 'note' : '',
          isErr(v) ? 'err' : '', this.book.isFormula(a) ? 'f' : '', prec.has(a) ? 'prec' : '',
          p.r >= r0 && p.r <= r1 && p.c >= c0 && p.c <= c1 ? 'insel' : '',
          p.c === this.sel.c && p.r === this.sel.r ? 'sel' : '', this.opts.mark?.(a) || '',
        ].filter(Boolean).join(' ');
      }
    }
    rect() {
      const a = this.anchor || this.sel;
      return [Math.min(a.r, this.sel.r), Math.max(a.r, this.sel.r), Math.min(a.c, this.sel.c), Math.max(a.c, this.sel.c)];
    }
    select(p, extend = false, scroll = true) {
      p = { c: Math.min(Math.max(1, p.c), this.cols), r: Math.min(Math.max(1, p.r), this.rows) };
      if (extend) { this.anchor ||= { ...this.sel }; } else this.anchor = null;
      this.sel = p;
      const a = addr(p.c, p.r);
      this.fxAddr.textContent = this.anchor ? `${addr(this.rect()[2], this.rect()[0])}:${addr(this.rect()[3], this.rect()[1])}` : a;
      if (document.activeElement !== this.fx) this.fx.value = this.book.raw(a);
      this.fx.readOnly = this.locked(a);
      this.refresh();
      if (scroll) this.tds[a]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    startEdit(initial) {
      const a = addr(this.sel.c, this.sel.r);
      if (this.locked(a)) { this.flash('Ta komórka jest zablokowana.'); return; }
      this.editing = a; const td = this.tds[a];
      td.classList.add('editing');
      td.innerHTML = `<input class="cell-input" spellcheck="false" autocomplete="off">`;
      const inp = td.firstChild; inp.value = initial ?? this.book.raw(a); inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
      inp.addEventListener('input', () => { this.fx.value = inp.value; });
      inp.addEventListener('keydown', e => {
        e.stopPropagation(); // nie przekazuj do siatki (inaczej Enter od razu otwiera edycję kolejnej komórki)
        if (e.key === 'Enter') { e.preventDefault(); this.commit(inp.value); this.move(0, e.shiftKey ? -1 : 1); }
        else if (e.key === 'Tab') { e.preventDefault(); this.commit(inp.value); this.move(e.shiftKey ? -1 : 1, 0); }
        else if (e.key === 'Escape') { e.preventDefault(); this.cancel(); }
      });
      inp.addEventListener('blur', () => { if (this.editing === a && !this.pickingRef) this.commit(inp.value); });
    }
    commit(val) {
      const a = this.editing; if (!a) return;
      this.editing = null; this.write(a, val.trim());
      this.wrap.focus({ preventScroll: true }); this.select(this.sel);
    }
    cancel() { this.editing = null; this.wrap.focus({ preventScroll: true }); this.select(this.sel); }
    write(a, val) {
      if (this.locked(a)) return;
      if (val.startsWith('=')) val = '=' + val.slice(1).replace(/"[^"]*"|[^"]+/g, s => s.startsWith('"') ? s : s.toUpperCase());
      this.book.set(a, val); this.opts.onChange?.(a);
    }
    move(dc, dr, extend = false) { this.select({ c: this.sel.c + dc, r: this.sel.r + dr }, extend); }
    flash(msg) { this.opts.onMessage ? this.opts.onMessage(msg) : null; }
    copy() {
      const [r0, r1, c0, c1] = this.rect(); const cells = [];
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) cells.push({ dc: c - c0, dr: r - r0, raw: this.book.raw(addr(c, r)) });
      this.clip = { c0, r0, w: c1 - c0 + 1, h: r1 - r0 + 1, cells };
      const text = Array.from({ length: this.clip.h }, (_, dr) => cells.filter(x => x.dr === dr).map(x => x.raw).join('\t')).join('\n');
      navigator.clipboard?.writeText(text).catch(() => {});
      this.flash(`Skopiowano ${this.clip.w * this.clip.h} kom.`);
    }
    paste() {
      if (!this.clip) return;
      const [r0, r1, c0, c1] = this.rect();
      const tileW = Math.max(this.clip.w, c1 - c0 + 1), tileH = Math.max(this.clip.h, r1 - r0 + 1);
      for (let dr = 0; dr < tileH; dr++) for (let dc = 0; dc < tileW; dc++) {
        const src = this.clip.cells.find(x => x.dc === dc % this.clip.w && x.dr === dr % this.clip.h);
        const tc = c0 + dc, tr = r0 + dr; if (tc > this.cols || tr > this.rows) continue;
        const ta = addr(tc, tr); if (this.locked(ta)) continue;
        const raw = shiftFormula(src.raw, tc - (this.clip.c0 + src.dc), tr - (this.clip.r0 + src.dr));
        this.book.set(ta, raw);
      }
      this.opts.onChange?.(null); this.select(this.sel);
    }
    clear() {
      const [r0, r1, c0, c1] = this.rect();
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const a = addr(c, r); if (!this.locked(a)) this.book.set(a, ''); }
      this.opts.onChange?.(null); this.select(this.sel, false);
    }
    wire() {
      this.wrap.addEventListener('mousedown', e => {
        const td = e.target.closest('td'); if (!td || e.target.classList.contains('cell-input')) return;
        const p = parseAddr(td.dataset.a);
        // podczas pisania formuły klik w komórkę wstawia jej adres
        if (this.editing && td.dataset.a !== this.editing) {
          const inp = this.tds[this.editing].firstChild;
          if (inp.value.startsWith('=') && /[=+\-*/^(,;:<>&]$/.test(inp.value.slice(0, inp.selectionStart))) {
            e.preventDefault(); const pos = inp.selectionStart;
            inp.value = inp.value.slice(0, pos) + td.dataset.a + inp.value.slice(inp.selectionEnd);
            inp.setSelectionRange(pos + td.dataset.a.length, pos + td.dataset.a.length);
            this.fx.value = inp.value; return;
          }
          this.commit(inp.value);
        }
        e.preventDefault(); this.wrap.focus({ preventScroll: true }); this.select(p, e.shiftKey);
        const onMove = ev => { const t = ev.target.closest?.('td'); if (t && this.tds[t.dataset.a]) this.select(parseAddr(t.dataset.a), true); };
        const onUp = () => { this.wrap.removeEventListener('mouseover', onMove); window.removeEventListener('mouseup', onUp); };
        this.wrap.addEventListener('mouseover', onMove); window.addEventListener('mouseup', onUp);
      });
      this.wrap.addEventListener('dblclick', e => { if (e.target.closest('td') && !this.editing) this.startEdit(); });
      this.wrap.addEventListener('keydown', e => {
        if (this.editing) return;
        const mod = e.metaKey || e.ctrlKey;
        const arrows = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
        if (arrows[e.key]) { e.preventDefault(); this.move(...arrows[e.key], e.shiftKey); }
        else if (e.key === 'Tab') { e.preventDefault(); this.move(e.shiftKey ? -1 : 1, 0); }
        else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); this.startEdit(); }
        else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.clear(); }
        else if (mod && e.key.toLowerCase() === 'c') { e.preventDefault(); this.copy(); }
        else if (mod && e.key.toLowerCase() === 'v') { e.preventDefault(); this.paste(); }
        else if (mod && e.key === '`') { e.preventDefault(); this.toggleFormulas(); }
        else if (!mod && e.key.length === 1) { e.preventDefault(); this.startEdit(e.key); }
      });
      this.fx.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); this.write(addr(this.sel.c, this.sel.r), this.fx.value.trim()); this.wrap.focus(); this.select(this.sel); }
        if (e.key === 'Escape') { this.fx.value = this.book.raw(addr(this.sel.c, this.sel.r)); this.wrap.focus(); }
      });
      this.el.querySelector('.fx-toggle').addEventListener('click', () => this.toggleFormulas());
    }
    toggleFormulas() { this.showFormulas = !this.showFormulas; this.el.classList.toggle('show-f', this.showFormulas); this.refresh(); }
  }

  return { Book, View, parse, shiftFormula, refsIn, format, addr, parseAddr, numToCol, colToNum, isErr, literal };
})();
