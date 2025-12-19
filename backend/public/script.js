async function searchMovie() {
    const movieName = document.getElementById("searchInput").value;
    const resultDiv = document.getElementById("result");

    if (movieName === "") {
        resultDiv.innerText = "Please enter a movie name";
        return;
    }

    resultDiv.innerText = "Loading...";

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
            <img src="${data.poster}" width="200" />
            <p><strong>Rating:</strong> ${data.rating}</p>
            <p>${data.overview}</p>
        `;
    } catch (error) {
        resultDiv.innerText = "Failed to fetch data";
    }
}
