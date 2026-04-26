<div align="center">

![Logo](logo.svg)

# Flatlens

**The search dashboard for Flatseek.** Upload, search, aggregate, and visualize your data — all from the browser.

[![License](https://img.shields.io/badge/license-Apache%202.0-green.svg)](LICENSE)

**Live Demo:** [https://flatlens.demo.flatseek.io](https://flatlens.demo.flatseek.io)
&nbsp;&middot;&nbsp;
**API Docs:** [https://api.demo.flatseek.io/docs](https://api.demo.flatseek.io/docs)
&nbsp;&middot;&nbsp;
**Author:** judotens@flatseek.io

</div>

---

## Features

### Upload & Index
- **Drag-and-drop upload** — CSV, JSON, JSONL, XLS, XLSX
- **Data preview** — Inspect first 100 rows before indexing
- **Column type editor** — Set TEXT, KEYWORD, DATE, FLOAT, INT, BOOL, ARRAY, OBJECT
- **Index naming** — One index per file, configurable

### Search
- **Lucene query syntax** — Type directly or use the visual filter builder
- **Column selectors** — Choose which columns to display (sticky per index)
- **Pagination** — Navigate large result sets
- **CSV export** — Download full result set as CSV

### Aggregations
- **Aggregation types** — Terms, stats, date_histogram, avg, min, max, sum, cardinality
- **Chart styles** — Bar, line, donut, pie
- **Configurable size** — Top N terms, bucket intervals for date histograms

### Map View
- **Leaflet maps** — Plot geo-tagged documents
- **Marker clustering** — Handles up to 50,000 points per view
- **Auto-detect lat/lng columns** — Picks up `lat`, `lng`, `latitude`, `longitude` automatically

### Index Management
- **Rename index** — Change index name in place
- **Encrypt** — Password-protect with ChaCha20-Poly1305
- **Delete index** — Remove index and free disk space
- **Stats view** — Doc count, index size, column types, total storage

---

## Installation

Flatlens is bundled with [Flatseek](https://github.com/flatseek/flatseek). Install Flatseek first — the dashboard is included automatically.

### Via install.sh (recommended)

```bash
curl -fsSL flatseek.io/install.sh | sh
```

This installs `flatseek` and `flatlens` to `~/.local/share/flatlens`.

### Via git clone

```bash
git clone https://github.com/flatseek/flatseek.git
cd flatseek && pip install -e .
```

### Via pip

```bash
pip install flatseek
```

Then serve with:

```bash
flatseek serve -d ./data
# API:        http://localhost:8000
# Dashboard:  http://localhost:8000/dashboard
```

---

## Usage

### Upload a file

1. Click **+ Upload** in the top-right corner
2. Drag-drop or select a CSV, JSON, JSONL, or XLS file
3. Preview the data and edit column types if needed
4. Name the index and click **Build**
5. Watch the progress bar — ETA and worker count shown in real-time

### Search

1. Select an index from the dropdown in the toolbar
2. Type a query in the search bar (Lucene syntax)
3. Results appear instantly with pagination

**Example queries:**
```
message:*visitor*
region:ap-southeast-1 AND duration:[50 TO 200]
```

### Aggregate and chart

1. Click the **Aggregations** tab
2. Select aggregation type (Terms, Stats, Date Histogram, etc.)
3. Pick a column and configure parameters
4. Choose a chart style (Bar, Line, Donut, Pie)
5. Results render immediately

### Map view

1. Click the **Map** tab
2. Flatlens auto-detects lat/lng columns — configure if needed
3. Points render with marker clustering
4. Click a cluster to zoom in

---

## Tech Stack

- **Frontend** — Vanilla JS, HTML, CSS (no build step)
- **Charts** — Chart.js
- **Maps** — Leaflet + Marker clustering
- **Spreadsheets** — SheetJS (xlsx)
- **Backend** — FastAPI + uvicorn (via [flatseek](https://github.com/flatseek/flatseek))

---

## File Structure

```
flatlens/
  index.html     # Main dashboard (single-page app)
  js/
    api.js       # Flatseek API client
  css/
    dashboard.css # Dashboard styles
  logo.svg       # Flatlens logo
  favicon.svg    # Favicon
```

---

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

Apache License 2.0. See [LICENSE](LICENSE).
