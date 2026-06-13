import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ── Serve static frontend (production) ──────────────────────────────────────
const distPath = join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ── In-memory lead store (replace with a real DB in production) ──────────────
const leads = [];

// ── POST /api/analyze ────────────────────────────────────────────────────────
app.post('/api/analyze', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const scriptPath = join(__dirname, 'analyze.py');
  const python = process.env.PYTHON_PATH || 'python3';
  const child = spawn(python, [scriptPath, url], { timeout: 30000 });

  let stdout = '';
  let stderr = '';

  child.stdout.on('data', d => { stdout += d.toString(); });
  child.stderr.on('data', d => { stderr += d.toString(); });

  child.on('close', code => {
    const lines = stdout.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('{')) {
        try {
          return res.json(JSON.parse(line));
        } catch {
          break;
        }
      }
    }
    console.error('analyze.py stderr:', stderr);
    res.status(500).json({ error: 'Analysis failed. Check server logs.' });
  });

  child.on('error', err => {
    res.status(500).json({ error: `Could not run analyzer: ${err.message}` });
  });
});

// ── POST /api/leads ──────────────────────────────────────────────────────────
app.post('/api/leads', (req, res) => {
  const { email, url, score } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  leads.push({ email, url, score, createdAt: new Date().toISOString() });
  console.log(`[lead] ${email} | ${url} | score: ${score}`);
  // TODO: connect to your CRM / email list (Mailchimp, ConvertKit, GHL, etc.)
  res.json({ ok: true });
});

// ── GET /api/leads (admin view) ──────────────────────────────────────────────
app.get('/api/leads', (req, res) => {
  const key = req.headers['x-admin-key'];
  if (key !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'Unauthorized' });
  res.json(leads);
});

// ── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  const index = join(__dirname, '../dist/index.html');
  if (fs.existsSync(index)) return res.sendFile(index);
  res.send('findmewith.ai API server is running.');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`findmewith.ai server running on port ${PORT}`));
