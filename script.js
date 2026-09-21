const videos = (items) => items;

const people = [
  { slug: "micheal-phelps", name: "Micheal Phelps", note: "Two picks for a quiet watch", media: videos([["Unstable SMP: The Mafia", "CpNP39w2hEk"], ["STELLA LEFTY - Boston", "VrChRBLw3OQ"]]) },
  { slug: "micheal-collins", name: "Micheal Collins - Me", note: "A classic cartoon corner", media: videos([["Tom & Jerry in Full Screen", "t0Q2otsqC4I"]]) },
  { slug: "colin-o", name: "Colin O", note: "A full playlist for the room", media: videos([["Lil Baby - Dead Fresh", "PXxbEfhtDiM"], ["Kodak Black - Already", "vhmpbXsAl9c"], ["Don Toliver - E85", "7GwLnsVUwHY"], ["Drake - Headlines", "cimoNqiulUE"], ["Kanye West - Homecoming", "LQ488QrqGE4"], ["Don Toliver - Excavator", "_SrosL0WdOQ"]]) },
  { slug: "aidan", name: "Aidan", note: "Music, plus two games to pick up", media: videos([["Lil Baby - Dead Fresh", "PXxbEfhtDiM"], ["Don Toliver - No Pole", "nM_ZUbSIA0Q"]]), games: [["Tetr.io-style game", "https://telatro.tomcat.sh/game/"], ["Retro Bowl", "https://falloutscript.github.io/Retrobowl/"]] },
  { slug: "christian", name: "Christian", note: "A lot of music and a game break", media: videos([["Rebecca Black - Friday", "WqVIvVh-dkI"], ["ELO - Mr Blue Sky", "sQiPtneudlo"], ["Pharrell Williams - Double Life", "fWtn6RMNiok"], ["Avicii - The Nights", "UtF6Jej8yb4"], ["Avicii - The Nights (Lyrics)", "H78YW7ycuwI"], ["Post Malone, Swae Lee - Sunflower", "ApXoWvfEYVU"], ["Imagine Dragons - Believer", "W0DM5lcj6mw"], ["Redbone - Come and Get Your Love", "wFwYcHjP-YU"], ["Imagine Dragons - Thunder", "GtEvysh1654"]]), games: [["Retro Bowl", "https://falloutscript.github.io/Retrobowl/"]] },
  { slug: "henry", name: "Henry", note: "One game, ready when you are", games: [["Tetr.io-style game", "https://telatro.tomcat.sh/game/"]] }
];

const app = document.querySelector("#app");
const videoUrl = (id) => `https://www.youtube.com/embed/${id}`;
const themeStorageKey = "student-lounge-theme";
const deviceTheme = window.matchMedia("(prefers-color-scheme: dark)");

function applyTheme(theme) {
  const activeTheme = theme === "auto" ? (deviceTheme.matches ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = activeTheme;
}

function savedTheme() {
  return localStorage.getItem(themeStorageKey) || "auto";
}

applyTheme(savedTheme());
deviceTheme.addEventListener?.("change", () => {
  if (savedTheme() === "auto") applyTheme("auto");
});

function mediaCard(title, id, index) {
  return `<article class="media-card"><div class="media-frame"><iframe src="${videoUrl(id)}" title="${title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div><div class="media-info"><small>Video ${String(index + 1).padStart(2, "0")}</small><h3>${title}</h3></div></article>`;
}

function gameCard([title, url], index) {
  return `<article class="media-card game-card"><div class="media-frame"><iframe src="${url}" title="${title}" loading="lazy" allow="fullscreen" allowfullscreen></iframe><button class="fullscreen-button" type="button" data-fullscreen title="Open game fullscreen">Full screen</button></div><div class="media-info"><small>Game ${String(index + 1).padStart(2, "0")}</small><h3>${title}</h3></div></article>`;
}

function homePage() {
  return `<section class="hero"><div class="hero-copy"><span class="eyebrow">Your shared corner of the internet</span><h1>Come in.<br />Stay <em>awhile.</em></h1><p>A low-pressure place for the people, videos, and games that make a school day feel a little lighter.</p><div class="hero-actions"><a class="button primary" href="#people">See the lounge <span>↗</span></a><a class="button secondary" href="#requests">Make a request</a></div></div><div class="hero-art"><img src="logo.png" alt="The Student Lounge" /><span class="sticker">always open</span></div></section><section id="people"><div class="section-heading"><div><span class="eyebrow">The room list</span><h2>Pick a person.</h2></div><p>Each corner has its own mood. Find a name and settle in.</p></div><div class="people-grid">${people.map((person, index) => `<a class="person-card" href="#${person.slug}"><span class="person-number">0${index + 1}</span><div><h3>${person.name}</h3><p>${person.note}</p></div><span class="arrow">↗</span></a>`).join("")}</div></section>`;
}

function personPage(person) {
  const media = person.media?.map(([title, id], index) => mediaCard(title, id, index)).join("") || "";
  const games = person.games?.map(gameCard).join("") || "";
  return `<section class="page-head"><span class="eyebrow">A corner for</span><h1>${person.name}</h1><p>${person.note}. Take your time, turn the volume down, and make yourself comfortable.</p></section>${person.media?.length ? `<section><div class="section-heading"><h2>Watch list</h2><p>Hand-picked for this corner of the lounge.</p></div><div class="media-grid">${media}</div></section>` : ""}${person.games?.length ? `<section><div class="section-heading"><h2>Play room</h2><p>Open a game right here and keep your place in the lounge.</p></div><div class="media-grid">${games}</div></section>` : ""}`;
}

function requestsPage() {
  return `<section class="page-head"><span class="eyebrow">Keep the lounge growing</span><h1>Request a drop.</h1><p>Know a video, song, or game that belongs here? Send it through and we will make room.</p></section><section class="request-layout"><div class="request-note"><h2>Leave a little something for the room.</h2><p>Use the form to suggest a video or game. It opens in the panel beside this note, so you never have to leave the lounge.</p><a class="button" href="https://forms.gle/fc5mWuPjdMgMvXL58" target="_blank" rel="noreferrer">Open form in new tab ↗</a></div><div class="form-card"><iframe src="https://forms.gle/fc5mWuPjdMgMvXL58" title="Request a video or game">Loading…</iframe></div></section>`;
}

function settingsPage() {
  return `<section class="page-head"><span class="eyebrow">Make it yours</span><h1>Settings.</h1><p>Choose the atmosphere that feels right. Your choice stays with you on this device.</p></section><section class="settings-panel"><div><span class="eyebrow">Appearance</span><h2>Color mode</h2><p>Device mode follows your computer or phone preference automatically.</p></div><div class="theme-control"><span>Theme</span><div class="theme-options" role="group" aria-label="Color mode"><button type="button" class="theme-option" data-theme-option="auto"><strong>Device</strong><small>Follow device</small></button><button type="button" class="theme-option" data-theme-option="light"><strong>Light</strong><small>Soft paper</small></button><button type="button" class="theme-option" data-theme-option="dark"><strong>Dark</strong><small>Low light</small></button></div></div></section>`;
}

function wirePageControls(route) {
  document.querySelectorAll("[data-fullscreen]").forEach((button) => {
    button.addEventListener("click", async () => {
      const frame = button.closest(".media-frame");
      if (!document.fullscreenElement) await frame.requestFullscreen?.();
      else await document.exitFullscreen?.();
    });
  });

  if (route === "settings") {
    const options = document.querySelectorAll("[data-theme-option]");
    const syncOptions = () => options.forEach((option) => {
      const selected = option.dataset.themeOption === savedTheme();
      option.classList.toggle("active", selected);
      option.setAttribute("aria-pressed", selected);
    });
    options.forEach((option) => option.addEventListener("click", () => {
      localStorage.setItem(themeStorageKey, option.dataset.themeOption);
      applyTheme(option.dataset.themeOption);
      syncOptions();
    }));
    syncOptions();
  }
}

function render() {
  const route = window.location.hash.slice(1) || "home";
  const person = people.find((entry) => entry.slug === route);
  app.innerHTML = route === "home" ? homePage() : route === "requests" ? requestsPage() : route === "settings" ? settingsPage() : person ? personPage(person) : homePage();
  document.querySelectorAll("[data-nav]").forEach((link) => link.classList.toggle("active", link.dataset.nav === (person ? "people" : route)));
  wirePageControls(route);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("hashchange", render);
render();