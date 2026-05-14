import { useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import {
  MessageSquare,
  FileText,
  Scale,
  Database,
  Shield,
  Zap,
  ArrowRight,
  Check,
} from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'Assistant IA Juridique',
    desc: 'Posez vos questions juridiques et recevez des réponses précises basées sur le droit marocain et francophone.',
    dark: true,
  },
  {
    icon: Database,
    title: 'Base Documentaire RAG',
    desc: 'Téléchargez vos documents juridiques. Notre IA les indexe et les utilise comme contexte pour des réponses ultra-précises.',
    dark: false,
  },
  {
    icon: FileText,
    title: 'Éditeur LaTeX Intelligent',
    desc: 'Générez des contrats, NDA et documents légaux à partir de modèles professionnels avec assistance IA intégrée.',
    dark: false,
  },
  {
    icon: Scale,
    title: 'Annuaire d\'Avocats',
    desc: 'Trouvez l\'avocat spécialisé qu\'il vous faut, filtré par spécialité, barreau et disponibilité.',
    dark: true,
  },
];

const CHECKS = [
  'Droit marocain & francophone',
  'Recherche sémantique avancée',
  'Documents LaTeX professionnels',
  'Sécurité de niveau entreprise',
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <header className="landing__nav">
        <div className="landing__nav-inner">
          <div className="landing__brand">
            <span className="landing__brand-icon">⚖</span>
            <span className="landing__brand-text">Lexis AI</span>
          </div>
          <nav className="landing__nav-links">
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
          </nav>
          <div className="landing__nav-actions">
            <SignedOut>
              <button
                className="landing__btn landing__btn--ghost"
                onClick={() => navigate('/sign-in')}
                id="nav-sign-in"
              >
                Connexion
              </button>
              <button
                className="landing__btn landing__btn--primary"
                onClick={() => navigate('/sign-up')}
                id="nav-sign-up"
              >
                Commencer gratuitement
              </button>
            </SignedOut>
            <SignedIn>
              <button
                className="landing__btn landing__btn--primary"
                onClick={() => navigate('/chat')}
                id="nav-dashboard"
              >
                Dashboard <ArrowRight size={16} />
              </button>
            </SignedIn>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing__hero">
        <div className="landing__hero-inner">
          <span className="landing__badge">INTELLIGENCE JURIDIQUE</span>
          <h1 className="landing__hero-title">
            L'IA au service<br />du droit
          </h1>
          <p className="landing__hero-sub">
            Recherche juridique intelligente, génération de documents et
            assistance professionnelle — tout en un seul outil.
          </p>
          <div className="landing__hero-actions">
            <SignedOut>
              <button
                className="landing__btn landing__btn--primary landing__btn--lg"
                onClick={() => navigate('/sign-up')}
                id="hero-cta"
              >
                Essayer Lexis AI <ArrowRight size={18} />
              </button>
              <button
                className="landing__btn landing__btn--ghost landing__btn--lg"
                onClick={() => navigate('/sign-in')}
                id="hero-login"
              >
                Se connecter
              </button>
            </SignedOut>
            <SignedIn>
              <button
                className="landing__btn landing__btn--primary landing__btn--lg"
                onClick={() => navigate('/chat')}
              >
                Accéder au Dashboard <ArrowRight size={18} />
              </button>
            </SignedIn>
          </div>
          <div className="landing__checks">
            {CHECKS.map((item) => (
              <span key={item} className="landing__check">
                <Check size={14} /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Bento Grid ── */}
      <section className="landing__features" id="features">
        <div className="landing__features-inner">
          <span className="landing__badge">FONCTIONNALITÉS</span>
          <h2 className="landing__section-title">
            Tout ce dont vous avez besoin<br />pour votre pratique juridique
          </h2>
          <div className="landing__bento">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={`landing__card ${f.dark ? 'landing__card--dark' : ''}`}
              >
                <div className="landing__card-icon">
                  <f.icon size={24} />
                </div>
                <h3 className="landing__card-title">{f.title}</h3>
                <p className="landing__card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="landing__stats">
        <div className="landing__stats-inner">
          <div className="landing__stat">
            <span className="landing__stat-num">98%</span>
            <span className="landing__stat-label">Précision des réponses</span>
          </div>
          <div className="landing__stat">
            <span className="landing__stat-num">10x</span>
            <span className="landing__stat-label">Plus rapide que la recherche manuelle</span>
          </div>
          <div className="landing__stat">
            <span className="landing__stat-num">500+</span>
            <span className="landing__stat-label">Modèles juridiques disponibles</span>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing__cta" id="pricing">
        <div className="landing__cta-inner">
          <div className="landing__cta-badges">
            <Shield size={18} /> <Zap size={18} />
          </div>
          <h2 className="landing__cta-title">
            Prêt à transformer votre pratique juridique ?
          </h2>
          <p className="landing__cta-sub">
            Rejoignez les professionnels qui font confiance à Lexis AI.
          </p>
          <SignedOut>
            <button
              className="landing__btn landing__btn--white landing__btn--lg"
              onClick={() => navigate('/sign-up')}
              id="cta-final"
            >
              Commencer gratuitement <ArrowRight size={18} />
            </button>
          </SignedOut>
          <SignedIn>
            <button
              className="landing__btn landing__btn--white landing__btn--lg"
              onClick={() => navigate('/chat')}
            >
              Accéder au Dashboard <ArrowRight size={18} />
            </button>
          </SignedIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <span>© 2026 Lexis AI. Tous droits réservés.</span>
          <span className="landing__footer-credit">PFA — ChatBot Juridique RAG</span>
        </div>
      </footer>
    </div>
  );
}
