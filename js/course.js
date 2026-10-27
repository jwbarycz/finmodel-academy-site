// Manual wyceny Funduszu Hossa ProCapital — od wyboru spółki do raportu i aktualizacji.
// Treść oparta na materiałach Funduszu: Minipodręcznik wyceny, Suplement informacyjny, Checklista DCF,
// opracowanie o koszcie kapitału, handbooki analizy sektora, wzory modelu/raportu/aktualizacji,
// uwagi z recenzji wycen, notatki i protokoły ze spotkań, prezentacja AWP oraz materiały Działu Ryzyka.
const STD = (t) => `<div class="callout std"><b>Standard Funduszu</b>${t}</div>`;
const ERR = (t) => `<div class="callout err"><b>Częsty błąd (z recenzji wycen)</b>${t}</div>`;
const TIP = (t) => `<div class="callout tip"><b>Wskazówka</b>${t}</div>`;
const F = (t) => `<pre class="formula">${t}</pre>`;

const Course = [
  {
    id: 'm0', title: 'Jak wygląda wycena w Funduszu',
    lessons: [
      {
        id: 'p1', title: 'Mapa procesu: 9 etapów od spółki do raportu',
        src: 'Suplement informacyjny, Minipodręcznik wyceny, Plan na rok 2026/2027',
        body: `<p>Każda wycena w Funduszu przechodzi przez ten sam ciąg etapów. Ten manual prowadzi Cię przez nie po kolei, a każdy moduł kursu odpowiada jednemu albo dwóm etapom.</p>
<ol class="steps">
<li><b>Wybór spółki</b>: potencjalnie niedowartościowana spółka z GPW, z dobrymi relacjami inwestorskimi.</li>
<li><b>Wstępna analiza</b>: historia spółki, minimum 4 ostatnie kwartały, konferencje wynikowe i rekomendacje domów maklerskich.</li>
<li><b>Zebranie danych</b>: arkusz z RZiS, bilansem i RPP w formie raportowanej przez spółkę oraz dane pozafinansowe.</li>
<li><b>Analiza sektora</b>: definicja rynku, wzrost, konkurencja, makro, łańcuch dostaw. Najważniejszym wynikiem jest prognoza wzrostu sektora.</li>
<li><b>Prognoza przychodów</b>: kwartalnie do końca roku obrotowego, potem rocznie na co najmniej 5 lat, z driverami i uzasadnieniem.</li>
<li><b>Prognoza kosztów i podatku</b>: każda pozycja kosztowa z udziałem w przychodach oraz gotówkowa stopa podatkowa. Wynik to NOPAT.</li>
<li><b>NOPAT → FCFF</b>: amortyzacja, CAPEX, zmiana kapitału obrotowego i inne korekty.</li>
<li><b>Koszt kapitału (WACC)</b>: CAPM z betą zrelewarowaną do struktury spółki i koszt długu po podatku.</li>
<li><b>DCF, wycena porównawcza, raport</b>: dyskontowanie, wartość rezydualna, most do equity, wrażliwość, mnożniki, cena docelowa, prezentacja i rekomendacja.</li>
</ol>
${STD(`Wycenę publikujemy na najnowszych danych. Aktualizujemy ją najpóźniej w ciągu miesiąca od publikacji wyników, a po istotnej informacji cenotwórczej w ciągu 3 tygodni. Analityk utrzymuje wycenę co najmniej przez 6 miesięcy.`)}
<p><b>Rytm pracy.</b> Nowe wyceny powstają w 3-tygodniowym cyklu: <i>T</i> to pitch pomysłów i wybór spółek, <i>T+1</i> analiza sektora i profilu spółki, <i>T+2</i> DCF i analiza finansowa, <i>T+3</i> gotowiec po poprawkach. Równolegle biegnie ścieżka aktualizacji dla spółek z portfela.</p>
<p><b>Co oddajesz:</b> (1) model w Excelu według wzoru Funduszu, (2) raport, czyli prezentację z wyceny z rekomendacją, (3) później krótkie aktualizacje po wynikach.</p>`,
        quiz: [
          { q: 'Spółka opublikowała wyniki kwartalne. Do kiedy według planu Funduszu powinna być gotowa aktualizacja wyceny?', options: ['Do końca roku obrotowego', 'Najpóźniej miesiąc od publikacji wyników', 'Tylko gdy kurs zmieni się o ponad 10%'], answer: 1, expl: 'Ścieżka aktualizacji: każda spółka z portfela ma termin, czyli najpóźniej miesiąc od publikacji wyników.' },
          { q: 'Który etap jest najważniejszym „produktem” analizy sektora dla modelu?', options: ['Ładne wykresy rynku', 'Prognoza wzrostu sektora, w którym działa spółka', 'Lista wszystkich konkurentów na świecie'], answer: 1, expl: 'Minipodręcznik: najważniejszą metryką z analizy sektora jest prognoza wzrostu sektora. Na niej opierają się założenia przychodowe.' },
        ],
      },
      {
        id: 'p2', title: 'Mentalność analityka: błędy, zanim wpiszesz pierwszą liczbę',
        src: 'Prezentacja „Akademia Wycen Przedsiębiorstw” (Komitet Inwestycyjny), notatki ze spotkań',
        body: `<p>„Zły model to objaw złego procesu”. Większość błędów powstaje w głowie analityka, zanim wpisze pierwszą cyfrę. Komitet Inwestycyjny wskazuje pięć powtarzających się pułapek:</p>
<ol class="steps">
<li><b>Pułapka AI i złudzenie wiedzy.</b> Podsumowania AI są dobre na start, ale wnioski bywają płytkie, bo opierają się na nagłówkach. Fundusz świadomie wybrał trudniejszą drogę: każdy buduje model od zera. AI to narzędzie, a nie zastępca myślenia.</li>
<li><b>Iluzja precyzji.</b> Skomplikowany Excel nie daje lepszej wyceny. Nie „doktoryzuj się” z linii, która generuje 3% przychodów, ignorując rdzeń biznesu. Dobry analityk wie, co pominąć.</li>
<li><b>Zła tożsamość spółki = zła wycena.</b> Na przykład Answear to nie „zwykłe e-commerce”, tylko premium CEE z własnym magazynem. Zanim dobierzesz peerów, opisz model biznesowy i odpowiedz, na czym spółka ma najwyższą marżę (unit economics).</li>
<li><b>Chroniczny optymizm.</b> Po tygodniu pracy analityk „zakochuje się” w spółce. Badania rekomendacji na GPW pokazują dominację „kupuj” nawet w bessie. Downside to sygnał do analizy, a nie porażka.</li>
<li><b>Manipulacja WACC.</b> Koszt kapitału najłatwiej „podkręcić”, żeby wyszła wymarzona wycena. Każdy parametr musi mieć źródło i datę.</li>
</ol>
${STD(`„Nie nastawiaj się, że wyjdzie ci upside. Rekomendacja sell czy hold jest również bardzo pożądana w funduszu.” Analizujemy nie swoje pieniądze, więc każde założenie musi dać się obronić przed Komitetem.`)}
${TIP(`Każdy wykres i każde zdanie w analizie musi prowadzić do wniosku: „co z tego wynika dla wyceny?”. Jeśli nie prowadzi, usuń je.`)}`,
        quiz: [
          { q: 'Model wyszedł z downside 25%. Co robisz?', options: ['Podnoszę marże, aż wyjdzie upside', 'Sprawdzam założenia; jeśli są obronione, rekomendacja „sprzedaj” jest wartościowym wynikiem', 'Obniżam WACC o 2 p.p.'], answer: 1, expl: 'Downside to początek prawdziwej analizy. „Sell” i „hold” są w Funduszu pożądane.' },
          { q: 'Spółka ma segment dający 3% przychodów, o bardzo złożonej specyfice. Jak go modelujesz?', options: ['Budujesz osobny model z 20 driverami', 'Upraszczasz (np. % przychodów, stały wzrost) i skupiasz się na rdzeniu biznesu', 'Pomijasz całą spółkę'], answer: 1, expl: 'Iluzja precyzji: dokładność tam, gdzie nie ma znaczenia, to strata czasu. Skup się na 20% elementów, które tworzą 80% wartości.' },
        ],
      },
    ],
  },
  {
    id: 'm1', title: 'Wybór spółki i wstępna analiza',
    lessons: [
      {
        id: 'w1', title: 'Wybór spółki',
        src: 'Minipodręcznik wyceny, plik „Wybór spółki”, Suplement informacyjny, protokół ze spotkania',
        body: `<p>Szukamy <b>potencjalnie niedowartościowanej</b> spółki z polskiego rynku, ale wybór zależy też od portfela Funduszu i od tego, czy da się ją rzetelnie wycenić.</p>
<ol class="steps">
<li><b>Kryteria:</b> dostępność danych, dywersyfikacja branżowa portfela, łatwość wyceny (złożoność modelu biznesowego, układ raportów, przewidywalność przychodów i kosztów) oraz sytuacja wewnętrzna spółki.</li>
<li><b>Relacje inwestorskie:</b> spółka musi publikować co najmniej prezentacje do wyników kwartalnych, a najlepiej także nagrania konferencji wynikowych. W razie wątpliwości napisz do IR. Spółki, których IR nie odpowiada, trafiają na „czarną listę” z opisem powodu.</li>
<li><b>Procedura:</b> każdy analityk zgłasza 3 spółki, które chciałby wycenić, a Komitet dobiera mu jedną. Jedną spółkę wycenia maksymalnie 2 osoby. Współpracę w parze zaznacz w pliku wyboru.</li>
<li><b>Dopasowanie do portfela:</b> limity koncentracji (patrz moduł o ryzyku) oznaczają, że druga spółka z tego samego subsektora raczej nie wejdzie do portfela.</li>
</ol>
${TIP(`Przy spółkach oznaczonych w pliku wyboru jako „trudne” zawsze jest wyjaśnienie, dlaczego są trudne. Przeczytaj je przed zgłoszeniem.`)}`,
        quiz: [{ q: 'Spółka nie publikuje nagrań konferencji, a IR od 3 tygodni nie odpowiada na maile. Co robisz?', options: ['Wyceniam, dane jakoś znajdę', 'Rezygnuję i zgłaszam spółkę na czarną listę z opisem powodu', 'Biorę dane z forum'], answer: 1, expl: 'Dobre IR to warunek wyboru. Fundusz prowadzi czarną listę spółek z nieodpowiadającym IR.' }],
      },
      {
        id: 'w2', title: 'Wstępna analiza: co przeczytać i obejrzeć',
        src: 'Minipodręcznik wyceny, Suplement informacyjny, Checklista DCF (pkt 1–3)',
        body: `<p>Cel: zrozumieć, jak spółka zarabia pieniądze, <b>zanim</b> otworzysz Excela. Analizujesz całą historię spółki i dokładnie co najmniej 4 ostatnie kwartały.</p>
<ol class="steps">
<li><b>Prezentacje wynikowe</b> z co najmniej ostatnich 4 kwartałów.</li>
<li><b>Konferencje wynikowe</b>: obejrzyj co najmniej 4 ostatnie i rób notatki. To tam padają informacje o planach inwestycyjnych, cenach i marżach.</li>
<li><b>Raporty okresowe</b>, zwłaszcza <i>Sprawozdanie z działalności zarządu</i> i <i>List Prezesa</i> (raz w roku).</li>
<li><b>Rekomendacje domów maklerskich</b>: często trzeba założyć konto w DM, co nie jest ani trudne, ani niebezpieczne.</li>
<li>Materiały wideo i artykuły o spółce jako uzupełnienie.</li>
</ol>
${STD(`Checklista przed oddaniem wyceny pyta: czy przeczytano raporty i obejrzano konferencje z ostatnich dwóch lat obrotowych, czy określono konkretne przewagi konkurencyjne i jak są silne.`)}
${TIP(`Przewaga konkurencyjna to nie zawsze coś innowacyjnego. Często to po prostu powód, dla którego klient wybiera tę spółkę, a nie inną. Siłę przewagi możesz rozbić analizą ROE DuPonta, co przyda się przy prognozie marż.`)}`,
        quiz: [{ q: 'Gdzie najczęściej znajdziesz zapowiedzi planów inwestycyjnych (np. budowy zakładu), które wpływają na prognozę CAPEX?', options: ['W konferencjach wynikowych i sprawozdaniu zarządu', 'W notowaniach kursu', 'W rejestrze KRS'], answer: 0, expl: 'Minipodręcznik podkreśla, że plany inwestycyjne zarząd często podaje na konferencjach wynikowych.' }],
      },
    ],
  },
  {
    id: 'm2', title: 'Dane: arkusz historyczny',
    lessons: [
      {
        id: 'd1', title: 'Skąd brać dane finansowe',
        src: 'Minipodręcznik wyceny, Suplement informacyjny, skrypt do raportów ESEF',
        body: `<p>Kolejność wiarygodności źródeł:</p>
<ol class="steps">
<li><b>Pliki Excel od spółki</b> z sekcji IR. Jeśli ich nie ma, poproś o nie IR krótkim mailem.</li>
<li><b>Sprawozdanie finansowe</b> (PDF albo ESEF/XHTML) razem z <b>notami objaśniającymi</b>.</li>
<li><b>Bazy danych</b> (np. Notoria) tylko ostrożnie, bo potrafią łączyć różne pozycje kosztów w jedną. Każdą wątpliwą pozycję sprawdź w notach.</li>
</ol>
${ERR(`Kopiowanie danych z serwisów typu gurufocus zamiast ze sprawozdania. Standard mówi jasno: przepisujemy dane w formie, w jakiej raportuje je spółka.`)}
${TIP(`Raporty ESEF (pliki .xhtml) można automatycznie zamienić na Excel. Fundusz ma skrypt w Pythonie (BeautifulSoup + pandas), który zbiera wszystkie tabele z pliku do jednego arkusza. Dla spółek z USA odpowiednikiem jest SEC EDGAR (XBRL). Import z EDGAR masz w zakładce Case studies.`)}
<p><b>Dane makro</b> bierz z raportu o inflacji NBP: inflacja, PKB, wynagrodzenia. <b>Dane sektorowe</b> z raportów branżowych (McKinsey, PwC, Deloitte, EY), Statisty, IBISWorld, EMIS i prospektów emisyjnych.</p>`,
        quiz: [{ q: 'Baza danych pokazuje „koszty operacyjne” jedną liczbą, a spółka raportuje osobno koszty sprzedaży i ogólnego zarządu. Co robisz?', options: ['Używam liczby z bazy', 'Wracam do sprawozdania i not i przepisuję pozycje tak, jak raportuje spółka', 'Dzielę po połowie'], answer: 1, expl: 'Bazy ujednolicają pozycje. Dane muszą odpowiadać sprawozdaniu, a wątpliwości rozstrzygają noty.' }],
      },
      {
        id: 'd2', title: 'Struktura modelu Funduszu',
        src: 'Wzór modelu Funduszu i „Read me” do wzorów, Suplement informacyjny, uwagi z recenzji, zaakceptowane wyceny',
        body: `<p>Model ma <b>standardowy format</b>, wspólny dla wszystkich członków. Zaakceptowane wyceny mają te arkusze (nazwy arkuszy z wzoru są niezmienne):</p>
<table class="tbl"><tr><th>Arkusz</th><th>Zawartość</th></tr>
<tr><td>Disclaimer, Okładka</td><td>bez zmian; uzupełniasz tylko nazwę spółki, datę i autorów</td></tr>
<tr><td>Bilans, RZiS, Przepływy pieniężne</td><td>dane jak w raporcie: <b>3 lata kwartalnie + 5 lat rocznie</b> (osobne arkusze „qq” i „rr”)</td></tr>
<tr><td>Prognoza przychodów / Założenia</td><td>drivery przychodów i <b>uzasadnienie każdej liczby</b> w kolumnie komentarzy</td></tr>
<tr><td>NOPAT / FCFF (kwartalnie i rocznie)</td><td>koszty, podatek, amortyzacja, CAPEX, kapitał obrotowy (np. arkusz CCC lub NWC)</td></tr>
<tr><td>WACC</td><td>rf, beta, ERP, koszt długu, struktura kapitału, z datami i źródłami</td></tr>
<tr><td>DCF</td><td>podsumowanie z odwołaniami do wszystkich arkuszy, TV, most do equity, analiza wrażliwości</td></tr>
<tr><td>Wycena porównawcza</td><td>peerzy, mnożniki, wagi, cena docelowa</td></tr></table>
${STD(`„W Excelu nie kopiujemy wartości; musi być widać, że liczby wynikają z Waszych obliczeń.” Jednostki zapisujemy jako [PLN], [kPLN] lub [mPLN], liczby z przecinkiem, daty w formacie dd/mm/rrrr. Komentarze dodajemy jako notatki w komórkach.`)}
${ERR(`„Patrząc na ten arkusz kompletnie nie wiem, gdzie mogę wpisać inne liczby, aby zobaczyć, jak zmienia się model.” Oddziel kolorami dane wpisane na stałe, założenia do zmiany i formuły. Użytkownik ma od razu widzieć, gdzie może coś zmienić. W arkuszach tej platformy dane wejściowe są <span class="in-color">niebieskie</span>, a formuły czarne.`)}
${ERR(`CAPEX liczony w trzech różnych miejscach i niespójny EBIT utrudniają recenzję. Każda wielkość powinna być liczona w jednym miejscu, a pozostałe arkusze powinny się do niej odwoływać.`)}
<p>Dodatkowo zbierasz <b>dane pozafinansowe</b> (liczba klientów, sklepów, wolumen produkcji, tony odpadów), udziały rynkowe i marże konkurentów z tych samych okresów.</p>`,
        quiz: [
          { q: 'Ile historii zawiera standardowy arkusz danych Funduszu?', options: ['Tylko ostatni rok', '3 lata kwartalnie i 5 lat rocznie', '10 lat rocznie'], answer: 1, expl: 'Suplement: dane z ostatnich 3 lat kwartalnie i 5 lat rocznie, w formie raportowanej przez spółkę.' },
          { q: 'Recenzent pisze: „nie wiem, gdzie mogę wpisać inne liczby”. Co poprawiasz?', options: ['Dodaję więcej arkuszy', 'Ujednolicam formatowanie: inne kolory dla danych, założeń i formuł', 'Zamieniam formuły na wartości'], answer: 1, expl: 'Czytelność to jeden z najczęstszych tematów recenzji: założenia do zmiany muszą być od razu widoczne.' },
        ],
        exercise: 'ebit-hardcoded',
      },
      {
        id: 'd3', title: 'Oczyszczanie danych historycznych',
        src: 'Minipodręcznik wyceny, Checklista DCF (pkt 16–17), wzór aktualizacji',
        body: `<p>Zanim zaczniesz prognozować, oczyść historię. Inaczej przeniesiesz jednorazowe zdarzenia na kolejne lata.</p>
<ol class="steps">
<li><b>Zdarzenia jednorazowe</b>: restrukturyzacje, odpisy, sprzedaż aktywów, nietypowe przychody i koszty. Zidentyfikuj je i wyłącz.</li>
<li><b>Kursy walut</b>: jeśli spółka ma koszty albo przychody w walutach obcych, oczyść je z efektu kursowego. Gdy kurs wpływa i na przychody, i na koszty, prognozuj koszty do przychodu w <b>kursach stałych</b>.</li>
<li><b>Odchylenia od trendu</b>: szukaj czynników nieliniowych. Pozytywne to skok przychodów, spadek kosztów albo wyższe FCFF. Negatywne to spadek przychodów i marż albo nietypowy CAPEX. Sprawdź źródło: duży kontrakt, sezonowość, odpis czy przejęcie.</li>
<li><b>Zmiany definicji</b>: na przykład CAPEX z przejęciami (M&A) albo bez nich. Jeśli w RPP są wydatki na M&A, zdecyduj świadomie, czy wchodzą do historii.</li>
<li><b>Źródła informacji</b> o jednorazówkach to konferencje wynikowe, sprawozdanie zarządu i prezentacje.</li>
</ol>
${STD(`Checklista: „Czy przeanalizowano historyczne wyniki spółki? Czy zidentyfikowano istotne odchylenia od trendu w przychodach, strukturze kosztów, CAPEX, NWC i stawce opodatkowania? Czy wyjaśniono zdarzenia one-off?”`)}`,
        quiz: [{ q: 'Spółka importuje towary w USD i sprzedaje w PLN. Złoty mocno się umocnił. Jak prognozujesz koszt własny sprzedaży?', options: ['Jako stały % przychodu z historii', 'Z uwzględnieniem kursu: koszt odzwierciedla kurs z momentu zakupu (DIOH), a marża zmieni się z opóźnieniem', 'Ignoruję kursy'], answer: 1, expl: 'Przy DIOH = 180 dni koszty księgowane dziś opierają się na kursach sprzed ok. pół roku. Ruch walut przełoży się więc na marże z opóźnieniem.' }],
      },
    ],
  },
  {
    id: 'm3', title: 'Analiza sektora',
    lessons: [
      {
        id: 's1', title: 'Definicja sektora i wielkość rynku',
        src: 'Minipodręcznik wyceny, „Podstawy analizy sektorowej”, „Analiza sektora: handbook” (metodyka CFA)',
        body: `<p><b>Krok 1. Bardzo wąska definicja działalności.</b> „Sprzedaje ubrania” czy „działa w IT” to za mało. Realni konkurenci walczą o tych samych klientów, w tym samym segmencie cenowym i z podobnym modelem biznesowym. Na przykład LPP i Hugo Boss to różne segmenty rynku odzieżowego. Zapisz: jakie rozwiązania spółka dostarcza, komu, jak funkcjonują ci klienci i co może osłabić ich biznes.</p>
<p><b>Krok 2. Klasyfikacje formalne</b> (GICS, ICB, klasyfikacja Damodarana) jako punkt wyjścia. Skoryguj je dla firm wieloproduktowych, przy substytutach i różnej geografii.</p>
<p><b>Krok 3. Wielkość rynku</b>:</p>
${F('TAM: cały rynek produktów z kategorii modelu biznesowego\nSAM: część TAM z produktami identycznymi lub bardzo zbliżonymi\nSOM: część SAM, którą spółka realnie zdobyła lub może zdobyć')}
<p>Przykład: rynek motoryzacyjny wart 2 bln USD (TAM), z czego pojazdy elektryczne to 20%, czyli 400 mld USD (SAM). Przy celu 10% udziału w EV daje to 40 mld USD (SOM).</p>
<p><b>Krok 4. Dynamika</b>: historyczny i prognozowany CAGR sektora oraz jego najważniejszych podsegmentów. Rozbij wzrost na wolumen i cenę lub miks, a potem wyjaśnij, <b>co napędza wzrost</b>: technologia, preferencje, regulacje, budżety czy programy rządowe.</p>
${TIP(`Precyzja nie jest Ci potrzebna, szacuj. Gdy brakuje danych, szacuj przez analogie z innymi rynkami. Popyt możesz badać Google Trends, importem i eksportem albo przez konkurentów. Przy innowacyjnych sektorach pomocne są dane o inwestycjach VC.`)}`,
        quiz: [{ q: 'Firma produkuje oprogramowanie do rozliczeń dla polskich szpitali. Który opis sektora jest właściwy do analizy?', options: ['IT', 'Oprogramowanie dla ochrony zdrowia w Polsce, finansowanej głównie przez NFZ', 'Globalny rynek software'], answer: 1, expl: 'Definicja musi być wąska: kto jest klientem, co go finansuje i co może osłabić jego budżety.' }],
      },
      {
        id: 's2', title: 'Konkurencja, makro i łańcuch dostaw',
        src: 'Minipodręcznik wyceny, handbook analizy sektora, wzór raportu (Porter, SWOT), Checklista DCF (pkt 4–11)',
        body: `<p><b>Struktura rynku.</b> Ustal udziały rynkowe według przychodów. Często kilka firm ma większość rynku. Koncentrację mierzysz indeksem HHI (suma kwadratów udziałów). Źródła to sprawozdania zarządu, raporty branżowe, prospekty emisyjne z ostatnich 2–3 lat i baza EMIS dla firm nienotowanych.</p>
<p><b>Plany konkurentów</b> mówią o kierunku rynku. Przykład z sektora sportowego: jeden gracz podwaja sieć sklepów, a inni zamykają placówki. To bardzo dużo mówi o przewagach i trendach.</p>
<p><b>Pięć sił Portera</b> (w raporcie przesuwasz „kropkę” od niskiej do wysokiej): rywalizacja w sektorze, groźba nowych wejść, substytuty, siła nabywców i siła dostawców.</p>
<p><b>Makro (PEST/PESTLE).</b> Analizę makro umieść na początku analizy sektora. Wskaż wprost 3–4 wskaźniki, które realnie sterują pieniędzmi w sektorze, np.:</p>
<ul><li>detal: realna siła nabywcza konsumenta, płaca minimalna;</li><li>technologia: budżety inwestycyjne klientów korporacyjnych;</li><li>transport: ceny paliw i dynamika handlu.</li></ul>
<p><b>Łańcuch dostaw i odbiorcy.</b> Zbadaj koncentrację dostawców, ceny komponentów i dostępność surowców. Sprawdź też, czy odbiorcy są rozproszeni, czy spółka zależy od kilku klientów i jak cykl koniunkturalny wpływa na ich kondycję.</p>
${STD(`Checklista pyta o rozmiar rynku (obecny i prognozowany), CAGR ze źródłami, natężenie konkurencji, średnie branżowe dla marż, NWC i CAPEX, łańcuch dostaw, czynniki poza kontrolą firmy razem z siłą ich wpływu oraz trendy w branży.`)}
${TIP(`Gdy brakuje średnich branżowych, recenzent poleca deep research w narzędziach LLM (z zastrzeżeniem, że wnioski niektórych narzędzi bywają płytkie). Zawsze weryfikuj liczby w źródle.`)}`,
        quiz: [{ q: 'Co ma być ostatecznym celem całej analizy sektora?', options: ['Kompletny opis branży do raportu', 'Wnioski, które bezpośrednio zasilą prognozy przychodów, kosztów, CAPEX i NWC, z prognozą wzrostu sektora na czele', 'Analiza SWOT'], answer: 1, expl: 'Minipodręcznik: analiza ma być maksymalnie użyteczna przy prognozowaniu elementów DCF.' }],
      },
    ],
  },
  {
    id: 'm4', title: 'Prognoza przychodów',
    lessons: [
      {
        id: 'r1', title: 'Horyzont prognozy i dojście do dojrzałości',
        src: 'Minipodręcznik wyceny, Checklista DCF (pkt 12–15, 20), spotkanie z praktykiem z equity research',
        body: `<ol class="steps">
<li><b>Do końca bieżącego roku obrotowego</b> prognozujesz <b>kwartalnie</b>.</li>
<li>Potem <b>rocznie, co najmniej 5 lat</b>. Dla spółek młodych lub szybko rosnących wydłuż okres do <b>7–10 lat</b>.</li>
<li>Prognoza musi trwać, aż spółka osiągnie <b>dojrzałość</b>: rynek przestaje rosnąć realnie, czyli po odjęciu inflacji. W praktyce ostatni rok prognozy ma wzrost ok. <b>2,5%</b>, a wcześniejsze lata stopniowo do niego schodzą.</li>
<li>Przy wysokim wzroście po 5–10 latach szczegółowej prognozy dodaj <b>5–10 lat uproszczonych</b>, w których modelujesz już tylko malejący wzrost FCFF aż do g w wartości rezydualnej.</li>
</ol>
${STD(`Checklista: czy okres prognozy dopasowano do etapu rozwoju (spółki stabilne 5–6 lat, rosnące 8–10 lat)? Czy wzrost przychodów w ostatnim roku jest zgodny z przyjętym g?`)}
${TIP(`Praktyk z equity research: wzrost dużo powyżej rynku lub inflacji rzadko da się uzasadnić na dłużej niż ok. 3 lata. Potem bliżej inflacji, bo rynek nie zdyskontuje tego, co dzieje się 3 lata dalej. Przy małym wzroście TV ma mniejszą wagę, więc wycenę łatwiej obronić.`)}`,
        quiz: [{ q: 'Prognoza kończy się w 2030 r. wzrostem przychodów 9%, a g w TV wynosi 2,5%. Co jest nie tak?', options: ['Nic', 'Spółka nie osiągnęła dojrzałości. Trzeba wydłużyć prognozę albo stopniowo obniżać wzrost do ok. 2,5%', 'Trzeba podnieść g do 9%'], answer: 1, expl: 'Wzrost w ostatnim roku musi być zgodny z g. Inaczej TV przypisuje wieczny wzrost spółce, która jeszcze rośnie szybko.' }],
      },
      {
        id: 'r2', title: 'Drivery przychodów i uzasadnienie',
        src: 'Minipodręcznik wyceny, wycena Dino Polska (zaakceptowana przez Komitet), Suplement informacyjny',
        body: `<p>Przychód rzadko jest wartością autonomiczną. Zwykle wynika z <b>driverów operacyjnych</b>:</p>
<ul><li>liczba klientów × ARPU (średni przychód na klienta);</li><li>tony przyjętych odpadów × cena za tonę;</li><li>liczba sklepów × przychód na sklep (albo powierzchnia × przychód z m²);</li><li>wynajmowane m² × stawka czynszu;</li><li>do tego inflacja, która wpływa na ceny i siłę nabywczą.</li></ul>
<p><b>Metody.</b> <i>Top-down</i>: wzrost rynku × udział spółki, bardzo wiarygodny, jeśli masz dane rynkowe. <i>Bottom-up</i>: wolumen × cena z metryk spółki. W praktyce kończy się zwykle <b>metodą ekspercką</b>, czyli połączeniem analizy sektora, makro, konkurencji, sezonowości, planów spółki, jednorazówek i zdrowego rozsądku.</p>
<p><b>Przykład z wyceny Dino.</b> Model rozdziela przychody na:</p>
${F('Przychody realne = przychody / skumulowana inflacja (żywność 90% + alkohol i tytoń 10%)\nLiczba sklepów_t = sklepy_t-1 + otwarcia netto (malejące tempo otwarć)\nPrzychód na sklep rośnie o LFL realny; LFL nominalny = (1 + LFL realny) × 1,025 − 1')}
${ERR(`Mechaniczne mnożenie metryk. Jeśli struktura klientów jest bardzo zróżnicowana (jeden duży klient zastępuje stu małych), „klienci × ARPU” zniekształca obraz. Zawsze oceń sensowność metody, a nie stosuj jej tylko dlatego, że dane są dostępne.`)}
${STD(`Każda przyjęta liczba musi być wyjaśniona w arkuszu uzasadniającym (kolumna „Komentarz” w arkuszu Założenia), tak żeby cały proces był logiczny, przejrzysty i możliwy do obrony.`)}`,
        quiz: [{ q: 'Przychody rosły przez 5 lat o 15% rocznie. Jak to wykorzystać w prognozie?', options: ['Przyjąć 15% na kolejne 5 lat', 'Zrozumieć, co napędzało wzrost (np. otwarcia sklepów, ceny), i ocenić, czy te czynniki się utrzymają; przeszłość służy do zrozumienia biznesu, a nie do przedłużenia trendu', 'Przyjąć średnią z rynku'], answer: 1, expl: 'Minipodręcznik: długi wzrost może też oznaczać zbliżanie się do granic rynku. Prognoza nie może być prostym przedłużeniem trendu.' }],
        exercise: 'rev-stores',
      },
      {
        id: 'r3', title: 'Sezonowość i prognoza kwartalna',
        src: 'Minipodręcznik wyceny, prezentacja AWP („Prognoza oparta na danych rocznych”)',
        body: `<p>Prognozę kwartalną budujesz <b>rok do roku dla danego kwartału</b>: Q4 2025 od Q4 2024, Q1 2026 od Q1 2025. Dzięki temu sezonowość (święta, wakacje) zostaje w modelu automatycznie.</p>
${F('Przychody Q3 2026 = Przychody Q3 2025 × (1 + dynamika r/r Q3)\nPrzychody 2026 = suma 4 kwartałów (zrealizowanych + prognozowanych)')}
${ERR(`Prognozowanie wyników rocznych bez uwzględnienia kwartałów, które w danym roku już się wydarzyły, to według Komitetu „oczywisty błąd analityczny”. Dane roczne ukrywają sezonowość, a kwartalna analiza LTM daje lepszy obraz bieżącej kondycji.`)}
${TIP(`Prognoza kwartalna ułatwia aktualizacje. Po każdych wynikach porównujesz realizację z prognozą i od razu widzisz, które założenie korygować.`)}`,
        quiz: [{ q: 'Q4 to 40% rocznej sprzedaży. Jak liczysz przychody Q4 2026?', options: ['Q3 2026 × (1 + wzrost)', 'Q4 2025 × (1 + dynamika r/r)', 'Przychody 2025 / 4'], answer: 1, expl: 'R/r dla tego samego kwartału zachowuje sezonowość.' }],
        exercise: 'rev-quarterly',
      },
    ],
  },
  {
    id: 'm5', title: 'Koszty operacyjne, EBIT i podatek',
    lessons: [
      {
        id: 'k1', title: 'Prognoza kosztów operacyjnych',
        src: 'Minipodręcznik wyceny, Suplement informacyjny, Checklista DCF (pkt 22, 24), spotkanie z praktykiem ER',
        body: `<ol class="steps">
<li><b>Każda pozycja osobno.</b> Prognozujesz każdy rodzaj kosztu raportowany przez spółkę, który prowadzi do EBIT, z osobnym wierszem „udział w przychodach”.</li>
<li><b>Zmienny czy stały?</b> Koszty zmienne prognozuj jako % przychodu (albo % zysku brutto). Koszty stałe i półstałe trzymaj na stałym poziomie albo podnoś w określonym tempie, np. o inflację.</li>
<li><b>Trend udziału</b>, np. spadające koszty administracyjne/przychody, może oznaczać efekt skali, automatyzację albo zmianę priorytetów. Przeanalizuj go, ale <b>nie zakładaj automatycznie</b>, że będzie trwał.</li>
<li><b>Wskaźniki wyprzedzające</b>: znana płaca minimalna daje presję na koszty pracy, a bieżący kurs USD/PLN przy imporcie przekłada się na marżę z opóźnieniem DIOH.</li>
<li><b>EBIT = przychody − suma kosztów operacyjnych</b>, zawsze jako formuła.</li>
</ol>
${STD(`Checklista: czy każda zmiana kosztów (wzrost lub spadek udziału w przychodach) ma jasne uzasadnienie? Czy utrzymanie albo zmiana marży EBITDA jest uzasadniona skalą, zmianami w branży lub inflacją surowców?`)}
${TIP(`Praktyk z equity research: DCF jest bardzo wrażliwy na wzrost marży w przyszłości. Bez silnego uzasadnienia zakładaj stałą marżę. Spółka nie będzie rosła wiecznie na rosnących marżach, bo konkurencja w końcu „wpadnie na to samo”.`)}`,
        quiz: [{ q: 'Koszty ogólnego zarządu spadły z 9% do 6% przychodów w 4 lata. Jak je prognozujesz?', options: ['Kontynuuję spadek do 3%', 'Ustalam przyczynę (efekt skali, automatyzacja) i przyjmuję udział uzasadniony tą przyczyną, np. stabilizację', 'Wracam do 9%'], answer: 1, expl: 'Trend trzeba zrozumieć i uzasadnić, a nie przedłużać mechanicznie.' }],
        exercise: 'ebit-hardcoded',
      },
      {
        id: 'k2', title: 'Efektywna stopa podatkowa i NOPAT',
        src: 'Minipodręcznik wyceny, uwagi z recenzji (podatek zapłacony vs RZiS), notatka o stopie opodatkowania, zaakceptowane wyceny',
        body: `<p>Standardowe 19% CIT to tylko punkt wyjścia. Każda spółka ma <b>własną efektywną stopę</b> (ulgi, specyfika działalności, struktura grupy).</p>
${F('Gotówkowa stopa opodatkowania = podatek dochodowy zapłacony (RPP) / zysk przed opodatkowaniem\nNOPAT = EBIT × (1 − t)        (dla EBIT < 0 podatek = 0)')}
<ol class="steps">
<li>Policz historyczną gotówkową stopę, najlepiej rocznie, bo kwartalnie potrafi skakać.</li>
<li>Uwzględnij możliwe zmiany polityki podatkowej i struktury spółki.</li>
<li>Jeśli historia skacze albo spółka ponosi straty, przyjmij <b>19%</b> lub średnią gotówkową stopę dla branży.</li>
<li><b>Nie opodatkowujesz ujemnego EBIT.</b></li>
</ol>
${ERR(`W wierszu EBIT wzięto „zysk przed opodatkowaniem” zamiast „zysku z działalności operacyjnej”. NOPAT był przez to błędny, bo koszty finansowe są już w WACC.`)}
<div class="callout"><b>Dyskusja w Funduszu: podatek z RPP czy z RZiS?</b> Jedna recenzja zaleca podatek zapłacony z RPP, który daje stopę gotówkową. Inny głos zwraca uwagę, że podatek może być odroczony, a mieszanie memoriału z kasą bywa mylące. Standard z Minipodręcznika to <b>gotówkowa stopa</b>. Ważne, żeby świadomie wybrać i opisać metodę oraz sprawdzić, czy stopa nie zawiera już efektu tarczy odsetkowej, którą ujmuje WACC.</div>`,
        quiz: [{ q: 'W 2028 spółka ma EBIT = −40. Jaki podatek przyjmujesz w NOPAT?', options: ['+7,6 (ujemny podatek)', '0', '−7,6'], answer: 1, expl: 'Nie opodatkowujemy ujemnego EBIT: podatek = −MAX(EBIT; 0) × t.' }],
        exercise: 'tax-cash',
      },
    ],
  },
  {
    id: 'm6', title: 'Od NOPAT do FCFF',
    lessons: [
      {
        id: 'f1', title: 'Amortyzacja i podstawa amortyzacji',
        src: 'Minipodręcznik wyceny, prezentacja „Amortyzacja, CAPEX, Kapitał obrotowy”, wycena Dino, protokół ze spotkania',
        body: `<p>Szukamy zmian, które wpływają na gotówkę, a których nie widać w RZiS. Pierwsza to amortyzacja, czyli zużywanie się operacyjnych aktywów długoterminowych.</p>
${F('Podstawa amortyzacji = RAT netto − grunty − środki trwałe w budowie − zaliczki na ŚT\n                     + WNiP podlegające amortyzacji + aktywa z tytułu prawa do użytkowania\n\nAmortyzacja_t = stopa amortyzacji × podstawa amortyzacji (na początek okresu)')}
<ol class="steps">
<li>Policz historyczną stopę: amortyzacja / podstawa na początek okresu. Typowo wychodzi <b>3–30%</b> rocznie.</li>
<li><b>Nie amortyzują się</b> grunty i prawo wieczystego użytkowania gruntów, dzieła sztuki, WNiP o nieokreślonym okresie użytkowania i środki trwałe w budowie.</li>
<li>Prognozujesz podstawę amortyzacji (zwykle w relacji do przychodu, patrz CAPEX), a z niej amortyzację.</li>
</ol>
${TIP(`W wycenie Dino grunty wydzielono z pozycji „grunty i budynki” przez amortyzację budynków / 2,5% (budynki amortyzowane 40 lat). To dobry trik, gdy spółka nie podaje gruntów osobno.`)}
<div class="callout"><b>Otwarte pytanie standardu</b>: amortyzację liczyć od podstawy na początek okresu, czy od średniej (początek + koniec) / 2? Średnia jest metodologicznie czystsza przy nierównym CAPEX w ciągu roku. Na razie spotyka się obie metody, więc opisz w modelu, którą stosujesz.</div>`,
        quiz: [{ q: 'Która pozycja NIE wchodzi do podstawy amortyzacji?', options: ['Aktywa z tytułu prawa do użytkowania', 'Środki trwałe w budowie', 'Maszyny i urządzenia'], answer: 1, expl: 'Środki trwałe w budowie, grunty i zaliczki nie są amortyzowane.' }],
        exercise: 'da-base',
      },
      {
        id: 'f2', title: 'CAPEX',
        src: 'Minipodręcznik wyceny, prezentacja „Amortyzacja, CAPEX, Kapitał obrotowy”, Checklista DCF (pkt 3, 25–28)',
        body: `${F('CAPEX = PA₁ − PA₀ + amortyzacja        (PA = podstawa amortyzacji)')}
<p>CAPEX to zmiana podstawy amortyzacji plus amortyzacja roku. <b>Nie</b> bierz CAPEX z przepływów inwestycyjnych, bo nie zawierają leasingów.</p>
<p><b>Rodzaje:</b> <i>odtworzeniowy</i> odnawia zużyte aktywa (≈ amortyzacja), a <i>rozwojowy</i> zwiększa zdolności i generuje wzrost.</p>
<p><b>Trzy sposoby prognozy</b> (z prezentacji szkoleniowej):</p>
<ol class="steps">
<li>CAPEX jako % przychodu;</li>
<li>nowy CAPEX (CAPEX − amortyzacja) jako % przychodu albo w relacji do zmiany przychodu;</li>
<li><b>podstawa amortyzacji jako % przychodu, a CAPEX jako wypadkowa tożsamości</b>. To podejście rekomendowane, bo zachowuje spójność bilansu.</li>
</ol>
<p>Uwzględnij też <b>plany zarządu</b> (budowa zakładu, otwarcia sklepów), np. w Dino CAPEX wynika z liczby nowych sklepów × nakład na sklep.</p>
${STD(`Checklista CAPEX:<br>• Czy przy istotnym wzroście przychodów spółka ma wolne moce? Jeśli nie, ile kosztuje ich zwiększenie i ile osób trzeba zatrudnić?<br>• Czy długoterminowy CAPEX koresponduje z amortyzacją? <b>Amortyzacja nie może przewyższać CAPEX w ostatnim roku prognozy.</b><br>• Czy CAPEX / przychody jest realistyczny na tle historii i branży?<br>• Jak spółka sfinansuje duże inwestycje: gotówką, dotacją czy kredytem?<br>• Czy w ostatnim roku uwzględniono reinwestycje?`)}
${TIP(`W okresie rezydualnym CAPEX rozwojowy powinien być bliski zera (wzrost ≈ inflacja), ale CAPEX nie może spaść poniżej amortyzacji, bo wtedy majątek się kurczy, a FCFF w TV jest zawyżony.`)}`,
        quiz: [{ q: 'Podstawa amortyzacji: początek 500, koniec 560, amortyzacja w roku 45. Ile wynosi CAPEX?', options: ['60', '105', '15'], answer: 1, expl: '560 − 500 + 45 = 105.' }],
        exercise: 'capex-identity',
      },
      {
        id: 'f3', title: 'Kapitał obrotowy: DIOH, DSO, DPO',
        src: 'Minipodręcznik wyceny, prezentacja „Amortyzacja, CAPEX, Kapitał obrotowy”, uwagi z recenzji, wycena Dino (arkusz CCC), Checklista DCF (pkt 29–31)',
        body: `${F('KO = zapasy + należności handlowe − zobowiązania nieoprocentowane (operacyjne)\n     (bez należności i zobowiązań z tytułu podatku dochodowego)\n\nDIOH = średnie zapasy / koszt własny sprzedaży × 365\nDSO  = średnie należności / przychody × 365\nDPO  = średnie zobowiązania / koszt własny sprzedaży × 365\nCCC  = DIOH + DSO − DPO')}
<ol class="steps">
<li>Policz historyczne dni rotacji <b>sam, z bilansu</b>.</li>
<li>Prognozuj DIOH, DSO i DPO, bo to metryki z realnym przełożeniem na biznes.</li>
<li>„Odwróć” wzór: zapasy = COGS / 365 × DIOH, należności = przychody / 365 × DSO, zobowiązania = COGS / 365 × DPO.</li>
<li>Do FCFF trafia <b>zmiana</b> KO (wzrost KO odejmujemy).</li>
</ol>
${STD(`Fundusz nie używa podejścia KO / przychody (zaprzestał go stosować). Prognozujemy każdy składnik osobno przez dni rotacji.`)}
${ERR(`„Jeżeli wskaźniki rotacji wyliczone z bilansu są inne niż raportowane przez spółkę, to te raportowane należy wyrzucić do kosza.” Licz je sam, spójnie z bilansem.`)}
<p><b>Przykłady z prezentacji szkoleniowej:</b></p>
<ul><li>Blokada Kanału Sueskiego wydłuża trasę o 10 dni. MSSF każe rozpoznać zapas od wypłynięcia statku, więc <b>DIOH rośnie o ok. 10 dni</b>.</li>
<li>Nowe warunki u dostawcy, T+60 zamiast T+30, wydłużają <b>DPO o ok. 30 dni</b>, a to uwalnia gotówkę.</li></ul>
<p>KO może być <b>ujemny</b> (np. Dino: dostawcy finansują działalność) i to jest w porządku.</p>
${STD(`Checklista: KO zawiera wszystkie pozycje (zapasy, należności, zobowiązania handlowe, RMK, rezerwy); wskaźniki w dwóch ostatnich latach prognozy się nie zmieniają; DSO, DPO i DIO zbiegają do poziomów branżowych.`)}`,
        quiz: [{ q: 'Spółka negocjuje z dostawcą T+60 zamiast T+30. Jak to wpływa na FCFF w roku zmiany?', options: ['Obniża FCFF', 'Podnosi FCFF, bo rosną zobowiązania, spada KO, a gotówka jest uwalniana', 'Bez wpływu'], answer: 1, expl: 'Wyższe DPO oznacza wyższe zobowiązania nieoprocentowane, niższy KO i dodatni wpływ na FCFF.' }],
        exercise: 'nwc-days',
      },
      {
        id: 'f4', title: 'Złożenie FCFF i długi horyzont',
        src: 'Minipodręcznik wyceny, wzór modelu (arkusz DCF), spotkanie z praktykiem ER (ROIC, reinvestment rate)',
        body: `${F('FCFF = EBIT × (1 − t) + amortyzacja − CAPEX − Δ kapitału obrotowego ± inne korekty')}
<p>Inne korekty to w zależności od spółki np. rezerwy czy zdarzenia jednorazowe. Każdą korektę prognozujesz osobno i uzasadniasz. Arkusz DCF we wzorze Funduszu pokazuje wiersze: przychody, koszty operacyjne, EBITDA, EBIT, stawka podatkowa, podatek, NOPAT, amortyzacja (+), CAPEX (−), zmiana KO (+/−) i FCFF.</p>
<p><b>Kontrola spójności wzrostu</b> (praktyk ER):</p>
${F('g = ROIC × stopa reinwestycji        (reinwestycje = CAPEX − amortyzacja + ΔKO; stopa = reinwestycje / NOPAT)')}
<ul><li>W długim terminie <b>ROIC → WACC</b>, bo w konkurencyjnej branży nadwyżkowe zwroty znikają.</li>
<li>Implikowany wzrost z ROIC i reinwestycji powinien odpowiadać g w TV.</li>
<li>Rosnący ROIC przy spadającej reinwestycji to sygnał ostrzegawczy.</li></ul>
${ERR(`Licząc FCFF, wzięto podatek z RZiS bez analizy stopy, a dług netto „zapomniał” odjąć gotówkę. Takie poprawki recenzent musiał wprowadzić w zaakceptowanej wycenie.`)}`,
        quiz: [{ q: 'NOPAT w ostatnim roku = 100, reinwestycje netto = 10, ROIC = 25%. Jaki wzrost implikuje to dla TV?', options: ['10%', '2,5%', '25%'], answer: 1, expl: 'Stopa reinwestycji 10/100 = 10%, a g = 25% × 10% = 2,5%. To spójne z typowym g.' }],
        exercise: 'dcf-build-fcff',
      },
    ],
  },
  {
    id: 'm7', title: 'Koszt kapitału (WACC)',
    lessons: [
      {
        id: 'c1', title: 'Stopa wolna od ryzyka i premia za ryzyko',
        src: 'Opracowanie „Wszystko w temacie kosztu kapitału”, Checklista DCF (pkt 18, 37, 41), prezentacja AWP',
        body: `${F('Ke = rf + β × ERP (+ premia za ryzyko kraju) (+ ewentualnie size premium)\nWACC = Ke × E/(D+E) + Kd × (1 − t) × D/(D+E)')}
<p><b>Stopa wolna od ryzyka (rf).</b> Teoretycznie to rentowność obligacji zerokuponowej o terminie zbliżonym do horyzontu przepływów. W praktyce bierzemy <b>10-letnie obligacje skarbowe w walucie przepływów</b> (zasada spójności walutowej): PLN to polskie 10Y, USD to US Treasuries, EUR to Bundy.</p>
<p><b>Premia za ryzyko rynkowe (ERP)</b> to Rm − rf, a nie oczekiwana stopa zwrotu z rynku. Źródłem są najnowsze zestawienia Damodarana.</p>
${STD(`Checklista: rf to rentowność polskich 10-letnich obligacji Skarbu Państwa; ERP to najbardziej aktualna wartość Damodarana; przy każdym parametrze <b>podana jest data pobrania</b> (rf, kurs akcji, market cap, ERP).`)}
${TIP(`Praktyk ER: rentowność polskich obligacji zawiera premię za ryzyko kraju, więc można ją skorygować o spread względem państwa AAA i dodać CRP osobno. Koszt kapitału ma uwzględniać tylko to, czego nie ma w przepływach. Ryzyko, które da się zamodelować w FCFF (np. możliwy podatek sektorowy), modeluj w FCFF, a nie przez doklejanie procentów do WACC.`)}`,
        quiz: [{ q: 'Wyceniasz spółkę z GPW, przepływy są w PLN. Jaka rf?', options: ['US Treasury 10Y', 'Polskie obligacje skarbowe 10Y, z datą', 'Stopa referencyjna NBP'], answer: 1, expl: 'Spójność walutowa i standard Funduszu: polskie 10Y, z datą pobrania.' }],
      },
      {
        id: 'c2', title: 'Beta: od sektora do spółki',
        src: 'Minipodręcznik wyceny, prezentacja AWP („Beta nie jest liczbą z ekranu”), Suplement informacyjny, zaakceptowane wyceny',
        body: `<p>Beta z regresji kursu spółki bywa obarczona dużym błędem, zwłaszcza przy małych, młodych i mało płynnych spółkach. Dlatego Fundusz stosuje <b>betę sektorową</b>:</p>
<ol class="steps">
<li>Weź <b>betę nielewarowaną</b> (unlevered) sektora ze strony Damodarana. Gotowe wartości unlevered są tam podane.</li>
<li><b>Zrelewaruj</b> ją do struktury kapitału spółki (formuła Hamady), z D/E w wartościach rynkowych:</li>
</ol>
${F('βL = βU × (1 + (1 − t) × D/E)')}
<ol class="steps" start="3">
<li><b>Dostosuj ekspercko</b>: bety Damodarana dotyczą rynku USA. Przykład z Minipodręcznika: Voxel (diagnostyka obrazowa) ma przychody głównie z NFZ, więc jest mniej cykliczny niż prywatna opieka zdrowotna w USA. Beta „z USA” zawyżyłaby koszt kapitału, dlatego koryguje się ją w dół.</li>
<li>Opcjonalnie dodaj <b>size premium</b> dla spółek z kapitalizacją &lt; 250 mln USD.</li>
</ol>
${ERR(`Beta przepisana z ekranu albo beta sektorowa bez relewarowania. Przy D/E 50% i becie 0,9 różnica po relewarowaniu wynosi 0,44, czyli błąd 49%. Checklista pyta: czy dokonano lewarowania bety i czy w CAPM użyto bety lewarowanej?`)}
${TIP(`W wycenie Dino: βU = 0,80, D/E (rynkowe) ≈ 2%, t = 19%, więc βL = 0,80 × (1 + 0,81 × 0,021) ≈ 0,81.`)}`,
        quiz: [{ q: 'βU sektora = 0,8, D/E = 0,5, t = 19%. Ile wynosi βL?', options: ['0,80', '1,12', '1,20'], answer: 1, expl: '0,8 × (1 + 0,81 × 0,5) = 0,8 × 1,405 ≈ 1,12.' }],
        exercise: 'beta-hamada',
      },
      {
        id: 'c3', title: 'Koszt długu i struktura kapitału',
        src: 'Minipodręcznik wyceny, Suplement informacyjny, Checklista DCF (pkt 35–38), wycena Dino (arkusz WACC), notatka ze spotkania (leasing)',
        body: `<p><b>Koszt długu (Kd)</b>, od najlepszej metody:</p>
<ol class="steps">
<li>Rentowność (YTM) <b>obligacji spółki</b>: sprawdź marżę ponad WIBOR na Catalyst i dodaj ją do rf.</li>
<li>Bez obligacji: <b>rf + szacowana marża</b>, zwykle <b>1–4%</b>. Niżej dla stabilnych i mało zadłużonych spółek, wyżej dla ryzykownych. Porównaj z obligacjami firm o podobnej wielkości, branży i strukturze finansowania.</li>
<li>Kontrolnie: <b>koszty odsetkowe z not / średni dług</b>. W Dino zsumowano odsetki od kredytów, leasingów i obligacji z not, zannualizowano je i podzielono przez dług.</li>
</ol>
${F('Kd po podatku = Kd × (1 − t)        (tarcza podatkowa: odsetki są kosztem podatkowym)')}
<p><b>Struktura kapitału:</b></p>
<ul><li><b>D</b> to wszystkie zobowiązania finansowe: kredyty, pożyczki, obligacje i <b>leasingi</b>.</li>
<li><b>E</b> to <b>kapitalizacja rynkowa</b> (kurs × liczba akcji) z podaną datą, a nie kapitał księgowy.</li></ul>
${ERR(`Komentarze z recenzji WACC: „W jaki sposób liczyłeś koszt długu? Czemu jest tak niski?” oraz „Podaj konkretną datę pobrania market capu”.`)}
<div class="callout"><b>Dlaczego tarcza jest w WACC, a nie w FCFF?</b> W FCFF opodatkowujemy cały EBIT i nie rozróżniamy, czy przepływy trafią do akcjonariuszy, czy do wierzycieli. Korzyść podatkową z odsetek ujmujemy więc, obniżając koszt długu.</div>`,
        quiz: [{ q: 'Co przyjmujesz jako E przy wagach WACC?', options: ['Kapitał własny z bilansu', 'Kapitalizację rynkową (kurs × liczba akcji) z datą', 'EV'], answer: 1, expl: 'Wagi rynkowe: wartość księgowa zniekształca D/E i betę.' }],
        exercise: 'wacc-kd',
      },
    ],
  },
  {
    id: 'm8', title: 'DCF: od FCFF do ceny za akcję',
    lessons: [
      {
        id: 'v1', title: 'Dyskontowanie i data wyceny',
        src: 'Minipodręcznik wyceny, Checklista DCF (pkt 42), prezentacja AWP („Dyskontowanie w trakcie trwania roku”), wycena Dino',
        body: `${F('PV(FCFF_t) = FCFF_t / (1 + WACC)^t')}
<ol class="steps">
<li><b>Dyskontujesz tylko przepływy przyszłe</b>, czyli po dacie wyceny. Przepływów historycznych i już zrealizowanych kwartałów nie dyskontujesz i nie wliczasz do EV.</li>
<li>Jeśli ostatnie dane są za Q2 2025, z 2025 bierzesz tylko Q3–Q4, a nie prognozę z całego roku.</li>
<li><b>Data wyceny</b> wyznacza wykładnik: pierwszy okres to ułamek roku do jego końca, kolejne to ułamek + 1, + 2… W Dino: <code>1/(1+WACC)^((rok − 2024) + (DATA − DZIŚ)/365)</code> i <code>0,25 × FCFF</code> bieżącego roku.</li>
<li>Opcjonalnie stosujesz <b>konwencję połowy roku</b> (mid-year), bo przepływy powstają w ciągu roku, a nie na jego koniec. Dyskontowanie na koniec roku zaniża wartość, zwłaszcza przy wysokim WACC.</li>
</ol>
${ERR(`Dyskontowanie danych historycznych albo pełnego roku, w którym część kwartałów już minęła. To jeden z punktów Checklisty DCF.`)}`,
        quiz: [{ q: 'Wycena na 30/06/2026, ostatnie dane za Q2 2026. Co z FCFF 2026?', options: ['Dyskontuję cały 2026', 'Biorę tylko H2 2026 (połowę rocznego FCFF lub prognozę Q3–Q4) z okresem dyskontowym 0,5 roku', 'Pomijam 2026'], answer: 1, expl: 'Dyskontujesz tylko przyszłe przepływy, a okres liczysz od daty wyceny.' }],
        exercise: 'stub-discount',
      },
      {
        id: 'v2', title: 'Wartość rezydualna (TV)',
        src: 'Minipodręcznik wyceny, Checklista DCF, prezentacja AWP, spotkanie z praktykiem ER, wzór modelu',
        body: `${F('TV_n = FCFF_n × (1 + g) / (WACC − g)        (model Gordona)\nPV(TV) = TV_n / (1 + WACC)^n')}
<ol class="steps">
<li><b>g</b> odzwierciedla długoterminowy wzrost, typowo ok. <b>2,5%</b> dla spółek z perspektywą wzrostu, a niżej dla spółek o ograniczonym rozwoju. W Funduszu g wiąże się z prognozowaną inflacją.</li>
<li>Ostatni rok prognozy musi być <b>stabilny</b>: wzrost przychodów ≈ g, CAPEX ≥ amortyzacji, stałe wskaźniki KO.</li>
<li>Sprawdź <b>udział TV w EV</b>. Praktyk ER wskazuje maksymalnie ok. <b>50–70%</b>. Wyższy oznacza, że wycena wisi na jednym założeniu.</li>
<li>Rozważ <b>osobny „rok terminalny”</b>: znormalizowany FCFF z terminalnym CAPEX i NOPAT = terminalny ROIC × kapitał zainwestowany, zamiast bezrefleksyjnego mnożenia ostatniego roku.</li>
</ol>
${ERR(`Zbyt optymistyczne g „zdominuje całą wycenę”. Brak (1 + g) w liczniku albo dyskontowanie TV o n + 1 lat to klasyczne błędy techniczne.`)}`,
        quiz: [{ q: 'TV stanowi 88% EV. Co robisz?', options: ['Nic, tak bywa', 'Sprawdzam g, normalizację ostatniego roku (CAPEX vs amortyzacja, marże) i długość prognozy; udział powyżej 50–70% to sygnał ostrzegawczy', 'Podnoszę WACC, aż spadnie'], answer: 1, expl: 'Wysoki udział TV oznacza ryzyko wyceny. Szukasz przyczyny w założeniach, a nie podkręcasz WACC.' }],
        exercise: 'dcf-build-tv',
      },
      {
        id: 'v3', title: 'Most od EV do ceny za akcję',
        src: 'Minipodręcznik wyceny, Suplement informacyjny, Checklista DCF (pkt 43–45), prezentacja AWP (NCI), uwagi z recenzji',
        body: `${F('Equity = EV − dług netto − udziały niekontrolujące (NCI)\nDług netto = kredyty + pożyczki + obligacje + leasingi − gotówka i ekwiwalenty\n          (− inwestycje krótko- i długoterminowe, jeśli nieoperacyjne)\nWartość na akcję = Equity / liczba akcji')}
<ol class="steps">
<li>Dług netto bierzesz <b>z ostatniego zaraportowanego okresu</b>.</li>
<li>Odejmujesz <b>wyłącznie zobowiązania finansowe</b>, czyli nie handlowe i nie inne operacyjne.</li>
<li><b>Dodajesz gotówkę</b> z ostatniego dostępnego okresu historycznego.</li>
<li><b>NCI</b>: jeśli spółka nie ma 100% udziałów w spółkach zależnych, odejmij udział mniejszości. Najprościej z bilansu, a dokładniej EBITDA spółki zależnej × sektorowy EV/EBITDA × udział mniejszości.</li>
</ol>
${ERR(`„W formule na dług netto nie odejmowaliście gotówki, więc de facto był to jedynie dług.” Do tego pomylenie zobowiązań handlowych z finansowymi i pominięte NCI w holdingach.`)}
<div class="callout"><b>Leasing.</b> Każda rata leasingu to odpływ gotówki, więc musisz go uwzględnić. Spójnie: zobowiązania leasingowe idą do długu, a aktywa z prawa do użytkowania do podstawy amortyzacji i CAPEX. Nie uwzględniaj go dwa razy ani wcale.</div>
<div class="callout"><b>Przyszłe emisje.</b> Model zakłada, że ewentualne przyszłe emisje kapitału i długu odbywają się po wartości wewnętrznej, więc nie zmieniają wyceny na akcję. Dlatego nie modelujemy przyszłego finansowania osobno.</div>`,
        quiz: [{ q: 'EV = 1 000, kredyty 200, leasing 50, zobowiązania handlowe 120, gotówka 80, NCI 30. Ile wynosi equity?', options: ['680', '800', '710'], answer: 1, expl: 'Dług netto = 200 + 50 − 80 = 170; equity = 1 000 − 170 − 30 = 800. Zobowiązania handlowe są w KO.' }],
        exercise: 'bridge-nci',
      },
      {
        id: 'v4', title: 'Analiza wrażliwości',
        src: 'Minipodręcznik wyceny (instrukcja tabeli danych), odpowiedzi na komentarze z recenzji, wycena Dino',
        body: `<p>Pokazuje, jak bardzo wynik zależy od założeń. Standardowo zmieniasz <b>WACC</b> (np. 7–12%) i <b>g</b> (np. 1–3%).</p>
<ol class="steps">
<li>W wierszu wpisz wartości g (np. 1,0; 1,5; 2,0; 2,5; 3,0%), a w kolumnie wartości WACC.</li>
<li>W lewym górnym rogu siatki wpisz odwołanie do komórki z ceną, np. <code>=F42</code>.</li>
<li>Zaznacz całą tabelę i wybierz <i>Dane → Analiza warunkowa → Tabela danych</i>.</li>
<li><i>Komórka wejściowa wiersza</i> to komórka z g, a <i>komórka wejściowa kolumny</i> to komórka z WACC. Zatwierdź.</li>
<li>Dodaj formatowanie warunkowe. W wycenach Funduszu pola blisko środka (przyjęte WACC i g) <b>wyszarza się</b>, żeby pokazać, jak zmienia się cena przy niewielkich zmianach.</li>
<li>Zrzut tabeli wklej w zakładce DCF w wyraźnie oznaczonej sekcji.</li>
</ol>
<p><b>Po co?</b> Jeśli cena mocno się zmienia przy małych zmianach parametrów, ryzyko błędnej wyceny jest większe. Ta informacja powinna trafić do slajdu „Analiza wrażliwości” w raporcie.</p>
${TIP(`W arkuszach case study na tej platformie tabela wrażliwości liczy się formułami NPV, bez Tabeli danych. Środek tabeli musi dać tę samą cenę co główny model. To dobra kontrola spójności.`)}`,
        quiz: [{ q: 'Środkowa komórka tabeli wrażliwości różni się od ceny w modelu. Co to znaczy?', options: ['Nic', 'Tabela jest źle podpięta: komórki wejściowe nie są tymi, z których korzysta model, albo formuły nie są spójne', 'Że WACC jest za wysoki'], answer: 1, expl: 'Środek siatki odpowiada przyjętym WACC i g, więc musi dawać cenę z modelu.' }],
      },
    ],
  },
  {
    id: 'm9', title: 'Wycena porównawcza i cena docelowa',
    lessons: [
      {
        id: 'x1', title: 'Dobór spółek porównawczych',
        src: 'Minipodręcznik wyceny, Suplement informacyjny, prezentacja AWP, Checklista DCF (pkt 32–34)',
        body: `<p>Najważniejszy element wyceny porównawczej to <b>dobór spółek</b>. Kolejność szukania:</p>
<ol class="steps">
<li>konkurenci z <b>tego samego regionu</b>;</li>
<li>konkurenci <b>spoza regionu</b>;</li>
<li>spółki z <b>szeroko pojętej branży</b> z tego samego regionu (np. Wedel + Tarczyński = spożywcza).</li>
</ol>
<p>Spółka działająca w kilku branżach: wyceń każdą działalność osobno według średnich mnożników dla danego segmentu.</p>
${STD(`Mnożniki bierz z jednolitego źródła (np. Koyfin) i normalizuj je (jednorazowe straty i zyski). Nie przyjmuj wskaźników ekstremalnych (np. 1000) ani ujemnych. Wtedy dla tej spółki nie przyjmujesz żadnej wartości. Spółki z istotnym odchyleniem od reszty grupy eliminujesz, bo zawyżają lub zaniżają wycenę.`)}
${ERR(`„Zła grupa porównawcza = błędna wycena mnożnikowa, zawsze.” Zanim dobierzesz peerów, opisz model biznesowy spółki i ustal, na czym zarabia najwięcej.`)}`,
        quiz: [{ q: 'Jeden z 5 peerów ma P/E = −35 (strata), a drugi P/E = 140 (zysk jednorazowo bliski zera). Co robisz?', options: ['Liczę średnią ze wszystkich', 'Nie przyjmuję tych wartości (ujemne i ekstremalne) i liczę na pozostałych', 'Zamieniam −35 na 35'], answer: 1, expl: 'Standard: ujemnych i ekstremalnych wskaźników nie przyjmujemy.' }],
      },
      {
        id: 'x2', title: 'Mnożniki, średnie i implikowana cena',
        src: 'Minipodręcznik wyceny, wycena Dino (arkusz „Wycena porównawcza”), prezentacja AWP, Checklista DCF',
        body: `<p><b>Mnożniki i przykładowe wagi</b> (zależą od branży): P/E 30%, P/S 10%, PEG 10%, EV/FCF 20%, EV/EBITDA 30%.</p>
${F('Implikowany mnożnik = mediana lub średnia harmoniczna peerów\nImplikowana cena (dla mnożnika) = kurs × mnożnik implikowany / mnożnik spółki\nCena z wyceny porównawczej = Σ (cena_i × waga_i)')}
<ul><li><b>Średnia arytmetyczna</b> przy outlierach zawyża wycenę. Użyj <b>mediany</b> albo <b>średniej harmonicznej</b> (ta z kolei zaniża).</li>
<li>Skrót „kurs × mnożnik peerów / mnożnik spółki” jest dokładny dla mnożników kapitałowych (P/E, P/S). Dla EV/EBITDA dokładniej jest policzyć EV = mnożnik × EBITDA, a potem odjąć dług netto i podzielić przez liczbę akcji.</li>
<li>Mnożniki forward wymagają konsensusu prognoz dla konkurencji.</li></ul>
${STD(`Checklista: czy EV/EBITDA policzono prawidłowo (spójnie licznik i mianownik, np. z leasingiem lub bez)? Czy użyto mediany albo średniej harmonicznej?`)}`,
        quiz: [{ q: 'P/E peerów: 12, 14, 15, 60. Który implikowany mnożnik jest najbardziej sensowny?', options: ['Średnia: 25,3', 'Mediana: 14,5', 'Maksimum: 60'], answer: 1, expl: 'Outlier (60) zawyża średnią. Mediana lub harmoniczna daje rozsądniejszy obraz.' }],
        exercise: 'comps-harmonic',
      },
      {
        id: 'x3', title: 'Cena docelowa i rekomendacja',
        src: 'Wycena Dino, wzór aktualizacji, plik „Wybór spółki”, prezentacja AWP',
        body: `${F('Cena docelowa = waga_DCF × wartość z DCF + waga_porównawcza × wartość z wyceny porównawczej\nPotencjał = cena docelowa / bieżący kurs − 1')}
<ul><li>W wycenach Funduszu dominuje DCF (np. <b>90/10</b> albo 80/20). Waga porównawczej zależy od jakości grupy peerów.</li>
<li>Przy słabej grupie porównawczej stosuje się <b>dyskonto</b> do wyceny porównawczej (w jednej z aktualizacji podniesiono je z 25% do 30% z powodu braku odpowiednich peerów).</li>
<li>Rekomendacja wynika z potencjału względem kursu. Progi i decyzję portfelową ustala Komitet Inwestycyjny, a model Blacka-Littermana przekłada wyceny na wagi w portfelu.</li></ul>
${STD(`Arkusz podsumowania zawiera co najmniej: przychody, EBITDA, EBIT i FCFF w okresie prognozy, g, WACC, betę, końcową wycenę akcji i analizę wrażliwości.`)}`,
        quiz: [{ q: 'DCF = 48 zł, porównawcza = 40 zł, wagi 90/10, kurs 41 zł. Ile wynosi potencjał?', options: ['+15,1%', '+3,4%', '+17,1%'], answer: 0, expl: 'Cena docelowa = 0,9 × 48 + 0,1 × 40 = 47,2 zł; 47,2 / 41 − 1 ≈ +15,1%.' }],
        exercise: 'target-weights',
      },
    ],
  },
  {
    id: 'm10', title: 'Raport, aktualizacje i portfel',
    lessons: [
      {
        id: 'z1', title: 'Raport z wyceny',
        src: '„Read me” do wzorów raportu, wzór raportu, protokół ze spotkania (format pitchów), spotkanie z praktykiem ER',
        body: `<p><b>Struktura raportu</b> (tytuły slajdów są niezmienne):</p>
<table class="tbl"><tr><th>Slajd</th><th>Zawartość</th><th>Maks.</th></tr>
<tr><td>Strona tytułowa, Wstęp</td><td>tylko nazwa, data i autorzy</td><td>–</td></tr>
<tr><td>Informacje o spółce</td><td>czym się zajmuje i tabela podstawowych danych (ticker, ISIN, kapitalizacja, EV, P/E, cena…)</td><td>1</td></tr>
<tr><td>Model biznesowy</td><td>na czym zarabia</td><td>2</td></tr>
<tr><td>Analiza jakościowa</td><td>SWOT i pięć sił Portera</td><td>1</td></tr>
<tr><td>Analiza sektora</td><td>rynek i konkurencja</td><td>2</td></tr>
<tr><td>Analiza finansowa</td><td>opcjonalnie</td><td>2</td></tr>
<tr><td>Założenia do modelu</td><td>tabela założeń DCF</td><td>1</td></tr>
<tr><td>Model DCF</td><td>opis i tabele</td><td>1</td></tr>
<tr><td>Wycena porównawcza</td><td>opis i tabela</td><td>2</td></tr>
<tr><td>Analiza wrażliwości</td><td>ocena modelu i ryzyka wyceny</td><td>1</td></tr>
<tr><td>Podsumowanie, Disclaimer</td><td>tabele i wykres</td><td>1</td></tr></table>
${STD(`Formatowanie: czcionka Lato (tekst 10, tabele 8, wykresy 12/8/6); wykres ma maksymalnie 4 elementy, a resztę zbierasz w kategorię „inne”; tabel i wykresów nie wklejasz jako obraz; numeracja stron; kolory z palety Funduszu (#B8212E i #852029 do wyróżnień, zielenie #2D4236 i #546C5A plus szarości do serii).`)}
<p><b>Styl.</b> Pitch to „story”, a nie suchy raport: wyrazista, kontrowersyjna teza obroniona argumentem. Praktyk ER: pisz to the point, bardziej prasowo niż naukowo. Teza ma się zgadzać z prognozami, a najlepiej pokazywać coś, czego rynek nie widzi.</p>`,
        quiz: [{ q: 'Wykres udziałów rynkowych ma 9 firm. Jak go pokazać według standardu?', options: ['Wszystkie 9 serii', 'Maksymalnie 4 elementy, a resztę w kategorię „inne”', 'Jako obraz z internetu'], answer: 1, expl: 'Standard: maksymalnie 4 elementy na wykresie dla czytelności.' }],
      },
      {
        id: 'z2', title: 'Aktualizacja wyceny',
        src: 'Wzór aktualizacji, przykładowe aktualizacje wycen Funduszu, Plan na rok 2026/2027',
        body: `<p>Aktualizacja to krótki dokument po nowych wynikach albo istotnej informacji. Struktura według wzoru:</p>
<ol class="steps">
<li><b>Co się stało</b>: wyniki vs konsensus (tabela różnic) i reakcja rynku.</li>
<li><b>Kluczowe czynniki</b>: na przykład komentarz zarządu o trendach po kwartale albo zmiana kursów walut.</li>
<li><b>Wpływ na wycenę w liczbach</b>, np. „wyniki obniżyły wartość na akcję o ok. 6,5%, z czego kursy walut o ok. 8%, częściowo zrównoważone niższą stopą podatkową”.</li>
<li><b>Lista zmian w modelu</b>: kursy, wzrost sprzedaży, koszty, stopa podatkowa, dyskonto w porównawczej, poprawki błędów (np. CIT w kapitale obrotowym).</li>
<li><b>Nowa cena docelowa</b> z rozbiciem na DCF i porównawczą oraz disclaimer.</li>
</ol>
${STD(`Termin: najpóźniej miesiąc od publikacji wyników (po istotnej informacji cenotwórczej w ciągu 3 tygodni). Na spotkaniu aktualizacja ma maks. 10 minut „krótkiego przelotu”.`)}
${TIP(`Przygotuj „wycenę do szuflady” dla ważnego scenariusza, np. zakończenia wojny w Ukrainie w wycenie producenta farb. Gdy prawdopodobieństwo scenariusza gwałtownie rośnie, publikujesz aktualizację od razu. Scenariusze buduj tylko wtedy, gdy wycenie to się przyda.`)}`,
        quiz: [{ q: 'Wyniki spółki są zgodne z konsensusem, ale złoty umocnił się o 5% wobec USD, a spółka sprzedaje w USA. Czy aktualizować?', options: ['Nie, wyniki zgodne', 'Tak, bo kurs to istotny czynnik wyceny. W przykładzie z aktualizacji Funduszu to waluty miały największy wpływ', 'Tylko jeśli kurs akcji spadnie'], answer: 1, expl: 'Aktualizacja obejmuje wszystkie istotne czynniki, nie tylko wyniki.' }],
      },
      {
        id: 'z3', title: 'Ryzyko portfela i zasady alokacji',
        src: 'Suplement informacyjny (strategia zarządzania kapitałem), prezentacja Działu Zarządzania Ryzykiem, karty ryzyka, notatka o raportowaniu',
        body: `<p>Wycena to dopiero początek. Decyzję o portfelu podejmuje Komitet Inwestycyjny, a ryzyko niezależnie monitoruje <b>Dział Zarządzania Ryzykiem</b>.</p>
<p><b>Limity z polityki</b> (aktualne wartości sprawdzaj w polityce inwestycyjnej):</p>
<ul><li>Suplement: jedna transakcja maks. 10% portfela, jeden sektor maks. 20%, w jednym subsektorze maks. jedna pozycja, a pozycja powyżej 15% jest redukowana do 10%.</li>
<li>Prezentacja Działu Ryzyka: pojedyncza spółka 5–9% portfela akcyjnego, sektor maks. 40%, a dryf wagi &gt; 0,25 p.p. to sygnał do rebalancingu.</li>
<li>Alerty: zmienność 60D &gt; 11% wymaga przeglądu, korelacja spółek &gt; 0,8 analizy dywersyfikacji, a 3 dni ze stratą &gt; 3% w ciągu 10 dni wstrzymanie transakcji.</li></ul>
<p><b>Metryki z karty ryzyka:</b> zmienność (σ), <b>VaR 95%</b> (strata, której z 95% pewnością nie przekroczymy w ciągu dnia), <b>Expected Shortfall</b> (średnia strata w najgorszych 5% dni), <b>max drawdown</b>, Sharpe, Sortino, beta, korelacje i wkład spółki w ryzyko portfela.</p>
<p><b>Model:</b> Risk Parity jako punkt wyjścia oraz <b>Black-Litterman</b>, który łączy rynek z „widokami” Funduszu, czyli upside z wycen. Stąd wyceny analityków bezpośrednio wpływają na wagi.</p>
${STD(`Po każdym rebalancingu powstaje raport: wynik portfela, zmiany w składzie z uzasadnieniem, komentarz analityków, ocena ryzyka (koncentracja, ekspozycje) i najważniejsze wnioski.`)}`,
        quiz: [{ q: 'VaR 1D 95% portfela wynosi 580 zł. Co to znaczy?', options: ['Portfel na pewno nie straci więcej niż 580 zł', 'W 95% dni dzienna strata nie przekroczy ok. 580 zł; w pozostałych 5% może być większa (to mierzy ES)', 'Średni dzienny zysk to 580 zł'], answer: 1, expl: 'VaR to kwantyl rozkładu strat. To, co dzieje się w ogonie, opisuje Expected Shortfall.' }],
      },
      {
        id: 'z4', title: 'Checklista przed oddaniem wyceny',
        src: 'Checklista DCF Funduszu (wersja zaktualizowana, 45 punktów), skrócona',
        body: `<p>Przejdź ją punkt po punkcie przed wysłaniem modelu do Komitetu. Recenzent przejdzie ją i tak.</p>
<div class="checklist">
<h3>Analiza spółki i sektora</h3>
<label><input type="checkbox"> Raporty i konferencje z ostatnich 2 lat przejrzane; przewagi konkurencyjne określone i ocenione.</label>
<label><input type="checkbox"> Rozmiar rynku (obecny i prognozowany), CAGR ze źródłami, natężenie konkurencji.</label>
<label><input type="checkbox"> Średnie branżowe dla marż, KO i CAPEX; łańcuch dostaw; czynniki poza kontrolą firmy i siła ich wpływu; trendy.</label>
<h3>Prognozy</h3>
<label><input type="checkbox"> Etap rozwoju określony; długość prognozy dopasowana (stabilne 5–6 lat, rosnące 8–10).</label>
<label><input type="checkbox"> Prognoza kwartalna do końca roku obrotowego; odchylenia od trendu i one-offy wyjaśnione.</label>
<label><input type="checkbox"> Źródła i <b>daty</b> wszystkich założeń (rf, kurs, market cap, sektor Damodarana).</label>
<label><input type="checkbox"> Wzrost przychodów wymaga mocy produkcyjnych? Jeśli tak, policzony CAPEX i zatrudnienie.</label>
<label><input type="checkbox"> Wzrost w ostatnim roku = g; założenia spójne z makro (inflacja, PKB, płace) i specyfiką sektora.</label>
<label><input type="checkbox"> Każda zmiana udziału kosztów uzasadniona; koszty finansowe wynikają z pozycji bilansowych; zmiana marży EBITDA uzasadniona.</label>
<h3>CAPEX i KO</h3>
<label><input type="checkbox"> CAPEX ≥ amortyzacja w ostatnim roku; CAPEX/przychody realistyczny; finansowanie inwestycji opisane; reinwestycje w ostatnim roku.</label>
<label><input type="checkbox"> KO zawiera wszystkie pozycje operacyjne (bez CIT); wskaźniki stałe w 2 ostatnich latach; DSO, DPO, DIO zbiegają do branży.</label>
<h3>WACC</h3>
<label><input type="checkbox"> Dług = wszystkie zobowiązania finansowe (kredyty, pożyczki, leasingi, obligacje); E = market cap z datą.</label>
<label><input type="checkbox"> rf = PL 10Y; koszt długu realistyczny i zgodny z notami; beta zrelewarowana i użyta w CAPM; ERP aktualne, z datą.</label>
<h3>DCF i porównawcza</h3>
<label><input type="checkbox"> Nie dyskontuję historii (tylko pozostałe kwartały bieżącego roku).</label>
<label><input type="checkbox"> NCI odjęte; gotówka z ostatniego okresu dodana; od EV odjęte tylko zobowiązania finansowe.</label>
<label><input type="checkbox"> EV/EBITDA policzony poprawnie; mediana lub średnia harmoniczna; outliery wyeliminowane.</label>
</div>
${TIP(`Checklistę możesz też przerobić w praktyce: w zakładce Case studies zbuduj model i sprawdź go punkt po punkcie.`)}`,
        quiz: [
          { q: 'Ostatni rok prognozy: amortyzacja 120, CAPEX 80. Co mówi checklista?', options: ['OK', 'Błąd: amortyzacja nie może przewyższać CAPEX w ostatnim roku prognozy', 'Trzeba obniżyć amortyzację do zera'], answer: 1, expl: 'Punkt CAPEX: długoterminowy CAPEX musi korespondować z amortyzacją.' },
          { q: 'Które zobowiązania odejmujesz od EV?', options: ['Wszystkie zobowiązania z bilansu', 'Wyłącznie finansowe: kredyty, pożyczki, leasingi, obligacje (minus gotówka) oraz NCI', 'Tylko kredyty'], answer: 1, expl: 'Ostatnie punkty checklisty DCF.' },
        ],
      },
    ],
  },
];
