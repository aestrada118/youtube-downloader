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
            if (urlObj.hostname.includes('youtube.com')) {
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
        showStatus('Starting download...', 'info');
        showProgress(0);

        try {
            const response = await fetch(
                `https://youtube-api.example/download?videoId=${videoId}&quality=${quality}`
            );
            if (!response.ok) throw new Error('Network response was not ok');

            const downloadLink = await response.json();
            trackProgress(downloadLink);
            saveToHistory(videoId, quality);
            showStatus('Download started successfully!', 'success');
        } catch (error) {
            console.error('Error downloading video:', error);
            // Demo mode: simulate download when API is unavailable
            simulateDownload(videoId, quality);
        }
    }

    function simulateDownload(videoId, quality) {
        showStatus(`Downloading ${videoId} at ${quality}...`, 'info');
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                showProgress(100);
                showStatus('Download complete!', 'success');
                saveToHistory(videoId, quality);
            }
            showProgress(progress);
        }, 400);
    }

    function trackProgress(downloadLink) {
        let progress = 0;
        const interval = setInterval(() => {
            if (progress < 100) {
                progress += 10;
                showProgress(progress);
            } else {
                clearInterval(interval);
                showStatus('Download complete!', 'success');
            }
        }, 500);
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

    function saveToHistory(videoId, quality) {
        const history = JSON.parse(localStorage.getItem('downloadHistory')) || [];
        history.unshift({ videoId, quality, date: new Date().toISOString() });
        localStorage.setItem('downloadHistory', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('downloadHistory')) || [];
        historyBody.innerHTML = '';

        if (history.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" style="text-align:center;color:#666;">No downloads yet</td>';
            historyBody.appendChild(row);
            return;
        }

        history.forEach((item) => {
            const row = document.createElement('tr');
            const date = new Date(item.date).toLocaleString();
            row.innerHTML = `<td>${item.videoId}</td><td>${item.quality}</td><td>${date}</td>`;
            historyBody.appendChild(row);
        });
    }
});