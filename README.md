# 🎬 CineSkope

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge)

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-success?style=for-the-badge)](https://cineskope.onrender.com)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/shubhamjha007/CineSkope)

**Compare movie and TV show ratings from multiple platforms in one place.**

CineSkope is a full-stack web application that allows users to search for movies and TV shows and view ratings aggregated from **IMDb**, **Rotten Tomatoes**, **TMDb**, and **Metacritic**. It presents all ratings in a clean, cinema-inspired interface along with detailed information such as plot, cast, director, runtime, genre, and awards.

## 🌐 Live Demo

**Live Application:** https://cineskope.onrender.com

## ✨ Features

- 🔍 Search movies and TV shows
- ⚡ Search autocomplete suggestions
- ⭐ Aggregated ratings from:
  - IMDb
  - Rotten Tomatoes
  - TMDb
  - Metacritic
- 🎯 Combined rating display
- 🎬 Detailed movie information
  - Overview
  - Genre
  - Runtime
  - Content Rating
  - Director
  - Cast
  - Awards
- 📱 Fully responsive design
- 🔒 Secure API key management using environment variables

---

## 📸 Screenshots

### Home Page

> ![HomePage](homepage_desktop.png)

---

### Search Results

> ![Search Result](search_result_desktop.png)

> (![Details and Overview](<details and overview desktop-1.png>))

---

### Mobile View

> ![Homepage Mobile](homepage_mobile.jpg)

>![Search Result Mobile](search_result_mobile.jpg)

>  ![Details and Overview Mobile](<details and overview mobile.jpg>)

---

## 🛠 Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript (ES6)

### Backend

- Node.js
- Express.js

### APIs

- TMDb API
- OMDb API

### Tools

- Git
- GitHub
- Render
- dotenv

---

## 📂 Project Structure

```
CineSkope
│
├── backend
│   ├── public
│   │   ├── index.html
│   │   ├── style.css
│   │   ├── script.js
│   │   └── favicon.ico
│   │
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend
│
└── README.md
```

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone <https://github.com/shubhamjha007/CineSkope>

cd CineSkope/backend
```

### Install dependencies

```bash
npm install
```

### Create a `.env` file

```env
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_omdb_api_key
```

### Start the server

```bash
npm start
```

Visit

```
http://localhost:5000
```

---

## 🎯 Future Improvements

- 🎥 Official movie trailers
- ❤️ Favorites / Watchlist
- 🔥 Trending movies section
- 🎬 Similar movie recommendations
- 🌙 Light/Dark theme toggle
- 📊 Weighted CineScore algorithm
- 🎭 Actor and director pages
- 🎞 Streaming platform availability

---

## 📖 What I Learned

Through this project, I gained practical experience with:

- REST API integration
- Full-stack web development
- Asynchronous JavaScript
- Express.js server development
- Environment variable management
- Git & GitHub workflows
- Deploying applications on Render
- Responsive web design

---

## 👨‍💻 Author

**Shubham Kumar Jha**

- GitHub: <https://github.com/shubhamjha007>
- LinkedIn: <https://www.linkedin.com/in/shubhamjha07/>

---

## 🙏 Acknowledgements

This project uses data provided by:

- TMDb API
- OMDb API

Special thanks to both platforms for providing public APIs for educational and development purposes.