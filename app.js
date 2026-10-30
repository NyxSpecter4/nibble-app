// Nibble — software-only v0.1.1
// Offline PWA. Installable on Android (Add to Home Screen).
// Uses embedded core pack. Honest refusal outside pack.

const PACK = [
  { id:"c01", claim:"The Earth is flat.", verdict:"refuted", confidence:0.95, blast:"Navigation, satellites, and global logistics would fail.", check:"Direct observation of curvature, satellite imagery, and circumnavigation.", falsify:"A successful flat-Earth consistent model that predicts GPS and seasons." },
  { id:"c02", claim:"Vaccines cause autism.", verdict:"refuted", confidence:0.98, blast:"Public health campaigns and herd immunity.", check:"Large cohort studies and meta-analyses show no causal link.", falsify:"A well-powered study demonstrating a causal mechanism." },
  { id:"c03", claim:"Water boils at 100°C at sea level.", verdict:"supported", confidence:0.99, blast:"Cooking and industrial processes.", check:"Standard atmospheric pressure measurement.", falsify:"Repeated measurement under controlled conditions showing a different temperature." },
  { id:"c04", claim:"This product will make you rich.", verdict:"unsupported", confidence:0.1, blast:"Financial decisions.", check:"None provided.", falsify:"Any independent verification of outcomes." },
  { id:"c05", claim:"Mice cured of cancer in a lab study.", verdict:"context", confidence:0.4, blast:"Near zero for humans until replicated.", check:"Read the actual paper: model, dose, controls.", falsify:"Failed replication or no human relevance." },
  { id:"c06", claim:"All swans are white.", verdict:"refuted", confidence:0.9, blast:"Inductive reasoning examples.", check:"Existence of black swans.", falsify:"Discovery of a non-white swan." },
  { id:"c07", claim:"2 + 2 = 4.", verdict:"supported", confidence:1.0, blast:"None.", check:"Peano axioms or direct counting.", falsify:"A consistent arithmetic in which it does not hold." },
  { id:"c08", claim:"The market will crash tomorrow.", verdict:"unsupported", confidence:0.05, blast:"Investment decisions.", check:"None.", falsify:"It does not crash." },
  { id:"c09", claim:"Humans have walked on the Moon.", verdict:"supported", confidence:0.99, blast:"Historical record.", check:"Telemetry, samples, independent tracking, photographs.", falsify:"Coordinated fabrication across multiple nations and technologies." },
  { id:"c10", claim:"This claim is true because many people believe it.", verdict:"refuted", confidence:0.9, blast:"Argument from popularity.", check:"Popularity is not evidence.", falsify:"Independent evidence supporting the claim." }
];

let log = JSON.parse(localStorage.getItem("nibble-log") || "[]");
let bests = JSON.parse(localStorage.getItem("nibble-bests") || "{}");

function save() {
  localStorage.setItem("nibble-log", JSON.stringify(log.slice(0, 50)));
  localStorage.setItem("nibble-bests", JSON.stringify(bests));
}

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9°]+/g, " ").trim();
}

function matchClaim(text) {
  const t = norm(text);
  if (!t) return null;
  // Exact normalized match first — handles numeric/short claims the word filter misses (e.g. "2 + 2 = 4").
  for (const c of PACK) if (norm(c.claim) === t) return c;
  let best = null, score = 0;
  for (const c of PACK) {
    const words = norm(c.claim).split(" ");
    let s = 0;
    for (const w of words) if (w.length > 3 && t.includes(w)) s++;
    if (s > score) { score = s; best = c; }
  }
  return score >= 2 ? best : null;
}

function renderCheck(result, input) {
  if (!result) {
    return `<div class="card">
      <div class="muted">Not in this pack</div>
      <p>Nibble refuses to invent a verdict. Load a pack that contains this claim or rephrase.</p>
      <div class="muted">No check, no confidence.</div>
    </div>`;
  }
  return `<div class="card">
    <div><span class="badge ${result.verdict}">${result.verdict}</span> <span class="muted">${Math.round(result.confidence*100)}% confidence</span></div>
    <p><strong>Claim</strong><br>${result.claim}</p>
    <p><strong>Blast radius</strong><br>${result.blast}</p>
    <p><strong>How to check it</strong><br>${result.check}</p>
    <p><strong>What would kill it</strong><br>${result.falsify}</p>
  </div>`;
}

function render() {
  const tab = document.querySelector(".tab.active").dataset.tab;
  const app = document.getElementById("app");
  if (tab === "check") {
    app.innerHTML = `
      <div class="card">
        <input id="claim" placeholder="Enter a claim" autofocus>
        <button class="primary" id="go">Check</button>
      </div>
      <div id="result"></div>`;
    document.getElementById("go").onclick = () => {
      const text = document.getElementById("claim").value;
      const m = matchClaim(text);
      document.getElementById("result").innerHTML = renderCheck(m, text);
      if (m) {
        log.unshift({ t: Date.now(), claim: text, id: m.id, verdict: m.verdict });
        save();
      }
    };
  } else if (tab === "play") {
    app.innerHTML = `
      <div class="card"><h3>Claim or Not</h3><p class="muted">5 verdict calls. Evidence after each.</p><button class="primary" data-game="con">Start</button></div>
      <div class="card"><h3>Proof Hunt</h3><p class="muted">Find the blanked field.</p><button class="primary" data-game="ph">Start</button></div>
      <div class="card"><h3>Falsify It</h3><p class="muted">Pick what would kill the claim.</p><button class="primary" data-game="fi">Start</button></div>
      <div id="game"></div>`;
    document.querySelectorAll("[data-game]").forEach(b => b.onclick = () => startGame(b.dataset.game));
  } else if (tab === "kit") {
    let html = `<div class="card"><strong>Accuracy kit</strong><p class="muted">Scored against the shipped pack only.</p></div>`;
    PACK.forEach(c => {
      html += `<div class="card"><span class="badge ${c.verdict}">${c.verdict}</span> ${c.claim}</div>`;
    });
    app.innerHTML = html;
  } else {
    let html = `<div class="card"><strong>Log</strong> <span class="muted">${log.length} checks</span></div>`;
    log.slice(0, 20).forEach(e => {
      html += `<div class="card"><span class="badge ${e.verdict}">${e.verdict}</span> ${e.claim.slice(0,80)}</div>`;
    });
    app.innerHTML = html;
  }
}

function startGame(type) {
  const g = document.getElementById("game");
  if (type === "con") {
    let i = 0, score = 0;
    const run = () => {
      if (i >= 5) {
        bests.con = Math.max(bests.con || 0, score);
        save();
        g.innerHTML = `<div class="card">Done. Score ${score}/5. Best: ${bests.con}</div>`;
        return;
      }
      const c = PACK[i % PACK.length];
      g.innerHTML = `<div class="card"><p>${c.claim}</p>
        <button class="primary" data-v="supported">Supported</button>
        <button class="primary" data-v="refuted">Refuted</button>
        <button class="primary" data-v="context">Context</button></div>`;
      g.querySelectorAll("button").forEach(btn => btn.onclick = () => {
        const right = btn.dataset.v === c.verdict;
        if (right) score++;
        g.innerHTML = `<div class="card">
          <div><span class="badge ${c.verdict}">${c.verdict}</span> <span class="muted">${right ? "Correct" : "Not quite"}</span></div>
          <p><strong>Claim</strong><br>${c.claim}</p>
          <p><strong>Blast radius</strong><br>${c.blast}</p>
          <p><strong>How to check it</strong><br>${c.check}</p>
          <p><strong>What would kill it</strong><br>${c.falsify}</p>
          <button class="primary" id="next">Next</button></div>`;
        document.getElementById("next").onclick = () => { i++; run(); };
      });
    };
    run();
  } else {
    g.innerHTML = `<div class="card">Game coming in next pack. Doctrine held.</div>`;
  }
}

document.querySelectorAll(".tab").forEach(t => {
  t.onclick = () => {
    document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    render();
  };
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}

render();
