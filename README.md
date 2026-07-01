# Språksjekken – Norsk Fysioterapeutforbund

Et skriveverktøy som gir umiddelbar tilbakemelding på tekst, bygget på forbundets
merkevareplattform. Alt kjører i nettleseren. Ingen tekst sendes noe sted.

Inspirert av NAVs Klarspråkshjelpen (github.com/navikt/spraksjekk), tilpasset NFF.

## Slik er prosjektet bygd

Byggefritt statisk nettsted. Ingen npm, ingen kompilering. Åpne `index.html`
i en nettleser, eller publiser mappa som den er.

```
index.html            markup, design (CSS) og innlasting av filene under
spraksjekk.js         logikken (analyse, visning, lesbarhet)
data/
  nff-regler.js       NFFs egne regler: harde regler, tunge ord, passiv,
                      påståelig, fagsjargong, fagord (soft). REDIGER HER.
  kansellisten.js     Språkrådets kanselliste
  nrk.js              NRKs flerkulturelle ordliste + ordliste for funksjonsmangfold
  avloserord.js       Språkrådets avløserord (importord -> norsk)
.nojekyll             slår av Jekyll på GitHub Pages
```

## Redigere ordlistene

Åpne fila i `data/` og rediger. Ingen byggesteg – lagre og last siden på nytt.

- Legge til et fagord som bør forklares: åpne `data/nff-regler.js`, finn `fag`,
  legg til en linje: `"nytt ord":"kort forklaring",`
- Kontekstavhengig fagord (soft, lyseblå): legg det i `fagsoft` i samme fil.
- De harde reglene (aldri «NFF», aldri «avlaste …») ligger øverst i `nff-regler.js`.
- Ordene i `kansellisten.js`, `nrk.js` og `avloserord.js` er hentet fra Språkrådet
  og NRK. Rediger bare hvis dere bevisst vil avvike fra kildene.

Formatet er enkelt: hver oppføring er `["ord", "forklaring eller forslag"]`
(NRK har i tillegg et brukstall og en kilde).

## Publisere på GitHub Pages

1. Lag et nytt repo på GitHub (f.eks. `nff-spraksjekk`).
2. Last opp alle filene i denne mappa (behold mappestrukturen, ta med `.nojekyll`).
3. Repo -> Settings -> Pages -> Build and deployment -> Source: «Deploy from a branch»,
   Branch: `main`, mappe `/ (root)`. Lagre.
4. Siden blir tilgjengelig på `https://<brukernavn>.github.io/nff-spraksjekk/`.

## Kilder

- Kansellisten og avløserord: Språkrådet
- Flerkulturell ordliste og ordliste for funksjonsmangfold: NRK
- Merkevareplattform og fagtermer: Norsk Fysioterapeutforbund

## Tilgjengelighet

Verktøyet er gjennomgått mot WCAG 2.1 AA: kontrast, synlig fokus, tastaturbruk,
skjermleser-etikett på tekstfeltet, aria-live på funn, og Esc lukker LIX-popupen.
