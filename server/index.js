import express from 'express';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import Stripe from 'stripe';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

const PRICE_IDS = {
  pro_monthly:    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
  pro_yearly:     process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  agency_monthly: process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID,
  agency_yearly:  process.env.STRIPE_AGENCY_YEARLY_PRICE_ID,
};

const APP_URL = process.env.APP_URL || 'https://www.findmewith.ai';

// ── Supabase admin client ─────────────────────────────────────────────────────
const supabaseAdmin = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

// ── Resend email sender ───────────────────────────────────────────────────────
async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { console.warn('[email] RESEND_API_KEY not set'); return false; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'findmewith.ai <hello@findmewithai.com>', to, subject, html }),
  });
  const data = await res.json();
  if (!res.ok) { console.error('[email] Resend error:', data); return false; }
  console.log(`[email] sent to ${to} — id: ${data.id}`);
  return true;
}

// ── Weekly report email builder ───────────────────────────────────────────────
function buildWeeklyEmailHtml({ email, url, score, previousScore, topFix }) {
  const delta = previousScore !== null ? score - previousScore : null;
  const deltaText = delta === null ? '' : delta > 0 ? `▲ ${delta} pts from last week` : delta < 0 ? `▼ ${Math.abs(delta)} pts from last week` : 'No change from last week';
  const deltaColor = delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#6b7280';
  const scoreColor = score >= 70 ? '#16a34a' : score >= 45 ? '#f59e0b' : '#dc2626';
  const scoreLabel = score >= 70 ? 'Great visibility' : score >= 45 ? 'Getting there' : 'Needs attention';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c3aed,#9333ea);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">findmewith.ai</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:4px;">Your weekly AI visibility report</div>
        </td></tr>

        <!-- Score card -->
        <tr><td style="background:white;padding:36px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
          <div style="text-align:center;margin-bottom:28px;">
            <div style="font-size:13px;color:#6b7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">Your AI Visibility Score</div>
            <div style="font-size:72px;font-weight:900;color:${scoreColor};line-height:1;">${score}</div>
            <div style="font-size:14px;font-weight:700;color:${scoreColor};margin-top:4px;">${scoreLabel}</div>
            ${delta !== null ? `<div style="font-size:13px;color:${deltaColor};margin-top:8px;font-weight:600;">${deltaText}</div>` : ''}
          </div>

          <div style="background:#f3f4f6;border-radius:10px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#374151;">
            <strong>Site scanned:</strong> <a href="${url}" style="color:#7c3aed;">${url}</a>
          </div>

          <!-- Plain English summary -->
          <div style="background:#fdf4ff;border:1.5px solid #e9d5ff;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
            <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:8px;">What this means for your business</div>
            <div style="font-size:14px;color:#374151;line-height:1.7;">
              ${score >= 70
                ? 'AI tools like ChatGPT and Google AI are finding your business well. Keep it up — stay consistent and consider adding more detailed content.'
                : score >= 45
                ? 'You\'re on the radar for AI search, but there\'s room to grow. A few targeted improvements could get you recommended significantly more often.'
                : 'Right now, AI tools would likely miss your business in search results. The good news: most fixes are straightforward and don\'t require technical expertise.'}
            </div>
          </div>

          ${topFix ? `<!-- #1 Priority -->
          <div style="background:linear-gradient(135deg,#f5f3ff,#fff);border:1.5px solid #c4b5fd;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
            <div style="font-size:11px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">⚡ Your #1 priority this week</div>
            <div style="font-size:16px;font-weight:800;color:#111827;margin-bottom:8px;">${topFix.title}</div>
            <div style="font-size:14px;color:#4b5563;line-height:1.65;">${topFix.description}</div>
          </div>` : ''}

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:8px;">
            <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;text-decoration:none;font-weight:700;font-size:15px;padding:16px 36px;border-radius:12px;">
              View My Full Report →
            </a>
          </div>
          <div style="text-align:center;font-size:12px;color:#9ca3af;margin-top:10px;">Scan again any time to see your updated score</div>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;padding:24px 40px;text-align:center;">
          <div style="font-size:12px;color:#6b7280;line-height:1.7;">
            You're receiving this because you scanned your site on findmewith.ai.<br>
            Questions? <a href="mailto:hello@findmewithai.com" style="color:#7c3aed;">hello@findmewithai.com</a><br>
            <a href="${APP_URL}?unsubscribe=${encodeURIComponent(email)}" style="color:#9ca3af;">Unsubscribe from weekly reports</a>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Run weekly reports ────────────────────────────────────────────────────────
async function runWeeklyReports() {
  if (!supabaseAdmin) { console.warn('[weekly] Supabase admin not configured'); return; }
  console.log('[weekly] Starting weekly report run…');

  // Get most recent scan per email
  const { data: scans, error } = await supabaseAdmin
    .from('scans')
    .select('email, url, score, created_at')
    .order('created_at', { ascending: false });

  if (error) { console.error('[weekly] Supabase query error:', error.message); return; }

  // Deduplicate — keep most recent per email
  const latestByEmail = new Map();
  for (const scan of scans) {
    if (scan.email && !latestByEmail.has(scan.email)) {
      latestByEmail.set(scan.email, scan);
    }
  }

  console.log(`[weekly] Found ${latestByEmail.size} users to report on`);

  for (const [email, lastScan] of latestByEmail) {
    try {
      // Re-scan their site
      const newResult = await analyzeUrl(lastScan.url);
      const newScore = newResult.score;
      const previousScore = lastScan.score;

      // Save new scan to Supabase
      await supabaseAdmin.from('scans').insert({
        email,
        url: lastScan.url,
        score: newScore,
        result: newResult,
      });

      // Build and send email
      const topFix = newResult.suggestions?.[0] || null;
      const html = buildWeeklyEmailHtml({ email, url: lastScan.url, score: newScore, previousScore, topFix });
      await sendEmail({
        to: email,
        subject: `Your AI visibility score this week: ${newScore}/100`,
        html,
      });

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.error(`[weekly] Failed for ${email}:`, err.message);
    }
  }

  console.log('[weekly] Done.');
}

// ── Schedule: every Monday at 9:00 AM UTC ────────────────────────────────────
cron.schedule('0 9 * * 1', () => {
  runWeeklyReports().catch(err => console.error('[weekly cron]', err.message));
}, { timezone: 'UTC' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, stripe-signature');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Serve static frontend ────────────────────────────────────────────────────
const distPath = join(__dirname, '../dist');
if (fs.existsSync(distPath)) app.use(express.static(distPath));

// ── Subscription store (in-memory + file backup) ─────────────────────────────
// Map: email → { customerId, subscriptionId, plan, status, createdAt }
const subscriptions = new Map();
const SUB_FILE = process.env.DATA_DIR
  ? join(process.env.DATA_DIR, 'subscriptions.json')
  : '/tmp/subscriptions.json';

function loadSubs() {
  try {
    if (fs.existsSync(SUB_FILE)) {
      const data = JSON.parse(fs.readFileSync(SUB_FILE, 'utf8'));
      Object.entries(data).forEach(([k, v]) => subscriptions.set(k, v));
      console.log(`[subs] loaded ${subscriptions.size} subscriptions from disk`);
    }
  } catch (e) { console.warn('[subs] could not load:', e.message); }
}

function saveSubs() {
  try {
    fs.writeFileSync(SUB_FILE, JSON.stringify(Object.fromEntries(subscriptions), null, 2));
  } catch (e) { console.warn('[subs] could not save:', e.message); }
}

loadSubs();

// ── POST /api/webhook (raw body — MUST be before express.json()) ──────────────
app.post('/api/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) return res.status(500).send('Stripe not configured');

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error('[webhook] signature failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // No secret yet — accept unsigned (set STRIPE_WEBHOOK_SECRET to secure)
      try { event = JSON.parse(req.body.toString()); }
      catch { return res.status(400).send('Invalid JSON'); }
    }

    console.log(`[webhook] ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
      if (email) {
        subscriptions.set(email, {
          customerId:     session.customer,
          subscriptionId: session.subscription,
          plan:           session.metadata?.plan || 'pro',
          status:         'active',
          createdAt:      new Date().toISOString(),
        });
        saveSubs();
        console.log(`[webhook] activated: ${email}`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      for (const [email, data] of subscriptions.entries()) {
        if (data.subscriptionId === sub.id) {
          subscriptions.set(email, { ...data, status: 'cancelled' });
          saveSubs();
          console.log(`[webhook] cancelled: ${email}`);
          break;
        }
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      for (const [email, data] of subscriptions.entries()) {
        if (data.subscriptionId === sub.id) {
          subscriptions.set(email, { ...data, status: sub.status === 'active' ? 'active' : sub.status });
          saveSubs();
          break;
        }
      }
    }

    res.json({ received: true });
  }
);

// ── JSON body parser (after webhook route) ────────────────────────────────────
app.use(express.json());

// ── In-memory lead store ──────────────────────────────────────────────────────
const leads = [];

// ── Analyzer (pure Node.js) ───────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  has_schema_org: 12, has_organization_schema: 10, has_person_schema: 5,
  has_faq_schema: 5, has_article_schema: 3,
  has_meta_description: 6, has_h1: 5, content_length: 8, has_og_tags: 6,
  has_contact_info: 7, has_about_page: 7, has_social_links: 6,
  https_enabled: 5, has_title_tag: 5, has_robots_txt: 3, has_sitemap: 2,
  has_llms_txt: 5,
};

const CATEGORIES = {
  structured_data:  ['has_schema_org','has_organization_schema','has_person_schema','has_faq_schema','has_article_schema'],
  content_quality:  ['has_meta_description','has_h1','content_length','has_og_tags'],
  entity_authority: ['has_contact_info','has_about_page','has_social_links'],
  technical_seo:    ['https_enabled','has_title_tag','has_robots_txt','has_sitemap'],
  ai_bonus:         ['has_llms_txt'],
};

const LABELS = {
  has_schema_org: 'Website tells AI who it is',
  has_organization_schema: 'Business details are machine-readable',
  has_person_schema: 'Owner / author is identified for AI',
  has_faq_schema: 'FAQ answers are AI-readable',
  has_article_schema: 'Blog posts are labeled for AI',
  has_meta_description: 'One-sentence site summary exists',
  has_h1: 'Pages have clear main headings',
  content_length: 'Enough content for AI to read',
  has_og_tags: 'Site looks good when shared online',
  has_contact_info: 'Contact info is visible',
  has_about_page: 'About page detected',
  has_social_links: 'Social media profiles linked',
  https_enabled: 'Website is secure (https)',
  has_title_tag: 'Page has a clear title',
  has_robots_txt: 'Navigation file for AI bots exists',
  has_sitemap: 'Sitemap detected',
  has_llms_txt: 'AI introduction file (llms.txt) found',
};

const SUGGESTIONS = {
  has_llms_txt:            ['critical',     'Add an llms.txt file',             "This tells ChatGPT and Perplexity exactly who you are. It's the single most impactful change you can make.",    'high'],
  has_organization_schema: ['critical',     'Add your business details code',   'A small code snippet that tells AI your name, address, phone, and what you do.',                                 'high'],
  has_schema_org:          ['critical',     'Add structured data to your site', 'AI needs machine-readable data to confidently recommend you. Use the Schema Builder to generate your snippet.',   'high'],
  has_faq_schema:          ['important',    'Add a Q&A section AI can read',    'FAQ schema is one of the best ways to get AI to include you in direct answers.',                                  'high'],
  has_meta_description:    ['important',    'Write a one-sentence summary',     "Every page should have a short description — it's how AI decides what your site is about.",                      'medium'],
  content_length:          ['important',    'Add more content to your pages',   'AI needs enough text to understand what you offer. Aim for at least 300 words per page.',                       'medium'],
  has_h1:                  ['important',    'Add a main heading to each page',  'A clear H1 heading helps AI understand the topic of each page.',                                                  'medium'],
  has_about_page:          ['important',    'Create an About page',             'AI looks for an About page to confirm who you are and what you do.',                                              'medium'],
  has_contact_info:        ['important',    'Make your contact info visible',   'AI needs to see your phone, email, or address to trust and cite your business.',                                 'medium'],
  has_og_tags:             ['nice-to-have', 'Add social sharing tags',          'Open Graph tags make your site look great when shared — and give AI extra context.',                             'low'],
  has_robots_txt:          ['nice-to-have', 'Add a robots.txt file',            'Tells AI bots how to navigate your site.',                                                                        'low'],
  has_sitemap:             ['nice-to-have', 'Add an XML sitemap',               'Helps AI discover all your pages.',                                                                               'low'],
  has_article_schema:      ['nice-to-have', 'Label your blog posts for AI',     'Article schema helps AI identify and cite your content.',                                                        'low'],
  has_person_schema:       ['nice-to-have', 'Add author / person schema',       'Especially useful for personal brands, consultants, and professionals.',                                         'low'],
  has_social_links:        ['nice-to-have', 'Link your social profiles',        'Linking to your social accounts helps AI confirm your online identity.',                                         'low'],
};

// ── DataForSEO AI Keyword Volume ──────────────────────────────────────────────
const DATAFORSEO_AUTH = 'Basic ' + Buffer.from(
  (process.env.DATAFORSEO_LOGIN || 'brad@genierocket.com') + ':' +
  (process.env.DATAFORSEO_PASSWORD || '4af0536485267057')
).toString('base64');

async function fetchAiKeywordVolume(keywords) {
  try {
    const res = await fetch(
      'https://api.dataforseo.com/v3/ai_optimization/ai_keyword_data/keywords_search_volume/live',
      {
        method: 'POST',
        headers: { 'Authorization': DATAFORSEO_AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ keywords: keywords.slice(0, 8), location_code: 2840, language_code: 'en' }]),
        signal: AbortSignal.timeout(12000),
      }
    );
    const data = await res.json();
    if (!res.ok || data.status_code !== 20000) {
      console.warn('[dataforseo] API error:', data?.status_message);
      return null;
    }
    return data?.tasks?.[0]?.result?.[0]?.items || null;
  } catch (err) {
    console.warn('[dataforseo] fetch error:', err.message);
    return null;
  }
}

function generateKeywordsFromSite({ title, metaDesc, h1Texts, url }) {
  const keywords = new Set();

  // Extended stop words — include generic site words that produce bad keywords
  const stopWords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
    'is','are','we','our','your','this','that','all','any','get','find','how',
    'best','top','near','local','home','homes','welcome','page','click','here',
    'read','more','learn','about','us','contact','services','service','team',
    'website','site','online','free','new','now','today','great','good',
    'world','life','love','time','work','place','make','take',
  ]);

  // Helper: strip a raw string to meaningful content words only
  function cleanPhrase(raw) {
    if (!raw) return '';
    return raw
      .split(/[\-\|–—:]/)[0]   // take only the part before separators
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 5)
      .join(' ')
      .trim();
  }

  const coreTitle = cleanPhrase(title);
  const coreH1   = cleanPhrase(h1Texts[0]);
  const coreMeta = cleanPhrase(metaDesc);

  // Use the longest / most descriptive as primary
  const primary = [coreTitle, coreH1, coreMeta].sort((a, b) => b.split(' ').length - a.split(' ').length)[0];

  if (primary && primary.length > 3) {
    keywords.add(primary);
    keywords.add(`best ${primary}`);
    keywords.add(`${primary} near me`);
    keywords.add(`find ${primary}`);
  }

  // Add H1 if different from primary
  if (coreH1 && coreH1 !== primary && coreH1.length > 3) {
    keywords.add(coreH1);
  }

  // Add meta phrase if different
  if (coreMeta && coreMeta !== primary && coreMeta.length > 3) {
    keywords.add(`${coreMeta}`);
  }

  return [...keywords]
    .filter(k => {
      const words = k.split(' ');
      return words.length >= 1 && words.length <= 6 && k.length > 3;
    })
    .slice(0, 8);
}

function fetchUrl(urlStr, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));
    let parsed;
    try { parsed = new URL(urlStr); } catch { return reject(new Error('Invalid URL')); }

    const lib = parsed.protocol === 'https:' ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: (parsed.pathname || '/') + (parsed.search || ''),
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; findmewith-bot/1.0; +https://findmewith.ai)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      rejectUnauthorized: false,
      timeout: 15000,
    };

    const req = lib.request(options, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.origin}${res.headers.location}`;
        res.resume();
        return fetchUrl(next, redirectCount + 1).then(resolve).catch(reject);
      }
      if (res.statusCode >= 400) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ html: Buffer.concat(chunks).toString('utf8', 0, 500000), finalUrl: urlStr }));
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    req.end();
  });
}

function checkUrlExists(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request({
        method: 'HEAD',
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname,
        rejectUnauthorized: false,
        timeout: 6000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; findmewith-bot/1.0)' },
      }, (res) => { res.resume(); resolve(res.statusCode < 400); });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    } catch { resolve(false); }
  });
}

async function analyzeUrl(url) {
  const { html, finalUrl } = await fetchUrl(url);
  const htmlLower = html.toLowerCase();

  const parsed = new URL(finalUrl);
  const origin = `${parsed.protocol}//${parsed.host}`;
  const isHttps = parsed.protocol === 'https:';

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                         html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : '';

  const hasOgTitle = /<meta[^>]+property=["']og:title["']/i.test(html);
  const hasOgDesc  = /<meta[^>]+property=["']og:description["']/i.test(html);

  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Texts = h1Matches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

  const jsonLdMatches = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const ldTypes = [];
  for (const block of jsonLdMatches) {
    const content = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '').trim();
    try {
      const obj = JSON.parse(content);
      const addType = (t) => { if (t) ldTypes.push(String(t).toLowerCase()); };
      if (obj['@type']) { Array.isArray(obj['@type']) ? obj['@type'].forEach(addType) : addType(obj['@type']); }
      if (obj['@graph']) obj['@graph'].forEach(item => item['@type'] && addType(item['@type']));
    } catch {}
  }

  const bodyText = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 2).length;

  const hasContactInfo = /(\+?1?[\s.\-]?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}|[\w.+\-]+@[\w\-]+\.\w+)/.test(bodyText);

  const [hasRobots, hasSitemap, hasLlms] = await Promise.all([
    checkUrlExists(`${origin}/robots.txt`),
    checkUrlExists(`${origin}/sitemap.xml`),
    checkUrlExists(`${origin}/llms.txt`),
  ]);

  const checks = {
    https_enabled:           isHttps,
    has_title_tag:           !!title,
    has_meta_description:    !!metaDesc,
    has_h1:                  h1Texts.length > 0,
    has_og_tags:             hasOgTitle || hasOgDesc,
    content_length:          wordCount >= 250,
    has_schema_org:          jsonLdMatches.length > 0,
    has_organization_schema: ldTypes.some(t => t.includes('organization') || t.includes('localbusiness')),
    has_person_schema:       ldTypes.some(t => t.includes('person')),
    has_faq_schema:          ldTypes.some(t => t.includes('faqpage')),
    has_article_schema:      ldTypes.some(t => t.includes('article') || t.includes('blogposting')),
    has_contact_info:        hasContactInfo,
    has_about_page:          /href=["'][^"']*\babout\b[^"']*["']/.test(htmlLower),
    has_social_links:        /href=["'][^"']*(?:facebook\.com|twitter\.com|x\.com|linkedin\.com|instagram\.com|youtube\.com)[^"']*["']/.test(htmlLower),
    has_robots_txt:          hasRobots,
    has_sitemap:             hasSitemap || htmlLower.includes('sitemap.xml'),
    has_llms_txt:            hasLlms,
  };

  const categoryScores = {};
  for (const [cat, keys] of Object.entries(CATEGORIES)) {
    categoryScores[cat] = keys.reduce((sum, k) => sum + (checks[k] ? (SCORE_WEIGHTS[k] || 0) : 0), 0);
  }
  const overall = Object.values(categoryScores).reduce((a, b) => a + b, 0);

  const findings = Object.entries(checks).map(([id, passed]) => ({
    id, label: LABELS[id] || id, status: passed ? 'pass' : 'fail',
    ...((!passed && SUGGESTIONS[id]) ? { suggestion: SUGGESTIONS[id][2] } : {}),
  }));

  const impactOrder = { high: 0, medium: 1, low: 2 };
  const catOrder = { critical: 0, important: 1, 'nice-to-have': 2 };
  const suggestions = Object.entries(checks)
    .filter(([k, v]) => !v && SUGGESTIONS[k])
    .map(([k]) => {
      const [category, title, description, impact] = SUGGESTIONS[k];
      return { category, title, description, impact };
    })
    .sort((a, b) =>
      (catOrder[a.category] ?? 3) - (catOrder[b.category] ?? 3) ||
      (impactOrder[a.impact] ?? 3) - (impactOrder[b.impact] ?? 3)
    );

  // ── DataForSEO AI Market Data ────────────────────────────────────────────
  let ai_market_data = null;
  try {
    const kwList = generateKeywordsFromSite({ title, metaDesc, h1Texts, url: finalUrl });
    if (kwList.length > 0) {
      const rawItems = await fetchAiKeywordVolume(kwList);
      if (rawItems && rawItems.length > 0) {
        const processed = rawItems
          .filter(item => (item.ai_search_volume || 0) > 0)
          .map(item => ({
            keyword: item.keyword,
            volume: item.ai_search_volume || 0,
            monthly: (item.monthly_searches || []).slice(-6).map(m => ({
              month: new Date(m.year, m.month - 1).toLocaleDateString('en-US', { month: 'short' }),
              volume: m.search_volume || 0,
            })),
          }))
          .sort((a, b) => b.volume - a.volume);

        if (processed.length > 0) {
          const totalVolume = processed.reduce((sum, k) => sum + k.volume, 0);
          const topKw = processed[0];
          let trendDirection = 'stable', trendPct = 0;
          if (topKw.monthly.length >= 4) {
            const recent = topKw.monthly.slice(-3).reduce((s, m) => s + m.volume, 0);
            const older  = topKw.monthly.slice(0, 3).reduce((s, m) => s + m.volume, 0);
            if (older > 0) {
              trendPct = Math.round(((recent - older) / older) * 100);
              trendDirection = trendPct > 5 ? 'growing' : trendPct < -5 ? 'declining' : 'stable';
            }
          }
          ai_market_data = {
            keywords: processed.slice(0, 5),
            total_volume: totalVolume,
            top_keyword: topKw.keyword,
            top_volume: topKw.volume,
            trend_direction: trendDirection,
            trend_pct: Math.abs(trendPct),
          };
        }
      }
    }
  } catch (err) {
    console.warn('[dataforseo] ai_market_data skipped:', err.message);
  }

  return { url: finalUrl, score: overall, categories: categoryScores, findings, suggestions, ai_market_data, site_info: { title, metaDesc, h1: h1Texts[0] || '' } };
}

// ── POST /api/analyze ─────────────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  try {
    const result = await analyzeUrl(url.startsWith('http') ? url : 'https://' + url);
    res.json(result);
  } catch (err) {
    console.error('[analyze error]', err.message);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// ── POST /api/leads ───────────────────────────────────────────────────────────
app.post('/api/leads', (req, res) => {
  const { email, url, score } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  leads.push({ email, url, score, createdAt: new Date().toISOString() });
  console.log(`[lead] ${email} | ${url} | score: ${score}`);
  res.json({ ok: true });
});

// ── POST /api/create-checkout-session ─────────────────────────────────────────
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Payments not configured — STRIPE_SECRET_KEY missing' });
  const { plan, email } = req.body;
  const priceId = PRICE_IDS[plan];
  if (!priceId) return res.status(400).json({ error: `Unknown plan: ${plan}` });
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      // {CHECKOUT_SESSION_ID} is replaced by Stripe automatically
      success_url: `${APP_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${APP_URL}/?payment=cancelled`,
      metadata: { plan },
      subscription_data: {
        trial_period_days: 7,
        metadata: { plan },
      },
      ...(email ? { customer_email: email } : {}),
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/verify-session — called after Stripe redirect ────────────────────
app.get('/api/verify-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const paid = session.payment_status === 'paid' || session.status === 'complete';
    // Trial: status is 'complete' but payment_status is 'no_payment_required'
    const ok = paid || session.status === 'complete';
    if (ok) {
      const email = (session.customer_details?.email || session.customer_email || '').toLowerCase().trim();
      if (email) {
        subscriptions.set(email, {
          customerId:     session.customer,
          subscriptionId: session.subscription,
          plan:           session.metadata?.plan || 'pro',
          status:         'active',
          createdAt:      new Date().toISOString(),
        });
        saveSubs();
      }
      return res.json({ ok: true, email, plan: session.metadata?.plan || 'pro' });
    }
    res.json({ ok: false, status: session.status });
  } catch (err) {
    console.error('[verify-session]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/check-subscription — verify email has active subscription ────────
app.get('/api/check-subscription', async (req, res) => {
  const email = (req.query.email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Check in-memory store first
  const cached = subscriptions.get(email);
  if (cached && cached.status === 'active') {
    return res.json({ active: true, plan: cached.plan });
  }

  // Fall back to querying Stripe directly (handles server restarts)
  if (stripe) {
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        const customerId = customers.data[0].id;
        const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });
        if (subs.data.length > 0) {
          const activeSub = subs.data[0];
          const plan = activeSub.metadata?.plan || 'pro';
          subscriptions.set(email, { customerId, subscriptionId: activeSub.id, plan, status: 'active' });
          saveSubs();
          return res.json({ active: true, plan });
        }
      }
    } catch (e) { console.warn('[check-subscription]', e.message); }
  }

  res.json({ active: false });
});

// ── POST /api/create-portal-session — Stripe Customer Portal ─────────────────
app.post('/api/create-portal-session', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  const email = (req.body.email || '').toLowerCase().trim();
  if (!email) return res.status(400).json({ error: 'Email required' });

  let customerId = subscriptions.get(email)?.customerId;

  // Look up in Stripe if not cached
  if (!customerId) {
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    } catch (e) { console.warn('[portal]', e.message); }
  }

  if (!customerId) {
    return res.status(404).json({ error: 'No subscription found for this email' });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: APP_URL,
    });
    res.json({ url: portalSession.url });
  } catch (err) {
    console.error('[portal error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/send-weekly-reports (admin trigger for testing) ─────────────────
app.post('/api/send-weekly-reports', async (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorized' });
  res.json({ ok: true, message: 'Weekly reports started — check server logs' });
  runWeeklyReports().catch(err => console.error('[weekly manual]', err.message));
});

// ── GET /api/leads (admin) ────────────────────────────────────────────────────
app.get('/api/leads', (req, res) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY)
    return res.status(401).json({ error: 'Unauthorized' });
  res.json(leads);
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  const index = join(__dirname, '../dist/index.html');
  if (fs.existsSync(index)) return res.sendFile(index);
  res.send('findmewith.ai API server is running ✓');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`findmewith.ai server running on port ${PORT}`));
