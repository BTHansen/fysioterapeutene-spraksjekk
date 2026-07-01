/* ============================================================
   Språksjekken – logikk. Krever at datafilene er lastet først:
   data/nff-regler.js, data/kansellisten.js, data/nrk.js, data/avloserord.js
   ============================================================ */

/* ---------- hjelpere ---------- */
function esc(s){return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function reFor(term){
  const e = term.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return new RegExp("(?<![\\wæøåÆØÅ])("+e+")(?![\\wæøåÆØÅ])","gi");
}

const input    = document.getElementById("input");
const backdrop = document.getElementById("backdrop");
const findingsEl = document.getElementById("findings");

function analyser(){
  const text = input.value;
  let ranges = [];

  // 1) Harde regler
  REGLER.hard.poster.forEach(p=>{
    let m; p.re.lastIndex=0;
    while((m=p.re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:"hard",label:REGLER.hard.label,
        word:m[0],why:p.why,fix:p.fix,prio:5});
      if(m.index===p.re.lastIndex)p.re.lastIndex++;
    }
  });

  // 2) Byråkratiske ord
  for(const [ord,forslag] of Object.entries(REGLER.byra.ord)){
    const re=reFor(ord);let m;
    while((m=re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:"byra",label:REGLER.byra.label,
        word:m[0],why:REGLER.byra.why,fix:"Prøv: <b>"+forslag+"</b>",prio:3});
    }
  }

  // 3) Passiv
  REGLER.passiv.ord.forEach(ord=>{
    const re=reFor(ord);let m;
    while((m=re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:"passiv",label:REGLER.passiv.label,
        word:m[0],why:REGLER.passiv.why,fix:REGLER.passiv.fix,prio:2});
    }
  });

  // 4) Påståelig / arrogant
  REGLER.paastaelig.ord.forEach(ord=>{
    const re=reFor(ord);let m;
    while((m=re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:"paastaelig",label:REGLER.paastaelig.label,
        word:m[0],why:REGLER.paastaelig.why,fix:REGLER.paastaelig.fix,prio:2});
    }
  });

  // 5) Fagsjargong – flagges alltid, bør forklares
  for(const [ord,forklaring] of Object.entries(REGLER.fag.ord)){
    const re=reFor(ord);let m;
    while((m=re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:"fag",label:REGLER.fag.label,
        word:m[0],why:REGLER.fag.why,fix:"Bør forklares. Betyr: "+forklaring,prio:2});
    }
  }

  // 5b) Fagord (soft) – kontekstavhengig
  for(const [ord,forklaring] of Object.entries(REGLER.fagsoft.ord)){
    const re=reFor(ord);let m;
    while((m=re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:"fagsoft",label:REGLER.fagsoft.label,
        word:m[0],why:REGLER.fagsoft.why,fix:"Vurder forklaring ut fra konteksten. Betyr: "+forklaring,prio:1});
    }
  }

  // 6) Gjentatte ord ("og og")
  const reRep=/(?<![\wæøåÆØÅ])([a-zæøåA-ZÆØÅ]{2,})\s+\1(?![\wæøåÆØÅ])/gi;
  let mr;
  while((mr=reRep.exec(text))!==null){
    ranges.push({s:mr.index,e:mr.index+mr[0].length,cat:"gjentakelse",label:"Ordet er gjentatt",
      word:mr[0],why:"Samme ord står to ganger etter hverandre.",fix:"Fjern det ene.",prio:4});
  }

  // 7) Manglende komma foran "men"
  const reMen=/[^,\s]\s+(men)(?=\s)/gi;
  let mm;
  while((mm=reMen.exec(text))!==null){
    const menStart=mm.index+mm[0].length-3;
    ranges.push({s:menStart,e:menStart+3,cat:"komma",label:"Komma foran «men»",
      word:"men",why:"Det skal som regel være komma foran «men».",fix:"Sett komma: «…, men …».",prio:1});
  }

  // 8) NRKs ordlister (gjelder alltid, uavhengig av målgruppe)
  NRK.forEach(([ord,bruk,forklaring,src])=>{
    const re=reFor(ord);let m;const k=NRK_KILDER[src];
    const cat = bruk==="1" ? "nrk1" : "nrk2";
    while((m=re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:cat,
        word:m[0],why:forklaring,fix:"",
        kilde:k.kilde+" · <a href='"+k.lenke+"' target='_blank' rel='noopener'>kilde</a>",
        prio: bruk==="1"?4:2});
    }
  });

  // 9) Kansellisten (Språkrådet)
  KANSELLISTEN.forEach(([ord,alt])=>{
    const re=reFor(ord);let m;
    while((m=re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:"kanselli",
        word:m[0],why:"Utdatert eller unødig vanskelig ord.",fix:"Skriv heller: <b>"+alt+"</b>",
        kilde:KANSELLI_KILDE,prio:3});
    }
  });

  // 10) Personopplysninger (e-post, telefon, fødselsnummer)
  const personRe=[
    {re:/([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,type:"E-postadresse"},
    {re:/(?<!\d)(\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}|\d{3}[-.\s]?\d{2}[-.\s]?\d{3})(?!\d)/g,type:"Mulig telefonnummer"},
    {re:/(?<!\d)(\d{6}\s?\d{5})(?!\d)/g,type:"Mulig fødselsnummer"}
  ];
  personRe.forEach(p=>{let m;p.re.lastIndex=0;
    while((m=p.re.exec(text))!==null){
      ranges.push({s:m.index,e:m.index+m[0].length,cat:"person",
        word:m[0],why:p.type+". Vurder om dette bør stå i teksten.",fix:"",prio:5});
      if(m.index===p.re.lastIndex)p.re.lastIndex++;
    }
  });

  // 11) Avløserord (Språkrådet) – norske ord for importord
  if(typeof AVLOSERORD!=="undefined"){
    AVLOSERORD.forEach(([imp,avl])=>{
      const re=reFor(imp);let m;
      while((m=re.exec(text))!==null){
        ranges.push({s:m.index,e:m.index+m[0].length,cat:"import",
          word:m[0],why:"Importord. Det finnes norske ord du kan bruke.",
          fix:"Norsk: <b>"+avl+"</b>",
          kilde:"Avløserord (Språkrådet) · <a href='https://www.sprakradet.no/sprakhjelp/Skriverad/Avloeysarord/' target='_blank' rel='noopener'>kilde</a>",
          prio:1});
      }
    });
  }

  // ---- løs overlapp: sorter etter start, så prioritet ----
  ranges.sort((a,b)=> a.s-b.s || b.prio-a.prio);
  const valgt=[];let lastEnd=-1;
  for(const r of ranges){ if(r.s>=lastEnd){valgt.push(r);lastEnd=r.e;} }

  // ---- bygg highlight-HTML ----
  let html="";let pos=0;
  for(const r of valgt){
    html+=esc(text.slice(pos,r.s));
    html+="<mark class='"+r.cat+"'>"+esc(text.slice(r.s,r.e))+"</mark>";
    pos=r.e;
  }
  html+=esc(text.slice(pos));
  backdrop.innerHTML=html+"\n";

  // ---- lange setninger (NAV: 21 ord eller mer) ----
  const setninger=text.split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);
  const langeSetn=[];
  setninger.forEach(s=>{
    const n=(s.match(/\S+/g)||[]).length;
    if(n>=21)langeSetn.push({s,n});
  });
  langeSetn.sort((a,b)=>b.n-a.n);

  // ---- lange ord (NAV/LIX: over 6 bokstaver) ----
  const alleOrd=(text.toLowerCase().match(/[a-zæøå]+/g)||[]);
  const langeOrdSett=[...new Set(alleOrd.filter(o=>o.length>6))].sort((a,b)=>b.length-a.length);

  // ---- lange avsnitt (NAV: 4 setninger eller mer) ----
  const langeAvsnitt=[];
  text.split(/\n+/).map(a=>a.trim()).filter(Boolean).forEach(a=>{
    const n=a.replace(/([.?!])\s*(?=[A-ZÆØÅ])/g,"$1|").split("|").filter(x=>x.trim()).length;
    if(n>=4)langeAvsnitt.push({a,n});
  });

  visFunn(valgt,{langeSetn,langeOrd:langeOrdSett,langeAvsnitt});
  visMaal(text,setninger);
}

function visFunn(valgt,extra){
  const {langeSetn,langeOrd,langeAvsnitt}=extra;
  const order=["hard","person","nrk1","nrk2","kanselli","byra","passiv","paastaelig","import","fag","fagsoft","gjentakelse","komma"];
  const titler={hard:"Aldri",person:"Mulige personopplysninger",
    nrk1:"Diskriminerende eller utdatert – skal ikke brukes",nrk2:"Omtale med omtanke",
    kanselli:"Kansellisten – utdatert ord",byra:"Tunge ord",passiv:"Passiv",
    paastaelig:"Påståelig / arrogant",import:"Importord – norsk finnes",
    fag:"Fagsjargong – bør forklares",fagsoft:"Fagord – vurder forklaring",
    gjentakelse:"Gjentatt ord",komma:"Komma foran «men»"};
  const grupper={}; order.forEach(k=>grupper[k]=[]);
  valgt.forEach(r=>{ if(grupper[r.cat])grupper[r.cat].push(r); });

  const total=valgt.length+langeSetn.length+langeOrd.length+langeAvsnitt.length;
  document.getElementById("f-antall").textContent=total;
  const sr=document.getElementById("sr-status"); if(sr)sr.textContent=total===0?"Ingen funn":total+" funn";

  if(total===0){
    findingsEl.innerHTML="<div class='empty'><span class='ok'>Ingen funn.</span> Teksten følger reglene verktøyet sjekker.</div>";
    return;
  }
  let html="";
  order.forEach(cat=>{
    const arr=grupper[cat]; if(!arr.length)return;
    html+="<div class='fgroup'><h3><span class='swatch s-"+cat+"'></span>"+titler[cat]+" ("+arr.length+")</h3>";
    arr.forEach(r=>{
      html+="<div class='finding lb-"+cat+"'><div class='w'>"+esc(r.word)+"</div>"+
            "<div class='why'>"+r.why+"</div>"+
            (r.fix?"<div class='fix'>"+r.fix+"</div>":"")+
            (r.kilde?"<div class='kilde'>"+r.kilde+"</div>":"")+"</div>";
    });
    html+="</div>";
  });
  if(langeSetn.length){
    html+="<div class='fgroup'><h3><span class='swatch s-lang'></span>Lange setninger ("+langeSetn.length+")</h3>";
    langeSetn.forEach(o=>{
      const kort=o.s.length>110?o.s.slice(0,110)+"…":o.s;
      html+="<div class='finding lb-lang'><div class='w'>"+o.n+" ord</div>"+
            "<div class='why'>"+esc(kort)+"</div>"+
            "<div class='fix'>Del opp. Setninger over 20 ord er tunge å lese.</div></div>";
    });
    html+="</div>";
  }
  if(langeAvsnitt.length){
    html+="<div class='fgroup'><h3><span class='swatch s-avsnitt'></span>Lange avsnitt ("+langeAvsnitt.length+")</h3>";
    langeAvsnitt.forEach(o=>{
      const f=(o.a.match(/^[^.!?]*[.!?]/)||[o.a])[0];
      html+="<div class='finding lb-avsnitt'><div class='w'>"+o.n+" setninger</div>"+
            "<div class='why'>"+esc(f.length>110?f.slice(0,110)+"…":f)+"</div>"+
            "<div class='fix'>Et avsnitt bør ha to til tre setninger.</div></div>";
    });
    html+="</div>";
  }
  if(langeOrd.length){
    const vis=langeOrd.slice(0,20);
    html+="<div class='fgroup'><h3><span class='swatch s-langord'></span>Lange ord ("+langeOrd.length+")</h3>";
    html+="<div class='finding lb-langord'><div class='why'>Ord over seks bokstaver regnes som lange (LIX). De lengste:</div>"+
          "<div class='fix' style='color:inherit'>"+vis.map(w=>esc(w)+" <span style='color:#5e6a7e'>("+w.length+")</span>").join(", ")+
          (langeOrd.length>20?" …":"")+"</div></div></div>";
  }
  findingsEl.innerHTML=html;
}

function visMaal(text,setninger){
  const ord=text.match(/[\wæøåÆØÅ]+/g)||[];
  const antallOrd=ord.length;
  const antallSetn=setninger.length||(antallOrd?1:0);
  const snitt=antallSetn?Math.round(antallOrd/antallSetn):0;
  const langeOrd=ord.filter(o=>o.length>6).length;
  const lix=antallOrd?Math.round(antallOrd/Math.max(antallSetn,1)+langeOrd*100/antallOrd):0;

  document.getElementById("m-ord").textContent=antallOrd;
  document.getElementById("m-setn").textContent=antallSetn;
  document.getElementById("m-snitt").textContent=snitt;
  document.getElementById("m-lix").textContent=lix;

  let tekst,pct;
  if(lix<34){tekst="LIX "+lix+" – enkel å lese";}
  else if(lix<44){tekst="LIX "+lix+" – middels å lese";}
  else{tekst="LIX "+lix+" – vanskelig å lese";}
  document.getElementById("m-lix-tekst").textContent=tekst;
  pct=Math.max(0,Math.min(100,(lix-20)/40*100));
  document.getElementById("lix-dot").style.left=pct+"%";
}

/* scroll-synk overlay */
input.addEventListener("scroll",()=>{backdrop.scrollTop=input.scrollTop;backdrop.scrollLeft=input.scrollLeft;});
input.addEventListener("input",analyser);
document.getElementById("btn-tom").addEventListener("click",()=>{input.value="";analyser();input.focus();});
document.getElementById("btn-eksempel").addEventListener("click",()=>{
  input.value="Vedrørende den nye ordningen ønsker NFF å informere samtlige medlemmer. "+
  "I henhold til vedtaket vil tiltaket iverksettes fra høsten, og dette skal naturligvis gjennomføres i samråd med tillitsvalgte. "+
  "Fysioterapeuter kan avlaste fastleger og dermed bidra til at flere pasienter blir behandlet raskere, noe som åpenbart er bra for folkehelsen og for kommunene som sliter med å rekruttere og som derfor trenger flere hender i tjenesten. "+
  "Vi vil også nå fysioterapeuter med utenlandsk bakgrunn og legge til rette for brukere med spesielle behov. "+
  "Vi gir feedback innen deadline. "+
  "Medlemmer som har spørsmål vedrørende MNFF eller takst A7 kan kontakte forbundet på post@fysio.no eller 22 93 30 50.";
  analyser();input.focus();
});

/* Esc lukker LIX-popupen (WCAG 1.4.13) */
const lixCell=document.querySelector(".lix-cell");
if(lixCell){
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){lixCell.classList.add("tip-hidden");if(document.activeElement===lixCell)lixCell.blur();}});
  lixCell.addEventListener("mouseenter",()=>lixCell.classList.remove("tip-hidden"));
  lixCell.addEventListener("focus",()=>lixCell.classList.remove("tip-hidden"));
}

analyser();
