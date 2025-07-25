// @deno-types="npm:@types/express@4.17.15"
import express from "npm:express";
import { statSync } from "node:fs";

const app = express();

const HTTP_PORT = 1024;

import api from './core/api.ts';

// Middleware to serve static files
const options = {
    dotfiles: 'ignore',
    etag: true,
    extensions: ['html', 'htm', 'js', 'png'],
    index: 'index.html',
    maxAge: '1d',
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

app.listen(HTTP_PORT, () => {
    console.log(`Example app listening on port ${HTTP_PORT}`)
})



