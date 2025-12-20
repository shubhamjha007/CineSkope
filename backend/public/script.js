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
            <h2>${data.title}</h2>

            <img src="${data.poster}" width="220" style="margin:15px 0"/>

            <p><strong>Overview:</strong><br>${data.overview}</p>

            <p><strong>TMDb Rating:</strong> ⭐ ${data.tmdbRating}</p>
            <p><strong>IMDb Rating:</strong> ⭐ ${data.imdbRating}</p>
            <p><strong>Rotten Tomatoes:</strong> 🍅 ${data.rottenRating}</p>
        `;

    } catch (error) {
        resultDiv.innerText = "Failed to fetch data";
    }
}
