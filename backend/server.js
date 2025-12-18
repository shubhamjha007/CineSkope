const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("/movie", (req, res) => {
    const title = req.query.title;

    if (!title) {
        return res.json({ message: "No movie title provided" });
    }

    res.json({
        message: `Backend received movie: ${title}`
    });
});

app.listen(5000, () => {
    console.log("Server running on port 5000");
});
