const express = require("express");
const cors = require("cors");
const path = require("path");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

app.get("/movie", async (req, res) => {
    const title = req.query.title;

    if (!title) {
        return res.json({ error: "No movie title provided" });
    }

    try {
        // 1️⃣ TMDb search
        const tmdbUrl = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
            title
        )}&api_key=${process.env.TMDB_API_KEY}`;

        const tmdbResponse = await fetch(tmdbUrl);
        const tmdbData = await tmdbResponse.json();

        if (!tmdbData.results || tmdbData.results.length === 0) {
            return res.json({ error: "Movie not found" });
        }

        const movie = tmdbData.results[0];

        // 2️⃣ Get IMDb ID from TMDb movie details
        const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.TMDB_API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        const imdbID = detailsData.imdb_id;

        // 3️⃣ OMDb ratings using IMDb ID
        let imdbRating = "N/A";
        let rottenRating = "N/A";

        if (imdbID) {
            const omdbUrl = `http://www.omdbapi.com/?i=${imdbID}&apikey=${process.env.OMDB_API_KEY}`;
            const omdbResponse = await fetch(omdbUrl);
            const omdbData = await omdbResponse.json();

            imdbRating = omdbData.imdbRating || "N/A";

            const rotten = omdbData.Ratings?.find(
                r => r.Source === "Rotten Tomatoes"
            );
            rottenRating = rotten ? rotten.Value : "N/A";
        }

        res.json({
            title: movie.title,
            overview: movie.overview,
            poster: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "",
            tmdbRating: movie.vote_average,
            imdbRating,
            rottenRating
        });

    } catch (error) {
        res.json({ error: "Failed to fetch movie data" });
    }
});


app.listen(5000, () => {
    console.log("Server running on port 5000");
});
