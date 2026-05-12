// getApiBase() checks window.API_BASE dynamically, then ?api= query param, then default
function getApiBase() {
    if (window.API_BASE) return window.API_BASE;
    const params = new URLSearchParams(window.location.search);
    if (params.has('api')) return params.get('api').replace(/\/$/, '');
    return '__FLATLENS_API_URL__';
}

// Track active requests for cancellation
const activeControllers = {};

function showDebug(request, response) {
    const debugBar = document.getElementById('debug-bar');
    const requestEl = document.getElementById('debug-request');
    const responseEl = document.getElementById('debug-response');

    if (debugBar && requestEl && responseEl) {
        requestEl.textContent = JSON.stringify(request, null, 2);
        responseEl.textContent = JSON.stringify(response, null, 2);
        debugBar.classList.remove('hidden');
        debugBar.classList.add('show');
    }
}

function getIndexPassword(indexName) {
    return sessionStorage.getItem('index_password_' + indexName);
}

const FlatseekAPI = {
    async request(method, endpoint, body = null, requestKey = null) {
        // Cancel any existing request with the same key
        if (requestKey && activeControllers[requestKey]) {
            activeControllers[requestKey].abort();
            delete activeControllers[requestKey];
        }

        const controller = new AbortController();
        if (requestKey) {
            activeControllers[requestKey] = controller;
        }

        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal
        };

        // Add password header if index is encrypted
        const idxMatch = endpoint.match(/^\/([^\/]+)/);
        if (idxMatch) {
            const idxName = idxMatch[1];
            const pw = sessionStorage.getItem('index_password_' + idxName);
            const hasBucket = endpoint.includes('bucket=');
            console.log('api.js request:', method, endpoint, 'pw:', pw ? pw.substring(0,3) + '...' : 'null', 'hasBucket:', hasBucket, 'X-Index-Password header will be set:', pw ? 'YES' : 'NO');
            if (pw) {
                options.headers['X-Index-Password'] = pw;
            }
        }

        if (body) options.body = JSON.stringify(body);

        const requestInfo = { method, endpoint, body };

        try {
            const response = await fetch(`${getApiBase()}${endpoint}`, options);
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }

            if (!response.ok) {
                const msg = (data && typeof data === 'object' && data.detail) ? data.detail : `HTTP ${response.status}`;
                throw new Error(msg);
            }

            // Show debug info
            showDebug(requestInfo, data);

            return data;
        } finally {
            if (requestKey) {
                delete activeControllers[requestKey];
            }
        }
    },

    // Cancel all pending requests
    cancelAll() {
        Object.values(activeControllers).forEach(c => c.abort());
        Object.keys(activeControllers).forEach(k => delete activeControllers[k]);
    },

    async clusterHealth() {
        return this.request('GET', '/_cluster/health');
    },

    async listIndices() {
        return this.request('GET', '/_indices');
    },

    async search(index, query = '*', size = 20, fromOffset = 0) {
        return this.request('POST', `/${index}/_search`, { query, size, from: fromOffset }, `search-${index}`);
    },

    async count(index, query = '*') {
        return this.request('GET', `/${index}/_count?q=${encodeURIComponent(query)}`);
    },

    async aggregate(index, query = '*', aggs = {}) {
        return this.request('POST', `/${index}/_aggregate`, { query, aggs }, `agg-${index}`);
    },

    async stats(index) {
        return this.request('GET', `/${index}/_stats`);
    },

    async getStats(index) {
        return this.request('GET', `/${index}/_stats`);
    },

    async logs(index) {
        return this.request('GET', `/${index}/_logs`);
    },

    async mapping(index) {
        return this.request('GET', `/${index}/_mapping`);
    },

    async validate(index, query) {
        return this.request('POST', `/${index}/_validate`, { query });
    },

    async deleteByQuery(index, query) {
        return this.request('POST', `/${index}/_delete_by_query`, { query });
    },

    async indexDocument(index, doc) {
        return this.request('POST', `/${index}/_doc`, doc);
    },

    async bulkIndex(index, docs, extra = {}) {
        const options = { method: 'POST', headers: { 'Content-Type': 'application/json' } };
        if (extra.totalBytes) options.headers['X-Total-Bytes'] = extra.totalBytes;
        if (extra.fileName) options.headers['X-File-Name'] = extra.fileName;
        if (extra.fileIdx !== undefined) options.headers['X-File-Idx'] = extra.fileIdx;
        if (extra.totalFiles !== undefined) options.headers['X-Total-Files'] = extra.totalFiles;
        if (extra.doneFiles !== undefined) options.headers['X-Done-Files'] = extra.doneFiles;
        if (extra.bytesProcessed !== undefined) options.headers['X-Bytes-Processed'] = extra.bytesProcessed;
        if (extra.totalEstimate !== undefined) options.headers['X-Total-Estimate'] = extra.totalEstimate;
        if (extra.elapsed !== undefined) options.headers['X-Elapsed'] = extra.elapsed;
        if (extra.eta !== undefined) options.headers['X-ETA'] = extra.eta;
        if (extra.docsPerSec !== undefined) options.headers['X-Docs-Per-Sec'] = extra.docsPerSec;

        const idxMatch = index.match(/^\/([^\/]+)/);
        const idxName = idxMatch ? idxMatch[1] : index;
        const pw = getIndexPassword(idxName);
        if (pw) options.headers['X-Index-Password'] = pw;
        if (extra.bucket) options.headers['X-Bucket'] = extra.bucket;

        const controller = new AbortController();
        options.signal = controller.signal;
        activeControllers['bulkIndex'] = controller;

        let response, data;
        try {
            response = await fetch(`${getApiBase()}/${index}/_bulk`, { ...options, body: JSON.stringify(docs) });
            const text = await response.text();
            try { data = JSON.parse(text); } catch { data = text; }
        } catch (e) {
            delete activeControllers['bulkIndex'];
            throw e;
        }
        delete activeControllers['bulkIndex'];
        showDebug({ method: 'POST', endpoint: `/${index}`, docs: docs.length }, data);
        return data;
    },

    async deleteIndex(index) {
        return this.request('DELETE', `/${index}`);
    },

    async flush(index, wait = true) {
        return this.request('POST', `/${index}/_flush?wait=${wait}`);
    },

    async previewFromUrl(url, indexName, options = {}) {
        const { format = 'auto', sampleSize = 100, sourceField = null } = options;
        let qs = `url=${encodeURIComponent(url)}&index=${encodeURIComponent(indexName)}&format=${encodeURIComponent(format)}&sample_size=${sampleSize}`;
        if (sourceField) qs += `&source_field=${encodeURIComponent(sourceField)}`;
        return this.request('GET', `/_preview_from_url?${qs}`);
    },

    async fetchFromUrl(url, indexName, options = {}) {
        const { format = 'auto', sourceField = null } = options;
        let qs = `url=${encodeURIComponent(url)}&index=${encodeURIComponent(indexName)}&format=${encodeURIComponent(format)}`;
        if (sourceField) qs += `&source_field=${encodeURIComponent(sourceField)}`;
        return this.request('GET', `/_fetch_from_url?${qs}`);
    },

    async uploadFromUrl(url, indexName, options = {}) {
        const { format = 'auto', batchSize = 5000, sourceField = null } = options;
        let qs = `url=${encodeURIComponent(url)}&index=${encodeURIComponent(indexName)}&format=${encodeURIComponent(format)}&batch_size=${batchSize}`;
        if (sourceField) qs += `&source_field=${encodeURIComponent(sourceField)}`;
        return this.request('POST', `/_upload_from_url?${qs}`, {});
    },

    async uploadProgress(index) {
        return this.request('GET', `/${index}/_upload_progress`);
    },

    async updateUploadProgress(index, data) {
        return this.request('PATCH', `/${index}/_upload_progress`, data);
    },

    async createIndex(indexName, options = {}) {
        return this.request('PUT', `/${indexName}`, options);
    },

    async renameIndex(oldName, newName) {
        return this.request('POST', `/${oldName}/_rename`, { new_name: newName });
    },

    async createMapping(indexName, mapping) {
        const response = await fetch(`${getApiBase()}/${indexName}/_mapping`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapping)
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }
        return response.json();
    },

    async encryptIndex(indexName, passphrase) {
        // Returns { job_id, index, status, total_files } immediately
        return this.request('POST', `/${indexName}/_encrypt`, { passphrase });
    },

    async decryptIndex(indexName, passphrase) {
        // Returns { job_id, index, status, total_files } immediately
        return this.request('POST', `/${indexName}/_decrypt`, { passphrase });
    },

    async pollEncryptProgress(indexName, jobId) {
        return this.request('GET', `/${indexName}/_encrypt_progress?job_id=${encodeURIComponent(jobId)}`);
    },

    async authenticateIndex(indexName, passphrase) {
        return this.request('POST', `/${indexName}/_authenticate`, { passphrase });
    },

    async logoutIndex(indexName) {
        return this.request('DELETE', `/${indexName}/_authenticate`);
    },

    async isEncrypted(indexName) {
        return this.request('GET', `/${indexName}/_is_encrypted`);
    }
};

window.FlatseekAPI = FlatseekAPI;