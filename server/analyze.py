#!/usr/bin/env python3
"""
findmewith.ai — Website AI Visibility Analyzer
Outputs a single JSON line to stdout.
"""
import sys
import json
import re
import ssl
import urllib.request
import urllib.parse
from html.parser import HTMLParser

# ── Scoring weights ─────────────────────────────────────────────────────────
SCORE_WEIGHTS = {
    # structured_data (max 35)
    'has_schema_org':          12,
    'has_organization_schema': 10,
    'has_person_schema':        5,
    'has_faq_schema':           5,
    'has_article_schema':       3,
    # content_quality (max 25)
    'has_meta_description':     6,
    'has_h1':                   5,
    'content_length':           8,
    'has_og_tags':              6,
    # entity_authority (max 20)
    'has_contact_info':         7,
    'has_about_page':           7,
    'has_social_links':         6,
    # technical_seo (max 15)
    'https_enabled':            5,
    'has_title_tag':            5,
    'has_robots_txt':           3,
    'has_sitemap':              2,
    # ai_bonus (max 5)
    'has_llms_txt':             5,
}

CATEGORIES = {
    'structured_data':  ['has_schema_org','has_organization_schema','has_person_schema','has_faq_schema','has_article_schema'],
    'content_quality':  ['has_meta_description','has_h1','content_length','has_og_tags'],
    'entity_authority': ['has_contact_info','has_about_page','has_social_links'],
    'technical_seo':    ['https_enabled','has_title_tag','has_robots_txt','has_sitemap'],
    'ai_bonus':         ['has_llms_txt'],
}

LABELS = {
    'has_schema_org':          'Website tells AI who it is',
    'has_organization_schema': 'Business details are machine-readable',
    'has_person_schema':       'Owner / author is identified for AI',
    'has_faq_schema':          'FAQ answers are AI-readable',
    'has_article_schema':      'Blog posts are labeled for AI',
    'has_meta_description':    'One-sentence site summary exists',
    'has_h1':                  'Pages have clear main headings',
    'content_length':          'Enough content for AI to read',
    'has_og_tags':             'Site looks good when shared online',
    'has_contact_info':        'Contact info is visible',
    'has_about_page':          'About page detected',
    'has_social_links':        'Social media profiles linked',
    'https_enabled':           'Website is secure (https)',
    'has_title_tag':           'Page has a clear title',
    'has_robots_txt':          'Navigation file for AI bots exists',
    'has_sitemap':             'Sitemap detected',
    'has_llms_txt':            'AI introduction file (llms.txt) found',
}

SUGGESTIONS = {
    'has_llms_txt':            ('critical',  'Add an llms.txt file',            'This tells ChatGPT and Perplexity exactly who you are. It\'s the single most impactful change you can make.',      'high'),
    'has_organization_schema': ('critical',  'Add your business details code',  'A small code snippet that tells AI your name, address, phone, and what you do.',                                   'high'),
    'has_schema_org':          ('critical',  'Add structured data to your site','AI needs machine-readable data to confidently recommend you. Use the Schema Builder to generate your snippet.',     'high'),
    'has_faq_schema':          ('important', 'Add a Q&A section AI can read',   'FAQ schema is one of the best ways to get AI to include you in direct answers.',                                    'high'),
    'has_meta_description':    ('important', 'Write a one-sentence summary',    'Every page should have a short description — it\'s how AI decides what your site is about.',                        'medium'),
    'content_length':          ('important', 'Add more content to your pages',  'AI needs enough text to understand what you offer. Aim for at least 300 words per page.',                          'medium'),
    'has_h1':                  ('important', 'Add a main heading to each page', 'A clear H1 heading helps AI understand the topic of each page.',                                                    'medium'),
    'has_about_page':          ('important', 'Create an About page',            'AI looks for an About page to confirm who you are and what you do.',                                                'medium'),
    'has_contact_info':        ('important', 'Make your contact info visible',  'AI needs to see your phone, email, or address to trust and cite your business.',                                   'medium'),
    'has_og_tags':             ('nice-to-have','Add social sharing tags',       'Open Graph tags make your site look great when shared — and give AI extra context.',                               'low'),
    'has_robots_txt':          ('nice-to-have','Add a robots.txt file',         'Tells AI bots how to navigate your site.',                                                                          'low'),
    'has_sitemap':             ('nice-to-have','Add an XML sitemap',            'Helps AI discover all your pages.',                                                                                  'low'),
    'has_article_schema':      ('nice-to-have','Label your blog posts for AI',  'Article schema helps AI identify and cite your content.',                                                          'low'),
    'has_person_schema':       ('nice-to-have','Add author / person schema',    'Especially useful for personal brands, consultants, and professionals.',                                            'low'),
    'has_social_links':        ('nice-to-have','Link your social profiles',     'Linking to your social accounts helps AI confirm your online identity.',                                            'low'),
}


class HtmlExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.description = ''
        self.og_title = ''
        self.og_description = ''
        self.twitter_card = ''
        self.canonical = ''
        self.h1_texts = []
        self.json_ld_blocks = []
        self.body_text = ''
        self._in_title = False
        self._in_script_ld = False
        self._current_script = ''
        self._in_body = False
        self._skip_tags = {'script', 'style', 'head', 'nav', 'footer', 'header'}
        self._active_skip = 0

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        t = tag.lower()

        if t == 'title':
            self._in_title = True
        if t == 'script':
            stype = attrs_dict.get('type', '')
            if 'ld+json' in stype:
                self._in_script_ld = True
                self._current_script = ''
        if t == 'meta':
            name = attrs_dict.get('name', '').lower()
            prop = attrs_dict.get('property', '').lower()
            content = attrs_dict.get('content', '')
            if name == 'description':
                self.description = content
            if prop == 'og:title':
                self.og_title = content
            if prop == 'og:description':
                self.og_description = content
            if name == 'twitter:card':
                self.twitter_card = content
        if t == 'link':
            rel = attrs_dict.get('rel', '').lower()
            href = attrs_dict.get('href', '')
            if rel == 'canonical':
                self.canonical = href
        if t in ('h1',):
            self._collecting_h1 = True
            self._h1_buf = ''
        if t in self._skip_tags:
            self._active_skip += 1
        if t == 'body':
            self._in_body = True

    def handle_endtag(self, tag):
        t = tag.lower()
        if t == 'title':
            self._in_title = False
        if t == 'script' and self._in_script_ld:
            self._in_script_ld = False
            self.json_ld_blocks.append(self._current_script)
            self._current_script = ''
        if t == 'h1':
            buf = getattr(self, '_h1_buf', '').strip()
            if buf:
                self.h1_texts.append(buf)
            self._collecting_h1 = False
        if t in self._skip_tags:
            self._active_skip = max(0, self._active_skip - 1)

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_script_ld:
            self._current_script += data
        if getattr(self, '_collecting_h1', False):
            self._h1_buf = getattr(self, '_h1_buf', '') + data
        if self._in_body and self._active_skip == 0:
            self.body_text += data + ' '


def fetch_url(url, timeout=12):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (compatible; findmewith-bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
    })
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
        raw = resp.read(400_000)
        charset = resp.headers.get_content_charset() or 'utf-8'
        return raw.decode(charset, errors='replace'), resp.geturl()


def check_url_exists(url, timeout=6):
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        req = urllib.request.Request(url, method='HEAD', headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            return r.status < 400
    except Exception:
        return False


def analyze(url):
    html, final_url = fetch_url(url)
    parser = HtmlExtractor()
    parser.feed(html)
    html_lower = html.lower()

    base = urllib.parse.urlparse(final_url)
    origin = f"{base.scheme}://{base.netloc}"
    is_https = base.scheme == 'https'

    # Parse JSON-LD
    ld_types = []
    for block in parser.json_ld_blocks:
        try:
            obj = json.loads(block)
            if isinstance(obj, dict):
                ld_types.append(obj.get('@type', ''))
            elif isinstance(obj, list):
                ld_types.extend(o.get('@type', '') for o in obj if isinstance(o, dict))
        except Exception:
            pass
    ld_types_lower = [t.lower() for t in ld_types]

    body_text = re.sub(r'\s+', ' ', parser.body_text).strip()
    word_count = len(body_text.split())

    # Check signals
    checks = {}
    checks['https_enabled']           = is_https
    checks['has_title_tag']           = bool(parser.title.strip())
    checks['has_meta_description']    = bool(parser.description.strip()) or bool(parser.og_description.strip())
    checks['has_h1']                  = len(parser.h1_texts) > 0
    checks['has_og_tags']             = bool(parser.og_title) or bool(parser.og_description)
    checks['content_length']          = word_count >= 250
    checks['has_schema_org']          = len(parser.json_ld_blocks) > 0
    checks['has_organization_schema'] = any('organization' in t or 'localbusiness' in t for t in ld_types_lower)
    checks['has_person_schema']       = any('person' in t for t in ld_types_lower)
    checks['has_faq_schema']          = any('faqpage' in t for t in ld_types_lower)
    checks['has_article_schema']      = any('article' in t or 'blogposting' in t for t in ld_types_lower)
    checks['has_contact_info']        = bool(re.search(r'(\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}|[\w.+-]+@[\w-]+\.\w+)', body_text))
    checks['has_about_page']          = bool(re.search(r'href=["\'][^"\']*about[^"\']*["\']', html_lower))
    checks['has_social_links']        = bool(re.search(r'href=["\'][^"\']*(?:facebook|twitter|linkedin|instagram|youtube)\.[^"\']+["\']', html_lower))
    checks['has_robots_txt']          = check_url_exists(f"{origin}/robots.txt")
    checks['has_sitemap']             = check_url_exists(f"{origin}/sitemap.xml") or 'sitemap' in html_lower
    checks['has_llms_txt']            = check_url_exists(f"{origin}/llms.txt")

    # Build findings array
    findings = []
    for key, passed in checks.items():
        status = 'pass' if passed else 'fail'
        finding = {
            'id': key,
            'label': LABELS.get(key, key),
            'status': status,
        }
        if not passed and key in SUGGESTIONS:
            cat, title, desc, impact = SUGGESTIONS[key]
            finding['suggestion'] = desc
        findings.append(finding)

    # Category scores
    category_scores = {}
    for cat, keys in CATEGORIES.items():
        total = sum(SCORE_WEIGHTS.get(k, 0) for k in keys if checks.get(k, False))
        category_scores[cat] = total

    overall = sum(category_scores.values())

    # Build suggestions
    suggestions = []
    for key, passed in checks.items():
        if not passed and key in SUGGESTIONS:
            cat, title, desc, impact = SUGGESTIONS[key]
            suggestions.append({
                'category': cat,
                'title': title,
                'description': desc,
                'impact': impact,
            })
    # Sort: critical first, then by impact
    impact_order = {'high': 0, 'medium': 1, 'low': 2}
    cat_order = {'critical': 0, 'important': 1, 'nice-to-have': 2}
    suggestions.sort(key=lambda s: (cat_order.get(s['category'], 3), impact_order.get(s['impact'], 3)))

    return {
        'url': final_url,
        'score': overall,
        'categories': category_scores,
        'findings': findings,
        'suggestions': suggestions,
    }


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No URL provided'}))
        sys.exit(1)
    url = sys.argv[1]
    if not url.startswith('http'):
        url = 'https://' + url
    try:
        result = analyze(url)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({'url': url, 'score': 0, 'error': str(e), 'categories': {'structured_data':0,'content_quality':0,'entity_authority':0,'technical_seo':0,'ai_bonus':0}, 'findings': [], 'suggestions': []}))
