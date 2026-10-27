// Trener AI: rozmowa z modelem językowym przez API podane przez użytkownika (zapisane tylko w jego przeglądarce)
// oraz tryb offline, który odpowiada fragmentami manuala i słownika.
const Tutor = (() => {
  // dostawca neutralny: dowolne API w standardzie „chat completions” (adres, model i klucz podaje użytkownik)
  const KEY = 'fma_ai';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { } };
  const ready = cfg => !!(cfg.url && cfg.model);

  const outline = Course.map((m, i) => `${i + 1}. ${m.title}: ${m.lessons.map(l => l.title).join('; ')}`).join('\n');
  const standards = Data.standards.map(([t, xs]) => `${t}: ${xs.join(' ')}`).join('\n');
  const SYSTEM = `Jesteś trenerem wyceny w Funduszu Hossa ProCapital (studencki fundusz inwestycyjny). Uczysz modelowania finansowego, DCF, WACC, wyceny porównawczej i pracy w Excelu według standardów Funduszu. Odpowiadasz po polsku, zwięźle i konkretnie, z wzorami i krótkimi przykładami liczbowymi.

Gdy uczeń pyta o zadanie, które rozwiązuje, prowadź go pytaniami i podpowiedziami krok po kroku. Pełne rozwiązanie podawaj dopiero wtedy, gdy wprost o nie poprosi. Gdy czegoś nie wiesz albo coś zależy od aktualnych danych rynkowych (rentowności, ERP, kursy), powiedz to i wskaż, gdzie to sprawdzić. Nie dawaj rekomendacji inwestycyjnych.

Standardy Funduszu:
${standards}

Program manuala wyceny:
${outline}`;

  async function ask(history, context) {
    const cfg = load();
    if (!ready(cfg)) return offline(history.at(-1).content);
    const system = context ? `${SYSTEM}\n\nKontekst, w którym jest teraz uczeń:\n${context}` : SYSTEM;
    const res = await fetch(cfg.url.replace(/\/+$/, '') + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {}) },
      body: JSON.stringify({ model: cfg.model, messages: [{ role: 'system', content: system }, ...history.map(m => ({ role: m.role, content: m.content }))] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || '(pusta odpowiedź)';
  }

  // tryb offline: wyszukiwanie w słowniku i lekcjach po słowach kluczowych
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l');
  const strip = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  function offline(question) {
    const words = norm(question).split(/[^a-z0-9/&]+/).filter(w => w.length > 2);
    const score = text => { const t = norm(text); return words.reduce((s, w) => s + (t.includes(w) ? (w.length > 4 ? 2 : 1) : 0), 0); };
    const terms = Data.glossary.map(([t, d]) => ({ t, d, s: score(t) * 3 + score(d) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3);
    const lessons = Course.flatMap(m => m.lessons.map(l => ({ l, s: score(l.title) * 3 + score(strip(l.body)) }))).filter(x => x.s > 1).sort((a, b) => b.s - a.s).slice(0, 3);
    if (!terms.length && !lessons.length) return 'Nie znalazłem tego w manualu ani w słowniku. Sformułuj pytanie inaczej albo dodaj klucz API w ustawieniach trenera, żeby rozmawiać z modelem AI.';
    let out = 'Tryb offline: odpowiadam fragmentami manuala Funduszu.\n';
    if (terms.length) out += '\n' + terms.map(x => `**${x.t}**: ${x.d}`).join('\n');
    if (lessons.length) out += '\n\nWięcej w lekcjach:\n' + lessons.map(x => `[[${x.l.id}|${x.l.title}]]`).join('\n');
    return out;
  }

  return { ask, load, save, ready };
})();
