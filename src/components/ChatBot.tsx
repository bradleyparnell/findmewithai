import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';

// ── Knowledge base ────────────────────────────────────────────────────────────
interface QA {
  keywords: string[];
  answer: string;
  chips?: string[];
}

const KB: QA[] = [
  {
    keywords: ['wordpress', 'wp'],
    answer: `For WordPress, the easiest way is the free **"Insert Headers and Footers"** plugin (by WPCode):\n\n1. In your WordPress dashboard, go to **Plugins → Add New**\n2. Search for "Insert Headers and Footers"\n3. Install & activate it\n4. Go to **Settings → Insert Headers and Footers**\n5. Paste the script into the **Header** box\n6. Click **Save**\n\nThat's it — the script will appear on every page automatically. 🎉`,
    chips: ['What about Shopify?', 'What about Wix?', 'What does the script do?'],
  },
  {
    keywords: ['shopify'],
    answer: `For Shopify:\n\n1. From your Shopify admin, go to **Online Store → Themes**\n2. Click **"…" → Edit code** on your active theme\n3. Open **Layout → theme.liquid**\n4. Find the closing \`</head>\` tag\n5. Paste the script just before it\n6. Click **Save**\n\nIt'll now run on every page of your store. 🛍️`,
    chips: ['What about WordPress?', 'What about Wix?', 'What does the script do?'],
  },
  {
    keywords: ['wix'],
    answer: `For Wix:\n\n1. In your Wix editor, click **Settings** in the left menu\n2. Scroll down to **Custom Code**\n3. Click **+ Add Custom Code**\n4. Paste the script in the code box\n5. Set placement to **Head** and load to **All pages**\n6. Click **Apply**\n\nNote: Custom code requires a Wix Premium plan. 📋`,
    chips: ['What about WordPress?', 'What about Shopify?', 'What does the script do?'],
  },
  {
    keywords: ['squarespace'],
    answer: `For Squarespace:\n\n1. Go to **Settings → Advanced → Code Injection**\n2. Paste the script into the **Header** field\n3. Click **Save**\n\nThis adds it to every page automatically. ✅\n\nNote: Code injection requires a Business plan or higher.`,
    chips: ['What about WordPress?', 'What about Wix?', 'What does the script do?'],
  },
  {
    keywords: ['webflow'],
    answer: `For Webflow:\n\n1. Go to your **Project Settings → Custom Code**\n2. Paste the script into the **Head Code** section\n3. Click **Save** and then **Publish** your site\n\nYou're live! 🚀`,
    chips: ['What about WordPress?', 'What does the script do?'],
  },
  {
    keywords: ['html', 'head', '</head>', 'where', 'paste', 'place', 'put', 'add', 'install', 'insert'],
    answer: `You'll paste the script just before the **\`</head>\`** closing tag in your HTML. It should look like this:\n\n\`\`\`html\n  <!-- your other head stuff -->\n  <script src="..."></script>\n</head>\n\`\`\`\n\nIf you're not sure how to edit your site's code, just tell me which platform you use (WordPress, Shopify, Wix, etc.) and I'll walk you through it step by step.`,
    chips: ['I use WordPress', 'I use Shopify', 'I use Wix', 'What does the script do?'],
  },
  {
    keywords: ['llms.txt', 'llms', 'txt file', 'text file'],
    answer: `**llms.txt** is a simple text file that introduces your business to AI assistants like ChatGPT, Perplexity, and Claude.\n\nThink of it like a business card that AI reads before answering questions about your industry.\n\nTo install it:\n1. Copy the text from the llms.txt card above\n2. Save it as a file named exactly **\`llms.txt\`** (lowercase)\n3. Upload it to the root of your website so it lives at **\`yoursite.com/llms.txt\`**\n\nYour web developer can do this in about 2 minutes. Or ask your hosting provider — most have a file manager built in.`,
    chips: ['How do I upload a file to my website?', 'What is the script for?', 'Will this help my Google ranking?'],
  },
  {
    keywords: ['upload', 'ftp', 'file manager', 'cpanel', 'hosting'],
    answer: `To upload llms.txt to your website root:\n\n**If you have cPanel hosting (GoDaddy, Bluehost, etc.):**\n1. Log into cPanel\n2. Open **File Manager**\n3. Navigate to your **public_html** folder\n4. Click **Upload** and select your llms.txt file\n\n**If you use FTP:**\nConnect with your FTP client and drop llms.txt into the root folder (usually \`public_html\` or \`www\`).\n\n**Not sure?** Just forward this to your web developer — they'll know exactly where it goes.`,
    chips: ['What about WordPress?', 'What is llms.txt?'],
  },
  {
    keywords: ['what does', 'what is the script', 'why', 'point', 'purpose', 'do for me'],
    answer: `The script does two things:\n\n**1. Tells AI search engines about your business** — it adds structured data (schemas) to your pages so tools like ChatGPT and Perplexity understand who you are, what you offer, and where you're located.\n\n**2. Keeps everything updated automatically** — when you make changes in your findmewith.ai dashboard, your site updates automatically. No need to edit code again.\n\nThink of it as your always-on AI press release. 📡`,
    chips: ['What is a schema?', 'How long until I see results?', 'What about the llms.txt file?'],
  },
  {
    keywords: ['schema', 'structured data', 'json', 'ld', 'markup'],
    answer: `**Schemas** are small pieces of data embedded in your website that help search engines — both traditional Google and AI search tools — understand your business.\n\nFor example, a schema might tell ChatGPT:\n- Your business name and address\n- What services you offer\n- Your hours of operation\n- Answers to common questions\n\nInstead of AI having to *guess* this from your page text, schemas give it the facts directly. It's like the difference between hoping someone reads your whole website vs. handing them a fact sheet.`,
    chips: ['What does the script do?', 'How long until I see results?'],
  },
  {
    keywords: ['how long', 'when', 'results', 'take', 'work'],
    answer: `Great question! Here's a rough timeline:\n\n- **llms.txt**: AI crawlers typically pick it up within **1–2 weeks** on their next crawl cycle\n- **Schemas from the script**: Can show up in AI results within **days** for actively crawled sites\n- **Google SEO improvement**: Usually **4–12 weeks** to see ranking changes\n\nThe good news: once it's installed, it works 24/7 without any effort from you. Set it and forget it. ⏱️`,
    chips: ['What does the script do?', 'Will this help my Google ranking?'],
  },
  {
    keywords: ['google', 'seo', 'ranking', 'traditional', 'search'],
    answer: `Yes! The schemas from your script also help with **traditional Google SEO**.\n\nGoogle uses structured data (schemas) to power rich results — things like FAQ dropdowns, business info in the knowledge panel, and more.\n\nSo installing your script actually helps you in **two places at once**: AI search tools like ChatGPT *and* traditional Google. Two birds, one script. 🐦`,
    chips: ['How long until I see results?', 'What does the script do?'],
  },
  {
    keywords: ['free', 'cost', 'price', 'pay', 'upgrade', 'pro', 'plan'],
    answer: `The basic script (Organization + WebSite schemas + 2 FAQs) is **completely free** — no credit card needed.\n\n**Pro ($29/mo)** unlocks:\n- Full FAQ library\n- LocalBusiness + hours schema\n- Services schema\n- Voice AI (Speakable) schema\n- Weekly auto-updates\n\nAll signals are included in the same one-line script — upgrading just turns on more of them automatically. No new code to paste. 🔓`,
    chips: ['What does the script do?', 'How long until I see results?'],
  },
  {
    keywords: ['developer', 'web developer', 'someone else', "can't", 'help', 'don\'t know how'],
    answer: `Totally fine — most people just forward it to their web developer!\n\nHere's a message you can send them:\n\n---\n*"Hey, could you add a script to our website header and upload a text file? I have the exact code — it should take about 10 minutes. Let me know and I'll send the details."*\n\n---\n\nYou can also email us at **hello@findmewithai.com** and we'll help coordinate.`,
    chips: ['What about WordPress?', 'What is the script for?'],
  },
  {
    keywords: ['not working', 'broken', 'error', 'issue', 'problem', 'wrong'],
    answer: `Sorry to hear that! Let's figure it out.\n\nA few things to check:\n1. Make sure the script tag is inside your \`<head>\` section (not \`<body>\`)\n2. Make sure you copied the entire script — from \`<script\` all the way to \`</script>\`\n3. Try viewing your page source (right-click → View Source) and search for "findmewith" to confirm it's there\n\nIf it's still not working, email us at **hello@findmewithai.com** with your website URL and we'll take a look. 🔧`,
    chips: ['How do I install it?', 'I use WordPress', 'I use Shopify'],
  },
  {
    keywords: ['contact', 'support', 'email', 'talk', 'human', 'person'],
    answer: `You can reach our team anytime at **hello@findmewithai.com** — we're friendly, I promise! 😊\n\nWe typically respond within a few hours during business days. If you're having trouble with installation, include your website URL and we'll walk you through it.`,
  },
  {
    keywords: ['did it work', 'how do i know', 'verify', 'check if', 'working', 'installed correctly', 'confirm', 'test it', 'can i check'],
    answer: `Great question — here's how to confirm everything is working:\n\n**For the widget script:**\n1. Go to your website in a browser\n2. Right-click anywhere → **View Page Source**\n3. Press **Ctrl+F** (or Cmd+F on Mac) and search for "findmewith"\n4. You should see the script tag in your page's \`<head>\` section ✅\n\n**For llms.txt:**\n1. Open a new browser tab\n2. Go to **yoursite.com/llms.txt** (replace with your actual domain)\n3. You should see the plain text file you created ✅\n\n**To see your score improve:**\nRe-scan your site on your findmewith.ai dashboard (hit "Re-scan now" on the Score card). AI search engines typically pick up the changes within **1–2 weeks**. 📡`,
    chips: ['How long until I see results?', 'Something looks wrong', 'What does the script do?'],
  },
  {
    keywords: ['slow', 'speed', 'performance', 'load', 'page speed'],
    answer: `The script is designed to be **lightweight and non-blocking**. It loads asynchronously, which means it won't slow down your page at all.\n\nIt also caches the schema data from our servers, so repeat visitors won't even make a new network request.`,
    chips: ['What does the script do?', 'How do I install it?'],
  },
  {
    keywords: ['safe', 'secure', 'privacy', 'data', 'track', 'collect'],
    answer: `The script only **reads** data from our servers to inject schemas — it doesn't track your visitors, collect personal data, or modify your page content.\n\nIt's essentially just a structured data loader. You can inspect the source code of any schema it injects by right-clicking your page and viewing the source. Nothing hidden. 🔒`,
    chips: ['What does the script do?', 'How long until I see results?'],
  },
];

// ── Fallback response ─────────────────────────────────────────────────────────
const FALLBACK = `Hmm, I'm not sure about that one! Here's what I *can* help with:\n\n- How to install the script on WordPress, Shopify, Wix, etc.\n- What llms.txt is and how to upload it\n- What schemas do for your AI search visibility\n- How long it takes to see results\n\nOr email us at **hello@findmewithai.com** and a real human will help you out. 😊`;

const SUGGESTIONS = [
  'How do I install the script?',
  'I use WordPress',
  'What is llms.txt?',
  'Did it work? How do I check?',
  'I need help from a developer',
];

// ── Match logic ───────────────────────────────────────────────────────────────
function findAnswer(input: string): QA {
  const lower = input.toLowerCase();
  let best: QA | null = null;
  let bestScore = 0;

  for (const qa of KB) {
    const score = qa.keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = qa;
    }
  }

  return bestScore > 0 ? best! : { keywords: [], answer: FALLBACK, chips: SUGGESTIONS };
}

// ── Markdown renderer (simple) ────────────────────────────────────────────────
function renderMd(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      // Inline code
      return part.split(/(`[^`]+`)/g).map((p, k) => {
        if (p.startsWith('`') && p.endsWith('`')) {
          return <code key={k} style={{
            background: '#f3f4f6', borderRadius: '4px',
            padding: '1px 5px', fontSize: '12px', fontFamily: 'monospace',
          }}>{p.slice(1, -1)}</code>;
        }
        return <span key={k}>{p}</span>;
      });
    });

    // Numbered list
    const numMatch = line.match(/^(\d+)\. (.*)/);
    if (numMatch) {
      return <div key={i} style={{ marginLeft: '12px', marginBottom: '3px' }}>
        <span style={{ fontWeight: 700, color: '#7c3aed' }}>{numMatch[1]}.</span>{' '}
        {renderMd(numMatch[2])}
      </div>;
    }

    // HR
    if (line.trim() === '---') {
      return <hr key={i} style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '8px 0' }} />;
    }

    // Code block line
    if (line.startsWith('```') || line.endsWith('```')) return null;
    if (line.startsWith('  ') && line.includes('script')) {
      return <code key={i} style={{
        display: 'block', background: '#1e1b4b', color: '#c4b5fd',
        borderRadius: '6px', padding: '6px 10px', fontSize: '11px',
        fontFamily: 'monospace', marginBottom: '4px',
      }}>{line.trim()}</code>;
    }

    return <p key={i} style={{ margin: line === '' ? '4px 0' : '0 0 4px' }}>{parts}</p>;
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  role: 'bot' | 'user';
  text: string;
  chips?: string[];
}

// ── Component ─────────────────────────────────────────────────────────────────
export const ChatBot: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "Hi! 👋 I'm here to help you get set up. What would you like to know?",
      chips: SUGGESTIONS,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open, minimized]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const qa = findAnswer(text);
      setTyping(false);
      setMessages(prev => [...prev, { role: 'bot', text: qa.answer, chips: qa.chips }]);
    }, 600 + Math.random() * 400);
  };

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            color: 'white', border: 'none', cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          title="Need help installing?"
        >
          <MessageCircle size={26} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '360px', borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex', flexDirection: 'column',
          maxHeight: minimized ? 'auto' : '520px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          border: '1px solid rgba(124,58,237,0.12)',
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
            padding: '16px 18px', display: 'flex', alignItems: 'center',
            gap: '10px', flexShrink: 0, cursor: 'pointer',
          }} onClick={() => setMinimized(m => !m)}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <MessageCircle size={16} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'white' }}>Installation Help</div>
              <div style={{ fontSize: '12px', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                findmewith.ai support
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={e => { e.stopPropagation(); setMinimized(m => !m); }}
                style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <ChevronDown size={18} style={{ transform: minimized ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setOpen(false); }}
                style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', padding: '2px', display: 'flex' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '16px',
                background: '#fafafa', display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                {messages.map((msg, i) => (
                  <div key={i}>
                    <div style={{
                      display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                      <div style={{
                        maxWidth: '88%',
                        background: msg.role === 'user'
                          ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                          : 'white',
                        color: msg.role === 'user' ? 'white' : '#1f2937',
                        borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        padding: '10px 14px',
                        fontSize: '13.5px', lineHeight: 1.55,
                        boxShadow: msg.role === 'bot' ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
                        border: msg.role === 'bot' ? '1px solid #f3f4f6' : 'none',
                      }}>
                        {renderMd(msg.text)}
                      </div>
                    </div>
                    {/* Quick reply chips */}
                    {msg.chips && msg.chips.length > 0 && i === messages.length - 1 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', paddingLeft: '4px' }}>
                        {msg.chips.map((chip, ci) => (
                          <button key={ci} onClick={() => sendMessage(chip)} style={{
                            background: 'white', border: '1.5px solid #ddd6fe',
                            borderRadius: '100px', padding: '5px 12px',
                            fontSize: '12px', color: '#7c3aed', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f5f3ff'; e.currentTarget.style.borderColor = '#7c3aed'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#ddd6fe'; }}
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {typing && (
                  <div style={{ display: 'flex', gap: '5px', padding: '10px 14px', background: 'white', borderRadius: '18px 18px 18px 4px', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #f3f4f6' }}>
                    {[0, 1, 2].map(d => (
                      <span key={d} style={{
                        width: '7px', height: '7px', borderRadius: '50%', background: '#7c3aed',
                        display: 'inline-block', opacity: 0.6,
                        animation: 'chatDot 1.2s ease-in-out infinite',
                        animationDelay: `${d * 0.2}s`,
                      }} />
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{
                padding: '12px 14px', background: 'white',
                borderTop: '1px solid #f3f4f6', display: 'flex', gap: '8px', flexShrink: 0,
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                  placeholder="Ask anything about installation…"
                  style={{
                    flex: 1, border: '1.5px solid #e5e7eb', borderRadius: '12px',
                    padding: '10px 14px', fontSize: '13.5px', outline: 'none',
                    fontFamily: 'inherit', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#7c3aed')}
                  onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim()}
                  style={{
                    width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                    background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : '#f3f4f6',
                    border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <Send size={16} color={input.trim() ? 'white' : '#9ca3af'} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Typing dot animation */}
      <style>{`
        @keyframes chatDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </>
  );
};
