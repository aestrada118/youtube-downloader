// script.js
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('downloadForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const qualitySelect = document.getElementById('qualitySelect');
    const statusEl = document.getElementById('status');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const historyBody = document.getElementById('historyBody');
    const clearHistoryBtn = document.getElementById('clearHistory');

    renderHistory();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = videoUrlInput.value.trim();
        const quality = qualitySelect.value;

        if (!url) {
            showStatus('Please enter a valid YouTube URL.', 'error');
            return;
        }

        const videoId = extractVideoId(url);
        if (!videoId) {
            showStatus('Invalid YouTube URL. Please check and try again.', 'error');
            return;
        }

        downloadVideo(videoId, quality);
    });

    clearHistoryBtn.addEventListener('click', () => {
        localStorage.removeItem('downloadHistory');
        renderHistory();
        showStatus('History cleared.', 'info');
    });

    function extractVideoId(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
                return urlObj.searchParams.get('v');
            }
            if (urlObj.hostname === 'youtu.be') {
                return urlObj.pathname.slice(1);
            }
        } catch (_) {
            // If the input is an 11-char video ID by itself
            if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
                return url;
            }
        }
        return null;
    }

    async function downloadVideo(videoId, quality) {
        showStatus('Fetching video info…', 'info');
        showProgress(10);

        try {
            // Verify the video exists and retrieve its title
            const infoResponse = await fetch(
                `/api/info?videoId=${encodeURIComponent(videoId)}`
            );
            if (!infoResponse.ok) {
                let errMsg = 'Failed to fetch video info';
                try {
                    const err = await infoResponse.json();
                    errMsg = err.error || errMsg;
                } catch (parseErr) {
                    console.error('Could not parse error response:', parseErr);
                }
                throw new Error(errMsg);
            }
            const info = await infoResponse.json();

            showProgress(40);
            showStatus(`Downloading: ${info.title}`, 'info');

            // Trigger the actual file download via a hidden link
            const downloadUrl =
                `/api/download?videoId=${encodeURIComponent(videoId)}&quality=${encodeURIComponent(quality)}`;
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            showProgress(100);
            showStatus('Download started! Check your downloads folder.', 'success');
            saveToHistory(videoId, quality, info.title);
        } catch (error) {
            console.error('Error downloading video:', error);
            showStatus(
                `Error: ${error.message || 'Could not connect to the server. Make sure it is running (npm start).'}`,
                'error'
            );
            showProgress(0);
        }
    }

    function showProgress(value) {
        progressContainer.style.display = 'block';
        const clamped = Math.min(value, 100);
        progressBar.style.width = clamped + '%';
        progressText.textContent = clamped + '%';
    }

    function showStatus(message, type) {
        statusEl.textContent = message;
        statusEl.className = 'status-message ' + type;
    }

    function saveToHistory(videoId, quality, title) {
        const history = JSON.parse(localStorage.getItem('downloadHistory')) || [];
        history.unshift({ videoId, quality, title: title || videoId, date: new Date().toISOString() });
        localStorage.setItem('downloadHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('downloadHistory')) || [];
        historyBody.innerHTML = '';

        if (history.length === 0) {
            const row = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = 3;
            td.style.textAlign = 'center';
            td.style.color = '#666';
            td.textContent = 'No downloads yet';
            row.appendChild(td);
            historyBody.appendChild(row);
            return;
        }

        history.forEach((item) => {
            const row = document.createElement('tr');
            const tdTitle = document.createElement('td');
            const tdQuality = document.createElement('td');
            const tdDate = document.createElement('td');

            tdTitle.textContent = item.title || item.videoId;
            tdQuality.textContent = item.quality;
            tdDate.textContent = new Date(item.date).toLocaleString();

            row.appendChild(tdTitle);
            row.appendChild(tdQuality);
            row.appendChild(tdDate);
            historyBody.appendChild(row);
        });
    }
});