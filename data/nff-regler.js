/* ============================================================
   NFF-REGLER — forbundets egne regler. Rediger fritt.

   SLIK LEGGER DU TIL EN HEL NY KATEGORI (kun i denne fila):
   Lim inn en ny blokk med en egen nøkkel, og sett:
     type   : "ordbok" = ord med forslag  |  "liste" = ord som flagges  |  "regex" = mønster
     color  : "#RRGGBB" = fargen kategorien får i verktøyet
     label  : overskriften som vises
     why    : forklaringen
     prio   : tall (høyere vinner ved overlapp; 5 = høyest)
     ord    : { "ord":"forslag", ... }  for ordbok
              [ "ord", "ord", ... ]      for liste
     fixPrefix : (kun ordbok) tekst foran forslaget, f.eks. "Skriv heller: "
     fix    : (kun liste) fast råd som vises
   Du trenger IKKE endre spraksjekk.js eller index.html for en ny kategori.
   ============================================================ */
const REGLER = {
  // HARDE REGLER (rød). Disse er absolutte i NFFs språk.
  hard: {
    type: "regex",
    label: "Aldri",
    color: "#c8102e",
    prio: 5,
    poster: [
      // NFF -> skriv ut fullt navn
      { re: /(?<![\wæøåÆØÅ])NFFs?(?![\wæøåÆØÅ])/g,
        why: "Vi forkorter ikke forbundets navn.",
        fix: "Skriv «Norsk Fysioterapeutforbund» (eller «forbundet» ved gjentakelse)." },
      // Aldri "avlaste" leger/andre yrkesgrupper
      { re: /(?<![\wæøåÆØÅ])avlast(?:e|er|et|a|es)?\s+(?:fastleg\w*|legen\w*|legene|leger|lege\b|andre\s+yrkesgrupp\w*|andre\s+helsepersonell|helsepersonell|sykehus\w*|kommunen\w*)/gi,
        why: "Fysioterapeuter er selvstendige behandlere og helsepersonell med høyere utdanning. Vi bør være forsiktige med å si vi avlaster andre yrkesgrupper.",
        fix: "Skriv hva fysioterapeutens bidrag betyr: «gir mindre press på», «frigjør tid», «fjerner unødvendig dobbeltarbeid», «løser problemet med en gang»." }
    ]
  },

  // MODERNE TUNGE ORD (gul). Ord som ikke står i Kansellisten, men gjør teksten unødig tung.
  byra: {
    type: "ordbok",
    label: "Tungt ord – vurder velge et enklere",
    color: "#c97a00",
    prio: 3,
    why: "Kan gjøre teksten unødig byråkratisk. Merkevaren er mindre byråkratisk og mer menneskelig.",
    fixPrefix: "Prøv: ",
    ord: {
      "i henhold til":"etter / ifølge", "i forbindelse med":"ved / for",
      "med henblikk på":"for å", "herved":"(kan ofte sløyfes)",
      "foreligger":"finnes / er", "fremlegge":"legge fram / vise",
      "iverksette":"sette i gang / starte", "iverksettes":"settes i gang",
      "igangsette":"sette i gang", "implementere":"innføre / ta i bruk",
      "implementering":"innføring", "initiere":"starte", "anmode":"be om",
      "anmodning":"forespørsel", "benytte":"bruke", "benyttes":"brukes",
      "erholde":"få", "vederlag":"betaling", "tilstrekkelig":"nok",
      "øvrige":"andre / resten", "inneha":"ha", "påse":"sørge for / passe på",
      "grunnet":"på grunn av", "hensyntatt":"tatt hensyn til", "tilkjennegi":"vise / si",
      "vil kunne":"kan", "i og med at":"fordi", "samt":"og", "dersom":"hvis",
      "fordres":"kreves / trengs"
    }
  },

  // PASSIV (lilla). «Løsningsorientert, men ikke passiv».
  passiv: {
    type: "liste",
    label: "Passiv – skriv hvem som gjør det",
    color: "#6a4ca0",
    prio: 2,
    why: "Passiv form skjuler hvem som handler. Vær tydelig på hvem som gjør hva.",
    fix: "Skriv aktivt: «Forbundet gjennomfører …», «Vi vurderer …».",
    ord: ["gjennomføres","vurderes","besluttes","anbefales","igangsettes","iverksettes",
          "fremmes","ivaretas","håndteres","behandles","prioriteres","gjennomgås",
          "utbetales","tilbys","oversendes","fastsettes","utarbeides","foretas"]
  },

  // PÅSTÅELIG / ARROGANT (amber). «Tydelig, men ikke påståelig», «Kunnskapsrik, men ikke arrogant».
  paastaelig: {
    type: "liste",
    label: "Kan virke påståelig eller arrogant",
    color: "#e0a93a",
    prio: 2,
    why: "Merkevaren er tydelig, men ikke påståelig, og kunnskapsrik uten å være arrogant.",
    fix: "Underbygg med fakta i stedet for å slå fast.",
    ord: ["åpenbart","selvfølgelig","naturligvis","uten tvil","alle vet","enhver forstår",
          "som kjent","det sier seg selv","åpenbar","udiskutabelt"]
  },

  // FAGSJARGONG / FORKORTELSER (blå). Flagges alltid – bør forklares for lesere utenfor faget.
  fag: {
    type: "ordbok",
    label: "Fagsjargong – bør forklares",
    color: "#1f6fb2",
    prio: 2,
    why: "Fagsjargong eller forkortelse som kan være ukjent utenfor profesjonen.",
    fixPrefix: "Bør forklares. Betyr: ",
    ord: {
      "MNFF":"spesialist godkjent av Norsk Fysioterapeutforbund",
      "ASA 4313":"avtalen mellom KS og staten om driftstilskudd til fysioterapeuter",
      "takst A7":"egen takst for spesialister",
      "A2k":"tidligere navn på takst A7",
      "Helfo":"Helseøkonomiforvaltningen, som utbetaler refusjon",
      "NPE":"Norsk pasientskadeerstatning",
      "NUF":"Nyutdannede fysioterapeuter (utvalg i forbundet)",
      "fastlønnstilskudd":"statlig tilskudd til kommunalt ansatte fysioterapeuter",
      "triagering":"sortering av pasienter etter hvor mye det haster",
      "primærkontakt":"den pasienten kan oppsøke direkte uten henvisning",
      "Unio":"hovedorganisasjonen Norsk Fysioterapeutforbund er tilknyttet",
      "KS":"kommunenes arbeidsgiverorganisasjon",
      "Spekter":"arbeidsgiverforeningen for blant annet sykehusene",
      "Virke":"arbeidsgiverorganisasjon i privat tjenestesektor",
      "Fysiofondet":"fond for etter- og videreutdanning av fysioterapeuter",
      "tariff":"samlebetegnelse på avtalt lønn og arbeidsvilkår",
      "tariffavtale":"avtale om lønn og vilkår mellom partene i arbeidslivet",
      "hovedtariffavtale":"den sentrale lønnsavtalen i en sektor",
      "hovedavtale":"grunnavtalen om samarbeid og medbestemmelse i arbeidslivet",
      "autorisasjon":"offentlig godkjenning som helsepersonell",
      "kollegaveiledning":"strukturert veiledning mellom kolleger, del av spesialistordningen"
    }
  },

  // FAGORD – kontekstavhengig (soft). Kan trenge forklaring ut fra hvem som leser.
  fagsoft: {
    type: "ordbok",
    label: "Fagord – vurder forklaring",
    color: "#5b7fa6",
    prio: 1,
    why: "Litt fagspråk. Ut fra konteksten kan det trenge en forklaring.",
    fixPrefix: "Vurder forklaring ut fra konteksten. Betyr: ",
    ord: {
      "takst":"fastsatt sats for hva en behandling gir i refusjon",
      "refusjon":"det folketrygden dekker av behandlingen",
      "egenandel":"det pasienten selv betaler",
      "driftstilskudd":"offentlig tilskudd til avtalefysioterapeuter",
      "avtalehjemmel":"rett til å drive med kommunalt driftstilskudd"
    }
  },

  // PERSONFØRST-SPRÅK (cyan). Sett mennesket først, ikke diagnosen.
  personforst: {
    type: "ordbok",
    label: "Skriv personen først",
    color: "#0e7490",
    prio: 2,
    why: "Sett mennesket først. En person er mer enn diagnosen.",
    fixPrefix: "Skriv heller: ",
    ord: {
      "dement":"person med demens",
      "funksjonshemmet":"person med funksjonsnedsettelse",
      "funksjonsnedsatt":"person med funksjonsnedsettelse",
      "synshemmet":"person med synshemming",
      "bevegelseshemmet":"person med bevegelseshemming",
      "hørselshemmet":"person med hørselshemming"
    }
  }
};
