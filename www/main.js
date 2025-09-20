// Global variable for the YouTube API
let player;
window.onYouTubeIframeAPIReady = () => console.log("YouTube Player API Ready.");
window.handlePlayerStateChange = (event) => {
    if (event.data === YT.PlayerState.ENDED) {
        document.getElementById('player-container').innerHTML = `<div class="video-placeholder"><p>Video finished.</p></div>`;
        document.getElementById('player-controls').innerHTML = '';
    }
};

// --- DOM ELEMENTS & CONFIG ---
const RENDER_BACKEND_URL = "https://focustube-backend-1d7l.onrender.com"; // IMPORTANT
const YOUTUBE_API_KEY = "AIzaSyCDBue0NEe_hAOmCGJNdjLB9EgHpZL3_Lw"
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsSidebar = document.getElementById('results-sidebar');
const playerContainer = document.getElementById('player-container');
const playerControls = document.getElementById('player-controls');
const darkModeToggle = document.getElementById('dark-mode-toggle');

// --- EVENT LISTENERS ---
searchForm.addEventListener('submit', handleSearchSubmit);
darkModeToggle.addEventListener('click', toggleDarkMode);

// --- CORE LOGIC ---
(function checkTheme() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        darkModeToggle.textContent = '☀️';
    }
})();

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        darkModeToggle.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        darkModeToggle.textContent = '🌙';
    }
}

async function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;
    resultsSidebar.innerHTML = `<p>Searching...</p>`;
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=20&q=${encodeURIComponent(query)}&key=YOUTUBE_API_KEY`);
        if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
        const data = await res.json();
        displayResults(data.items);
    } catch (error) {
        resultsSidebar.innerHTML = `<p class="error">Search failed.</p>`;
    }
}

function displayResults(items) {
    resultsSidebar.innerHTML = '';
    if (!items || items.length === 0) {
        resultsSidebar.innerHTML = '<p>No results found.</p>';
        return;
    }
    items.forEach(item => {
        const { videoId } = item.id;
        const { title, channelTitle, thumbnails } = item.snippet;
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `<img src="${thumbnails.medium.url}" alt="" class="result-thumbnail"><div class="result-info"><h3 class="result-title">${title}</h3><p class="result-channel">${channelTitle}</p></div>`;
        resultItem.addEventListener('click', () => playVideo(videoId));
        resultsSidebar.appendChild(resultItem);
    });
}

function playVideo(videoId) {
    searchInput.value = '';
    searchInput.blur();
    playerContainer.innerHTML = '<div id="youtube-player-iframe"></div>';
    playerControls.innerHTML = `<button id="audio-mode-btn" class="control-button" title="Switch to Audio Only">🎧</button>`;
    document.getElementById('audio-mode-btn').addEventListener('click', () => switchToAudioMode(videoId));
    player = new YT.Player('youtube-player-iframe', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: { 'playsinline': 1, 'rel': 0, 'autoplay': 1 },
        events: { 'onStateChange': window.handlePlayerStateChange }
    });
}

async function switchToAudioMode(videoId) {
    playerContainer.innerHTML = '<p>Switching to Audio Mode...</p>';
    playerControls.innerHTML = '';
    try {
        const res = await fetch(`${RENDER_BACKEND_URL}/getVideo?videoId=${videoId}`);
        if (!res.ok) throw new Error('Back-end service failed.');
        const { streamUrl } = await res.json();
        playerContainer.innerHTML = `
            <div style="text-align: center; color: #ccc; padding-bottom: 10px;"><p style="margin: 0;">Now Playing (Audio Only)</p></div>
            <audio controls autoplay style="width: 100%;"><source src="${streamUrl}" type="video/mp4"></audio>
        `;
    } catch (error) {
        playerContainer.innerHTML = `<p class="error">Could not switch to audio mode.</p>`;
    }
}
