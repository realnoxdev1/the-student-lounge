const videos = (items) => items;

const people = [
  { slug: "micheal-phelps", name: "Micheal Phelps", note: "Two picks for a quiet watch", media: videos([["Unstable SMP: The Mafia", "CpNP39w2hEk"], ["STELLA LEFTY - Boston", "VrChRBLw3OQ"]]) },
  { slug: "micheal-collins", name: "Micheal Collins - Me", note: "A classic cartoon corner", media: videos([["Tom & Jerry in Full Screen", "t0Q2otsqC4I"]]) },
  { slug: "colin-o", name: "Colin O", note: "A full playlist for the room", media: videos([["Lil Baby - Dead Fresh", "PXxbEfhtDiM"], ["Kodak Black - Already", "vhmpbXsAl9c"], ["Don Toliver - E85", "7GwLnsVUwHY"], ["Drake - Headlines", "cimoNqiulUE"], ["Kanye West - Homecoming", "LQ488QrqGE4"], ["Don Toliver - Excavator", "_SrosL0WdOQ"]]) },
  { slug: "aidan", name: "Aidan", note: "Music, plus two games to pick up", media: videos([["Lil Baby - Dead Fresh", "PXxbEfhtDiM"], ["Don Toliver - No Pole", "nM_ZUbSIA0Q"], ["Djo - End Of Beginning (Lyrics)", "B3Z4XGAxJB0"], ["The Killers - Mr Brightside (Lyrics)", "j8tZs6G_h7U"], ["Mustard - Pure Water [Lyrics/Lyric] Ft. Migos", "hVsEbUm-kb0"]]), games: [["Tetr.io-style game", "https://telatro.tomcat.sh/game/"], ["Retro Bowl", "https://falloutscript.github.io/Retrobowl/"]] },
  { slug: "christian", name: "Christian", note: "A lot of music and a game break", media: videos([["Rebecca Black - Friday", "WqVIvVh-dkI"], ["ELO - Mr Blue Sky", "sQiPtneudlo"], ["Pharrell Williams - Double Life", "fWtn6RMNiok"], ["Avicii - The Nights", "UtF6Jej8yb4"], ["Avicii - The Nights (Lyrics)", "H78YW7ycuwI"], ["Post Malone, Swae Lee - Sunflower", "ApXoWvfEYVU"], ["Imagine Dragons - Believer", "W0DM5lcj6mw"], ["Redbone - Come and Get Your Love", "wFwYcHjP-YU"], ["Imagine Dragons - Thunder", "GtEvysh1654"], ["The Buggles - Video Killed The Radio Star (Lyrics)", "XMEN_FsVg_c"], ["Silver - Wham Bam Shang-A-Lang", "M5iSEdo5VNI"], ["Blue Swede - Hooked On A Feeling", "Bo-qweh7nbQ"]]), games: [["Retro Bowl", "https://falloutscript.github.io/Retrobowl/"]] },
  { slug: "henry", name: "Henry", note: "One game, ready when you are", games: [["Tetr.io-style game", "https://telatro.tomcat.sh/game/"]] }
];

const app = document.querySelector("#app");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const supabaseConfig = window.studentLoungeSupabaseConfig || {};
const supabaseClient = window.supabase && supabaseConfig.url && supabaseConfig.anonKey
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;
const videoUrl = (id) => `https://www.youtube-nocookie.com/embed/${id}?origin=${encodeURIComponent(window.location.origin)}&rel=0&playsinline=1`;
const watchUrl = (id) => `https://www.youtube.com/watch?v=${id}`;
const themeStorageKey = "student-lounge-theme";
const favoritesStorageKey = "student-lounge-favorites";
const pointsStorageKey = "student-lounge-points";
const rewardAdRotationStorageKey = "student-lounge-ad-rotation";
const dailyPollStorageKey = "student-lounge-daily-poll";
const unlockedStylesStorageKey = "student-lounge-unlocked-styles";
const appearanceStorageKey = "student-lounge-appearance";
const rewardAdVideoIds = ["QVWpiMdiiw4", "KUDhMV0Fpno"];
const rewardAdReward = 50;
let rewardAdCloseTimeout;
const dailyPollReward = 20;
const dailyPolls = [
  { question: "What helps you reset between classes?", choices: ["A favorite song", "A short walk", "A quick game", "A quiet moment"] },
  { question: "Pick your ideal short break.", choices: ["Stretch a little", "Listen to music", "Get some fresh air", "Chat with a friend"] },
  { question: "What should the lounge feel like today?", choices: ["Calm and cozy", "Bright and upbeat", "Quiet and focused", "Playful and fun"] },
  { question: "Choose a low-key after-school plan.", choices: ["Watch something", "Play a game", "Make something", "Take it easy"] },
  { question: "Which small win makes your day better?", choices: ["Finishing a task", "Learning something new", "Helping someone", "Taking a good break"] }
];
const styleOptions = [
  { id: "sage", label: "Garden", description: "A calm sage-green accent palette.", kind: "palette", value: "sage", cost: 80 },
  { id: "sunset", label: "Sunset", description: "Warm coral and golden-hour tones.", kind: "palette", value: "sunset", cost: 80 },
  { id: "lora", label: "Bookish", description: "Lora headings with a relaxed editorial feel.", kind: "typeface", value: "lora", cost: 120 },
  { id: "nunito", label: "Roundabout", description: "A friendly, rounded Nunito type style.", kind: "typeface", value: "nunito", cost: 120 }
];
const deviceTheme = window.matchMedia("(prefers-color-scheme: dark)");

function loadPoints() {
  return Number(localStorage.getItem(pointsStorageKey) || 0);
}

function savePoints(value) {
  localStorage.setItem(pointsStorageKey, String(value));
  const pointsDisplay = document.querySelector("[data-points-total]");
  if (pointsDisplay) pointsDisplay.textContent = String(value);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function requestListMarkup(requests) {
  const entries = requests.map((request) => {
    const date = new Date(request.created_at);
    const dateLabel = Number.isNaN(date.getTime()) ? "Saved request" : date.toLocaleString();
    return `<li class="request-entry"><div><h3>${escapeHtml(request.item)}</h3><p>Requested by ${escapeHtml(request.name)}</p></div><time>${escapeHtml(dateLabel)}</time></li>`;
  }).join("");
  const content = entries || '<li class="request-empty">No requests yet. Be the first to suggest something.</li>';
  return `<section class="request-list-section" data-request-list aria-labelledby="request-list-title"><div class="section-heading"><div><span class="eyebrow">The request box</span><h2 id="request-list-title">All requests <span class="request-count">${requests.length}</span></h2></div><p>Suggestions submitted here appear in this list.</p></div><ul class="request-list">${content}</ul></section>`;
}

function privateInboxErrorMessage(error) {
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    return "Supabase cannot find public.video_requests in this project. Make sure the table is named video_requests in the public schema, then run all of supabase-setup.sql in this same project’s SQL Editor.";
  }
  if (error?.code === "42501") {
    return "The table exists, but Supabase is denying the owner read access. Re-run supabase-setup.sql with the owner email matching the signed-in account.";
  }
  if (error?.code === "PGRST204" || error?.code === "42703") {
    return "The requests table columns do not match the site. It needs id, name, item, and created_at; check the table setup SQL.";
  }
  return "Supabase could not load the inbox. Check the table and row-level security policies, then retry.";
}

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function todaysPoll() {
  const [year, month, day] = todayKey().split("-").map(Number);
  const dayNumber = Math.floor(Date.UTC(year, month - 1, day) / 86400000);
  return dailyPolls[dayNumber % dailyPolls.length];
}

function todaysPollRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(dailyPollStorageKey) || "null");
    return record?.date === todayKey() ? record : null;
  } catch {
    return null;
  }
}

function dailyPollMarkup() {
  const poll = todaysPoll();
  const record = todaysPollRecord();
  const choices = poll.choices.map((choice, index) => {
    const selected = record?.choice === index;
    return `<button class="poll-choice ${selected ? "is-selected" : ""}" type="button" data-poll-vote="${index}" ${record ? "disabled" : ""} aria-pressed="${selected}">${choice}</button>`;
  }).join("");
  const status = record
    ? `You earned ${dailyPollReward} points. Your answer is saved on this device.`
    : `Choose an answer to earn ${dailyPollReward} points. One vote per day.`;

  return `<section class="daily-poll-panel" aria-labelledby="daily-poll-title"><div class="daily-poll-copy"><span class="eyebrow">A little question for today</span><h2 id="daily-poll-title">${poll.question}</h2><p data-poll-status aria-live="polite">${status}</p></div><div class="poll-choices" role="group" aria-label="Poll answers">${choices}</div></section>`;
}

function mountDailyPoll() {
  const rewardPanel = app.querySelector(".reward-panel");
  if (!rewardPanel || app.querySelector(".daily-poll-panel")) return;
  rewardPanel.insertAdjacentHTML("afterend", dailyPollMarkup());
}

function handlePollVote(choiceIndex) {
  if (todaysPollRecord()) return;
  const poll = todaysPoll();
  if (!Number.isInteger(choiceIndex) || choiceIndex < 0 || choiceIndex >= poll.choices.length) return;

  localStorage.setItem(dailyPollStorageKey, JSON.stringify({ date: todayKey(), choice: choiceIndex }));
  savePoints(loadPoints() + dailyPollReward);
  const panel = app.querySelector(".daily-poll-panel");
  if (panel) panel.outerHTML = dailyPollMarkup();
}

function loadUnlockedStyles() {
  try {
    const unlocked = JSON.parse(localStorage.getItem(unlockedStylesStorageKey) || "[]");
    return new Set(Array.isArray(unlocked) ? unlocked : []);
  } catch {
    return new Set();
  }
}

function loadAppearance() {
  try {
    const appearance = JSON.parse(localStorage.getItem(appearanceStorageKey) || "{}");
    return { palette: appearance.palette || "classic", typeface: appearance.typeface || "classic" };
  } catch {
    return { palette: "classic", typeface: "classic" };
  }
}

function saveAppearance(appearance) {
  localStorage.setItem(appearanceStorageKey, JSON.stringify(appearance));
  applyAppearance();
}

function applyAppearance() {
  const appearance = loadAppearance();
  document.documentElement.dataset.skin = appearance.palette;
  document.documentElement.dataset.typeface = appearance.typeface;
}

function customizationMarkup() {
  const unlocked = loadUnlockedStyles();
  const appearance = loadAppearance();
  const points = loadPoints();
  const options = styleOptions.map((option) => {
    const isUnlocked = unlocked.has(option.id);
    const isActive = appearance[option.kind] === option.value;
    const canAfford = points >= option.cost;
    const action = isUnlocked ? "use" : "buy";
    const buttonText = isActive ? "In use" : isUnlocked ? "Use style" : canAfford ? `Unlock · ${option.cost} points` : `Need ${option.cost - points} more`;
    const disabled = isActive || (!isUnlocked && !canAfford);
    return `<article class="style-card style-${option.id}"><span class="style-preview" aria-hidden="true">Aa</span><div class="style-card-copy"><h3>${option.label}</h3><p>${option.description}</p></div><button class="button ${isActive ? "secondary" : "primary"}" type="button" data-style-action="${action}" data-style-id="${option.id}" ${disabled ? "disabled" : ""}>${buttonText}</button></article>`;
  }).join("");
  return `<section class="customization-section" aria-labelledby="customization-title"><div class="section-heading"><div><span class="eyebrow">Spend your points</span><h2 id="customization-title">Personalize your lounge.</h2></div><p>Unlock a look once, then switch between your styles whenever you like. Choices stay on this device.</p></div><div class="style-grid">${options}</div><p class="customization-note">Style unlocks are local to this browser and do not affect other visitors.</p></section>`;
}

function mountCustomizations() {
  if (app.querySelector(".customization-section")) return;
  const settingsPanel = app.querySelector(".settings-panel");
  if (settingsPanel) settingsPanel.insertAdjacentHTML("afterend", customizationMarkup());
}

function handleStyleAction(action, styleId) {
  const option = styleOptions.find((style) => style.id === styleId);
  if (!option) return;

  const unlocked = loadUnlockedStyles();
  if (action === "buy") {
    if (unlocked.has(option.id) || loadPoints() < option.cost) return;
    unlocked.add(option.id);
    localStorage.setItem(unlockedStylesStorageKey, JSON.stringify([...unlocked]));
    savePoints(loadPoints() - option.cost);
  } else if (action !== "use" || !unlocked.has(option.id)) {
    return;
  }

  const appearance = loadAppearance();
  appearance[option.kind] = option.value;
  saveAppearance(appearance);
  const section = app.querySelector(".customization-section");
  if (section) section.outerHTML = customizationMarkup();
}

function updateRewardButtonState() {
  const button = document.querySelector("[data-open-reward]");
  if (!button) return;

  button.disabled = false;
  button.textContent = "Watch an ad for +50 points";
  button.classList.remove("is-disabled");
}

function nextRewardAdVideoId() {
  const previousIndex = Number(localStorage.getItem(rewardAdRotationStorageKey) || 0);
  const nextIndex = Number.isInteger(previousIndex) && previousIndex >= 0 ? previousIndex % rewardAdVideoIds.length : 0;
  localStorage.setItem(rewardAdRotationStorageKey, String((nextIndex + 1) % rewardAdVideoIds.length));
  return rewardAdVideoIds[nextIndex];
}

function closeRewardAd() {
  clearTimeout(rewardAdCloseTimeout);
  rewardAdCloseTimeout = undefined;

  const modal = document.querySelector("[data-reward-modal]");
  const iframe = document.querySelector("[data-reward-iframe]");
  window.__rewardAdSession = (window.__rewardAdSession || 0) + 1;
  window.__rewardPlayer?.stopVideo?.();
  if (iframe) iframe.hidden = true;
  if (modal) modal.hidden = true;
  document.body.classList.remove("is-ad-lock");
}

function loadRewardYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (window.__rewardYouTubeApiPromise) return window.__rewardYouTubeApiPromise;

  window.__rewardYouTubeApiPromise = new Promise((resolve, reject) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve(window.YT);
    };

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => reject(new Error("YouTube player API failed to load."));
    document.head.append(script);
  });

  return window.__rewardYouTubeApiPromise;
}

function ensureRewardPlayer() {
  if (window.__rewardPlayer) return Promise.resolve(window.__rewardPlayer);
  if (window.__rewardPlayerPromise) return window.__rewardPlayerPromise;

  window.__rewardPlayerPromise = loadRewardYouTubeApi().then((youtube) => new Promise((resolve) => {
    const iframe = document.querySelector("[data-reward-iframe]");
    if (!iframe) throw new Error("Reward video frame not found.");

    window.__rewardPlayer = new youtube.Player(iframe, {
      events: {
        onReady: (event) => resolve(event.target),
        onStateChange: (event) => {
          if (event.data === youtube.PlayerState.ENDED) finishRewardAd();
        },
        onError: () => {
          const status = document.querySelector("[data-reward-status]");
          if (status) status.textContent = "The ad could not be played. Please try again.";
        }
      }
    });
  }));

  return window.__rewardPlayerPromise;
}

function openRewardAd() {
  window.__rewardAdAwarded = false;
  const selectedVideoId = nextRewardAdVideoId();
  window.__activeRewardAdVideoId = selectedVideoId;
  const session = (window.__rewardAdSession || 0) + 1;
  window.__rewardAdSession = session;

  const modal = document.querySelector("[data-reward-modal]");
  const iframe = document.querySelector("[data-reward-iframe]");
  const closeButton = document.querySelector("[data-close-reward]");
  if (!modal || !iframe) return;

  clearTimeout(rewardAdCloseTimeout);
  iframe.hidden = false;
  if (!window.__rewardPlayer && !window.__rewardPlayerPromise) {
    iframe.src = `https://www.youtube-nocookie.com/embed/${selectedVideoId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&autoplay=0&controls=0&disablekb=1&fs=0&rel=0&playsinline=1`;
  }
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
  if (closeButton) closeButton.disabled = false;
  modal.hidden = false;
  document.body.classList.add("is-ad-lock");
  const status = document.querySelector("[data-reward-status]");
  if (status) status.textContent = "Finish the video to claim your reward.";

  ensureRewardPlayer().then((player) => {
    if (window.__rewardAdSession !== session || modal.hidden) return;
    player.loadVideoById(selectedVideoId);
  }).catch(() => {
    if (window.__rewardAdSession !== session || modal.hidden) return;
    if (status) status.textContent = "The ad player could not load. Please try again.";
  });
}

function finishRewardAd() {
  if (window.__rewardAdAwarded) return;

  const modal = document.querySelector("[data-reward-modal]");
  const iframe = document.querySelector("[data-reward-iframe]");
  const closeButton = document.querySelector("[data-close-reward]");
  if (!modal || !iframe || modal.hidden) return;

  window.__rewardAdAwarded = true;
  const nextPoints = loadPoints() + rewardAdReward;
  savePoints(nextPoints);
  iframe.hidden = true;
  if (closeButton) closeButton.disabled = false;
  updateRewardButtonState();
  const status = document.querySelector("[data-reward-status]");
  if (status) status.textContent = "Ad complete! Click the × to close. This will close automatically in 5 seconds.";

  clearTimeout(rewardAdCloseTimeout);
  rewardAdCloseTimeout = setTimeout(closeRewardAd, 5000);
}

function attachRewardListeners() {
  if (window.__rewardListenersBound) return;

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-reward]");
    if (trigger && !trigger.disabled) {
      openRewardAd();
      return;
    }

    const closeButton = event.target.closest("[data-close-reward]");
    if (closeButton && !closeButton.disabled) {
      closeRewardAd();
    }
  });

  window.__rewardListenersBound = true;
}

function attachEconomyListeners() {
  if (window.__economyListenersBound) return;

  document.addEventListener("click", (event) => {
    const pollButton = event.target.closest("[data-poll-vote]");
    if (pollButton && !pollButton.disabled) {
      handlePollVote(Number(pollButton.dataset.pollVote));
      return;
    }

    const styleButton = event.target.closest("[data-style-action]");
    if (styleButton && !styleButton.disabled) {
      handleStyleAction(styleButton.dataset.styleAction, styleButton.dataset.styleId);
    }
  });

  window.__economyListenersBound = true;
}

function applyTheme(theme) {
  const activeTheme = theme === "auto" ? (deviceTheme.matches ? "dark" : "light") : theme;
  document.documentElement.dataset.theme = activeTheme;
  themeColorMeta?.setAttribute("content", activeTheme === "dark" ? "#111315" : "#f4f1eb");
}

function savedTheme() {
  return localStorage.getItem(themeStorageKey) || "auto";
}

applyTheme(savedTheme());
applyAppearance();
deviceTheme.addEventListener?.("change", () => {
  if (savedTheme() === "auto") applyTheme("auto");
});

function getFavoriteSet() {
  try {
    const favorites = JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");
    return new Set(Array.isArray(favorites) ? favorites : []);
  } catch {
    return new Set();
  }
}

function setFavoriteSet(set) {
  localStorage.setItem(favoritesStorageKey, JSON.stringify([...set]));
}

function favoriteButtonMarkup(kind, id, label) {
  const key = `${kind}:${id}`;
  const favorited = getFavoriteSet().has(key);
  return `<button class="favorite-button ${favorited ? "is-favorited" : ""}" type="button" data-favorite-toggle data-favorite-kind="${kind}" data-favorite-id="${id}" data-favorite-label="${label}" aria-label="${favorited ? "Remove from favorites" : "Add to favorites"}: ${label}" title="${favorited ? "Remove from favorites" : "Add to favorites"}">${favorited ? "♥" : "♡"}</button>`;
}

function recentTagMarkup(recentlyAdded) {
  return recentlyAdded ? '<span class="card-tag is-recent">Recently added</span>' : "";
}

function mediaCard(title, id, index, { recentlyAdded = false } = {}) {
  return `<article class="media-card video-card"><div class="media-top-row">${recentTagMarkup(recentlyAdded)}${favoriteButtonMarkup("video", id, title)}</div><div class="media-frame video-frame"><div class="volume-warning" data-video-warning><span class="eyebrow">Volume check</span><p>This video may start louder than expected. Check your volume before continuing.</p><button class="button primary" type="button" data-watch-video data-video-id="${id}">Watch anyway</button></div></div><div class="media-info"><small>Video ${String(index + 1).padStart(2, "0")}</small><h3>${title}</h3><a class="video-watch-link" href="${watchUrl(id)}" target="_blank" rel="noopener noreferrer">Watch on YouTube <span aria-hidden="true">↗</span></a></div></article>`;
}

function gameCard([title, url], index, { recentlyAdded = false } = {}) {
  return `<article class="media-card game-card"><div class="media-top-row">${recentTagMarkup(recentlyAdded)}${favoriteButtonMarkup("game", url, title)}</div><div class="media-frame"><iframe src="${url}" title="${title}" loading="lazy" allow="fullscreen; gamepad" allowfullscreen></iframe><button class="fullscreen-button" type="button" data-fullscreen title="Open ${title} fullscreen" aria-label="Open ${title} fullscreen"><span aria-hidden="true">⛶</span><span>Full screen</span></button></div><div class="media-info"><small>Game ${String(index + 1).padStart(2, "0")}</small><h3>${title}</h3><a class="game-launch-link" href="${url}" target="_blank" rel="noopener noreferrer">Open in new tab <span aria-hidden="true">↗</span></a></div></article>`;
}

document.addEventListener("fullscreenchange", () => {
  document.querySelectorAll("[data-fullscreen]").forEach((button) => {
    const isActive = button.closest(".media-frame") === document.fullscreenElement;
    button.classList.toggle("is-active", isActive);
    button.querySelector("span:last-child").textContent = isActive ? "Exit full screen" : "Full screen";
    button.setAttribute("aria-label", isActive ? "Exit full screen" : button.title);
  });
});

function homePage() {
  return `<section class="hero"><div class="hero-copy"><span class="eyebrow">Your shared corner of the internet</span><h1>Come in.<br />Stay <em>awhile.</em></h1><p>A low-pressure place for the people, videos, and games that make a school day feel a little lighter.</p><div class="hero-actions"><a class="button primary" href="#people">Browse people <span>↗</span></a><a class="button secondary" href="#request">Request a video</a></div></div><div class="hero-art"><img src="logo.png" alt="The Student Lounge" draggable="false" title="Drag to move the logo" /><span class="sticker">always open</span></div></section><section class="reward-panel"><div class="reward-copy"><span class="eyebrow">Lounge reward</span><h2>Watch an ad, earn 50 points.</h2><p>Choose from two ads with the same button. Watch either one as many times as you like; every completed ad earns 50 points.</p></div><button class="button primary" type="button" data-open-reward>Watch an ad for +50 points</button></section><div class="reward-ad-modal" data-reward-modal hidden aria-live="polite"><div class="reward-ad-dialog" role="dialog" aria-modal="true" aria-label="Reward ad"><div class="reward-ad-header"><span class="eyebrow">Reward ad</span><button type="button" class="reward-ad-close" data-close-reward aria-label="Close reward ad" disabled>✕</button></div><iframe data-reward-iframe title="Reward ad" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe><p class="reward-ad-status" data-reward-status>Finish the video to claim your reward.</p></div></div>`;
}

function peopleDirectoryPage() {
  const cards = people.map((person, index) => `<a class="person-card" href="#${person.slug}"><span class="person-number">${String(index + 1).padStart(2, "0")}</span><div><h3>${person.name}</h3><p>${person.note}</p></div><span class="arrow">↗</span></a>`).join("");
  return `<section class="page-head"><span class="eyebrow">The room list</span><h1>Find your people.</h1><p>Choose a corner and settle in.</p></section><section class="people-directory"><div class="people-grid">${cards}</div></section>`;
}

function personPage(person) {
  const media = person.media?.map(([title, id], index) => mediaCard(title, id, index)).join("") || "";
  const games = person.games?.map(gameCard).join("") || "";
  return `<section class="page-head"><span class="eyebrow">A corner for</span><h1>${person.name}</h1><p>${person.note}. Take your time, turn the volume down, and make yourself comfortable.</p></section>${person.media?.length ? `<section><div class="section-heading"><h2>Watch list</h2><p>Hand-picked for this corner of the lounge.</p></div><div class="media-grid">${media}</div></section>` : ""}${person.games?.length ? `<section><div class="section-heading"><h2>Play room</h2><p>Open a game right here and keep your place in the lounge.</p></div><div class="media-grid">${games}</div></section>` : ""}`;
}

function hanyPage() {
  return `<section class="page-head"><span class="eyebrow">A little appreciation</span><h1>Hany is my dad.</h1><p>He loves me, supports me, and is always there when I need him. He makes life brighter with his kindness, advice, and sense of humor.</p></section><section class="request-note"><h2>Thanks for being you, Dad.</h2><p>I’m lucky to have you in my corner. Love you!</p><a class="button primary" href="#home">Back to the lounge <span aria-hidden="true">↗</span></a></section>`;
}

function requestsPage() {
  return `<section class="page-head"><span class="eyebrow">Keep the lounge growing</span><h1>Request a video or game.</h1><p>Send a suggestion for the lounge. Your name and suggestion will only be visible in the owner’s private requests inbox.</p></section><section class="request-layout"><div class="form-card"><form class="request-form" data-request-form><label for="request-name">#1 Whats your name?</label><input id="request-name" name="name" type="text" autocomplete="name" maxlength="80" required /><label for="request-item">#2 What is the video or game name you want?</label><input id="request-item" name="item" type="text" maxlength="160" required /><button class="button primary" type="submit">Send request <span aria-hidden="true">↗</span></button><p class="request-form-status" data-request-status aria-live="polite"></p></form></div><aside class="request-note"><span class="eyebrow">A note about requests</span><h2>Help grow the lounge.</h2><p>Submissions are sent to a private inbox. Only the site owner can sign in to view them.</p></aside></section>`;
}

function privateRequestsPage() {
  return `<section class="page-head"><span class="eyebrow">Owner access</span><h1>Private requests.</h1><p>Sign in with the owner account to view the suggestions submitted by visitors.</p></section><section class="admin-requests-panel"><form class="request-form admin-login-form" data-admin-login hidden><label for="admin-email">Owner email</label><input id="admin-email" name="email" type="email" autocomplete="username" required /><label for="admin-password">Password</label><input id="admin-password" name="password" type="password" autocomplete="current-password" required /><button class="button primary" type="submit">Sign in</button></form><p class="request-form-status admin-status" data-admin-status aria-live="polite">Checking owner access…</p><div data-admin-results hidden></div></section>`;
}

async function refreshPrivateRequests() {
  const loginForm = app.querySelector("[data-admin-login]");
  const status = app.querySelector("[data-admin-status]");
  const results = app.querySelector("[data-admin-results]");
  if (!loginForm || !status || !results) return;

  if (!supabaseClient || !supabaseConfig.adminEmail) {
    status.textContent = "The private inbox needs Supabase project settings. See the setup steps in README.md.";
    return;
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    loginForm.hidden = false;
    status.textContent = "Could not check sign-in. Please reload and try again.";
    return;
  }

  const session = data.session;
  if (!session) {
    loginForm.hidden = false;
    status.textContent = "Sign in with the site owner account to view requests.";
    return;
  }

  if (session.user.email?.toLowerCase() !== supabaseConfig.adminEmail.toLowerCase()) {
    await supabaseClient.auth.signOut();
    loginForm.hidden = false;
    status.textContent = "This account is not authorized to view the requests.";
    return;
  }

  loginForm.hidden = true;
  status.textContent = "Owner signed in. Only this account can read the private inbox.";
  const { data: requests, error: requestError } = await supabaseClient
    .from("video_requests")
    .select("id, name, item, created_at")
    .order("created_at", { ascending: false });
  if (requestError) {
    console.error("Could not load private video requests.", requestError);
    results.hidden = false;
    results.innerHTML = `<p class="request-form-status">${privateInboxErrorMessage(requestError)}</p><button class="button secondary admin-retry" type="button" data-admin-retry>Try again</button>`;
    results.querySelector("[data-admin-retry]")?.addEventListener("click", refreshPrivateRequests);
    return;
  }

  results.hidden = false;
  results.innerHTML = `<button class="button secondary admin-sign-out" type="button" data-admin-sign-out>Sign out</button>${requestListMarkup(requests || [])}`;
  results.querySelector("[data-admin-sign-out]")?.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    results.hidden = true;
    loginForm.hidden = false;
    loginForm.reset();
    status.textContent = "You have signed out.";
  });
}

function settingsPage() {
  return `<section class="page-head"><span class="eyebrow">Make it yours</span><h1>Settings.</h1><p>Choose the atmosphere that feels right. Your choice stays with you on this device.</p></section><section class="settings-panel"><div><span class="eyebrow">Appearance</span><h2>Color mode</h2><p>Device mode follows your computer or phone preference automatically.</p></div><div class="theme-control"><span>Theme</span><div class="theme-options" role="group" aria-label="Color mode"><button type="button" class="theme-option" data-theme-option="auto"><strong>Device</strong><small>Follow device</small></button><button type="button" class="theme-option" data-theme-option="light"><strong>Light</strong><small>Soft paper</small></button><button type="button" class="theme-option" data-theme-option="dark"><strong>Dark</strong><small>Low light</small></button></div></div></section>`;
}

function accountPage() {
  return `<section class="page-head"><span class="eyebrow">Your lounge account</span><h1>Keep your place.</h1><p>Create an account or sign in. Your Pro status will be stored with your account, so it follows you when you sign in on another device.</p></section><section class="account-panel" aria-label="Account management"><div data-account-guest><form class="request-form" data-account-sign-in><h2>Welcome back.</h2><label for="account-signin-email">Email</label><input id="account-signin-email" name="email" type="email" autocomplete="username" required /><label for="account-signin-password">Password</label><input id="account-signin-password" name="password" type="password" autocomplete="current-password" required /><button class="button primary" type="submit">Sign in</button><p class="account-switch">New here? <button type="button" data-account-show-sign-up>Create an account</button></p></form><form class="request-form" data-account-sign-up hidden><h2>Make your account.</h2><label for="account-display-name">Your name</label><input id="account-display-name" name="displayName" type="text" autocomplete="name" maxlength="80" required /><label for="account-signup-email">Email</label><input id="account-signup-email" name="email" type="email" autocomplete="email" required /><label for="account-signup-password">Create a password</label><input id="account-signup-password" name="password" type="password" autocomplete="new-password" minlength="8" required /><button class="button primary" type="submit">Create account</button><p class="account-switch">Already have an account? <button type="button" data-account-show-sign-in>Sign in</button></p></form></div><div data-account-member hidden><div class="account-identity"><div><span class="eyebrow">Signed in as</span><h2 data-account-name>Your account</h2><p class="account-email" data-account-email></p></div><button class="button secondary" type="button" data-account-sign-out>Sign out</button></div><div class="pro-status-card" data-pro-status-card><span class="pro-badge" data-pro-badge>Checking Pro</span><p data-pro-status>Checking your membership…</p></div></div><p class="account-message" data-account-message aria-live="polite">${supabaseClient ? "" : "Account sign-in isn't connected yet. Please try again later."}</p></section>`;
}

async function refreshAccountPage() {
  const guestPanel = app.querySelector("[data-account-guest]");
  const memberPanel = app.querySelector("[data-account-member]");
  const message = app.querySelector("[data-account-message]");
  if (!guestPanel || !memberPanel || !message) return;

  if (!supabaseClient) {
    message.textContent = "Account sign-in isn't connected. Check the Supabase settings and refresh.";
    return;
  }

  try {
    const { data, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    const user = data.session?.user;
    guestPanel.hidden = Boolean(user);
    memberPanel.hidden = !user;
    if (!user) return;

    app.querySelector("[data-account-name]").textContent = user.user_metadata?.display_name || "Lounge member";
    app.querySelector("[data-account-email]").textContent = user.email || "";
    const badge = app.querySelector("[data-pro-badge]");
    const proStatus = app.querySelector("[data-pro-status]");
    const proCard = app.querySelector("[data-pro-status-card]");
    const { data: entitlement, error: entitlementError } = await supabaseClient
      .from("pro_entitlements")
      .select("expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (entitlementError) {
      console.error("Could not read account Pro status.", entitlementError);
      badge.textContent = "Pro status unavailable";
      proStatus.textContent = "Run the account and Pro setup in supabase-setup.sql, then reload this page.";
      return;
    }

    const expiry = entitlement?.expires_at ? new Date(entitlement.expires_at) : null;
    const hasPro = Boolean(entitlement && (!expiry || expiry > new Date()));
    badge.textContent = hasPro ? "Pro member" : "Lounge member";
    proCard.classList.toggle("is-pro", hasPro);
    proStatus.textContent = hasPro
      ? expiry ? `Pro is active until ${expiry.toLocaleDateString()}. It is linked to this account.` : "Pro is active on this account. Sign in with this account on another device to keep your membership." 
      : "No Pro membership is linked to this account yet. When the helper program opens, Pro access can be granted to this account.";
  } catch (error) {
    console.error("Could not load account details.", error);
    message.textContent = "Could not check your account right now. Check your connection and reload.";
  }
}

function wireAccountControls() {
  const signInForm = app.querySelector("[data-account-sign-in]");
  const signUpForm = app.querySelector("[data-account-sign-up]");
  const message = app.querySelector("[data-account-message]");
  if (!signInForm || !signUpForm || !message) return;

  app.querySelector("[data-account-show-sign-up]")?.addEventListener("click", () => {
    signInForm.hidden = true;
    signUpForm.hidden = false;
    message.textContent = "";
  });
  app.querySelector("[data-account-show-sign-in]")?.addEventListener("click", () => {
    signUpForm.hidden = true;
    signInForm.hidden = false;
    message.textContent = "";
  });

  signInForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) return;
    const button = signInForm.querySelector('[type="submit"]');
    button.disabled = true;
    message.textContent = "Signing in…";
    try {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: signInForm.elements.namedItem("email").value.trim(),
        password: signInForm.elements.namedItem("password").value
      });
      if (error) throw error;
      signInForm.reset();
      message.textContent = "";
      await refreshAccountPage();
    } catch (error) {
      console.error("Account sign-in failed.", error);
      message.textContent = "Sign-in failed. Check the email and password, then try again.";
    } finally {
      button.disabled = false;
    }
  });

  signUpForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabaseClient) return;
    const button = signUpForm.querySelector('[type="submit"]');
    button.disabled = true;
    message.textContent = "Creating your account…";
    const displayName = signUpForm.elements.namedItem("displayName").value.trim();
    const email = signUpForm.elements.namedItem("email").value.trim();
    const password = signUpForm.elements.namedItem("password").value;
    try {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}${window.location.pathname}#account`
        }
      });
      if (error) throw error;
      signUpForm.reset();
      if (data.session) {
        message.textContent = "Account created. You’re signed in.";
        await refreshAccountPage();
      } else {
        signUpForm.hidden = true;
        signInForm.hidden = false;
        message.textContent = "Account created. Check your email to confirm it, then sign in.";
      }
    } catch (error) {
      console.error("Account registration failed.", error);
      message.textContent = error.message?.toLowerCase().includes("redirect")
        ? "Supabase needs this website URL added to Authentication → URL Configuration → Redirect URLs."
        : "Could not create the account. The email may already be registered, or Supabase may need account sign-up enabled.";
    } finally {
      button.disabled = false;
    }
  });

  app.querySelector("[data-account-sign-out]")?.addEventListener("click", async () => {
    const button = app.querySelector("[data-account-sign-out]");
    button.disabled = true;
    const { error } = await supabaseClient.auth.signOut();
    button.disabled = false;
    if (error) {
      message.textContent = "Could not sign out. Please try again.";
      return;
    }
    message.textContent = "You’re signed out.";
    await refreshAccountPage();
  });
}

function wirePageControls(route) {
  if (route === "request") {
    const requestForm = app.querySelector("[data-request-form]");
    requestForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const name = requestForm.elements.namedItem("name").value.trim();
      const item = requestForm.elements.namedItem("item").value.trim();
      const status = app.querySelector("[data-request-status]");
      if (!name || !item) {
        status.textContent = "Please fill in both required fields.";
        return;
      }

      if (!supabaseClient) {
        status.textContent = "Requests are not connected yet. Please try again later.";
        return;
      }

      const submitButton = requestForm.querySelector('[type="submit"]');
      submitButton.disabled = true;
      status.textContent = "Sending your request…";
      try {
        const { error } = await supabaseClient.from("video_requests").insert({ name, item });
        if (error) {
          console.error("Could not submit video request.", error);
          status.textContent = error.code === "PGRST205" || error.code === "42P01"
            ? "The requests table is missing in Supabase. Karaas needs to run supabase-setup.sql in the Supabase SQL Editor, then try again."
            : error.code === "PGRST204" || error.code === "42703"
              ? "The requests table is missing its name or item column. Run the updated supabase-setup.sql in the Supabase SQL Editor, then try again."
            : error.code === "42501"
              ? "Supabase blocked this request. Check the insert permission and row security policy in supabase-setup.sql."
              : "Could not send your request. Please check your connection and try again.";
          return;
        }

        requestForm.reset();
        status.textContent = "Thanks! Your request was sent privately to the site owner.";
      } catch (error) {
        console.error("Could not reach Supabase to submit video request.", error);
        status.textContent = "Could not reach the request database. Check your internet connection and try again.";
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  if (route === "requests") {
    const loginForm = app.querySelector("[data-admin-login]");
    loginForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = loginForm.elements.namedItem("email").value.trim();
      const password = loginForm.elements.namedItem("password").value;
      const status = app.querySelector("[data-admin-status]");
      if (!supabaseClient || email.toLowerCase() !== supabaseConfig.adminEmail?.toLowerCase()) {
        status.textContent = "That email is not authorized for the private inbox.";
        return;
      }

      const button = loginForm.querySelector('[type="submit"]');
      button.disabled = true;
      status.textContent = "Signing in…";
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      button.disabled = false;
      if (error) {
        status.textContent = "Sign-in failed. Check the owner email and password.";
        return;
      }

      loginForm.reset();
      await refreshPrivateRequests();
    });
  }

  const heroLogo = document.querySelector(".hero-art img");
  if (heroLogo) {
    let dragStart;

    heroLogo.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const currentX = Number.parseFloat(heroLogo.dataset.dragX || "0");
      const currentY = Number.parseFloat(heroLogo.dataset.dragY || "0");
      dragStart = {
        pointerX: event.clientX,
        pointerY: event.clientY,
        offsetX: currentX,
        offsetY: currentY
      };
      heroLogo.closest(".hero")?.classList.add("is-logo-dragging");
      heroLogo.classList.add("is-dragging");
      heroLogo.setPointerCapture(event.pointerId);
    });

    heroLogo.addEventListener("pointermove", (event) => {
      if (!dragStart) return;
      const x = dragStart.offsetX + event.clientX - dragStart.pointerX;
      const y = dragStart.offsetY + event.clientY - dragStart.pointerY;
      heroLogo.dataset.dragX = String(x);
      heroLogo.dataset.dragY = String(y);
      heroLogo.style.setProperty("--logo-drag-x", `${x}px`);
      heroLogo.style.setProperty("--logo-drag-y", `${y}px`);
    });

    const stopLogoDrag = () => {
      if (!dragStart) return;
      dragStart = undefined;
      delete heroLogo.dataset.dragX;
      delete heroLogo.dataset.dragY;
      heroLogo.style.setProperty("--logo-drag-x", "0px");
      heroLogo.style.setProperty("--logo-drag-y", "0px");
      heroLogo.classList.remove("is-dragging");
    };
    heroLogo.addEventListener("transitionend", (event) => {
      if (event.propertyName === "transform" && !dragStart) {
        heroLogo.closest(".hero")?.classList.remove("is-logo-dragging");
      }
    });
    heroLogo.addEventListener("pointerup", stopLogoDrag);
    heroLogo.addEventListener("pointercancel", stopLogoDrag);
    heroLogo.addEventListener("lostpointercapture", stopLogoDrag);
  }

  document.querySelectorAll("[data-watch-video]").forEach((button) => {
    button.addEventListener("click", () => {
      const frame = button.closest(".media-frame");
      const iframe = document.createElement("iframe");
      iframe.src = videoUrl(button.dataset.videoId);
      iframe.title = button.closest(".media-card").querySelector("h3").textContent;
      iframe.loading = "lazy";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.referrerPolicy = "origin-when-cross-origin";
      iframe.allowFullscreen = true;
      frame.replaceChildren(iframe);
    });
  });

  document.querySelectorAll("[data-favorite-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.favoriteKind;
      const id = button.dataset.favoriteId;
      const label = button.dataset.favoriteLabel || "favorite";
      const nextSet = getFavoriteSet();
      const key = `${kind}:${id}`;

      if (nextSet.has(key)) {
        nextSet.delete(key);
      } else {
        nextSet.add(key);
      }

      setFavoriteSet(nextSet);
      const isFavorited = nextSet.has(key);
      button.classList.toggle("is-favorited", isFavorited);
      button.textContent = isFavorited ? "♥" : "♡";
      button.setAttribute("aria-label", `${isFavorited ? "Remove from favorites" : "Add to favorites"}: ${label}`);
      button.setAttribute("title", isFavorited ? "Remove from favorites" : "Add to favorites");
    });
  });

  document.querySelectorAll("[data-fullscreen]").forEach((button) => {
    button.addEventListener("click", async () => {
      const frame = button.closest(".media-frame");
      if (!frame) return;
      try {
        if (document.fullscreenElement === frame) {
          await document.exitFullscreen?.();
          return;
        }
        if (document.fullscreenElement) await document.exitFullscreen?.();
        await frame.requestFullscreen?.();
      } catch (error) {
        console.warn("Unable to enter game fullscreen mode.", error);
      }
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
  const pageRoute = route;
  app.innerHTML = pageRoute === "home" ? homePage() : pageRoute === "people" ? peopleDirectoryPage() : pageRoute === "request" ? requestsPage() : pageRoute === "requests" ? privateRequestsPage() : pageRoute === "account" ? accountPage() : pageRoute === "settings" ? settingsPage() : pageRoute === "hany" ? hanyPage() : person ? personPage(person) : homePage();
  if (pageRoute === "home") mountDailyPoll();
  if (pageRoute === "settings") mountCustomizations();
  document.querySelectorAll("[data-nav]").forEach((link) => link.classList.toggle("active", link.dataset.nav === (person || pageRoute === "people" ? "people" : route)));
  const pointsDisplay = document.querySelector("[data-points-total]");
  if (pointsDisplay) pointsDisplay.textContent = String(loadPoints());
  updateRewardButtonState();
  wirePageControls(pageRoute);
  if (pageRoute === "requests") refreshPrivateRequests();
  if (pageRoute === "account") {
    wireAccountControls();
    refreshAccountPage();
  }
  attachRewardListeners();
  attachEconomyListeners();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showRecentUpdates() {
  const modal = document.querySelector("[data-updates-modal]");
  const dialog = modal?.querySelector('[role="dialog"]');
  if (!modal || !dialog) return;

  const closeButtons = modal.querySelectorAll("[data-close-updates]");
  const previousOverflow = document.body.style.overflow;
  const previousFocus = document.activeElement;
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = previousOverflow;
    document.removeEventListener("keydown", handleModalKeydown);
    if (previousFocus instanceof HTMLElement && document.body.contains(previousFocus)) previousFocus.focus();
  };
  const handleModalKeydown = (event) => {
    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  closeButtons.forEach((button) => button.addEventListener("click", closeModal));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeModal();
  });
  document.body.style.overflow = "hidden";
  modal.hidden = false;
  document.addEventListener("keydown", handleModalKeydown);
  closeButtons[0]?.focus();
}

window.addEventListener("hashchange", render);
render();
showRecentUpdates();
