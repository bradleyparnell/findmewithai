# findmewith.ai

**AI Visibility Checker for Business Owners**

Find out if ChatGPT, Perplexity, and Google AI know about your business — and fix it in minutes.

🔗 **Live at:** [findmewith.ai](https://findmewith.ai)

---

## What It Does

1. **See Your Score** — Scan any website and get an AI visibility score in seconds
2. **Fix Your Content** — Generate AI-friendly FAQ pages, About sections, and How-To guides
3. **Get Your Code Snippet** — Copy-paste code that tells AI exactly who you are

---

## Tech Stack

| Layer    | Tech                                |
|----------|-------------------------------------|
| Frontend | React 18 + TypeScript + Vite        |
| Backend  | Node.js + Express                   |
| Analyzer | Python 3 (BeautifulSoup + requests) |
| Styling  | Inline styles (purple/white/amber)  |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+

### Install
```bash
npm install
pip install requests beautifulsoup4
```

### Run locally
```bash
# Start both frontend and backend
npm run dev

# Or start just the API server
npm run server
```

Frontend runs at `http://localhost:5173`
API server runs at `http://localhost:3001`

---

## Deploy

### Frontend → Vercel
```bash
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend → Railway
1. Connect this GitHub repo to Railway
2. Set the start command: `node server/index.js`
3. Set environment variable: `PORT=3001`

### Environment Variables
| Variable     | Description                              |
|--------------|------------------------------------------|
| `PORT`       | API server port (default: 3001)          |
| `ADMIN_KEY`  | Secret key to view `/api/leads` endpoint |
| `PYTHON_PATH`| Path to Python binary (default: python3) |

---

## Project Structure

```
├── src/
│   ├── App.tsx                    # Main app + routing
│   ├── types.ts                   # TypeScript interfaces
│   ├── main.tsx                   # Entry point
│   ├── styles.css                 # Global styles
│   ├── utils/analyzer.ts          # API call to backend
│   └── components/
│       ├── HeroStep.tsx           # Landing / URL input
│       ├── EmailGate.tsx          # Email capture
│       ├── ScoreStep.tsx          # Score + findings
│       ├── ContentStep.tsx        # Content writer
│       ├── CodeStep.tsx           # Code snippets
│       ├── PricingPage.tsx        # Pricing plans
│       ├── Nav.tsx                # Navigation bar
│       └── LockOverlay.tsx        # Pro feature lock
├── server/
│   ├── index.js                   # Express API server
│   └── analyze.py                 # Python website analyzer
├── index.html
├── vite.config.ts
└── package.json
```

---

## Monetization

| Plan   | Price       | Key Features                                      |
|--------|-------------|---------------------------------------------------|
| Free   | $0          | Score, llms.txt, FAQ generator                    |
| Pro    | $29/mo      | All generators, all snippets, monitoring, reports |
| Agency | $99/mo      | White-label, unlimited clients, API access        |

**Stripe integration:** Replace the `handleProCta` function in `PricingPage.tsx` with a Stripe checkout redirect.

---

## License

MIT — build on it, learn from it, ship it.

Questions? [hello@findmewith.ai](mailto:hello@findmewith.ai)
