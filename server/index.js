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

// ── Nurture email HTML builders ───────────────────────────────────────────────
function emailWrapper({ preheader = '', headerTitle = 'findmewith.ai', headerSub = '', body = '', email = '', unsubLabel = 'Unsubscribe from nurture emails' }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <tr><td style="background:linear-gradient(135deg,#3b0764,#7c3aed);border-radius:16px 16px 0 0;padding:28px 40px;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px;">findmewith.ai</div>
        ${headerSub ? `<div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">${headerSub}</div>` : ''}
      </td></tr>
      <tr><td style="background:white;padding:36px 40px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
        ${body}
      </td></tr>
      <tr><td style="background:#f3f4f6;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;border-top:none;padding:24px 40px;text-align:center;">
        <div style="font-size:12px;color:#6b7280;line-height:1.8;">
          You're receiving this because you scanned your site on findmewith.ai.<br>
          Questions? <a href="mailto:hello@findmewithai.com" style="color:#7c3aed;">hello@findmewithai.com</a><br>
          <a href="${APP_URL}?unsubscribe=${encodeURIComponent(email)}" style="color:#9ca3af;">${unsubLabel}</a>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function buildWelcomeEmailHtml({ email, url, score }) {
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const scoreColor = score >= 70 ? '#16a34a' : score >= 41 ? '#d97706' : '#dc2626';
  const scoreEmoji = score >= 70 ? '🟢' : score >= 41 ? '🟡' : '🔴';
  const scoreLabel = score >= 70 ? 'Great start — you\'re already visible to AI' : score >= 41 ? 'On the radar — room to grow' : 'Not found yet — lots of quick wins ahead';
  const tip = score >= 70
    ? 'Add an FAQ section to your site. AI loves structured Q&A content — it pulls from it constantly.'
    : score >= 41
    ? 'Make sure your business name, address, and phone number are on every page of your website. This is the #1 signal AI uses to identify local businesses.'
    : 'Add a clear, plain-English description of what you do and who you serve to your homepage. Right now, AI tools can\'t confidently describe your business — a short paragraph fixes that.';

  const body = `
    <h1 style="font-size:24px;font-weight:800;color:#111827;margin:0 0 8px;">Welcome to findmewith.ai 🎯</h1>
    <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 28px;">You just scanned <strong style="color:#111827;">${domain}</strong> and got your AI visibility score. Here's what it means.</p>

    <!-- Score card -->
    <div style="background:linear-gradient(135deg,#f5f3ff,#fdf4ff);border:1.5px solid #ddd6fe;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
      <div style="font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Your AI Visibility Score</div>
      <div style="font-size:80px;font-weight:900;color:${scoreColor};line-height:1;">${score}</div>
      <div style="font-size:16px;font-weight:700;color:${scoreColor};margin-top:6px;">${scoreEmoji} ${scoreLabel}</div>
      <div style="font-size:13px;color:#6b7280;margin-top:8px;">out of 100 — based on what AI tools like ChatGPT, Perplexity, and Google AI can find about your business</div>
    </div>

    <!-- Plain English what this means -->
    <div style="margin-bottom:24px;">
      <h2 style="font-size:17px;font-weight:800;color:#111827;margin:0 0 10px;">What does this actually mean?</h2>
      <p style="font-size:14px;color:#374151;line-height:1.75;margin:0;">
        When someone types <em>"best [your service] near me"</em> into ChatGPT or Google's AI, it searches everything it knows about local businesses. Your score tells you how much useful information about <strong>${domain}</strong> it can actually find. A lower score means it's probably recommending your competitors instead.
      </p>
    </div>

    <!-- #1 quick win -->
    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:800;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">⚡ One thing to do today</div>
      <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;">${tip}</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;">
      <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;text-decoration:none;font-weight:700;font-size:15px;padding:16px 40px;border-radius:12px;box-shadow:0 4px 16px rgba(124,58,237,0.3);">
        Open My Dashboard →
      </a>
      <p style="font-size:12px;color:#9ca3af;margin-top:12px;">Your full report is waiting — see every fix ranked by impact.</p>
    </div>`;

  return emailWrapper({
    preheader: `Your AI visibility score for ${domain}: ${score}/100. Here's what it means and what to do first.`,
    headerSub: 'Welcome — your results are ready',
    body,
    email,
    unsubLabel: 'Unsubscribe from findmewith.ai emails',
  });
}

function buildNurtureDay2Html({ email, url, score }) {
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const scoreColor = score >= 70 ? '#16a34a' : score >= 41 ? '#d97706' : '#dc2626';

  const body = `
    <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">What your ${score}/100 actually means for your business</h1>
    <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 28px;">AI search is different from Google — and it's already sending customers somewhere.</p>

    <p style="font-size:14px;color:#374151;line-height:1.75;margin:0 0 20px;">
      You know how you'd ask a friend, <em>"know a good accountant near me?"</em> — and they'd give you one name? That's exactly how AI works now. When someone types a question into ChatGPT or Google's AI, it recommends <strong>one or two businesses</strong>, not a list of 20.
    </p>
    <p style="font-size:14px;color:#374151;line-height:1.75;margin:0 0 28px;">
      Your score of <strong style="color:${scoreColor};">${score}/100</strong> tells you how likely you are to be that recommendation. Businesses in the 70+ range are getting named regularly. Below 40, AI tools either can't find them or don't have enough information to confidently recommend them.
    </p>

    <!-- The three states -->
    <div style="border:1.5px solid #e5e7eb;border-radius:16px;overflow:hidden;margin-bottom:28px;">
      <div style="background:#fef2f2;padding:16px 20px;display:flex;align-items:center;">
        <div style="font-size:22px;margin-right:14px;">🔴</div>
        <div>
          <div style="font-size:14px;font-weight:800;color:#991b1b;">Score 0–40: Not Found</div>
          <div style="font-size:13px;color:#6b7280;margin-top:2px;">AI tools can't confidently describe or recommend your business</div>
        </div>
      </div>
      <div style="background:#fffbeb;padding:16px 20px;border-top:1px solid #e5e7eb;display:flex;align-items:center;">
        <div style="font-size:22px;margin-right:14px;">🟡</div>
        <div>
          <div style="font-size:14px;font-weight:800;color:#92400e;">Score 41–70: Getting Found</div>
          <div style="font-size:13px;color:#6b7280;margin-top:2px;">On the radar — shows up in some queries but loses to competitors in others</div>
        </div>
      </div>
      <div style="background:#f0fdf4;padding:16px 20px;border-top:1px solid #e5e7eb;display:flex;align-items:center;">
        <div style="font-size:22px;margin-right:14px;">🟢</div>
        <div>
          <div style="font-size:14px;font-weight:800;color:#15803d;">Score 71–100: Found</div>
          <div style="font-size:13px;color:#6b7280;margin-top:2px;">Regularly cited and recommended by AI tools — the goal</div>
        </div>
      </div>
    </div>

    <div style="background:#f5f3ff;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
      <p style="font-size:14px;color:#374151;line-height:1.75;margin:0;">
        The businesses winning in AI search right now aren't necessarily the biggest — they're the ones whose websites speak clearly to AI. A well-structured, information-rich site with consistent details beats a fancy site every time.
      </p>
    </div>

    <div style="text-align:center;">
      <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;text-decoration:none;font-weight:700;font-size:15px;padding:16px 40px;border-radius:12px;box-shadow:0 4px 16px rgba(124,58,237,0.3);">
        See My Fix List →
      </a>
      <p style="font-size:12px;color:#9ca3af;margin-top:12px;">Each fix in your dashboard is ranked by how much it'll move your score.</p>
    </div>`;

  return emailWrapper({
    preheader: `AI recommends one or two businesses — here's where ${domain} stands.`,
    headerSub: 'Understanding your AI visibility',
    body,
    email,
    unsubLabel: 'Unsubscribe from findmewith.ai emails',
  });
}

function buildNurtureDay5Html({ email, url, score }) {
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const body = `
    <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">3 quick wins to improve your AI score this week</h1>
    <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 28px;">None of these require a developer. Most take under 15 minutes.</p>

    <!-- Win 1 -->
    <div style="display:flex;gap:16px;margin-bottom:24px;padding:20px;background:#f5f3ff;border-radius:14px;border-left:4px solid #7c3aed;">
      <div style="font-size:28px;flex-shrink:0;margin-top:2px;">1️⃣</div>
      <div>
        <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:6px;">Add your NAP to every page</div>
        <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;">NAP = Name, Address, Phone number. These three things need to be <strong>identical</strong> across your website, Google Business, and social profiles. Even small differences ("St." vs "Street") confuse AI tools and lower trust.</p>
      </div>
    </div>

    <!-- Win 2 -->
    <div style="display:flex;gap:16px;margin-bottom:24px;padding:20px;background:#fffbeb;border-radius:14px;border-left:4px solid #f59e0b;">
      <div style="font-size:28px;flex-shrink:0;margin-top:2px;">2️⃣</div>
      <div>
        <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:6px;">Write a plain-English "About" section</div>
        <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;">AI reads your website like a person would. A clear sentence like <em>"We're a family-owned plumbing company serving Denver, CO since 2008"</em> gives it everything it needs to recommend you with confidence. Vague taglines don't cut it.</p>
      </div>
    </div>

    <!-- Win 3 -->
    <div style="display:flex;gap:16px;margin-bottom:32px;padding:20px;background:#f0fdf4;border-radius:14px;border-left:4px solid #16a34a;">
      <div style="font-size:28px;flex-shrink:0;margin-top:2px;">3️⃣</div>
      <div>
        <div style="font-size:15px;font-weight:800;color:#111827;margin-bottom:6px;">Add a simple FAQ section</div>
        <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;">AI loves questions and answers. Add 5–8 real questions your customers ask, with short direct answers. <em>"Do you offer free estimates?" "What areas do you serve?" "How long does a typical job take?"</em> This directly feeds AI recommendation engines.</p>
      </div>
    </div>

    <!-- Bonus: code snippets -->
    <div style="background:#f5f3ff;border:1.5px solid #c4b5fd;border-radius:14px;padding:20px 24px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">💡 Bonus: the fast track</div>
      <p style="font-size:14px;color:#374151;line-height:1.65;margin:0 0 12px;">
        Your dashboard includes ready-made code snippets — tiny pieces of structured data that tell AI tools exactly who you are, what you do, and where you're located. You paste them into your site once and they run forever.
      </p>
      <a href="${APP_URL}" style="font-size:13px;font-weight:700;color:#7c3aed;text-decoration:none;">See my code snippets →</a>
    </div>

    <div style="text-align:center;">
      <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;text-decoration:none;font-weight:700;font-size:15px;padding:16px 40px;border-radius:12px;box-shadow:0 4px 16px rgba(124,58,237,0.3);">
        Open My Dashboard →
      </a>
    </div>`;

  return emailWrapper({
    preheader: `3 things you can do this week to improve how AI finds ${domain} — no developer needed.`,
    headerSub: 'Quick wins for your AI visibility',
    body,
    email,
    unsubLabel: 'Unsubscribe from findmewith.ai emails',
  });
}

function buildNurtureDay10Html({ email, url, score }) {
  const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  const body = `
    <h1 style="font-size:22px;font-weight:800;color:#111827;margin:0 0 8px;">AI is sending customers somewhere right now. Is it you?</h1>
    <p style="font-size:15px;color:#6b7280;line-height:1.6;margin:0 0 24px;">Every week you're not optimized, someone in your area is getting those referrals instead.</p>

    <p style="font-size:14px;color:#374151;line-height:1.75;margin:0 0 28px;">
      Your current score for <strong>${domain}</strong> is a starting point — and you've already taken the first step by scanning. Here's the truth about what separates the businesses that get found from those that don't:
    </p>

    <!-- Comparison -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;border-radius:14px;overflow:hidden;border:1.5px solid #e5e7eb;">
      <tr style="background:#f9fafb;">
        <td style="padding:12px 20px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e5e7eb;">Free Account</td>
        <td style="padding:12px 20px;font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e5e7eb;border-left:1.5px solid #ddd6fe;background:#f5f3ff;">Pro Account</td>
      </tr>
      <tr style="background:white;">
        <td style="padding:14px 20px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:top;">
          ✅ One-time scan & score<br>✅ Top fix recommendations<br>✅ Basic code snippets<br>❌ No monitoring<br>❌ Manual re-scans only<br>❌ No competitor tracking
        </td>
        <td style="padding:14px 20px;font-size:13px;color:#374151;border-bottom:1px solid #f3f4f6;vertical-align:top;border-left:1.5px solid #ddd6fe;background:#fdfcff;">
          ✅ Everything in Free<br>✅ Weekly auto re-scan<br>✅ Score change alerts<br>✅ Competitor AI comparison<br>✅ Full snippet library<br>✅ Site Monitoring badge
        </td>
      </tr>
    </table>

    <div style="background:#fffbeb;border-left:4px solid #f59e0b;border-radius:0 12px 12px 0;padding:18px 22px;margin-bottom:32px;">
      <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;">
        <strong>Pro is $29/month.</strong> If it sends you even one extra customer a month — a single haircut, a service call, a consultation — it pays for itself. And it runs quietly in the background so you don't have to think about it.
      </p>
    </div>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:white;text-decoration:none;font-weight:700;font-size:15px;padding:16px 40px;border-radius:12px;box-shadow:0 4px 16px rgba(124,58,237,0.3);">
        Try Pro Free for 7 Days →
      </a>
    </div>
    <div style="text-align:center;">
      <a href="${APP_URL}" style="font-size:13px;color:#9ca3af;text-decoration:none;">Or keep using your free account — no pressure.</a>
    </div>`;

  return emailWrapper({
    preheader: `AI is recommending businesses in your area every day. Here's how to make sure it's recommending ${domain}.`,
    headerSub: 'A note from findmewith.ai',
    body,
    email,
    unsubLabel: 'Unsubscribe from findmewith.ai emails',
  });
}

// ── Nurture email drip ────────────────────────────────────────────────────────
async function runNurtureEmails() {
  if (!supabaseAdmin) { console.warn('[nurture] Supabase not configured'); return; }
  console.log('[nurture] Starting drip check...');

  // Get all unique emails + their earliest scan (signup date) + score
  const { data: scans, error } = await supabaseAdmin
    .from('scans')
    .select('email, url, score, created_at')
    .order('created_at', { ascending: true });

  if (error) { console.error('[nurture] Could not fetch scans:', error.message); return; }

  // Deduplicate — first scan per email
  const firstByEmail = new Map();
  for (const s of (scans || [])) {
    if (s.email && !firstByEmail.has(s.email)) firstByEmail.set(s.email, s);
  }

  const now = Date.now();

  for (const [email, scan] of firstByEmail) {
    if (!email) continue;
    const signupMs = new Date(scan.created_at).getTime();
    const daysSince = (now - signupMs) / (1000 * 60 * 60 * 24);

    // Check which steps are due
    const steps = [
      { step: 2, minDays: 2,  maxDays: 4 },
      { step: 5, minDays: 5,  maxDays: 8 },
      { step: 10, minDays: 10, maxDays: 16 },
    ];

    for (const { step, minDays, maxDays } of steps) {
      if (daysSince < minDays || daysSince > maxDays) continue;

      // Check if already sent
      const { data: existing } = await supabaseAdmin
        .from('nurture_log')
        .select('id')
        .eq('email', email)
        .eq('step', step)
        .maybeSingle();

      if (existing) continue; // already sent

      // Build and send
      let html, subject;
      if (step === 2) {
        html = buildNurtureDay2Html({ email, url: scan.url, score: scan.score });
        subject = `What your ${scan.score}/100 AI score means for your business`;
      } else if (step === 5) {
        html = buildNurtureDay5Html({ email, url: scan.url, score: scan.score });
        subject = `3 quick wins to improve your AI visibility this week`;
      } else {
        html = buildNurtureDay10Html({ email, url: scan.url, score: scan.score });
        subject = `AI is sending customers somewhere — is it you?`;
      }

      const sent = await sendEmail({ to: email, subject, html });
      if (sent) {
        // Log it
        await supabaseAdmin.from('nurture_log').insert({ email, step, url: scan.url });
        console.log(`[nurture] sent step ${step} to ${email}`);
      }

      await new Promise(r => setTimeout(r, 800)); // rate-limit
    }
  }
  console.log('[nurture] Done.');
}

// ── Schedule: daily at 10:00 AM UTC ──────────────────────────────────────────
cron.schedule('0 10 * * *', () => {
  runNurtureEmails().catch(err => console.error('[nurture cron]', err.message));
}, { timezone: 'UTC' });

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, stripe-signature, Authorization');
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
        body: JSON.stringify([{ keywords: keywords.slice(0, 12), location_code: 2840, language_code: 'en' }]),
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
  const stopWords = new Set([
    'the','a','an','and','or','but','in','on','at','to','for','of','with','by','from',
    'is','are','we','our','your','this','that','all','any','get','find','how',
    'best','top','near','local','home','homes','welcome','page','click','here',
    'read','more','learn','about','us','contact','services','service','team',
    'website','site','online','free','new','now','today','great','good',
    'world','life','love','time','work','place','make','take','also','just',
    'can','will','you','have','has','been','was','were','they','them',
  ]);

  function cleanPhrase(raw, maxWords = 5) {
    if (!raw) return '';
    return raw
      .split(/[\-\|–—:,\.!?]/)[0]
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, maxWords)
      .join(' ')
      .trim();
  }

  // Extract multiple distinct phrases from meta description by splitting on connectors
  function metaPhrases(meta) {
    if (!meta) return [];
    const segments = meta.split(/[,\.\-–—\|!]/).map(s => s.trim()).filter(s => s.length > 8);
    return segments.map(s => cleanPhrase(s, 4)).filter(s => s.length > 3);
  }

  const coreTitle = cleanPhrase(title);
  const allH1s    = h1Texts.map(h => cleanPhrase(h, 4)).filter(h => h.length > 3);
  const coreMeta  = cleanPhrase(metaDesc);
  const extraMeta = metaPhrases(metaDesc);

  // Collect all candidate core phrases, deduped
  const candidates = [...new Set([coreTitle, ...allH1s, coreMeta, ...extraMeta])].filter(c => c.length > 3);

  // Use the longest as the primary anchor
  const primary = candidates.sort((a, b) => b.split(' ').length - a.split(' ').length)[0] || '';

  const keywords = new Set();

  // From each unique candidate, add base + variations
  candidates.slice(0, 4).forEach(phrase => {
    keywords.add(phrase);
  });

  // AI-style question formats off the primary
  if (primary) {
    keywords.add(`best ${primary}`);
    keywords.add(`${primary} near me`);
    keywords.add(`top ${primary}`);
    keywords.add(`where to find ${primary}`);
    keywords.add(`${primary} recommendations`);
    keywords.add(`who has the best ${primary}`);
    keywords.add(`affordable ${primary}`);
  }

  // Secondary phrase variations
  if (allH1s[0] && allH1s[0] !== primary) {
    keywords.add(`best ${allH1s[0]}`);
    keywords.add(`${allH1s[0]} near me`);
  }

  return [...keywords]
    .filter(k => {
      const words = k.split(' ');
      return words.length >= 1 && words.length <= 7 && k.length > 3;
    })
    .slice(0, 12);
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
            keywords: processed.slice(0, 10),
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

// ── POST /api/keyword-volume ──────────────────────────────────────────────────
app.post('/api/keyword-volume', async (req, res) => {
  const { keywords } = req.body;
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    return res.status(400).json({ error: 'keywords array required' });
  }
  try {
    const rawItems = await fetchAiKeywordVolume(keywords.slice(0, 12));
    if (!rawItems) return res.json({ keywords: [] });
    const processed = rawItems.map(item => ({
      keyword: item.keyword,
      volume: item.ai_search_volume || 0,
    }));
    res.json({ keywords: processed });
  } catch (err) {
    console.warn('[keyword-volume] error:', err.message);
    res.status(500).json({ error: 'Failed to fetch keyword volume' });
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

// ── POST /api/welcome-email ───────────────────────────────────────────────────
app.post('/api/welcome-email', async (req, res) => {
  const { email, url, score } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  // Idempotent: skip if already sent (logged in nurture_log as step 1)
  if (supabaseAdmin) {
    const { data: existing } = await supabaseAdmin
      .from('nurture_log')
      .select('id')
      .eq('email', email)
      .eq('step', 1)
      .maybeSingle();
    if (existing) {
      console.log(`[welcome] already sent to ${email}, skipping`);
      return res.json({ ok: true, skipped: true });
    }
  }

  const html = buildWelcomeEmailHtml({ email, url: url || 'your site', score: score || 0 });
  const sent = await sendEmail({
    to: email,
    subject: `Welcome to findmewith.ai — your score is ${score || 0}/100`,
    html,
  });

  if (sent && supabaseAdmin) {
    await supabaseAdmin.from('nurture_log').insert({ email, step: 1, url: url || null });
  }

  console.log(`[welcome] email sent to ${email} — score ${score}`);
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

  // Admin account always gets free Pro
  if (email === 'hello@genierocket.com') return res.json({ active: true, plan: 'pro' });

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

// ── GET /api/check-widget — detect if widget script is installed on a site ────
app.get('/api/check-widget', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.json({ installed: false });
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'findmewith.ai/1.0 (compatibility check)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await response.text();
    const installed =
      html.includes('findmewithai-production.up.railway.app/api/widget') ||
      html.includes('findmewith.ai/api/widget') ||
      html.includes('__fmwai');
    res.json({ installed });
  } catch (err) {
    res.json({ installed: false, error: 'Could not reach site' });
  }
});

// ── GET /api/widget/:scanId.js — hosted AEO widget ───────────────────────────
app.get('/api/widget/:scanId.js', async (req, res) => {
  const { scanId } = req.params;

  const err = (msg) => res.status(404).type('application/javascript')
    .send(`/* findmewith.ai widget: ${msg} */`);

  if (!supabaseAdmin) return err('server not configured');

  try {
    const { data: scan, error } = await supabaseAdmin
      .from('scans')
      .select('result, url')
      .eq('id', scanId)
      .single();

    if (error || !scan) return err('scan not found');

    const result = scan.result || {};
    const url = scan.url || '';
    const domain = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const si = result.site_info || {};
    const businessName = si.h1 || (si.title || '').replace(/\s*[\|\-–—:].*/g, '').trim() || domain;
    const businessDesc = si.metaDesc || '';

    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: businessName,
        description: businessDesc,
        url,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: businessName,
        url,
        description: businessDesc,
      },
    ];

    // Inject FAQ if scan has passing FAQ findings
    const hasFaq = (result.findings || []).some(f => f.id === 'has_faq_schema' && f.status === 'pass');
    if (!hasFaq) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What does ${businessName} do?`,
            acceptedAnswer: { '@type': 'Answer', text: businessDesc || `${businessName} provides professional services. Visit ${url} to learn more.` },
          },
        ],
      });
    }

    const js = `/* findmewith.ai Managed AEO Widget | ${domain} | ${new Date().toISOString().slice(0, 10)} */
(function(){
  if(window.__fmwai)return;window.__fmwai=1;
  var schemas=${JSON.stringify(schemas)};
  function inject(){
    schemas.forEach(function(s){
      var el=document.createElement('script');
      el.type='application/ld+json';
      el.text=JSON.stringify(s);
      document.head.appendChild(el);
    });
  }
  if(document.head){inject();}else{document.addEventListener('DOMContentLoaded',inject);}
})();`;

    res.set('Content-Type', 'application/javascript; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.set('Access-Control-Allow-Origin', '*');
    res.send(js);
  } catch (err) {
    console.error('[widget]', err.message);
    res.status(500).type('application/javascript').send('/* findmewith.ai widget: error */');
  }
});

// ── GET /api/admin/stats — admin dashboard data (brad@genierocket.com only) ───
app.get('/api/admin/stats', async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: 'Server not configured' });

  // Verify the Bearer token is a valid Supabase session and belongs to the admin
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });
    if (user.email !== 'hello@genierocket.com') return res.status(403).json({ error: 'Forbidden' });

    // Fetch all auth users
    const { data: { users }, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    if (usersErr) throw usersErr;

    // Fetch all scans (id, user_id, email, url, score, created_at)
    const { data: scans, error: scansErr } = await supabaseAdmin
      .from('scans')
      .select('id, user_id, email, url, score, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (scansErr) throw scansErr;

    // Build per-user scan counts and latest scan
    const scansByUser = {};
    for (const scan of (scans || [])) {
      const uid = scan.user_id;
      if (!uid) continue;
      if (!scansByUser[uid]) scansByUser[uid] = { count: 0, latest: null };
      scansByUser[uid].count++;
      if (!scansByUser[uid].latest) scansByUser[uid].latest = scan;
    }

    const formattedUsers = (users || []).map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      scan_count: (scansByUser[u.id] || {}).count || 0,
      latest_scan: (scansByUser[u.id] || {}).latest || null,
    }));

    res.json({ users: formattedUsers, scans: scans || [] });
  } catch (err) {
    console.error('[admin/stats]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get('*', (_req, res) => {
  const index = join(__dirname, '../dist/index.html');
  if (fs.existsSync(index)) return res.sendFile(index);
  res.send('findmewith.ai API server is running ✓');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`findmewith.ai server running on port ${PORT}`));
