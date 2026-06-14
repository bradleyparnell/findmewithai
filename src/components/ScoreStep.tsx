import React from 'react';
import { CheckCircle, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import type { AnalysisResult } from '../types';

const CATEGORY_INFO: Record<string, { label: string; desc: string; max: number }> = {
  structured_data:  { label: 'Business Info Cards',  desc: 'Can AI identify your business?',          max: 35 },
  content_quality:  { label: 'Your Content',          desc: 'Does your site give AI enough to read?',  max: 25 },
  entity_authority: { label: 'Your Online Identity',  desc: 'How confidently can AI vouch for you?',   max: 20 },
  technical_seo:    { label: 'Website Health',        desc: 'Is your site easy for AI to access?',     max: 15 },
  ai_bonus:         { label: 'AI Extras',             desc: 'Special signals that boost visibility',   max: 5  },
};

const FINDING_QUESTIONS: Record<string, string> = {
  https_enabled:           'Is your website secure?',
  has_title_tag:           'Does your website have a clear title?',
  has_meta_description:    'Does your site have a one-sentence summary?',
  has_h1:                  'Does each page have a clear main heading?',
  has_og_tags:             'Does your site look good when shared online?',
  content_length:          'Does your site have enough content for AI to read?',
  has_schema_org:          'Does your website tell AI who you are?',
  has_organization_schema: 'Does AI know your business name and details?',
  has_person_schema:       'Does AI know who runs this business?',
  has_faq_schema:          'Does your site answer common customer questions?',
  has_article_schema:      'Are your blog posts labeled for AI?',
  has_contact_info:        'Can AI find your contact information?',
  has_about_page:          'Do you have an About page?',
  has_llms_txt:            'Have you introduced yourself to AI search engines?',
  has_sitemap:             'Can AI easily find all your pages?',
  has_robots_txt:          'Does your site have navigation instructions for AI?',
};

function getScoreMessage(score: number) {
  if (score >= 80) return { emoji: '🎉', headline: 'AI knows your business well!', sub: "You're ahead of most businesses. Here's how to get to 100%." };
  if (score >= 60) return { emoji: '👍', headline: "You're on AI's radar — let's sharpen the picture.", sub: "A few simple fixes and you'll show up much more often in AI search results." };
  if (score >= 40) return { emoji: '🌱', headline: "AI knows a little about you — there's room to grow.", sub: "Don't worry — this is completely fixable. Follow the steps below." };
  return { emoji: '💪', headline: "AI can barely find you right now — but that's easy to fix!", sub: "Every step you take from here will make a huge difference." };
}

function scoreColor(score: number) {
  if (score >= 80) return '#7c3aed';
  if (score >= 60) return '#6d28d9';
  if (score >= 40) return '#d97706';
  return '#ef4444';
}

interface Props {
  result: AnalysisResult;
  onFixContent: () => void;
  onGetCode: () => void;
  onUpgrade: () => void;
  isPro?: boolean;
  isAuthenticated?: boolean;
}

export const ScoreStep: React.FC<Props> = ({ result, onFixContent, onGetCode, onUpgrade, isPro, isAuthenticated }) => {
  const { score, categories, findings } = result;
  const msg = getScoreMessage(score);
  const color = scoreColor(score);
  const failing = findings.filter(f => f.status !== 'pass');
  const passing = findings.filter(f => f.status === 'pass');

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '36px 24px 60px' }}>


      <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ffffff)', border: '1px solid #ddd6fe', borderRadius: '24px', padding: '36px', textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '18px', marginBottom: '4px' }}>{msg.emoji}</div>
        <div style={{ fontSize: '64px', fontWeight: 900, color, lineHeight: 1, marginBottom: '4px' }}>
          {score}<span style={{ fontSize: '28px', fontWeight: 600 }}>%</span>
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
          AI search engines know <strong style={{ color: '#111827' }}>{score}%</strong> of your business
        </div>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>{msg.headline}</div>
        <div style={{ fontSize: '14px', color: '#6b7280', maxWidth: '440px', margin: '0 auto', lineHeight: 1.6 }}>{msg.sub}</div>
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <TrendingUp size={16} style={{ color: '#7c3aed' }} />
          What AI knows about you
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Object.entries(CATEGORY_INFO).map(([key, info]) => {
            const raw = (categories as Record<string, number>)[key] ?? 0;
            const pct = Math.min(100, Math.round((raw / info.max) * 100));
            const good = pct >= 60;
            return (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{info.label}</span>
                    <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '7px' }}>{info.desc}</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: good ? '#7c3aed' : '#d97706', flexShrink: 0, marginLeft: '8px' }}>{pct}%</span>
                </div>
                <div style={{ height: '7px', background: '#f5f3ff', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: good ? '#7c3aed' : '#f59e0b', borderRadius: '99px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {failing.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '26px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '16px' }}>
            ❗ Things to fix ({failing.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {failing.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '11px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px' }}>
                <AlertCircle size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>{FINDING_QUESTIONS[f.id] ?? f.label}</div>
                  {f.suggestion && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{f.suggestion}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {passing.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '26px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#111827', marginBottom: '14px' }}>✅ Already working ({passing.length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {passing.map(f => (
              <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '100px', padding: '4px 12px', fontSize: '12px', color: '#7c3aed', fontWeight: 500 }}>
                <CheckCircle size={12} />
                {(FINDING_QUESTIONS[f.id] ?? f.label).replace(/\?$/, '')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <button onClick={onFixContent} style={{ background: '#7c3aed', color: 'white', border: 'none', borderRadius: '18px', padding: '24px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontSize: '26px', marginBottom: '8px' }}>✍️</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Fix My Content</div>
          <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '16px', lineHeight: 1.5 }}>We'll write AI-friendly content for your FAQ page, About page, and more</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700 }}>Start writing <ArrowRight size={14} /></div>
        </button>
        <button onClick={onGetCode} style={{ background: '#fef3c7', color: '#111827', border: '1.5px solid #f59e0b', borderRadius: '18px', padding: '24px', cursor: 'pointer', textAlign: 'left' }}>
          <div style={{ fontSize: '26px', marginBottom: '8px' }}>🏷️</div>
          <div style={{ fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Get My Code Snippet</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '16px', lineHeight: 1.5 }}>Copy and paste a small piece of code to tell AI exactly who you are</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: 700, color: '#d97706' }}>Get the code <ArrowRight size={14} /></div>
        </button>
      </div>


    </div>
  );
};
