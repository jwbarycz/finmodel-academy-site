// Treści pomocnicze platformy: poziomy, boty, słownik, drivery branżowe („otwarcia”), kursy, standardy, osiągnięcia.
const Data = (() => {
  // poziomy zaawansowania przy starcie (jak na chess.com: nowy / początkujący / średni / zaawansowany)
  const levels = [
    { id: 'new', rating: 600, t: 'Nowy w wycenach', d: 'Wiem, czym jest akcja i sprawozdanie finansowe, ale nie robiłem jeszcze modelu.' },
    { id: 'beg', rating: 800, t: 'Początkujący', d: 'Znam pojęcia DCF, WACC i FCFF, ale mam mało praktyki w Excelu.' },
    { id: 'mid', rating: 1100, t: 'Średni poziom', d: 'Mam za sobą pierwsze modele, np. w funduszu albo na praktykach.' },
    { id: 'adv', rating: 1400, t: 'Zaawansowany', d: 'Modeluję regularnie, startuję w case competitions albo pracuję w IB, PE lub ER.' },
  ];

  // boty do gry „wycena na czas”: im wyższy poziom, tym mniej czasu i mniejszy błąd bota
  const bots = [
    { id: 'staz', name: 'Stażysta Staś', rating: 800, mins: 18, err: 0.12, ic: '🧑‍🎓', d: 'Myli znaki i zapomina o $. Dobry na pierwszą partię.' },
    { id: 'anal', name: 'Analityczka Ania', rating: 1000, mins: 15, err: 0.07, ic: '📊', d: 'Zna FCFF, ale bywa nieuważna przy wartości rezydualnej.' },
    { id: 'asso', name: 'Associate Adam', rating: 1250, mins: 12, err: 0.035, ic: '💼', d: 'Szybki i dokładny, gubi się przy moście do equity.' },
    { id: 'vp', name: 'VP Wiktoria', rating: 1500, mins: 9, err: 0.015, ic: '🎯', d: 'Rzadko się myli. Trzeba być szybkim i bezbłędnym.' },
    { id: 'md', name: 'MD Marek', rating: 1800, mins: 7, err: 0.004, ic: '👔', d: 'Prawie zawsze trafia co do grosza. Wygrasz tylko perfekcyjnym modelem.' },
  ];

  const glossary = [
    ['Beta (β)', 'Wrażliwość stopy zwrotu z akcji na zmiany rynku. W Funduszu: nielewarowana beta sektora (Damodaran) zrelewarowana do D/E spółki.'],
    ['Beta lewarowana / nielewarowana', 'βL zawiera ryzyko finansowe (dług), βU tylko ryzyko operacyjne. βL = βU × (1 + (1 − t) × D/E).'],
    ['CAGR', 'Średnioroczna stopa wzrostu: (koniec / początek)^(1/n) − 1, gdzie n to liczba okresów, a nie punktów danych.'],
    ['CAPEX', 'Nakłady inwestycyjne. W Funduszu: CAPEX = PA₁ − PA₀ + amortyzacja (PA = podstawa amortyzacji), nie z RPP inwestycyjnych.'],
    ['CAPM', 'Model kosztu kapitału własnego: Ke = rf + β × ERP (+ premia za ryzyko kraju).'],
    ['CCC (cykl konwersji gotówki)', 'DIOH + DSO − DPO. Ile dni gotówka jest zamrożona w działalności operacyjnej.'],
    ['Comps (wycena porównawcza)', 'Wycena mnożnikami spółek podobnych. W Funduszu: mediana lub średnia harmoniczna, ważenie mnożników.'],
    ['CRP', 'Premia za ryzyko kraju, dodawana do kosztu kapitału własnego dla rynków mniej rozwiniętych.'],
    ['D&A (amortyzacja)', 'Koszt zużycia aktywów trwałych. Niegotówkowy, więc dodajemy go do NOPAT przy liczeniu FCFF.'],
    ['DCF', 'Wycena metodą zdyskontowanych przepływów pieniężnych: suma PV przyszłych FCFF + PV wartości rezydualnej.'],
    ['DIOH', 'Dni zapasów: średnie zapasy / koszt własny sprzedaży × 365.'],
    ['DPO', 'Dni zobowiązań: średnie zobowiązania nieoprocentowane / koszt własny sprzedaży × 365.'],
    ['DSO', 'Dni należności: średnie należności / przychody × 365.'],
    ['Dług netto', 'Kredyty + pożyczki + obligacje + leasingi − gotówka. Tylko zobowiązania finansowe, z ostatniego raportu.'],
    ['EBIT', 'Zysk operacyjny: przychody − koszty operacyjne. Podstawa NOPAT (nie zysk przed opodatkowaniem).'],
    ['EBITDA', 'EBIT + amortyzacja. Podstawa mnożnika EV/EBITDA.'],
    ['Equity bridge (most)', 'Przejście od EV do wartości kapitału własnego: EV − dług netto − NCI (+ aktywa nieoperacyjne).'],
    ['ERP', 'Premia za ryzyko rynkowe (Rm − rf). W Funduszu z aktualnych zestawień Damodarana, z datą pobrania.'],
    ['ESPI / EBI', 'Systemy raportów bieżących i okresowych spółek z GPW.'],
    ['EV (wartość przedsiębiorstwa)', 'Wartość dla wszystkich dawców kapitału: suma PV FCFF + PV TV.'],
    ['FCFF', 'Wolne przepływy do firmy: EBIT × (1 − t) + D&A − CAPEX − ΔKO.'],
    ['Football field', 'Wykres zakresów wycen z różnych metod na tle bieżącego kursu.'],
    ['Gordon (model)', 'TV = FCFFₙ × (1 + g) / (WACC − g). Wymaga stabilnego ostatniego roku prognozy.'],
    ['Gotówkowa stopa podatkowa', 'Podatek zapłacony (RPP) / zysk przed opodatkowaniem. Gdy niestabilna lub straty: 19% lub średnia branżowa.'],
    ['Hardcode', 'Liczba wpisana ręcznie w miejscu formuły. W modelu Funduszu niedopuszczalne.'],
    ['Kapitał obrotowy (KO, NWC)', 'Zapasy + należności handlowe − zobowiązania nieoprocentowane, bez rozrachunków z tytułu CIT.'],
    ['Kd (koszt długu)', 'Rentowność obligacji spółki albo rf + marża (zwykle 1–4%). Do WACC po podatku: Kd × (1 − t).'],
    ['LFL (like-for-like)', 'Wzrost sprzedaży w porównywalnych sklepach, bez efektu nowych otwarć.'],
    ['LTM / NTM', 'Ostatnie / najbliższe 12 miesięcy. W comps trzeba być spójnym dla całej grupy.'],
    ['Mid-year convention', 'Dyskontowanie przepływów o t − 0,5, bo powstają w ciągu roku, a nie na jego koniec.'],
    ['MSSF 16', 'Standard leasingowy: leasing w długu, a aktywa z prawa do użytkowania w bilansie.'],
    ['NCI (udziały niekontrolujące)', 'Część spółek zależnych należąca do mniejszości. Odejmujemy od EV w moście.'],
    ['NOPAT', 'Zysk operacyjny po podatku: EBIT × (1 − t). Nie opodatkowujemy ujemnego EBIT.'],
    ['P/E', 'Kapitalizacja / zysk netto (cena / EPS). Mnożnik kapitałowy.'],
    ['PEG', 'P/E podzielone przez tempo wzrostu zysków.'],
    ['Podstawa amortyzacji', 'RAT netto − grunty − środki trwałe w budowie − zaliczki + WNiP amortyzowane + aktywa z prawa do użytkowania.'],
    ['rf (stopa wolna od ryzyka)', 'Rentowność 10-letnich obligacji skarbowych w walucie przepływów (PLN → polskie 10Y), z datą.'],
    ['ROIC', 'Zwrot z zainwestowanego kapitału. W długim terminie dąży do WACC; g = ROIC × stopa reinwestycji.'],
    ['Średnia harmoniczna', 'n / Σ(1/x). Odporna na wysokie wartości skrajne mnożników, ale ma tendencję do zaniżania.'],
    ['Stub period', 'Pozostała część bieżącego roku po dacie wyceny. Dyskontujemy tylko ją, nie cały rok.'],
    ['Tarcza podatkowa', 'Obniżenie podatku dzięki odsetkom. W DCF ujęta w WACC przez Kd × (1 − t).'],
    ['TV (wartość rezydualna)', 'Wartość przepływów po okresie prognozy. Typowo 50–70% EV; więcej to sygnał ostrzegawczy.'],
    ['Upside / downside', 'Cena docelowa / bieżący kurs − 1.'],
    ['WACC', 'Średni ważony koszt kapitału: Ke × E/(D+E) + Kd × (1 − t) × D/(D+E), wagi rynkowe.'],
    ['Wrażliwość (sensitivity)', 'Tabela ceny dla różnych WACC i g. Pokazuje, jak bardzo wycena zależy od założeń.'],
    ['XBRL / ESEF', 'Ustrukturyzowane formaty sprawozdań (SEC EDGAR, raporty ESEF w UE).'],
  ];

  // „otwarcia”: typowe schematy modelu dla branż, na których stoją wyceny Funduszu
  const sectors = [
    { id: 'retail', t: 'Sieć handlowa', ex: 'Dino Polska, Auto Partner, Wittchen', model: 'Przychody rosną przez nowe sklepy i sprzedaż w istniejących (LFL).',
      drivers: ['Liczba sklepów_t = sklepy_t−1 + otwarcia netto', 'Przychód = średnia liczba sklepów × przychód na sklep', 'Przychód na sklep rośnie o LFL (realny + inflacja koszyka)'],
      kpi: ['Otwarcia netto rocznie', 'LFL', 'Przychód na m²', 'Marża brutto', 'DIOH, DPO (często ujemny KO)'],
      capex: 'CAPEX rozwojowy = nowe sklepy × nakład na sklep; odtworzeniowy ≈ amortyzacja. Wolne moce i bank ziemi ograniczają tempo otwarć.',
      traps: ['Przenoszenie historycznego tempa otwarć w nieskończoność', 'Brak efektu kanibalizacji w LFL', 'Marża rosnąca bez uzasadnienia skalą'] },
    { id: 'saas', t: 'Oprogramowanie / SaaS', ex: 'Vercom, Shoper, Text', model: 'Przychody powtarzalne z subskrypcji, wysoka marża brutto, rosnące koszty sprzedaży.',
      drivers: ['Przychód = liczba klientów × ARPU (lub MRR × 12)', 'Klienci_t = klienci_t−1 × (1 − churn) + nowi', 'Ekspozycja walutowa przy sprzedaży w USD'],
      kpi: ['MRR / ARR', 'Churn', 'ARPU / ARPL', 'Net revenue retention', 'Koszt pozyskania klienta'],
      capex: 'Niski CAPEX, często aktywowane prace rozwojowe (WNiP). Sprawdź, czy koszty programistów nie są ukryte w CAPEX.',
      traps: ['Mechaniczne klienci × ARPU przy bardzo zróżnicowanych klientach', 'Ignorowanie kursu USD/PLN', 'Zbyt długi wzrost powyżej rynku'] },
    { id: 'constr', t: 'Budownictwo i infrastruktura', ex: 'Mirbud, Elektrotim, Mostostal Zabrze', model: 'Przychody z kontraktów; widoczność daje portfel zamówień (backlog).',
      drivers: ['Przychód_t ≈ część backlogu realizowana w roku + nowe kontrakty', 'Backlog_t = backlog_t−1 + nowe zlecenia − realizacja', 'Programy publiczne (KPO, CPK, PSE) jako driver nowych zleceń'],
      kpi: ['Portfel zamówień i jego pokrycie przychodów', 'Marża brutto na kontraktach', 'Należności i kwoty zatrzymane', 'Rezerwy na straty'],
      capex: 'Umiarkowany CAPEX (sprzęt), wysoki i zmienny kapitał obrotowy. Rozliczenia kontraktów w KO.',
      traps: ['Stała marża mimo inflacji materiałów', 'Pomijanie cykliczności zamówień publicznych', 'Kapitał obrotowy liczony jako % przychodów'] },
    { id: 'fmcg', t: 'Producent spożywczy / FMCG', ex: 'Wawel, Śnieżka, Ambra, Grupa Kęty', model: 'Wolumen × cena, sezonowość, presja cen surowców i siła marki.',
      drivers: ['Przychód = wolumen × średnia cena (z inflacją i miksem)', 'Sezonowość kwartalna (święta, sezon remontowy, lato)', 'Eksport i kursy walut'],
      kpi: ['Wolumen sprzedaży', 'Ceny surowców (kakao, cukier, aluminium)', 'Marża brutto', 'Udziały rynkowe'],
      capex: 'Moce produkcyjne: przy wzroście wolumenu sprawdź wykorzystanie mocy i plan rozbudowy zakładów.',
      traps: ['Prognoza roczna bez kwartałów (sezonowość)', 'Brak opóźnienia przenoszenia cen surowców', 'Scenariusze geopolityczne (np. Ukraina) wrzucone do bazowego'] },
    { id: 'health', t: 'Ochrona zdrowia', ex: 'Diagnostyka, Voxel, Neuca, Synektik', model: 'Część przychodów z NFZ (stabilna), część komercyjna; regulacje i wyceny świadczeń.',
      drivers: ['Liczba badań / punktów × średnia cena', 'Kontrakty z NFZ i ich indeksacja', 'Segment komercyjny zależny od siły nabywczej'],
      kpi: ['Liczba badań', 'Udział NFZ w przychodach', 'Koszty pracy (płaca minimalna, personel medyczny)', 'Wykorzystanie sprzętu'],
      capex: 'Sprzęt medyczny o krótszym okresie amortyzacji; leasingi (MSSF 16) istotne w długu.',
      traps: ['Beta z amerykańskiego sektora prywatnego bez korekty w dół', 'Pomijanie presji płacowej', 'Leasing ujęty ani w długu, ani w FCFF'] },
    { id: 'exch', t: 'Giełda i usługi finansowe', ex: 'GPW, XTB, Quercus TFI', model: 'Przychody z obrotów i opłat; silnie cykliczne, zależne od koniunktury.',
      drivers: ['Przychód = wartość obrotów × stawka opłat (+ opłaty stałe)', 'Regresja przychodów na miesięcznych obrotach publikowanych przez giełdę', 'Aktywa pod zarządzaniem × opłata (TFI)'],
      kpi: ['Wartość obrotów', 'Liczba aktywnych klientów', 'Aktywa pod zarządzaniem', 'Udział opłat stałych'],
      capex: 'Niski CAPEX, ważna polityka dywidendowa i gotówka regulacyjna (nie zawsze „wolna”).',
      traps: ['Ekstrapolacja rekordowego roku obrotów', 'Gotówka klientów potraktowana jako gotówka spółki', 'Brak scenariusza bessy'] },
    { id: 'ecom', t: 'E-commerce', ex: 'Answear, Oponeo, Dadelo', model: 'GMV, konwersja i koszyk; marketing jako główny koszt, własna logistyka.',
      drivers: ['Przychód = ruch × konwersja × średni koszyk', 'Liczba aktywnych klientów × częstotliwość × koszyk', 'Sezonowość (Black Friday, sezon oponiarski)'],
      kpi: ['Aktywni klienci', 'Średni koszyk', 'Koszty marketingu / przychody', 'Zwroty', 'DIOH'],
      capex: 'Magazyny i automatyzacja; zapasy to główny składnik KO.',
      traps: ['Zakładanie rentowności bez obrony unit economics', 'Zła grupa porównawcza („zwykłe e-commerce”)', 'Brak scenariusza „spółka nic nie warta”'] },
    { id: 'realestate', t: 'Nieruchomości i logistyka', ex: 'MLP Group, Dom Development', model: 'Najem m² lub sprzedaż mieszkań; wartość aktywów i bank ziemi.',
      drivers: ['Przychód z najmu = m² × stawka × obłożenie', 'Deweloper: liczba przekazanych lokali × cena za m²', 'Bank ziemi i harmonogram projektów'],
      kpi: ['Obłożenie', 'Stawki czynszu', 'Liczba przedsprzedaży', 'Marża brutto na projektach'],
      capex: 'Inwestycje w nieruchomości to rdzeń biznesu; często wycena NAV obok DCF.',
      traps: ['Wycena czystym DCF bez NAV', 'Stopy kapitalizacji niezgodne z rynkiem', 'Pomijanie stóp procentowych w popycie na mieszkania'] },
  ];

  // kursy: uporządkowane ścieżki przez lekcje i treningi
  const courses = [
    { id: 'full', t: 'Manual wyceny Funduszu', d: 'Wszystkie lekcje po kolei, od wyboru spółki po raport i aktualizacje.', lessons: null, drills: [] },
    { id: 'cycle', t: 'Pierwsza wycena: cykl 3 tygodni', d: 'Tak jak w Funduszu: T pitch, T+1 sektor i profil spółki, T+2 DCF i analiza finansowa, T+3 gotowiec.',
      steps: [['T: wybór i pitch', ['p1', 'w1', 'w2']], ['T+1: dane i sektor', ['d1', 'd2', 'd3', 's1', 's2']], ['T+2: prognozy i DCF', ['r1', 'r2', 'k1', 'k2', 'f1', 'f2', 'f3', 'f4', 'c1', 'c2', 'c3', 'v1', 'v2', 'v3', 'v4']], ['T+3: porównawcza i raport', ['x1', 'x2', 'x3', 'z1', 'z4']]], drills: ['recenzja'] },
    { id: 'quick', t: 'Szybki start: DCF w jeden dzień', d: 'Minimum, żeby zbudować pierwszy model: FCFF, WACC, TV i most do equity.', lessons: ['p1', 'f4', 'c1', 'c3', 'v1', 'v2', 'v3', 'x3'], drills: ['graj'] },
    { id: 'wacc', t: 'WACC od podszewki', d: 'Stopa wolna od ryzyka, ERP, beta, koszt długu i struktura kapitału.', lessons: ['c1', 'c2', 'c3'], drills: ['tematy:WACC'] },
    { id: 'end', t: 'Końcówki modelu', d: 'Wartość rezydualna, dyskontowanie w trakcie roku, most do equity i wrażliwość.', lessons: ['v1', 'v2', 'v3', 'v4'], drills: ['koncowki'] },
    { id: 'recruit', t: 'Przygotowanie do rekrutacji IB/PE/ER', d: 'Szybkie liczenie, typowe pytania rekrutacyjne i model pod presją czasu.', lessons: ['p2', 'f4', 'c2', 'v2', 'v3', 'x2'], drills: ['rush', 'graj', 'pojedynek'] },
  ];

  const standards = [
    ['Terminy', ['Aktualizacja najpóźniej miesiąc od publikacji wyników.', 'Po istotnej informacji cenotwórczej: w ciągu 3 tygodni.', 'Wycena utrzymywana minimum 6 miesięcy.', 'Nowe wyceny w cyklu 3 tygodni (T, T+1, T+2, T+3).']],
    ['Model w Excelu', ['Arkusze ze wzoru: Disclaimer, Okładka, Bilans, RZiS, Przepływy, NOPAT/FCFF, WACC, DCF, Wycena porównawcza.', 'Dane jak w raporcie: 3 lata kwartalnie + 5 lat rocznie, z danymi pozafinansowymi.', 'Bez wartości wpisanych na stałe: liczby wynikają z formuł.', 'Każde założenie ma uzasadnienie i źródło z datą (rf, kurs, market cap, ERP, sektor Damodarana).']],
    ['Metodyka', ['Prognoza kwartalna do końca roku obrotowego, potem co najmniej 5 lat rocznie (7–10 dla szybko rosnących).', 'Wzrost w ostatnim roku zgodny z g (ok. 2,5%).', 'Gotówkowa stopa podatkowa; bez podatku od ujemnego EBIT.', 'CAPEX = PA₁ − PA₀ + D&A; CAPEX ≥ amortyzacja w ostatnim roku.', 'KO przez DIOH, DSO, DPO, bez CIT.', 'Beta nielewarowana sektora zrelewarowana do rynkowego D/E.', 'Dyskontujemy tylko przyszłe przepływy; most: dług netto + NCI.', 'Comps: mediana lub średnia harmoniczna, bez ujemnych i skrajnych mnożników.']],
    ['Raport', ['Tytuły slajdów ze wzoru są niezmienne; limity slajdów na sekcję.', 'Czcionka Lato, wykresy maks. 4 elementy, tabele nie jako obrazy.', 'Jednostki [PLN], [kPLN], [mPLN]; liczby z przecinkiem; daty dd/mm/rrrr.', 'Pitch jako „story” z wyrazistą tezą, a nie lanie wody.']],
    ['Portfel i ryzyko', ['Limity koncentracji według polityki inwestycyjnej (sprawdź aktualną wersję).', 'Raport po każdym rebalancingu: wynik, zmiany, uzasadnienie, ryzyko, wnioski.', 'Rekomendacje „trzymaj” i „sprzedaj” są równie pożądane jak „kupuj”.']],
  ];

  // zadania „końcówek” modelu: TV, dyskontowanie w trakcie roku, most, cena docelowa
  const endgame = ['dcf-tv-growth', 'dcf-tv-discount', 'dcf-build-tv', 'stub-discount', 'dcf-mid-year', 'dcf-bridge', 'bridge-payables', 'bridge-leases', 'bridge-nci', 'target-weights'];
  // powiązanie tematów zadań z lekcjami (do planu treningowego)
  const topicLessons = { DCF: ['f4', 'v1', 'v2', 'v3'], Excel: ['d2'], WACC: ['c1', 'c2', 'c3'], 'Wycena porównawcza': ['x1', 'x2', 'x3'], 'NOPAT → FCFF': ['f1', 'f2', 'f3'], Przychody: ['r1', 'r2', 'r3'], 'Koszty i podatek': ['k1', 'k2'] };

  const variants = [
    { id: 'blind', t: 'Ślepy arkusz', d: 'Widzisz tylko formuły, bez wartości. Błąd trzeba znaleźć, czytając model.', ic: '🙈' },
    { id: 'hard', t: 'Bez koła ratunkowego', d: 'Brak podpowiedzi i rozwiązania, jedno sprawdzenie. Jak na komitecie.', ic: '🧗' },
    { id: 'clock', t: 'Na czas: 90 sekund', d: 'Każde zadanie ma 90 sekund. Po czasie liczy się jako przegrane.', ic: '⏱' },
    { id: 'double', t: 'Dwa błędy', d: 'Wyłącznie modele z dwoma niezależnymi błędami.', ic: '🎲' },
  ];

  const achievements = [
    ['first-lesson', '📘', 'Pierwsza lekcja', 'Ukończ dowolną lekcję manuala.', s => Object.keys(s.lessons).length >= 1],
    ['half-manual', '📗', 'Połowa manuala', 'Ukończ 16 lekcji.', s => Object.keys(s.lessons).length >= 16],
    ['manual', '🎓', 'Manual ukończony', 'Ukończ wszystkie lekcje.', (s, n) => Object.keys(s.lessons).length >= n],
    ['streak3', '🔥', 'Seria 3 dni', 'Ćwicz trzy dni z rzędu.', s => s.best >= 3],
    ['streak7', '🔥', 'Tydzień bez przerwy', 'Seria 7 dni.', s => s.best >= 7],
    ['streak30', '🌋', 'Miesiąc dyscypliny', 'Seria 30 dni.', s => s.best >= 30],
    ['solve1', '✅', 'Pierwsze zadanie', 'Rozwiąż zadanie z rankingiem.', s => s.solved >= 1],
    ['solve25', '🧩', '25 zadań', 'Rozwiąż 25 zadań z rankingiem.', s => s.solved >= 25],
    ['solve100', '🏅', '100 zadań', 'Rozwiąż 100 zadań z rankingiem.', s => s.solved >= 100],
    ['r1200', '♟', 'Rating 1200', 'Osiągnij rating zadań 1200.', s => Math.max(s.rating, ...s.ratingHist.map(x => x.r)) >= 1200],
    ['r1500', '♛', 'Rating 1500', 'Osiągnij rating zadań 1500.', s => Math.max(s.rating, ...s.ratingHist.map(x => x.r)) >= 1500],
    ['rush10', '⚡', 'Rush 10', 'Zdobądź 10 punktów w Model Rush.', s => Math.max(0, ...Object.values(s.rush || {})) >= 10],
    ['rush25', '⚡', 'Rush 25', 'Zdobądź 25 punktów w Model Rush.', s => Math.max(0, ...Object.values(s.rush || {})) >= 25],
    ['bot1', '🤖', 'Pierwsza wygrana', 'Pokonaj dowolnego bota.', s => (s.games || []).some(g => g.res === 'w')],
    ['botmd', '👔', 'Lepszy niż MD', 'Pokonaj MD Marka.', s => (s.games || []).some(g => g.res === 'w' && g.bot === 'md')],
    ['battle', '⚔️', 'Wygrany pojedynek', 'Wygraj pojedynek.', s => (s.battles || []).some(b => b.res === 'w')],
    ['case1', '▦', 'Pierwszy model', 'Utwórz case study.', s => s.cases.length >= 1],
    ['review90', '🔍', 'Czysty model', 'Uzyskaj 90+ w recenzji modelu.', s => (s.bestReview || 0) >= 90],
    ['vision20', '🎯', 'Sokole oko', 'Zdobądź 20 punktów w orientacji w arkuszu.', s => (s.vision || 0) >= 20],
    ['arena', '🏟', 'Uczestnik areny', 'Zagraj w arenie tygodnia.', s => Object.keys(s.arena || {}).length >= 1],
    ['tutor', '🧠', 'Pytanie do trenera', 'Zadaj pytanie trenerowi AI.', s => (s.tutorQs || 0) >= 1],
  ];

  // „Oglądaj”: rozbiór zaakceptowanej wyceny Funduszu krok po kroku (liczby z modelu Dino Polska, luty 2026)
  const walkthrough = {
    t: 'Rozbiór wyceny: Dino Polska',
    d: 'Zaakceptowany przez Komitet model Funduszu, krok po kroku. Liczby pochodzą z modelu z lutego 2026 i służą wyłącznie nauce.',
    steps: [
      ['Struktura pliku', 'Arkusze: RZiS, Bilans, Przepływy, Prognoza przychodów, Przychody kwartalnie, FCFF, WACC, DCF, Założenia do modelu, Wycena porównawcza, CCC. Każda liczba w DCF to odwołanie do arkusza źródłowego.'],
      ['Przychody', 'Przychody oczyszczone z inflacji koszyka (żywność 90%, alkohol i tytoń 10%). Liczba sklepów rośnie o malejące otwarcia netto (345, 390, 430, potem stopniowo mniej), a przychód na sklep o realny LFL. Nominalny LFL = (1 + LFL realny) × 1,025 − 1.'],
      ['Koszty', 'Każda pozycja jako % przychodów z osobnym wierszem udziału: koszt własny ok. 76%, koszty sprzedaży ok. 15–16%, ogólne ok. 0,7–0,8%. Udziały zmieniają się powoli i z uzasadnieniem.'],
      ['Podatek', 'Historyczna stopa = podatek zapłacony / zysk przed opodatkowaniem (17–23%), w prognozie 19%.'],
      ['Amortyzacja i CAPEX', 'Podstawa amortyzacji = RAT − grunty − środki trwałe w budowie − zaliczki + WNiP amortyzowane + leasingi. Grunty wydzielone przez amortyzację budynków / 2,5%. Amortyzacja = 6,8% podstawy, a CAPEX wynika z liczby nowych sklepów.'],
      ['Kapitał obrotowy', 'Arkusz CCC: DIOH liczony na średnich zapasach i koszcie własnym, DSO i DPO analogicznie. KO jest ujemny, bo dostawcy finansują sieć.'],
      ['WACC', 'rf 5,01%, βU 0,80 zrelewarowana do D/E ok. 2% → βL 0,81, ERP 5,5%, więc Ke ≈ 9,47%. Koszt długu z not: odsetki od kredytów, leasingów i obligacji / dług ≈ 7,5% przed podatkiem. WACC ≈ 9,4%.'],
      ['DCF', 'Bieżący rok: tylko 0,25 rocznego FCFF, a czynnik dyskontowy liczony od daty wyceny. g = 2,5%. Wartość na akcję ≈ 41,78 zł wobec kursu 41,30 zł.'],
      ['Wycena porównawcza', 'Peerzy: Jerónimo Martins, Żabka, BIM. Średnia harmoniczna P/E, EV/S, EV/EBITDA, PEG z wagami 40/10/20/30; implikowana cena ≈ 37,36 zł.'],
      ['Cena docelowa', 'Wagi 90% DCF i 10% porównawcza → ok. 41,3 zł. Potencjał bliski zera, więc rekomendacja neutralna. To też pełnoprawny wynik analizy.'],
    ],
  };

  return { levels, bots, glossary, sectors, courses, standards, endgame, topicLessons, variants, achievements, walkthrough };
})();
