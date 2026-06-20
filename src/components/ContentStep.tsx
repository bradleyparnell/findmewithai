import React, { useState, useEffect } from 'react';
import { Copy, Check, HelpCircle, User, BookOpen, ArrowRight } from 'lucide-react';
import { LockOverlay } from './LockOverlay';
import type { AnalysisResult } from '../types';

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

interface Props {
  siteUrl: string;
  result: AnalysisResult | null;
  isPro: boolean;
  onUpgrade: () => void;
  onNext: () => void;
}

type Tab = 'faq' | 'about' | 'howto';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={copied
        ? { background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }
        : { background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
    >
      {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
    </button>
  );
}

function generateAnswer(question: string, businessType: string, metaDesc: string): string {
  const q = question.toLowerCase();
  const bt = businessType;
  const desc = metaDesc || '';

  // Pricing / cost
  if (q.includes('cost') || q.includes('price') || q.includes('pricing') || q.includes('fee') || q.includes('charge') || q.includes('much'))
    return `Our pricing varies depending on the specific service or package you choose. We offer options for a range of budgets — contact us directly or visit our pricing page for current rates and any available discounts.`;

  // Registration / get started / sign up
  if (q.includes('register') || q.includes('sign up') || q.includes('get started') || q.includes('join') || q.includes('enroll'))
    return `Getting started is easy. Visit our website, choose your option, and follow the simple sign-up steps. If you have any questions along the way, our team is happy to help — just reach out at hello@${bt.toLowerCase().replace(/\s+/g, '')}.com or via our contact page.`;

  // Hours / location / where
  if (q.includes('hours') || q.includes('location') || q.includes('where') || q.includes('open') || q.includes('address'))
    return `${desc ? desc + ' ' : ''}You can find our current hours and location details on our website. We recommend checking our contact page or calling ahead to confirm, especially around holidays.`;

  // Services / offer / provide / do you do
  if (q.includes('offer') || q.includes('service') || q.includes('provide') || q.includes('do you do') || q.includes('specialize'))
    return `${bt} offers a range of services designed to meet your needs. ${desc ? desc : `Our team is passionate about delivering great results for every client.`} Visit our services page to explore everything we offer.`;

  // Gear / equipment / need / bring
  if (q.includes('gear') || q.includes('equipment') || q.includes('need') || q.includes('bring') || q.includes('prepare') || q.includes('require'))
    return `We recommend coming prepared with the basics — comfort and safety are our top priorities. Check our website for a full recommended gear list and any specific requirements for your activity or event.`;

  // Insurance / coverage / accept
  if (q.includes('insurance') || q.includes('accept') || q.includes('coverage'))
    return `We accept a variety of payment methods and work with select plans to make things as easy as possible for you. Contact us directly to confirm whether your specific plan or payment method is accepted.`;

  // Beginner / new / experience / first time
  if (q.includes('beginner') || q.includes('new') || q.includes('first time') || q.includes('no experience') || q.includes('start'))
    return `Absolutely — ${bt} welcomes people of all experience levels. Whether you're just starting out or looking to go deeper, we have options designed for you. Don't hesitate to reach out with any questions before you begin.`;

  // Consultation / free / trial
  if (q.includes('consultation') || q.includes('free') || q.includes('trial') || q.includes('demo'))
    return `Yes, we offer an initial consultation so you can learn more about how we work and whether we're the right fit for you. Reach out via our website to schedule your first conversation — no commitment required.`;

  // Group / team / corporate / business
  if (q.includes('group') || q.includes('team') || q.includes('corporate') || q.includes('business') || q.includes('bulk'))
    return `We love working with groups and teams. We offer tailored packages for organizations of all sizes. Contact us to discuss your group's specific needs and we'll put together the right plan for you.`;

  // Area / serve / location / region
  if (q.includes('area') || q.includes('serve') || q.includes('region') || q.includes('available') || q.includes('delivery'))
    return `${bt} currently serves ${desc ? 'the areas described on our website' : 'a growing number of locations'}. Visit our website or contact us directly to find out if we cover your area.`;

  // Cancellation / refund / policy
  if (q.includes('cancel') || q.includes('refund') || q.includes('policy') || q.includes('return'))
    return `We want you to feel confident booking with us. Our cancellation and refund policy is outlined on our website. If you have a specific situation, please reach out and we'll do our best to work with you.`;

  // Contact / reach / talk
  if (q.includes('contact') || q.includes('reach') || q.includes('talk') || q.includes('speak') || q.includes('call') || q.includes('email'))
    return `The easiest way to reach us is through our contact page or by emailing us directly. We typically respond within one business day and are happy to answer any questions you have.`;

  // Generic fallback with business context
  return `Great question. ${desc ? desc + ' ' : ''}For complete details, we recommend visiting our website or reaching out to our team directly — we're always happy to help.`;
}

function makeFaq(businessType: string, questions: string, metaDesc?: string): string {
  const qs = questions.split('\n').filter(q => q.trim());
  if (!businessType || !qs.length) return '';
  const htmlItems = qs.map(q => {
    const answer = generateAnswer(q.trim(), businessType, metaDesc || '');
    return `  <div class="faq-item">\n    <h3>${q.trim()}</h3>\n    <p>${answer}</p>\n  </div>`;
  }).join('\n');
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qs.map(q => ({
      "@type": "Question",
      name: q.trim(),
      acceptedAnswer: { "@type": "Answer", text: generateAnswer(q.trim(), businessType, metaDesc || '') }
    }))
  }, null, 2);
  return `<!-- FAQ Section — add to your FAQ or homepage -->\n<section>\n  <h2>Frequently Asked Questions About ${businessType}</h2>\n${htmlItems}\n</section>\n\n<!-- Paste just before </body> — this is what AI reads -->\n<script type="application/ld+json">\n${schema}\n</script>`;
}

function makeAbout(name: string, desc: string, location: string, website: string, phone: string): string {
  if (!name) return '';
  const schema: Record<string, unknown> = { "@context": "https://schema.org", "@type": "Organization", name, description: desc };
  if (website) schema.url = website;
  if (phone) schema.telephone = phone;
  if (location) schema.address = { "@type": "PostalAddress", addressLocality: location };
  return `<!-- About Section -->\n<section>\n  <h1>About ${name}</h1>\n  <p>${desc}</p>\n  ${location ? `<p>Located in ${location}.</p>` : ''}\n  ${phone ? `<p>Call us: <a href="tel:${phone}">${phone}</a></p>` : ''}\n</section>\n\n<!-- Paste just before </body> -->\n<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
}

function makeHowTo(title: string, stepsText: string): string {
  const steps = stepsText.split('\n').filter(s => s.trim());
  if (!title || !steps.length) return '';
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "HowTo", name: title, step: steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: `Step ${i + 1}`, text: s.trim() })) }, null, 2);
  return `<!-- How-To Guide -->\n<section>\n  <h2>${title}</h2>\n  <ol>\n${steps.map(s => `    <li>${s.trim()}</li>`).join('\n')}\n  </ol>\n</section>\n\n<!-- Paste just before </body> -->\n<script type="application/ld+json">\n${schema}\n</script>`;
}

function guessBusinessType(title: string, h1: string): string {
  const raw = (h1 || title || '').replace(/\s*[\|\-–—:].*/g, '').trim();
  return raw.length > 3 ? raw : title.trim();
}

function suggestFaqQuestions(businessType: string): string {
  if (!businessType) return '';
  const bt = businessType.toLowerCase();
  if (bt.includes('trail') || bt.includes('running') || bt.includes('race'))
    return 'What races and distances do you offer?\nHow do I register for an event?\nWhat gear do I need for trail running?\nAre there beginner-friendly routes?\nDo you offer group training programs?';
  if (bt.includes('restaurant') || bt.includes('food') || bt.includes('cafe') || bt.includes('bar'))
    return 'What are your hours and location?\nDo you take reservations?\nDo you offer delivery or takeout?\nDo you cater to dietary restrictions?\nIs there parking available?';
  if (bt.includes('gym') || bt.includes('fitness') || bt.includes('yoga') || bt.includes('studio'))
    return 'What classes do you offer?\nHow much does a membership cost?\nIs there a free trial available?\nDo you offer personal training?\nWhat are your hours?';
  if (bt.includes('consult') || bt.includes('agency') || bt.includes('marketing') || bt.includes('seo'))
    return 'What services do you offer?\nHow long does it take to see results?\nHow much do your services cost?\nDo you work with small businesses?\nHow do I get started?';
  if (bt.includes('law') || bt.includes('attorney') || bt.includes('legal'))
    return 'What areas of law do you practice?\nDo you offer free consultations?\nHow much do you charge?\nHow long will my case take?\nAre you licensed in my state?';
  if (bt.includes('dental') || bt.includes('medical') || bt.includes('clinic') || bt.includes('health'))
    return 'Are you accepting new patients?\nWhat insurance do you accept?\nHow do I schedule an appointment?\nDo you offer emergency services?\nWhat are your hours?';
  // Generic fallback
  return `What services does ${businessType} offer?\nHow much does it cost?\nHow do I get started?\nDo you offer a free consultation?\nWhat areas do you serve?`;
}

export const ContentStep: React.FC<Props> = ({ siteUrl, result, isPro, onUpgrade, onNext }) => {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 640;
  const [tab, setTab] = useState<Tab>('faq');
  const [output, setOutput] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [faqBusiness, setFaqBusiness] = useState('');
  const [faqQuestions, setFaqQuestions] = useState('');
  const [aboutName, setAboutName] = useState('');
  const [aboutDesc, setAboutDesc] = useState('');
  const [aboutLocation, setAboutLocation] = useState('');
  const [aboutPhone, setAboutPhone] = useState('');
  const [howToTitle, setHowToTitle] = useState('');
  const [howToSteps, setHowToSteps] = useState('');

  useEffect(() => {
    if (!result?.site_info || prefilled) return;
    const { title, metaDesc, h1 } = result.site_info;
    const businessType = guessBusinessType(title, h1);
    setFaqBusiness(businessType);
    setFaqQuestions(suggestFaqQuestions(businessType));
    setAboutName(businessType);
    setAboutDesc(metaDesc || '');
    setPrefilled(true);
  }, [result]);

  const tabs = [
    { id: 'faq' as Tab,   icon: <HelpCircle size={15} />, label: 'FAQ Section',        proOnly: false },
    { id: 'about' as Tab, icon: <User size={15} />,       label: 'About Your Business', proOnly: true  },
    { id: 'howto' as Tab, icon: <BookOpen size={15} />,   label: 'How-To Guide',        proOnly: true  },
  ];

  const inputStyle = { padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' as const };
  const labelStyle = { fontSize: '13px', fontWeight: 600 as const, color: '#111827', display: 'block' as const, marginBottom: '7px' };

  const handleGenerate = () => {
    if (tab === 'faq')   setOutput(makeFaq(faqBusiness, faqQuestions, result?.site_info?.metaDesc));
    if (tab === 'about') setOutput(makeAbout(aboutName, aboutDesc, aboutLocation, siteUrl, aboutPhone));
    if (tab === 'howto') setOutput(makeHowTo(howToTitle, howToSteps));
  };

  return (
    <div style={{ maxWidth: '100%', padding: '40px 0 60px' }}>
      <div style={{ marginBottom: '26px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 900, color: '#111827', marginBottom: '10px' }}>✍️ Let's write content AI can understand</h1>
        <p style={{ color: '#6b7280', fontSize: '18px', lineHeight: 1.6 }}>Fill in a few details and we'll generate content that helps AI search engines understand and recommend your business.</p>
      </div>

      {!isPro && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '15px', color: '#374151' }}>✨ <strong>Free:</strong> FAQ Section · Upgrade for About + How-To Guide</div>
          <button onClick={onUpgrade} style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Upgrade →</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' as const }}>
        {tabs.map(t => {
          const locked = t.proOnly && !isPro;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setOutput(''); }} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', border: tab === t.id ? '2px solid #7c3aed' : '1px solid #e5e7eb', background: tab === t.id ? '#f5f3ff' : 'white', color: locked ? '#9ca3af' : tab === t.id ? '#7c3aed' : '#6b7280', fontWeight: tab === t.id ? 700 : 500, cursor: 'pointer', fontSize: '13px' }}>
              {t.icon} {t.label} {locked && '🔒'}
            </button>
          );
        })}
      </div>

      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '18px', padding: '26px', marginBottom: '20px', position: 'relative', minHeight: '260px', overflow: 'hidden' }}>
        {tab === 'faq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {prefilled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '10px 14px' }}>
                <span style={{ fontSize: '16px' }}>✨</span>
                <span style={{ fontSize: '14px', color: '#6d28d9', fontWeight: 600 }}>Pre-filled from your site — edit anything and hit Generate</span>
              </div>
            )}
            <div>
              <label style={labelStyle}>What type of business are you?</label>
              <input type="text" style={inputStyle} placeholder="a local bakery" value={faqBusiness} onChange={e => setFaqBusiness(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>What questions do customers always ask? <span style={{ color: '#9ca3af', fontWeight: 400 }}>(one per line)</span></label>
              <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={6} placeholder={"Do you offer delivery?\nWhat are your hours?\nHow much does it cost?"} value={faqQuestions} onChange={e => setFaqQuestions(e.target.value)} />
            </div>
          </div>
        )}
        {tab === 'about' && !isPro && <LockOverlay feature="About Your Business" onUpgrade={onUpgrade} />}
        {tab === 'about' && isPro && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {prefilled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: '10px', padding: '10px 14px' }}>
                <span style={{ fontSize: '16px' }}>✨</span>
                <span style={{ fontSize: '14px', color: '#6d28d9', fontWeight: 600 }}>Pre-filled from your site — edit anything and hit Generate</span>
              </div>
            )}
            <div><label style={labelStyle}>Your business name</label><input type="text" style={inputStyle} placeholder="Acme Plumbing Co." value={aboutName} onChange={e => setAboutName(e.target.value)} /></div>
            <div><label style={labelStyle}>What do you do? <span style={{ color: '#9ca3af', fontWeight: 400 }}>(1–2 sentences)</span></label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="We provide residential plumbing services throughout Austin, TX." value={aboutDesc} onChange={e => setAboutDesc(e.target.value)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div><label style={labelStyle}>Your city / location</label><input type="text" style={inputStyle} placeholder="Austin, TX" value={aboutLocation} onChange={e => setAboutLocation(e.target.value)} /></div>
              <div><label style={labelStyle}>Phone <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label><input type="tel" style={inputStyle} placeholder="(555) 123-4567" value={aboutPhone} onChange={e => setAboutPhone(e.target.value)} /></div>
            </div>
          </div>
        )}
        {tab === 'howto' && !isPro && <LockOverlay feature="How-To Guide" onUpgrade={onUpgrade} />}
        {tab === 'howto' && isPro && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div><label style={labelStyle}>What are you teaching people to do?</label><input type="text" style={inputStyle} placeholder="How to order a custom cake" value={howToTitle} onChange={e => setHowToTitle(e.target.value)} /></div>
            <div><label style={labelStyle}>List the steps <span style={{ color: '#9ca3af', fontWeight: 400 }}>(one per line)</span></label><textarea style={{ ...inputStyle, resize: 'vertical' }} rows={6} placeholder={"Browse our cake flavors online\nChoose your size and add a message\nSelect a pickup date\nPay and get a confirmation email"} value={howToSteps} onChange={e => setHowToSteps(e.target.value)} /></div>
          </div>
        )}
        {(!['about', 'howto'].includes(tab) || isPro) && (
          <button onClick={handleGenerate} style={{ width: '100%', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '15px', padding: '12px', cursor: 'pointer', marginTop: '18px' }}>
            Generate My Content ✨
          </button>
        )}
      </div>

      {output && (
        <div style={{ background: 'white', border: '1px solid #ddd6fe', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #ddd6fe', background: '#f5f3ff' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#7c3aed' }}>Your content is ready! 🎉</div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>Copy this and paste it into your website or send to your web developer</div>
            </div>
            <CopyButton text={output} />
          </div>
          <pre style={{ margin: 0, padding: '18px', fontSize: '11.5px', lineHeight: 1.7, overflowX: 'auto', color: '#374151', background: 'white', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '280px', overflowY: 'auto' }}>
            {output}
          </pre>
          <div style={{ padding: '12px 18px', background: '#fffbeb', borderTop: '1px solid #fde68a', fontSize: '12px', color: '#6b7280', lineHeight: 1.55 }}>
            📌 <strong>Where to put it:</strong> Add the HTML to the relevant page. The <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>script</code> tag goes just before <code style={{ background: '#f3f4f6', padding: '1px 4px', borderRadius: '3px' }}>&lt;/body&gt;</code>. Not sure how? Just email this to your web developer — it's a 2-minute job.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '18px 22px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#111827' }}>Next up: Get your code snippet</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>One small piece of code makes a big difference for AI visibility</div>
        </div>
        <button onClick={onNext} style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', padding: '8px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' as const }}>
          Get Code <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
