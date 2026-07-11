import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { Globe, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-govNavy text-white shadow-md relative z-40">
      {/* Accent stripes */}
      <div className="h-1 bg-govSaffron w-full"></div>
      <div className="h-1 bg-govGreen w-full"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Portal Branding */}
        <Link to="/" className="flex items-center space-x-3">
          {/* Ashoka Chakra Motif */}
          <svg
            className="w-10 h-10 text-govSaffron fill-current animate-[spin_60s_linear_infinite]"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="50" r="8" fill="currentColor" />
            {Array.from({ length: 24 }).map((_, index) => {
              const angle = (index * 360) / 24;
              return (
                <line
                  key={index}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  transform={`rotate(${angle} 50 50)`}
                />
              );
            })}
          </svg>
          <div>
            <h1 className="text-lg font-bold font-serifDisplay tracking-wide leading-tight text-white">
              {t('nav.title')}
            </h1>
            <p className="text-[10px] text-govSaffron tracking-wider font-semibold">
              Govt. of India • Ministry of Social Justice & Empowerment
            </p>
          </div>
        </Link>

        {/* Navigation Links & Options */}
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            {user ? (
              <>
                <Link to="/dashboard" className="hover:text-govSaffron transition">
                  {t('nav.dashboard')}
                </Link>
                <Link to="/wizard" className="hover:text-govSaffron transition">
                  {t('nav.wizard')}
                </Link>
                <Link to="/resources" className="hover:text-govSaffron transition">
                  {t('nav.resources')}
                </Link>
                {user.role === 'ADMIN' && (
                  <Link to="/admin" className="hover:text-govSaffron text-govSaffron font-semibold transition">
                    {t('nav.admin')}
                  </Link>
                )}
              </>
            ) : (
              <Link to="/resources" className="hover:text-govSaffron transition">
                {t('nav.resources')}
              </Link>
            )}
          </nav>

          {/* Lang Selector */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-xs border border-white/30 rounded px-2.5 py-1 hover:bg-white/10 transition"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{i18n.language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Login/Logout CTA */}
          {user ? (
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 bg-white/15 hover:bg-white/20 transition px-3 py-1.5 rounded text-xs font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('nav.logout')}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs bg-white text-govNavy font-semibold px-3.5 py-1.5 rounded hover:bg-govCream transition"
              >
                {t('nav.login')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
