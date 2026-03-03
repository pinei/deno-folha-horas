import express from "express";
import { statSync } from "node:fs";

const app = express();

const HTTP_PORT = 1025;

import api from './core/api';

// Middleware to serve static files
const options = {
    dotfiles: 'ignore',
    etag: true,
    extensions: ['html', 'htm', 'js', 'png'],
    index: 'index.html',
    maxAge: '0',
    redirect: false,
    setHeaders: function (res, path, _stat) {
        const stats = statSync(path);
        const etag = stats.isFile() ? `${stats.mtimeMs}-${stats.size}` : '';
        res.set('ETag', etag);
        res.set('x-timestamp', Date.now())
    }
};

app.use(express.static('public', options));

// API
app.use('/api', api);

// History API Fallback for Vue Router
import path from "node:path";
app.get('*', (req, res) => {
    res.sendFile(path.resolve('public/index.html'));
});

app.listen(HTTP_PORT, () => {
    console.log(`Example app listening on port ${HTTP_PORT}`)
})



