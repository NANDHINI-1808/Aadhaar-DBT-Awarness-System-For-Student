import React, { useState } from 'react';
import { Download, AlertTriangle, CheckCircle, FileText, Info } from 'lucide-react';

export const Resources: React.FC = () => {
  const [downloading, setDownloading] = useState(false);
  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  const triggerPosterDownload = async () => {
    setDownloading(true);
    try {
      window.open(`${backendUrl}/resources/poster`, '_blank');
    } catch (err) {
      console.error('Error downloading poster:', err);
    } finally {
      setDownloading(false);
    }
  };

  const mistakes = [
    { title: 'Choosing "Aadhaar Link" only', desc: 'Confirm with the bank clerk that they enable the "NPCI Seeding / DBT Mapper" option, not just standard linking for KYC verification.' },
    { title: 'Seeding multiple accounts', desc: 'NPCI mapper only supports ONE active seeded bank account at a time. If you seed a new bank, benefits automatically route to the latest mapped account.' },
    { title: 'Inactive bank accounts', desc: 'Ensure the bank account you seed is active. Accounts frozen due to low balance or KYC expiration will reject DBT transfers.' }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h2 className="text-3xl font-bold font-serifDisplay">Awareness Center</h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Access circular guides, diagrams, and printouts designed to educate students about direct benefits mapping.
        </p>
      </div>

      {/* Printable Poster Action Section */}
      <div className="bg-govNavy rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row justify-between items-center gap-8 shadow-md relative overflow-hidden">
        {/* Accent stripes */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-govSaffron"></div>
        <div className="absolute top-1 left-0 right-0 h-1 bg-govGreen"></div>

        <div className="space-y-4 max-w-xl">
          <span className="bg-govGreen/20 text-govGreen border border-govGreen/30 text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full inline-block">
            Gram Panchayat notice board print
          </span>
          <h3 className="text-2xl font-bold font-serifDisplay">Printable Notice Board Poster (PDF)</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Download a high-contrast, informative A4 poster explaining Aadhaar Seeding steps and the difference between linking and seeding. Ideal for notices, cyber cafés, and libraries.
          </p>
        </div>

        <button
          onClick={triggerPosterDownload}
          disabled={downloading}
          className="bg-govSaffron hover:bg-[#e08528] text-govNavy font-bold px-6 py-3.5 rounded-xl shadow-md transition text-xs flex items-center space-x-2 whitespace-nowrap disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{downloading ? 'Generating PDF...' : 'Download Poster PDF'}</span>
        </button>
      </div>

      {/* Explainers cards grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Card 1 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-govNavy">
            <Info className="w-6 h-6" />
            <h4 className="font-bold text-base font-serifDisplay text-slate-900">What is Aadhaar Seeding?</h4>
          </div>
          <p className="text-slate-600 text-xs leading-relaxed">
            Aadhaar Seeding is a process where your bank links your Aadhaar to the Central NPCI (National Payments Corporation of India) mapper. When the government issues scholarship funds to your 12-digit Aadhaar ID, the NPCI server checks which bank account is active for DBT transfers and sends the money there.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2.5 text-govNavy">
            <FileText className="w-6 h-6" />
            <h4 className="font-bold text-base font-serifDisplay text-slate-900">Required Documents Checklist</h4>
          </div>
          <ul className="text-slate-600 text-xs space-y-2">
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-3.5 h-3.5 text-govGreen shrink-0 mt-0.5" />
              <span>Copy of Aadhaar Card (Self-Attested)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-3.5 h-3.5 text-govGreen shrink-0 mt-0.5" />
              <span>Latest Bank Passbook photocopy (first page)</span>
            </li>
            <li className="flex items-start space-x-2">
              <CheckCircle className="w-3.5 h-3.5 text-govGreen shrink-0 mt-0.5" />
              <span>Signed NPCI Aadhaar Mapping Consent Form</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Common Mistakes Section */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 text-govNavy">
          <AlertTriangle className="w-6 h-6 text-govSaffron" />
          <h4 className="text-lg font-bold font-serifDisplay">Common Seeding Failures to Avoid</h4>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {mistakes.map((m, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h5 className="font-bold text-sm text-slate-900">{m.title}</h5>
              <p className="text-slate-600 text-xs leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
