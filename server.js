import express from 'express';
import cors from 'cors';
import ytdl from '@distube/ytdl-core';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Get video info
app.get('/api/info', async (req, res) => {
    const { videoId } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(url);
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

        res.json({
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails.at(-1)?.url,
            duration: parseInt(info.videoDetails.lengthSeconds, 10),
            availableQualities: [...new Set(formats.map(f => f.qualityLabel).filter(Boolean))]
        });
    } catch (error) {
        console.error('Info error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Download video
app.get('/api/download', async (req, res) => {
    const { videoId, quality } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: 'videoId is required' });
    }

    try {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(url);

        // Sanitize title for use in filename (strip filesystem-unsafe chars)
        const title = info.videoDetails.title
            .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
            .replace(/[\u007F-\u009F]/g, '')
            .trim()
            .substring(0, 100) || videoId;

        // Filter for formats that have both video and audio
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

        if (formats.length === 0) {
            return res.status(404).json({ error: 'No downloadable formats found for this video' });
        }

        // Find the requested quality or fall back to highest available
        const selectedFormat =
            formats.find(f => f.qualityLabel === quality) || formats[0];

        const qualityLabel = selectedFormat.qualityLabel || quality || 'video';
        const safeFilename = encodeURIComponent(`${title}-${qualityLabel}.mp4`);
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeFilename}`);
        res.setHeader('Content-Type', 'video/mp4');

        if (selectedFormat.contentLength) {
            res.setHeader('Content-Length', selectedFormat.contentLength);
        }

        const stream = ytdl(url, { format: selectedFormat });

        stream.on('error', (err) => {
            console.error('Stream error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: err.message });
            }
        });

        stream.pipe(res);
    } catch (error) {
        console.error('Download error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: error.message });
        }
    }
});

app.listen(PORT, () => {
    console.log(`YouTube Downloader server running on http://localhost:${PORT}`);
});
