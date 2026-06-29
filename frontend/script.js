/* ============================================
   CineSkope front end
   ------------------------------------------------
   Backend endpoints used:

   GET /suggest?query=...
     -> { results: [ { id, type: "movie"|"tv", title, year, poster } ] }
     Lightweight, used for the search-as-you-type dropdown.

   GET /movie?id=...&type=movie|tv   (preferred, from a picked suggestion)
   GET /movie?title=...              (fallback, plain text search)
     -> {
          title: "Inception",
          type: "movie",
          combined: 8.7,             // out of 10
          sources: [
            { name: "IMDb", score: 8.8, outOf: 10 },
            { name: "Rotten Tomatoes", score: 87, outOf: 100 },
            { name: "Metacritic", score: 74, outOf: 100 }
          ]
        }

   Older backends that only return { "message": "..." } are still
   handled below and shown as a plain status line, so nothing breaks
   while you update the API.
   ============================================ */

const BACKEND_URL = "http://localhost:5000/movie";
const SUGGEST_URL = "http://localhost:5000/suggest";
const DEBOUNCE_MS = 300;

const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const result = document.getElementById("result");
const suggestionsList = document.getElementById("suggestions");

let debounceTimer = null;
let currentSuggestions = [];
let activeIndex = -1;

form.addEventListener("submit", (event) => {
    event.preventDefault();
    hideSuggestions();
    searchMovie();
});

input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = input.value.trim();

    if (!query) {
        hideSuggestions();
        return;
    }

    debounceTimer = setTimeout(() => fetchSuggestions(query), DEBOUNCE_MS);
});

input.addEventListener("keydown", (event) => {
    if (suggestionsList.hidden) return;

    if (event.key === "ArrowDown") {
        event.preventDefault();
        moveActive(1);
    } else if (event.key === "ArrowUp") {
        event.preventDefault();
        moveActive(-1);
    } else if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault();
        pickSuggestion(currentSuggestions[activeIndex]);
    } else if (event.key === "Escape") {
        hideSuggestions();
    }
});

document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-input-wrap")) {
        hideSuggestions();
    }
});

async function searchMovie() {
    const title = input.value.trim();

    if (!title) {
        showStatus("Type a movie or show name first.", true);
        return;
    }

    await fetchAndRender(`${BACKEND_URL}?title=${encodeURIComponent(title)}`);
}

async function fetchAndRender(url) {
    showLoading();

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Backend responded with ${response.status}`);
        }

        const data = await response.json();
        renderResult(data);

    } catch (error) {
        showStatus(
            "Couldn't reach the box office. Check that the backend is running on localhost:5000.",
            true
        );
    }
}

async function fetchSuggestions(query) {
    try {
        const response = await fetch(`${SUGGEST_URL}?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        currentSuggestions = Array.isArray(data.results) ? data.results : [];
        renderSuggestions();
    } catch (error) {
        hideSuggestions();
    }
}

function renderSuggestions() {
    activeIndex = -1;

    if (!currentSuggestions.length) {
        hideSuggestions();
        return;
    }

    suggestionsList.innerHTML = currentSuggestions.map((item, index) => `
        <li class="suggestion-item" role="option" data-index="${index}">
            ${item.poster
                ? `<img class="suggestion-poster" src="${item.poster}" alt="">`
                : `<span class="suggestion-poster"></span>`}
            <span class="suggestion-text">
                <span class="suggestion-title">${escapeHtml(item.title || "Untitled")}</span>
                <span class="suggestion-meta">${item.type === "tv" ? "Show" : "Movie"}${item.year ? " · " + escapeHtml(item.year) : ""}</span>
            </span>
        </li>
    `).join("");

    suggestionsList.hidden = false;
    input.setAttribute("aria-expanded", "true");

    suggestionsList.querySelectorAll(".suggestion-item").forEach((el) => {
        el.addEventListener("click", () => {
            pickSuggestion(currentSuggestions[Number(el.dataset.index)]);
        });
    });
}

function moveActive(direction) {
    const items = suggestionsList.querySelectorAll(".suggestion-item");
    if (!items.length) return;

    activeIndex = (activeIndex + direction + items.length) % items.length;

    items.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
    items[activeIndex].scrollIntoView({ block: "nearest" });
}

function hideSuggestions() {
    suggestionsList.hidden = true;
    suggestionsList.innerHTML = "";
    input.setAttribute("aria-expanded", "false");
    currentSuggestions = [];
    activeIndex = -1;
}

function pickSuggestion(item) {
    if (!item) return;
    input.value = item.title || "";
    hideSuggestions();
    fetchAndRender(`${BACKEND_URL}?id=${item.id}&type=${item.type}`);
}

function showStatus(text, isError) {
    result.innerHTML = `<p class="status-line${isError ? " is-error" : ""}">${escapeHtml(text)}</p>`;
}

function showLoading() {
    result.innerHTML = `
        <div class="bulbs chasing" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
        </div>
        <p class="status-line">Pulling scores from the critics…</p>
    `;
}

function renderResult(data) {
    // Your backend sends { error: "..." } when TMDb can't find a match,
    // or when the lookup itself fails. Show that message directly rather
    // than falling through to an empty card.
    if (data && data.error) {
        showStatus(data.error, true);
        return;
    }

    // Backward compatibility with a backend that only sends { message }
    if (!data || (data.message && !data.sources)) {
        showStatus(data && data.message ? data.message : "No data came back for that title.", false);
        return;
    }

    const title = escapeHtml(data.title || input.value.trim());
    const combined = formatScore(data.combined);
    const sources = Array.isArray(data.sources) ? data.sources : [];
    const posterUrl = data.poster || "";
    const kindLabel = data.type === "tv" ? "Show" : "Movie";

    const sourceCards = sources.map((source) => {
        const name = escapeHtml(source.name || "Source");
        const outOf = source.outOf || 10;
        const normalized = formatScore(toTen(source.score, outOf));
        return `
            <div class="source-stub">
                <p class="source-name">${name}</p>
                <p class="source-score">${normalized}</p>
                <p class="source-raw">${escapeHtml(String(source.score))}/${outOf}</p>
            </div>
        `;
    }).join("");

    result.innerHTML = `
        <article class="score-card">
            ${posterUrl ? `<img class="poster" src="${posterUrl}" alt="${title} poster">` : ""}
            <p class="stub-title">${title}</p>
            <p class="stub-sub">${kindLabel} · combined score</p>
            <div class="combined-score">
                <span class="score-num">${combined}</span><span class="score-max">/10</span>
            </div>
        </article>
        <div class="perforation" aria-hidden="true"></div>
        <div class="sources-row">
            ${sourceCards || `<p class="status-line">No individual source scores yet.</p>`}
        </div>
        ${renderDetails(data.details)}
    `;
}

function renderDetails(details) {
    if (!details) return "";

    const tags = [details.year, details.runtime, details.rated, details.genre]
        .filter(Boolean)
        .map((tag) => `<span class="details-tag">${escapeHtml(tag)}</span>`)
        .join("");

    const rows = [
        details.director ? `<p class="details-row"><strong>Director:</strong> ${escapeHtml(details.director)}</p>` : "",
        details.cast ? `<p class="details-row"><strong>Cast:</strong> ${escapeHtml(details.cast)}</p>` : "",
        details.awards ? `<p class="details-row"><strong>Awards:</strong> ${escapeHtml(details.awards)}</p>` : ""
    ].join("");

    if (!details.overview && !tags && !rows) return "";

    return `
        <div class="details-panel">
            ${details.overview ? `<p class="details-plot">${escapeHtml(details.overview)}</p>` : ""}
            ${tags ? `<div class="details-meta">${tags}</div>` : ""}
            ${rows}
        </div>
    `;
}

function toTen(score, outOf) {
    const num = Number(score);
    if (Number.isNaN(num) || !outOf) return null;
    return (num / outOf) * 10;
}

function formatScore(value) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "—";
    }
    return Number(value).toFixed(1);
}

function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}