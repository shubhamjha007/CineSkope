const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// ---- Search-as-you-type ----
// Lightweight lookup used by the dropdown while the person is typing.
// TMDb's "multi" search returns movies and TV shows together, tagged
// with media_type, so one call covers both.
app.get("/suggest", async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.json({ results: [] });
    }

    try {
        const url = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&api_key=${process.env.TMDB_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        const results = (data.results || [])
            .filter(r => r.media_type === "movie" || r.media_type === "tv")
            .slice(0, 6)
            .map(r => ({
                id: r.id,
                type: r.media_type,
                title: r.title || r.name || "Untitled",
                year: (r.release_date || r.first_air_date || "").slice(0, 4),
                poster: r.poster_path
                    ? `https://image.tmdb.org/t/p/w92${r.poster_path}`
                    : ""
            }));

        res.json({ results });

    } catch (error) {
        res.json({ results: [] });
    }
});

// ---- Full lookup: combined score + per-source ratings ----
// Two ways in:
//   ?id=...&type=movie|tv   -> picked from the suggestions dropdown
//   ?title=...              -> plain text search, falls back to the
//                              top multi-search match
app.get("/movie", async (req, res) => {
    const { title, id, type } = req.query;

    if (!title && !id) {
        return res.json({ error: "No movie title provided" });
    }

    try {
        let mediaId = id;
        let mediaType = type === "tv" ? "tv" : "movie";
        let basicInfo;

        if (mediaId) {
            // Already know exactly which title this is.
            const detailsUrl = `https://api.themoviedb.org/3/${mediaType}/${mediaId}?api_key=${process.env.TMDB_API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            basicInfo = await detailsResponse.json();

            if (!basicInfo || basicInfo.success === false) {
                return res.json({ error: "Title not found" });
            }
        } else {
            // Plain text search — take the top movie/TV match.
            const searchUrl = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}&api_key=${process.env.TMDB_API_KEY}`;
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();

            const match = (searchData.results || []).find(
                r => r.media_type === "movie" || r.media_type === "tv"
            );

            if (!match) {
                return res.json({ error: "Movie not found" });
            }

            mediaId = match.id;
            mediaType = match.media_type;
            basicInfo = match;
        }

        const displayTitle = basicInfo.title || basicInfo.name;
        const posterPath = basicInfo.poster_path;

        // Movies carry imdb_id directly on /movie/{id}; TV shows need a
        // separate external_ids lookup, and a multi-search match has
        // neither, so fall back to external_ids whenever it's missing.
        let imdbID = basicInfo.imdb_id;
        if (!imdbID) {
            const extUrl = `https://api.themoviedb.org/3/${mediaType}/${mediaId}/external_ids?api_key=${process.env.TMDB_API_KEY}`;
            const extResponse = await fetch(extUrl);
            const extData = await extResponse.json();
            imdbID = extData.imdb_id;
        }

        let imdbRating = "N/A";
        let rottenRating = "N/A";
        let metacriticRating = "N/A";
        let omdbDetails = null;

        if (imdbID) {
            const omdbUrl = `http://www.omdbapi.com/?i=${imdbID}&apikey=${process.env.OMDB_API_KEY}`;
            const omdbResponse = await fetch(omdbUrl);
            const omdbData = await omdbResponse.json();

            if (omdbData.Response !== "False") {
                omdbDetails = omdbData;
            }

            imdbRating = omdbData.imdbRating || "N/A";

            const rotten = omdbData.Ratings?.find(
                r => r.Source === "Rotten Tomatoes"
            );
            rottenRating = rotten ? rotten.Value : "N/A";

            const metacritic = omdbData.Ratings?.find(
                r => r.Source === "Metacritic"
            );
            metacriticRating = metacritic ? metacritic.Value : "N/A";
        }

        // OMDb's plot, genre, etc. are usually more complete than TMDb's,
        // so prefer them when available; fall back to TMDb so there's
        // still something to show if OMDb has no record for this title.
        const clean = (value) => (value && value !== "N/A" ? value : "");

        const details = {
            overview: clean(omdbDetails?.Plot) || basicInfo.overview || "",
            genre: clean(omdbDetails?.Genre),
            director: clean(omdbDetails?.Director),
            cast: clean(omdbDetails?.Actors),
            runtime: clean(omdbDetails?.Runtime),
            rated: clean(omdbDetails?.Rated),
            year: clean(omdbDetails?.Year) || (basicInfo.release_date || basicInfo.first_air_date || "").slice(0, 4),
            awards: clean(omdbDetails?.Awards)
        };

        // Build a "sources" entry only for ratings that actually came back.
        // Each one carries its own scale (outOf) so the frontend can
        // normalize it to /10 for the combined score and the stub display.
        const sources = [];

        const tmdbScore = parseRating(basicInfo.vote_average, 10);
        if (tmdbScore !== null) {
            sources.push({ name: "TMDb", score: tmdbScore, outOf: 10 });
        }

        const imdbScore = parseRating(imdbRating, 10);
        if (imdbScore !== null) {
            sources.push({ name: "IMDb", score: imdbScore, outOf: 10 });
        }

        const rtScore = parseRating(rottenRating, 100);
        if (rtScore !== null) {
            sources.push({ name: "Rotten Tomatoes", score: rtScore, outOf: 100 });
        }

        const metaScore = parseRating(metacriticRating, 100);
        if (metaScore !== null) {
            sources.push({ name: "Metacritic", score: metaScore, outOf: 100 });
        }

        res.json({
            title: displayTitle,
            type: mediaType,
            poster: posterPath
                ? `https://image.tmdb.org/t/p/w500${posterPath}`
                : "",
            combined: combineScores(sources),
            sources,
            details
        });

    } catch (error) {
        res.json({ error: "Failed to fetch movie data" });
    }
});

// Turns a raw rating value (which might be "N/A", "87%", "8.8", or a
// plain number) into a number on its own scale, or null if it's unusable.
function parseRating(value, outOf) {
    if (value === undefined || value === null || value === "N/A") {
        return null;
    }
    const num = parseFloat(String(value).replace("%", ""));
    if (Number.isNaN(num)) {
        return null;
    }
    return num;
}

// Averages every source's score after normalizing each to a /10 scale.
// Returns null (rather than 0) when nothing came back, so the frontend
// can show "—" instead of a misleading zero.
function combineScores(sources) {
    if (!sources.length) return null;

    const normalized = sources.map(s => (s.score / s.outOf) * 10);
    const sum = normalized.reduce((total, n) => total + n, 0);

    return Math.round((sum / normalized.length) * 10) / 10;
}


app.listen(5000, () => {
    console.log("Server running on port 5000");
});