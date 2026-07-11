import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Database, Award, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-16 pb-20">
      {/* 1. Hero Section */}
      <section className="bg-gradient-to-b from-govNavy to-[#081f3b] text-white py-20 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="bg-govSaffron/20 text-govSaffron font-semibold text-xs uppercase px-3 py-1 rounded-full border border-govSaffron/30 inline-block tracking-wide">
            National Civic Awareness Portal
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold font-serifDisplay leading-tight text-white">
            {t('landing.hero_title')}
          </h2>
          <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            {t('landing.hero_subtitle')}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              to="/register"
              className="bg-govSaffron hover:bg-[#e08528] text-govNavy font-bold px-7 py-3.5 rounded-lg shadow-lg hover:shadow-xl transition flex items-center space-x-2 text-sm w-full sm:w-auto justify-center"
            >
              <span>{t('landing.get_started')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/resources"
              className="border border-white/30 hover:bg-white/10 text-white font-semibold px-7 py-3.5 rounded-lg transition text-sm w-full sm:w-auto justify-center flex items-center"
            >
              {t('landing.learn_more')}
            </Link>
          </div>
        </div>

        {/* Dynamic Background SVG lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="0" y1="100" x2="100%" y2="500" stroke="white" strokeWidth="2" />
            <line x1="0" y1="300" x2="100%" y2="100" stroke="white" strokeWidth="1" />
          </svg>
        </div>
      </section>

      {/* 2. Visual Comparison Block (Address Delivery Analogy) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h3 className="text-3xl font-bold">{t('landing.compare_title')}</h3>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed">
            {t('landing.compare_subtitle')}
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">
          {/* Linked Account Card */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden transition-card hover:shadow-md">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-govSaffron"></div>
            <div className="flex items-center space-x-3 text-govSaffron">
              <AlertCircle className="w-8 h-8" />
              <h4 className="text-xl font-bold font-serifDisplay text-slate-900">
                {t('landing.linked_card_title')}
              </h4>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t('landing.linked_card_desc')}
            </p>
            <div className="bg-govCream rounded-xl p-4 border border-govSaffron/20 flex items-start space-x-3">
              <span className="text-xs bg-govSaffron/10 text-govSaffron font-bold px-2 py-0.5 rounded mt-0.5">
                Analogy
              </span>
              <p className="text-xs text-slate-700 leading-normal">
                Like the post office knowing you live in the village, but without knowing your exact street name and house number. The package sits at the hub.
              </p>
            </div>
            {/* Visual Mini-Diagram */}
            <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs font-mono text-slate-500 bg-slate-50">
              Aadhaar Database ──► [Bank Account (Identity Linked Only)] ──❌ [Disbursement Stalled]
            </div>
          </div>

          {/* Seeded Account Card */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden transition-card hover:shadow-md">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-govGreen"></div>
            <div className="flex items-center space-x-3 text-govGreen">
              <CheckCircle2 className="w-8 h-8" />
              <h4 className="text-xl font-bold font-serifDisplay text-slate-900">
                {t('landing.seeded_card_title')}
              </h4>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t('landing.seeded_card_desc')}
            </p>
            <div className="bg-govCream rounded-xl p-4 border border-govGreen/20 flex items-start space-x-3">
              <span className="text-xs bg-govGreen/10 text-govGreen font-bold px-2 py-0.5 rounded mt-0.5">
                Analogy
              </span>
              <p className="text-xs text-slate-700 leading-normal">
                Like updating your complete home address directly in the postman's routing logs. The postman delivers the package directly to your doorstep.
              </p>
            </div>
            {/* Visual Mini-Diagram */}
            <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs font-mono text-slate-500 bg-slate-50">
              Aadhaar Database ──► [NPCI Mapper Server] ──► [Specific Active Bank Account] ──✅ [DBT Successful]
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust Badges Section */}
      <section className="bg-white border-y border-slate-200 py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-3 mb-12">
            <h3 className="text-2xl font-bold text-govNavy">
              {t('landing.badge_sec_title')}
            </h3>
            <p className="text-sm text-slate-500">
              A platform built around absolute privacy and transparency.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Badge 1 */}
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="w-12 h-12 bg-govCream border border-govSaffron/20 rounded-2xl flex items-center justify-center text-govSaffron shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t('landing.badge1_title')}</h4>
              <p className="text-slate-600 text-xs leading-relaxed max-w-xs">
                {t('landing.badge1_desc')}
              </p>
            </div>

            {/* Badge 2 */}
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="w-12 h-12 bg-govCream border border-govNavy/20 rounded-2xl flex items-center justify-center text-govNavy shadow-sm">
                <Database className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t('landing.badge2_title')}</h4>
              <p className="text-slate-600 text-xs leading-relaxed max-w-xs">
                {t('landing.badge2_desc')}
              </p>
            </div>

            {/* Badge 3 */}
            <div className="flex flex-col items-center text-center p-6 space-y-4">
              <div className="w-12 h-12 bg-govCream border border-govGreen/20 rounded-2xl flex items-center justify-center text-govGreen shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-lg text-slate-900">{t('landing.badge3_title')}</h4>
              <p className="text-slate-600 text-xs leading-relaxed max-w-xs">
                {t('landing.badge3_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Awareness Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-govNavy rounded-3xl p-8 md:p-12 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-lg">
          <div className="space-y-4 max-w-xl">
            <h3 className="text-2xl md:text-3xl font-bold font-serifDisplay">
              Are you an educator or Gram Panchayat representative?
            </h3>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-light">
              Download our printable A4 awareness poster to put up on notice boards, school hallways, or local cyber cafés to educate first-generation students.
            </p>
          </div>
          <Link
            to="/resources"
            className="bg-govSaffron hover:bg-[#e08528] text-govNavy font-bold px-6 py-3.5 rounded-xl shadow-md transition text-sm flex items-center space-x-2 whitespace-nowrap"
          >
            <span>Visit Awareness Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
