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
        const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(
            title
        )}&api_key=${process.env.TMDB_API_KEY}`;

        const tmdbResponse = await fetch(url);
        const tmdbData = await tmdbResponse.json();

        if (!tmdbData.results || tmdbData.results.length === 0) {
            return res.json({ error: "Movie not found" });
        }

        const movie = tmdbData.results[0];

        res.json({
            title: movie.title,
            overview: movie.overview,
            poster: movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : "",
            rating: movie.vote_average
        });
    } catch (error) {
        console.error(error);
        res.json({ error: "Failed to fetch movie data" });
    }
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
