import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '48px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 16, padding: '48px 56px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>

        {/* Header */}
        <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6d28d9', textDecoration: 'none', fontSize: 14, marginBottom: 32 }}>
          ← Back to findmewith.ai
        </a>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#1e1b4b', marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 40 }}>Last updated: June 2025</p>

        <p style={{ color: '#374151', lineHeight: 1.7, marginBottom: 24 }}>
          findmewith.ai ("we", "our", or "us") is a product of GenieRocket LLC. We built this tool to help
          business owners understand how visible their websites are to AI-powered search engines.
          This policy explains what data we collect, why we collect it, and how we protect it.
          Plain English — no legalese.
        </p>

        <Section title="What we collect">
          <ul style={{ color: '#374151', lineHeight: 1.9, paddingLeft: 20 }}>
            <li><strong>Your email address</strong> — to send you your scan results and notify you when your score changes.</li>
            <li><strong>Your website URL</strong> — to run the AI visibility analysis.</li>
            <li><strong>Scan results</strong> — the data our tool generates about your site (score, keywords, signals). Stored so you can return to your dashboard.</li>
            <li><strong>Payment information</strong> — handled entirely by Stripe. We never see or store your card details.</li>
          </ul>
          <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 12 }}>
            We do <strong>not</strong> collect browsing history, track you across other websites, or sell your data to anyone.
          </p>
        </Section>

        <Section title="How we use it">
          <ul style={{ color: '#374151', lineHeight: 1.9, paddingLeft: 20 }}>
            <li>Deliver your scan results and dashboard.</li>
            <li>Send you score-change notifications (you can unsubscribe any time).</li>
            <li>Process Pro or Agency subscription payments through Stripe.</li>
            <li>Improve the accuracy of our AI visibility scoring.</li>
          </ul>
        </Section>

        <Section title="Third-party services">
          <p style={{ color: '#374151', lineHeight: 1.7 }}>
            We use the following services to operate findmewith.ai:
          </p>
          <ul style={{ color: '#374151', lineHeight: 1.9, paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Supabase</strong> — secure database and authentication (EU/US infrastructure).</li>
            <li><strong>Stripe</strong> — payment processing. Subject to <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#6d28d9' }}>Stripe's Privacy Policy</a>.</li>
            <li><strong>DataForSEO</strong> — keyword search volume data for your industry.</li>
            <li><strong>Resend</strong> — transactional email delivery.</li>
          </ul>
          <p style={{ color: '#374151', lineHeight: 1.7, marginTop: 12 }}>
            None of these services receive more data than they need to do their job.
          </p>
        </Section>

        <Section title="Data retention">
          <p style={{ color: '#374151', lineHeight: 1.7 }}>
            We keep your scan results and account data for as long as your account is active.
            If you'd like your data deleted, email us at{' '}
            <a href="mailto:hello@findmewithai.com" style={{ color: '#6d28d9' }}>hello@findmewithai.com</a>{' '}
            and we'll remove everything within 7 business days.
          </p>
        </Section>

        <Section title="Cookies">
          <p style={{ color: '#374151', lineHeight: 1.7 }}>
            We use a small number of cookies strictly necessary for authentication (keeping you logged in).
            We do not use advertising or tracking cookies.
          </p>
        </Section>

        <Section title="Your rights">
          <p style={{ color: '#374151', lineHeight: 1.7 }}>
            You can request a copy of your data, ask us to correct it, or ask us to delete it at any time.
            Just email{' '}
            <a href="mailto:hello@findmewithai.com" style={{ color: '#6d28d9' }}>hello@findmewithai.com</a>.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p style={{ color: '#374151', lineHeight: 1.7 }}>
            If we make material changes, we'll notify you by email before they take effect.
          </p>
        </Section>

        <Section title="Contact">
          <p style={{ color: '#374151', lineHeight: 1.7 }}>
            GenieRocket LLC — <a href="mailto:hello@findmewithai.com" style={{ color: '#6d28d9' }}>hello@findmewithai.com</a>
          </p>
        </Section>

      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>
      {title}
    </h2>
    {children}
  </div>
);

export default PrivacyPage;
