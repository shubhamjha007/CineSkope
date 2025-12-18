

async function searchMovie() {
    const movieName = document.getElementById("searchInput").value;

    if (movieName === "") {
        document.getElementById("result").innerText =
            "Please enter a movie name";
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:5000/movie?title=${movieName}`
        );

        const data = await response.json();

        document.getElementById("result").innerText = data.message;

    } catch (error) {
        document.getElementById("result").innerText =
            "Error connecting to backend";
    }
}
