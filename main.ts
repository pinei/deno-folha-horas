import express from "express";
import { statSync } from "node:fs";
import serverConfig from './core/config';

const app = express();

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

app.listen(serverConfig.httpPort, () => {
    console.log(`Timesheet listening on port ${serverConfig.httpPort}`)
})



