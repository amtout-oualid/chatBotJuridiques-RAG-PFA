import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  X,
  User,
  Filter,
} from 'lucide-react';
import { lawyerService } from '../services/authService';
import './LawyersPage.css';

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [specialite, setSpecialite] = useState('');
  const [region, setRegion] = useState('');

  const loadLawyers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (specialite.trim()) params.specialite = specialite;
      if (region.trim()) params.region = region;
      const res = await lawyerService.listLawyers(params);
      setLawyers(res.data.lawyers || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [specialite, region]);

  useEffect(() => {
    const timer = setTimeout(loadLawyers, 300);
    return () => clearTimeout(timer);
  }, [loadLawyers]);

  const handleSelect = async (lawyerId) => {
    setLoadingDetail(true);
    try {
      const res = await lawyerService.getLawyer(lawyerId);
      setSelected(res.data);
    } catch {
      /* ignore */
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="lawyers-page">
      {/* ── Header ── */}
      <header className="lawyers-header">
        <h1 className="lawyers-header__title">Annuaire des Avocats</h1>
        <div className="lawyers-filters">
          <div className="lawyers-filter">
            <Search size={14} />
            <input
              placeholder="Spécialité (ex: Droit des affaires)"
              value={specialite}
              onChange={(e) => setSpecialite(e.target.value)}
              id="filter-specialite"
            />
          </div>
          <div className="lawyers-filter">
            <MapPin size={14} />
            <input
              placeholder="Barreau / Région"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              id="filter-region"
            />
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="lawyers-content">
        {/* Grid */}
        <div className="lawyers-grid" id="lawyers-grid">
          {loading ? (
            <div className="lawyers-loading">
              <div className="spinner spinner--lg" />
            </div>
          ) : lawyers.length === 0 ? (
            <div className="lawyers-empty">
              <User size={40} opacity={0.3} />
              <p>Aucun avocat trouvé pour ces critères</p>
            </div>
          ) : (
            lawyers.map((lawyer) => (
              <div
                key={lawyer.id}
                className={`lawyer-card ${
                  selected?.id === lawyer.id ? 'lawyer-card--selected' : ''
                }`}
                onClick={() => handleSelect(lawyer.id)}
              >
                <div className="lawyer-card__avatar">
                  {(lawyer.prenom?.[0] || '') + (lawyer.nom?.[0] || '')}
                </div>
                <div className="lawyer-card__info">
                  <span className="lawyer-card__name">
                    {lawyer.prenom} {lawyer.nom}
                  </span>
                  {lawyer.specialite && (
                    <span className="lawyer-card__spec">{lawyer.specialite}</span>
                  )}
                  {lawyer.barreau && (
                    <span className="lawyer-card__location">
                      <MapPin size={12} /> {lawyer.barreau}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <aside className="lawyer-detail fade-in" id="lawyer-detail">
            <div className="lawyer-detail__header">
              <h2>Profil de l'Avocat</h2>
              <button onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>

            {loadingDetail ? (
              <div className="lawyers-loading">
                <div className="spinner" />
              </div>
            ) : (
              <div className="lawyer-detail__body">
                <div className="lawyer-detail__avatar">
                  {(selected.prenom?.[0] || '') + (selected.nom?.[0] || '')}
                </div>
                <h3 className="lawyer-detail__name">
                  {selected.prenom} {selected.nom}
                </h3>

                {selected.specialite && (
                  <span className="lawyer-detail__badge">
                    {selected.specialite}
                  </span>
                )}

                <div className="lawyer-detail__status">
                  <CheckCircle
                    size={14}
                    color={selected.disponible ? '#22c55e' : '#ef4444'}
                  />
                  {selected.disponible ? 'Disponible' : 'Indisponible'}
                </div>

                {selected.bio && (
                  <div className="lawyer-detail__section">
                    <h4>Bio</h4>
                    <p>{selected.bio}</p>
                  </div>
                )}

                <div className="lawyer-detail__contacts">
                  {selected.email && (
                    <div className="lawyer-detail__contact">
                      <Mail size={14} />
                      <span>{selected.email}</span>
                    </div>
                  )}
                  {selected.telephone && (
                    <div className="lawyer-detail__contact">
                      <Phone size={14} />
                      <span>{selected.telephone}</span>
                    </div>
                  )}
                  {selected.barreau && (
                    <div className="lawyer-detail__contact">
                      <MapPin size={14} />
                      <span>Barreau de {selected.barreau}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
