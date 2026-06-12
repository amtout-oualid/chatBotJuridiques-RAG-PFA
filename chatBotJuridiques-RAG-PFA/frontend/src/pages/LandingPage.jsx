import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import {
  Check, Clock, FileText, Lock, Zap, Shield,
  MessageSquare, Database, Edit2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import Particles, { ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './LandingPage.css';

gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = [
  { label: 'Use Cases', href: '#use-cases' },
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'The Ecosystem', href: '#ecosystem' },
  { label: 'Reviews', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
];

/* ═══════════════════════════════════════════════════════
   PARTICLES CONFIG — Edit these variables to customize
   All values are defined here in one place (lines 29-60)
   ═══════════════════════════════════════════════════════ */
const P_FPS_LIMIT          = 60;       // Max FPS (30, 60, 120)
const P_RETINA             = true;     // Retina display support
const P_COLOR              = '#999';   // Dot color (hex)
const P_COUNT              = 520;      // Total number of particles (20–300)
const P_DENSITY_AREA       = 1000;      // Area per particle — lower = denser (200–2000)
const P_SIZE_MIN           = 1;        // Min dot size in px
const P_SIZE_MAX           = 3;        // Max dot size in px
const P_OPACITY_MIN        = 0.4;      // Min opacity (0–1)
const P_OPACITY_MAX        = 0.5;      // Max opacity (0–1)
const P_OPACITY_ANIM       = true;     // Enable fade animation
const P_OPACITY_SPEED      = 0.8;      // Fade speed (0.1–5)
const P_LINKS_ENABLED      = true;     // Show lines between particles
const P_LINKS_COLOR        = '#aaa';   // Line color (hex)
const P_LINKS_DISTANCE     = 120;      // Max distance to draw a line (50–300)
const P_LINKS_OPACITY      = 0.3;      // Line opacity (0–1)
const P_LINKS_WIDTH        = 1;        // Line thickness in px
const P_SPEED              = 0.5;      // Drift speed (0.1–10)
const P_DIRECTION          = 'none';   // 'none','top','bottom','left','right'
const P_RANDOM             = true;     // Random movement
const P_STRAIGHT           = false;    // Straight lines vs wobble
const P_OUT_MODE           = 'out';    // Edge behavior: 'out','bounce','destroy'
const P_HOVER_ENABLED      = true;     // Enable hover effect
const P_HOVER_MODE         = 'grab';   // 'grab','repulse','bubble','connect'
const P_GRAB_DISTANCE      = 200;      // Cursor reach distance (50–500)
const P_GRAB_OPACITY       = 0.6;      // Grab line opacity (0–1)
const P_GRAB_COLOR         = '#777';   // Grab line color (hex)
const P_CLICK_ENABLED      = true;     // Enable click effect
const P_CLICK_MODE         = 'push';   // 'push','remove','repulse','bubble'
const P_PUSH_COUNT         = 3;        // Particles spawned per click (1–20)

const PARTICLES_OPTIONS = {
  fullScreen: false,
  fpsLimit: P_FPS_LIMIT,
  detectRetina: P_RETINA,
  interactivity: {
    events: {
      onHover: { enable: P_HOVER_ENABLED, mode: P_HOVER_MODE },
      onClick: { enable: P_CLICK_ENABLED, mode: P_CLICK_MODE },
    },
    modes: {
      grab: { distance: P_GRAB_DISTANCE, links: { opacity: P_GRAB_OPACITY, color: P_GRAB_COLOR } },
      push: { quantity: P_PUSH_COUNT },
    },
  },
  particles: {
    color: { value: P_COLOR },
    links: { color: P_LINKS_COLOR, distance: P_LINKS_DISTANCE, enable: P_LINKS_ENABLED, opacity: P_LINKS_OPACITY, width: P_LINKS_WIDTH },
    move: { enable: true, speed: P_SPEED, direction: P_DIRECTION, random: P_RANDOM, straight: P_STRAIGHT, outModes: { default: P_OUT_MODE } },
    number: { density: { enable: true, area: P_DENSITY_AREA }, value: P_COUNT },
    opacity: { value: { min: P_OPACITY_MIN, max: P_OPACITY_MAX }, animation: { enable: P_OPACITY_ANIM, speed: P_OPACITY_SPEED, sync: false } },
    shape: { type: 'circle' },
    size: { value: { min: P_SIZE_MIN, max: P_SIZE_MAX } },
  },
};

const particlesInit = async (engine) => { await loadSlim(engine); };

/* ── GSAP easing tokens ── */
const EASE_PRIMARY   = 'expo.out';
const EASE_SECONDARY = 'power2.out';
const EASE_MICRO     = 'back.out(1.4)';

/* ── Count-up helper ── */
function animateCountUp(el, target, suffix = '', duration = 1.2) {
  const isFloat = String(target).includes('.');
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration,
    ease: 'power2.out',
    onUpdate() {
      el.textContent = (isFloat ? obj.val.toFixed(1) : Math.round(obj.val)) + suffix;
    },
  });
}

/* ── Split text into word spans ── */
function splitWords(text) {
  return text.split(/\s+/).map((word, i) => (
    <span key={i} className="word gsap-hero-word">{word}</span>
  ));
}

export default function LandingPage() {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const containerRef = useRef(null);
  const particlesOptions = useMemo(() => PARTICLES_OPTIONS, []);

  const goToDashboard = () => navigate('/chat');
  const goToSignIn = () => navigate('/sign-in');
  const goToSignUp = () => navigate('/sign-up');

  const scrollTo = (hash) => {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollCarousel = useCallback((direction) => {
    const c = carouselRef.current;
    if (!c) return;
    const w = c.querySelector('.cq-card')?.offsetWidth || 400;
    c.scrollBy({ left: direction * (w + 24), behavior: 'smooth' });
  }, []);

  /* ── Carousel horizontal wheel ── */
  useEffect(() => {
    const c = carouselRef.current;
    if (!c) return;
    const h = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const max = c.scrollWidth - c.clientWidth;
      if (max <= 0) return;
      if ((c.scrollLeft <= 0 && e.deltaY < 0) || (c.scrollLeft >= max - 1 && e.deltaY > 0)) return;
      e.preventDefault();
      c.scrollLeft += e.deltaY;
    };
    c.addEventListener('wheel', h, { passive: false });
    return () => c.removeEventListener('wheel', h);
  }, []);

  /* ── Carousel drag ── */
  useEffect(() => {
    const c = carouselRef.current;
    if (!c) return;
    let down = false, sx = 0, sl = 0;
    const md = (e) => { down = true; sx = e.pageX - c.offsetLeft; sl = c.scrollLeft; c.style.scrollBehavior = 'auto'; };
    const mu = () => { down = false; c.style.scrollBehavior = 'smooth'; };
    const mm = (e) => { if (!down) return; e.preventDefault(); c.scrollLeft = sl - (e.pageX - c.offsetLeft - sx); };
    c.addEventListener('mousedown', md);
    window.addEventListener('mouseup', mu);
    window.addEventListener('mouseleave', mu);
    c.addEventListener('mousemove', mm);
    return () => { c.removeEventListener('mousedown', md); window.removeEventListener('mouseup', mu); window.removeEventListener('mouseleave', mu); c.removeEventListener('mousemove', mm); };
  }, []);

  /* ══════════════════════════════════════════
     GSAP MASTER ANIMATION TIMELINE
     ══════════════════════════════════════════ */
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      // Just make everything visible instantly
      gsap.set('.gsap-hero-label, .gsap-hero-word, .gsap-hero-subtitle, .hero-buttons, .gsap-hero-img, .gsap-reveal, .gsap-reveal-left, .gsap-reveal-right, .gsap-stat-card, .gsap-pill, .gsap-card, .landing-nav', {
        visibility: 'visible', opacity: 1, x: 0, y: 0, scale: 1,
      });
      return;
    }

    const ctx = gsap.context(() => {
      /* ── 1. NAV ── */
      gsap.to('.landing-nav', {
        opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: EASE_SECONDARY,
      });

      /* ── 2. HERO SEQUENCE ── */
      const heroTL = gsap.timeline({ delay: 0.3 });

      // A. Label — already visible, subtle fade only
      heroTL.set('.gsap-hero-label', { visibility: 'visible', opacity: 0.6 });

      // B. Heading words — first 25% static, rest animate
      const words = gsap.utils.toArray('.gsap-hero-word');
      const staticCount = Math.ceil(words.length * 0.25);

      // Make static words visible immediately
      if (staticCount > 0) {
        heroTL.set(words.slice(0, staticCount), { visibility: 'visible', opacity: 1, y: 0 });
      }

      // Animate remaining words
      const animatedWords = words.slice(staticCount);
      if (animatedWords.length > 0) {
        heroTL.set(animatedWords, { visibility: 'visible', opacity: 0, y: 40 });
        heroTL.to(animatedWords, {
          y: 0, opacity: 1, duration: 0.6, ease: EASE_PRIMARY, stagger: 0.1,
        }, '<');
      }

      // C. Subtitle — right-to-left reveal, opacity fades in over 1s
      heroTL.set('.gsap-hero-subtitle', { visibility: 'visible', opacity: 0, x: 60 });
      heroTL.to('.gsap-hero-subtitle', {
        x: 0, duration: 0.6, ease: EASE_SECONDARY,
      }, '>-0.1');
      heroTL.to('.gsap-hero-subtitle', {
        opacity: 0.75, duration: 1.0, ease: 'power2.out',
      }, '<');

      // D. Buttons — Center-Out Scale Expansion from tiny 5px dot
      heroTL.set('.hero-buttons', { visibility: 'visible', scale: 0.02, opacity: 0, transformOrigin: 'center center' });
      heroTL.to('.hero-buttons', {
        scale: 1, opacity: 1, duration: 0.7, ease: EASE_PRIMARY,
      }, '>-0.3');

      // E. Hero images — slide inward
      heroTL.set('.gsap-hero-img-left', { visibility: 'visible', x: -80, opacity: 0 });
      heroTL.set('.gsap-hero-img-right', { visibility: 'visible', x: 80, opacity: 0 });
      heroTL.to('.gsap-hero-img-left', { x: 0, opacity: 1, duration: 1.0, ease: EASE_PRIMARY }, '>-0.1');
      heroTL.to('.gsap-hero-img-right', { x: 0, opacity: 1, duration: 1.0, ease: EASE_PRIMARY }, '<0.1');

      /* ── 3. SCROLL-TRIGGERED SECTIONS ── */

      // Utility: batch scroll reveal
      const scrollReveal = (selector, fromVars, toVars, triggerOpts = {}) => {
        gsap.utils.toArray(selector).forEach((el) => {
          gsap.set(el, { visibility: 'visible', ...fromVars });
          gsap.to(el, {
            ...toVars,
            scrollTrigger: { trigger: el, start: 'top 85%', once: true, ...triggerOpts },
          });
        });
      };

      // Dark section heading + description
      scrollReveal('.dark-stats-section h2', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: EASE_PRIMARY });
      scrollReveal('.dark-stats-section > .landing-section-inner > p', { y: 30, opacity: 0 }, { y: 0, opacity: 0.75, duration: 0.7, delay: 0.15, ease: EASE_PRIMARY });
      scrollReveal('.dark-pill', { y: 20, opacity: 0 }, { y: 0, opacity: 0.6, duration: 0.6, ease: EASE_PRIMARY });

      // Stat cards — stagger + count-up
      const statCards = gsap.utils.toArray('.gsap-stat-card');
      statCards.forEach((card, i) => {
        gsap.set(card, { visibility: 'visible', y: 40, opacity: 0 });
        gsap.to(card, {
          y: 0, opacity: 1, duration: 0.8, ease: EASE_PRIMARY, delay: i * 0.15,
          scrollTrigger: { trigger: '.stats-grid', start: 'top 80%', once: true },
          onComplete() {
            const valEl = card.querySelector('.stat-value');
            if (!valEl) return;
            const raw = valEl.dataset.target;
            if (!raw) return;
            const numMatch = raw.match(/([\d.]+)/);
            if (numMatch) {
              const num = parseFloat(numMatch[1]);
              const prefix = raw.slice(0, raw.indexOf(numMatch[1]));
              const suffix = raw.slice(raw.indexOf(numMatch[1]) + numMatch[1].length);
              const isFloat = numMatch[1].includes('.');
              const obj = { val: 0 };
              gsap.to(obj, {
                val: num, duration: 1.2, ease: 'power2.out',
                onUpdate() { valEl.textContent = prefix + (isFloat ? obj.val.toFixed(1) : Math.round(obj.val)) + suffix; },
              });
            }
          },
        });
      });

      // Trusted section
      scrollReveal('.trusted-section h2', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: EASE_PRIMARY });
      scrollReveal('.trusted-section p', { y: 20, opacity: 0 }, { y: 0, opacity: 0.75, duration: 0.6, delay: 0.1, ease: EASE_PRIMARY });

      const pills = gsap.utils.toArray('.gsap-pill');
      pills.forEach((pill, i) => {
        gsap.set(pill, { visibility: 'visible', scale: 0.95, opacity: 0 });
        gsap.to(pill, {
          scale: 1, opacity: 0.8, duration: 0.5, ease: EASE_PRIMARY, delay: i * 0.05,
          scrollTrigger: { trigger: '.features-pill-grid', start: 'top 85%', once: true },
        });
      });

      // Clarity section
      scrollReveal('.clarity-left', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: EASE_PRIMARY });

      const clarityCards = gsap.utils.toArray('.clarity-right .gsap-card');
      clarityCards.forEach((card, i) => {
        gsap.set(card, { visibility: 'visible', y: 30, opacity: 0 });
        gsap.to(card, {
          y: 0, opacity: 1, duration: 0.7, ease: EASE_PRIMARY, delay: i * 0.1,
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        });
      });

      // Common questions — simple fade up for all cards
      scrollReveal('.cq-header', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: EASE_PRIMARY });
      const cqCards = gsap.utils.toArray('.cq-card');
      cqCards.forEach((card, i) => {
        gsap.set(card, { visibility: 'visible', y: 30, opacity: 0 });
        gsap.to(card, {
          y: 0, opacity: 1, duration: 0.7, ease: EASE_PRIMARY, delay: i * 0.1,
          scrollTrigger: { trigger: '.cq-carousel', start: 'top 85%', once: true },
        });
      });

      // Dual section
      scrollReveal('.dual-left', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: EASE_PRIMARY });
      const dualCards = gsap.utils.toArray('.dual-right .gsap-card');
      dualCards.forEach((card, i) => {
        gsap.set(card, { visibility: 'visible', x: 40, opacity: 0 });
        gsap.to(card, {
          x: 0, opacity: 1, duration: 0.7, ease: EASE_PRIMARY, delay: i * 0.2,
          scrollTrigger: { trigger: card, start: 'top 85%', once: true },
        });
      });

      // Testimonials
      scrollReveal('.empower-pill', { y: 20, opacity: 0 }, { y: 0, opacity: 0.6, duration: 0.6, ease: EASE_PRIMARY });
      scrollReveal('.empower-section h2', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, delay: 0.1, ease: EASE_PRIMARY });
      scrollReveal('.empower-section > .landing-section-inner > p', { y: 20, opacity: 0 }, { y: 0, opacity: 0.75, duration: 0.6, delay: 0.2, ease: EASE_PRIMARY });

      const tCards = gsap.utils.toArray('.testimonial-card');
      tCards.forEach((card, i) => {
        gsap.set(card, { visibility: 'visible', y: 20, opacity: 0 });
        gsap.to(card, {
          y: 0, opacity: 1, duration: 0.6, ease: EASE_PRIMARY, delay: i * 0.12,
          scrollTrigger: { trigger: '.testimonials', start: 'top 85%', once: true },
        });
      });

      // Footer
      scrollReveal('.landing-footer', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: EASE_SECONDARY });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  /* ── Hero scroll parallax ── */
  useEffect(() => {
    const imgs = document.querySelector('.hero-images');
    if (!imgs) return;
    const h = () => { imgs.style.transform = `translate3d(0, ${window.scrollY * 0.06}px, 0)`; };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* ── Heading text for word splitting ── */
  const line1 = 'Elite Legal Power,';
  const line2 = 'Accessible to Everyone';

  return (
    <div className="landing-container" ref={containerRef}>
      <nav className="landing-nav">
        <div className="nav-logo">LEXIS LAW</div>
        <div className="nav-links">
          {NAV_LINKS.map(({ label, href }) => (
            <a key={href} href={href} onClick={(e) => { e.preventDefault(); scrollTo(href); }}>{label}</a>
          ))}
        </div>
        <div className="nav-actions">
          <SignedOut>
            <button type="button" className="sign-in-link" onClick={goToSignIn}>Sign In</button>
            <button type="button" className="get-started-btn" onClick={goToSignUp}>Get Started</button>
          </SignedOut>
          <SignedIn>
            <button type="button" className="get-started-btn" onClick={goToDashboard}>Dashboard</button>
          </SignedIn>
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="hero-section">
        <ParticlesProvider init={particlesInit}>
          <Particles id="hero-particles" className="hero-particles" options={particlesOptions} />
        </ParticlesProvider>

        <div className="landing-section-inner">
          <div className="hero-pill gsap-hero-label">AUTOMATED LEGAL INTELLIGENCE</div>
          <h1 className="hero-title">
            <span className="hero-title-line">{splitWords(line1)}</span>
            <span className="hero-title-line">{splitWords(line2)}</span>
          </h1>
          <p className="hero-subtitle gsap-hero-subtitle">
            Whether you are navigating a personal legal dispute or optimizing
            your law practice, Lexis Law gives you instant, fact-checked
            answers and generates professional legal documents in seconds.
          </p>
          <div className="hero-buttons">
            <SignedOut>
              <button type="button" className="btn-primary" onClick={goToSignUp}>Ask a Legal Question</button>
              <button type="button" className="btn-secondary" onClick={() => scrollTo('#ecosystem')}>Explore Pro Features</button>
            </SignedOut>
            <SignedIn>
              <button type="button" className="btn-primary" onClick={goToDashboard}>Ask a Legal Question</button>
              <button type="button" className="btn-secondary" onClick={() => scrollTo('#ecosystem')}>Explore Pro Features</button>
            </SignedIn>
          </div>

          <div className="hero-images">
            <div className="hero-img-wrapper gsap-hero-img gsap-hero-img-left">
              <img src="/images/lady-justice.png" alt="Lady Justice bronze statue holding scales" loading="eager" />
            </div>
            <div className="hero-img-wrapper gsap-hero-img gsap-hero-img-right">
              <img src="/images/legal-scales.png" alt="Legal scales of justice and gavel" loading="eager" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ DARK STATS ═══════════ */}
      <section className="dark-stats-section landing-band-full" id="how-it-works">
        <div className="landing-section-inner">
          <div className="dark-pill gsap-reveal">MEET YOUR NEW AI</div>
          <h2 className="gsap-reveal">Stop guessing about your rights</h2>
          <p className="gsap-reveal">
            Generate AI chat that returns exact answers. Visitors can actually reach the law. We
            built a highly secure intelligence engine that searches through real legal
            libraries and your private documents to give you clarity and confidence.
          </p>
          <div className="stats-grid">
            <div className="stat-card gsap-stat-card">
              <div className="stat-icon"><Clock size={18} /></div>
              <div className="stat-content">
                <div className="stat-label">AVG RESPONSE TIME</div>
                <div className="stat-value" data-target="0.5s">0</div>
              </div>
            </div>
            <div className="stat-card gsap-stat-card">
              <div className="stat-icon"><FileText size={18} /></div>
              <div className="stat-content">
                <div className="stat-label">DOCUMENT GENERATION</div>
                <div className="stat-value" data-target="Instant">Instant</div>
              </div>
            </div>
            <div className="stat-card gsap-stat-card">
              <div className="stat-icon"><Zap size={18} /></div>
              <div className="stat-content">
                <div className="stat-label">ESTIMATED COST</div>
                <div className="stat-value" data-target="$25-250">$0</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED ═══════════ */}
      <section className="trusted-section">
        <div className="landing-section-inner">
          <h2 className="gsap-reveal">Trusted by Everyday People and Legal<br />Professionals</h2>
          <p className="gsap-reveal">
            From individuals drafting DIY prenups to litigators searching complex case files,<br />
            our platform scales to your exact requirements.
          </p>
          <div className="features-pill-grid">
            {['Fact-Checked Answers', 'Bank-Grade Security', 'Instant PDF Generation', 'LaTeX Formatting', 'Private Databases', 'Real Precedents', 'Zero Latency', 'Deterministic AI'].map((label) => (
              <div key={label} className="feature-pill gsap-pill">{label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CLARITY ═══════════ */}
      <section className="clarity-section">
        <div className="landing-section-inner clarity-section-inner">
          <div className="clarity-left gsap-reveal">
            <div className="clarity-pill">OUR PLATFORM</div>
            <h2>Clarity and<br />power, without<br />the hourly fees</h2>
            <p>Skip the confusing legal jargon and expensive consultations for basic research. We empower you to understand your situation, review contracts, and take definitive legal action.</p>
          </div>
          <div className="clarity-right">
            <div className="clarity-card gsap-card">
              <Shield size={20} className="card-icon" />
              <h3>Fact-Checked Answers</h3>
              <p>Lexis AI cross-references thousands of legal precedents across specific jurisdictions to tell you exactly where your situation stands today.</p>
            </div>
            <div className="clarity-card gsap-card">
              <FileText size={20} className="card-icon" />
              <h3>Instant Document Generation</h3>
              <p>Export perfectly formatted PDFs for a contract, business professional, court filing, or NDA instantaneously.</p>
            </div>
            <div className="clarity-card gsap-card">
              <Lock size={20} className="card-icon" />
              <h3>Total Privacy & Security</h3>
              <p>Your documents are strictly your business. We use SOC-2 compliance so your data is never shared or leaked.</p>
            </div>
            <div className="clarity-card gsap-card">
              <Zap size={20} className="card-icon" />
              <h3>Zero Time & Money</h3>
              <p>Get clarity on your legal situation in minutes, not weeks. Perfect for both individuals and busy lawyers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ COMMON QUESTIONS ═══════════ */}
      <section className="common-questions-section" id="use-cases">
        <div className="landing-section-inner">
          <div className="cq-header gsap-reveal" id="faq">
            <h2>Common Questions</h2>
            <button type="button" className="faq-btn" onClick={() => scrollTo('#faq')}>FAQ</button>
          </div>
          <div className="cq-carousel" ref={carouselRef}>
            <div className="cq-card gsap-card">
              <div className="cq-image img-1">
                <img src="/images/lady-justice.png" alt="Legal assistance for individuals" loading="lazy" />
              </div>
              <div className="cq-content">
                <h3>For Individuals & Businesses</h3>
                <p>Everything you need to know about everyday law, safely and effectively.</p>
                <div className="cq-features">
                  <div className="cq-feature"><Check size={14} /> Plain language answers to complex legal questions</div>
                  <div className="cq-feature"><Check size={14} /> Create, edit and format standard contracts</div>
                </div>
                <div className="cq-actions">
                  <button type="button" className="btn-dark-small">FAQ</button>
                  <button type="button" className="btn-light-small">Pricing</button>
                </div>
              </div>
            </div>
            <div className="cq-card gsap-card">
              <div className="cq-image img-2">
                <img src="/images/legal-scales.png" alt="Legal tools for professionals" loading="lazy" />
              </div>
              <div className="cq-content">
                <h3>For Legal Professionals</h3>
                <p>Everything you need to know about everyday law, safely and effectively.</p>
                <div className="cq-features">
                  <div className="cq-feature"><Check size={14} /> Interrogate private documents securely via our RAG</div>
                  <div className="cq-feature"><Check size={14} /> Export to our native LaTeX editor for perfect PDFs</div>
                </div>
                <div className="cq-actions">
                  <button type="button" className="btn-dark-small">FAQ</button>
                  <button type="button" className="btn-light-small">Pricing</button>
                </div>
              </div>
            </div>
            <div className="cq-card gsap-card">
              <div className="cq-image img-1">
                <img src="/images/lady-justice.png" alt="Contract disputes" loading="lazy" />
              </div>
              <div className="cq-content">
                <h3>Contract Disputes</h3>
                <p>Navigate breach of contract claims, termination clauses, and liability questions.</p>
                <div className="cq-features">
                  <div className="cq-feature"><Check size={14} /> Analyze contract terms for hidden risks</div>
                  <div className="cq-feature"><Check size={14} /> Draft formal dispute resolution letters</div>
                </div>
                <div className="cq-actions">
                  <button type="button" className="btn-dark-small">FAQ</button>
                  <button type="button" className="btn-light-small">Pricing</button>
                </div>
              </div>
            </div>
            <div className="cq-card gsap-card">
              <div className="cq-image img-2">
                <img src="/images/legal-scales.png" alt="Employment law" loading="lazy" />
              </div>
              <div className="cq-content">
                <h3>Employment Rights</h3>
                <p>Understand your workplace protections, from wrongful termination to wage disputes.</p>
                <div className="cq-features">
                  <div className="cq-feature"><Check size={14} /> Review employment agreements instantly</div>
                  <div className="cq-feature"><Check size={14} /> Generate complaint letters in minutes</div>
                </div>
                <div className="cq-actions">
                  <button type="button" className="btn-dark-small">FAQ</button>
                  <button type="button" className="btn-light-small">Pricing</button>
                </div>
              </div>
            </div>
            <div className="cq-card gsap-card">
              <div className="cq-image img-1">
                <img src="/images/lady-justice.png" alt="Real estate law" loading="lazy" />
              </div>
              <div className="cq-content">
                <h3>Real Estate & Property</h3>
                <p>From lease agreements to title disputes, get clear answers on property law.</p>
                <div className="cq-features">
                  <div className="cq-feature"><Check size={14} /> Analyze lease terms and tenant rights</div>
                  <div className="cq-feature"><Check size={14} /> Generate purchase agreements and NDAs</div>
                </div>
                <div className="cq-actions">
                  <button type="button" className="btn-dark-small">FAQ</button>
                  <button type="button" className="btn-light-small">Pricing</button>
                </div>
              </div>
            </div>
            <div className="cq-card gsap-card">
              <div className="cq-image img-2">
                <img src="/images/legal-scales.png" alt="Family law" loading="lazy" />
              </div>
              <div className="cq-content">
                <h3>Family & Civil Law</h3>
                <p>Custody, divorce, inheritance — sensitive legal matters handled with precision.</p>
                <div className="cq-features">
                  <div className="cq-feature"><Check size={14} /> Draft prenuptial and separation agreements</div>
                  <div className="cq-feature"><Check size={14} /> Understand custody and support obligations</div>
                </div>
                <div className="cq-actions">
                  <button type="button" className="btn-dark-small">FAQ</button>
                  <button type="button" className="btn-light-small">Pricing</button>
                </div>
              </div>
            </div>
          </div>
          <div className="carousel-nav">
            <button type="button" className="carousel-btn" onClick={() => scrollCarousel(-1)} aria-label="Previous slide"><ChevronLeft size={20} /></button>
            <button type="button" className="carousel-btn" onClick={() => scrollCarousel(1)} aria-label="Next slide"><ChevronRight size={20} /></button>
          </div>
        </div>
      </section>

      {/* ═══════════ BUILT FOR THE PUBLIC ═══════════ */}
      <section className="dual-section" id="ecosystem">
        <div className="landing-section-inner dual-section-inner">
          <div className="dual-left gsap-reveal">
            <div className="dual-pill">BUILT FOR THE PUBLIC</div>
            <h2>Built for the public.<br />Powerful enough<br />for professionals.</h2>
            <p>A completely secure environment to take you from your very first legal question to a finished, beautifully formatted document.</p>
          </div>
          <div className="dual-right">
            <div className="feature-row dark gsap-card">
              <MessageSquare size={20} />
              <div className="fr-content">
                <h4>AI Legal Assistant</h4>
                <p>Ask questions, analyze risk, explore case outcomes, and draft communications, all within the program.</p>
              </div>
            </div>
            <div className="feature-row dark gsap-card">
              <Database size={20} />
              <div className="fr-content">
                <h4>Private Legal Database</h4>
                <p>Upload your own libraries, contracts, or case files, and chat with everything securely without data leaving.</p>
              </div>
            </div>
            <div className="feature-row dark gsap-card">
              <Edit2 size={20} />
              <div className="fr-content">
                <h4>Smart Document Editor</h4>
                <p>Write alongside AI, suggest edits, and use our LaTeX editor to compile perfectly formatted, ready PDFs.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="empower-section" id="testimonials">
        <div className="landing-section-inner">
          <div className="empower-pill gsap-reveal">HEAR IT FROM USERS</div>
          <h2 className="gsap-reveal">Empowering people<br />and practitioners</h2>
          <p className="gsap-reveal">See how Lexis Law is changing the way people interact with the legal system.</p>
          <div className="testimonials">
            <div className="testimonial-card gsap-card">
              <div className="t-avatar a1" />
              <div className="t-content">
                <p>&ldquo;I was terrified when my landlord sent me a notice. Lexis Law explained my rights clearly and helped me draft a formal response letter in 5 minutes.&rdquo;</p>
                <div className="t-author"><strong>JESSICA T.</strong><span>Small Business Owner</span></div>
              </div>
            </div>
            <div className="testimonial-card gsap-card">
              <div className="t-avatar a2" />
              <div className="t-content">
                <p>&ldquo;As a solo lawyer, I don&apos;t have a team of paralegals. Uploading a 200-page dossier and instantly finding contradictions has saved me countless billable hours.&rdquo;</p>
                <div className="t-author"><strong>DAVID M.</strong><span>Independent Attorney</span></div>
              </div>
            </div>
            <div className="testimonial-card gsap-card">
              <div className="t-avatar a3" />
              <div className="t-content">
                <p>&ldquo;I used Lexis Law to review a commercial lease before signing. It flagged three clauses that would have cost me thousands. Absolutely essential tool.&rdquo;</p>
                <div className="t-author"><strong>SARAH K.</strong><span>Real Estate Investor</span></div>
              </div>
            </div>
            <div className="testimonial-card gsap-card">
              <div className="t-avatar a4" />
              <div className="t-content">
                <p>&ldquo;The LaTeX document editor is a game-changer. I draft NDAs and contracts that look like they came from a top-tier firm, all in under 10 minutes.&rdquo;</p>
                <div className="t-author"><strong>MARC L.</strong><span>Startup Founder</span></div>
              </div>
            </div>
            <div className="testimonial-card gsap-card">
              <div className="t-avatar a5" />
              <div className="t-content">
                <p>&ldquo;My team of three now handles the workload that used to require eight paralegals. The RAG-powered document search is incredibly accurate.&rdquo;</p>
                <div className="t-author"><strong>AMIRA B.</strong><span>Managing Partner, Law Firm</span></div>
              </div>
            </div>
            <div className="testimonial-card gsap-card">
              <div className="t-avatar a6" />
              <div className="t-content">
                <p>&ldquo;After my employer wrongfully terminated me, Lexis Law helped me understand my rights and draft a demand letter that led to a fair settlement.&rdquo;</p>
                <div className="t-author"><strong>THOMAS R.</strong><span>Software Engineer</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="landing-footer landing-band-full gsap-reveal">
        <div className="footer-content">
          <div className="footer-logo">LEXIS LAW</div>
          <div className="footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security & Compliance</span>
            <span>Regulatory Disclosures</span>
            <span>Contact Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
