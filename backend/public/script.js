async function searchMovie() {
    const movieName = document.getElementById("searchInput").value;
    const resultDiv = document.getElementById("result");

    if (movieName === "") {
        resultDiv.innerText = "Please enter a movie name";
        return;
    }

    resultDiv.innerHTML = "<p>Loading...</p>";

    try {
        const response = await fetch(
            `http://localhost:5000/movie?title=${movieName}`
        );

        const data = await response.json();

        if (data.error) {
            resultDiv.innerText = data.error;
            return;
        }

        resultDiv.innerHTML = `
    <div class="card">
        <h2>${data.title}</h2>

        <img src="${data.poster}" width="240" />

        <p class="overview">${data.overview}</p>

        <div class="ratings">
            <div class="rating-box">
                <p>TMDb</p>
                <strong>⭐ ${data.tmdbRating}</strong>
            </div>
            <div class="rating-box">
                <p>IMDb</p>
                <strong>⭐ ${data.imdbRating}</strong>
            </div>
            <div class="rating-box">
                <p>Rotten Tomatoes</p>
                <strong>🍅 ${data.rottenRating}</strong>
            </div>
        </div>
    </div>
`;


    } catch (error) {
        resultDiv.innerText = "Failed to fetch data";
    }
}
