import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { CheckSquare, Square, Calendar, Award, ShieldCheck, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Scholarship {
  id: string;
  name: string;
  provider: string;
  amount: number;
  endDate: string;
  startDate: string;
  description: string;
  eligibilityCriteria: string;
  minCgpa: number;
  maxIncome: number;
  eligibleCategories: string[];
  genderEligibility: string[];
  courseEligibility: string[];
  stateEligibility: string[];
  officialLink: string;
  procedure: string;
  renewalInfo: string;
  status: string;
  isEligible: boolean;
  reasons: string[];
  docsRequired: { documentType: string; description: string; status: 'UPLOADED' | 'MISSING' }[];
}

interface DBTStep {
  key: string;
  label: string;
  weight: number;
  completed: boolean;
}

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [dbtSteps, setDbtSteps] = useState<DBTStep[]>([]);
  const [dbtScore, setDbtScore] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Accordion details tracking
  const [expandedScholarshipId, setExpandedScholarshipId] = useState<string | null>(null);

  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  const loadDashboardData = async () => {
    try {
      // 1. Fetch eligible scholarships
      const schRes = await fetch(`${backendUrl}/scholarships/eligible`);
      if (schRes.ok) {
        const schData = await schRes.json();
        setScholarships(schData);
      }

      // 2. Fetch DBT seeding status
      const dbtRes = await fetch(`${backendUrl}/dbt/status`);
      if (dbtRes.ok) {
        const dbtData = await dbtRes.json();
        setDbtSteps(dbtData.steps || []);
        setDbtScore(dbtData.readinessScore || 0);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const toggleDBTStep = async (stepKey: string, currentCompleted: boolean) => {
    try {
      const res = await fetch(`${backendUrl}/dbt/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepKey, completed: !currentCompleted }),
      });

      if (res.ok) {
        // Reload statuses to update progress score
        loadDashboardData();
      }
    } catch (error) {
      console.error('Error toggling DBT step:', error);
    }
  };

  const toggleExpandScholarship = (id: string) => {
    if (expandedScholarshipId === id) {
      setExpandedScholarshipId(null);
    } else {
      setExpandedScholarshipId(id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-govNavy border-t-govSaffron rounded-full animate-spin"></div>
      </div>
    );
  }

  const eligibleCount = scholarships.filter(s => s.isEligible).length;
  const nearestDeadline = scholarships.length > 0 
    ? [...scholarships].sort((a,b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())[0]
    : null;

  // SVG parameters for readiness score progress ring
  const radius = 50;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (dbtScore / 100) * circumference;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-govNavy"></div>
        <div>
          <h2 className="text-2xl font-bold font-serifDisplay">
            {t('dashboard.title')}, {user?.name || 'Student'}!
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Track your government benefits and scholarship application eligibility from one secure panel.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-govCream border border-govGreen/20 text-govGreen px-3 py-1.5 rounded-lg text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Aadhaar Secured</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Metric 1: DBT Readiness Circle Ring */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center space-x-6 relative overflow-hidden">
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="transparent"
                stroke={dbtScore === 100 ? '#0F8B45' : '#FF9933'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute text-xl font-mono font-bold text-slate-800">
              {dbtScore}%
            </span>
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">{t('dashboard.dbt_score')}</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {t('dashboard.dbt_score_desc')}
            </p>
          </div>
        </div>

        {/* Metric 2: Eligible Scholarships Count */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center space-x-5 relative overflow-hidden">
          <div className="w-16 h-16 bg-govCream border border-govNavy/15 rounded-2xl flex items-center justify-center text-govNavy shrink-0 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-2xl font-bold block text-govNavy font-mono">{eligibleCount} / {scholarships.length}</span>
            <h4 className="font-bold text-sm text-slate-900 mt-0.5">{t('dashboard.eligible_schemes')}</h4>
            <p className="text-xs text-slate-500 mt-1">Schemes qualifying your academic and income details</p>
          </div>
        </div>

        {/* Metric 3: Upcoming Deadlines Summary */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex items-center space-x-5 relative overflow-hidden">
          <div className="w-16 h-16 bg-govCream border border-govSaffron/20 rounded-2xl flex items-center justify-center text-govSaffron shrink-0 shadow-inner">
            <Calendar className="w-8 h-8" />
          </div>
          <div className="overflow-hidden">
            {nearestDeadline ? (
              <>
                <span className="text-xs font-mono font-bold text-slate-950 truncate block">
                  {new Date(nearestDeadline.endDate).toLocaleDateString('en-IN')}
                </span>
                <h4 className="font-bold text-sm text-slate-900 truncate mt-0.5">{nearestDeadline.name}</h4>
                <p className="text-xs text-red-600 font-semibold mt-1">Nearest deadline approaches</p>
              </>
            ) : (
              <p className="text-xs text-slate-400">No active scholarship deadlines loaded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left column: Scholarship list */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold font-serifDisplay text-govNavy">Scholarship Schemes Matching Your Profile</h3>
          
          <div className="space-y-4">
            {scholarships.map((s) => (
              <div
                key={s.id}
                className={`bg-white rounded-2xl border transition shadow-sm overflow-hidden ${
                  s.isEligible ? 'border-slate-200' : 'border-slate-200 opacity-70'
                }`}
              >
                {/* Accordion Toggle Header */}
                <div
                  onClick={() => toggleExpandScholarship(s.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        s.isEligible ? 'bg-govGreen/10 text-govGreen' : 'bg-red-50 text-red-600'
                      }`}>
                        {s.isEligible ? 'Eligible' : 'Not Eligible'}
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                        {s.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-base">{s.name}</h4>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="font-mono text-sm font-bold text-govNavy bg-govCream px-2.5 py-1 rounded">
                      ₹{s.amount.toLocaleString('en-IN')}
                    </span>
                    {expandedScholarshipId === s.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedScholarshipId === s.id && (
                  <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-6 text-xs leading-relaxed">
                    {/* Top Level Description */}
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-govNavy uppercase tracking-wider">Description</h5>
                      <p className="text-slate-600 text-sm leading-relaxed">{s.description}</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 bg-white p-5 rounded-xl border border-slate-200 shadow-inner">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Provider</span>
                        <span className="font-semibold text-slate-800">{s.provider}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Annual Income Limit</span>
                        <span className="font-semibold text-slate-800">
                          {s.maxIncome ? `₹${s.maxIncome.toLocaleString('en-IN')}` : 'No Limit'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Min CGPA / Marks</span>
                        <span className="font-semibold text-slate-800">{s.minCgpa} CGPA</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">State Eligibility</span>
                        <span className="font-semibold text-slate-800">{s.stateEligibility?.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Course Scope</span>
                        <span className="font-semibold text-slate-800">{s.courseEligibility?.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Categories</span>
                        <span className="font-semibold text-slate-800">{s.eligibleCategories?.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Gender</span>
                        <span className="font-semibold text-slate-800">{s.genderEligibility?.join(', ')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Start Date</span>
                        <span className="font-semibold text-slate-800">
                          {s.startDate ? new Date(s.startDate).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">End Date / Deadline</span>
                        <span className="font-semibold text-red-600">
                          {s.endDate ? new Date(s.endDate).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Eligibility details */}
                    <div className="space-y-1.5">
                      <h5 className="text-xs font-bold text-govNavy uppercase tracking-wider">Eligibility Engine Criteria</h5>
                      <p className="text-slate-600 font-medium italic">{s.eligibilityCriteria}</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-500 mt-2">
                        {s.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Application Procedure & Renewal info */}
                    <div className="grid md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-govNavy uppercase tracking-wider">Application Procedure</h5>
                        <p className="text-slate-600">{s.procedure}</p>
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-govNavy uppercase tracking-wider">Renewal Information</h5>
                        <p className="text-slate-600">{s.renewalInfo}</p>
                      </div>
                    </div>

                    {/* Required documents check */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-govNavy uppercase tracking-wider">Required Seeding & Upload Checklist:</h5>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {s.docsRequired.map((doc, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
                            <div>
                              <p className="font-bold text-slate-800 text-[11px]">{doc.documentType}</p>
                              <p className="text-[10px] text-slate-400 leading-normal">{doc.description}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              doc.status === 'UPLOADED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                            }`}>
                              {doc.status === 'UPLOADED' ? 'Uploaded' : 'Missing'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Call to Action to Apply */}
                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      
                      {s.isEligible && (
                        <a
                          href={s.officialLink || 'https://scholarships.gov.in'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-govNavy hover:bg-[#071f3b] text-white px-5 py-2.5 rounded-lg font-bold transition shadow-md text-xs"
                        >
                          {t('dashboard.apply_nsp')}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Seeding status checklist */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold font-serifDisplay text-govNavy">{t('dashboard.checklist_title')}</h3>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-govSaffron"></div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('dashboard.checklist_desc')}
            </p>

            <div className="space-y-3.5 pt-2">
              {dbtSteps.map((step) => (
                <div
                  key={step.key}
                  onClick={() => toggleDBTStep(step.key, step.completed)}
                  className="flex items-start space-x-3.5 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                >
                  <button className="text-govNavy shrink-0 mt-0.5 focus:outline-none">
                    {step.completed ? (
                      <CheckSquare className="w-5 h-5 text-govGreen fill-govGreen/10" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-300" />
                    )}
                  </button>
                  <div>
                    <p className={`text-xs font-bold leading-normal ${step.completed ? 'text-govGreen line-through' : 'text-slate-800'}`}>
                      {step.label}
                    </p>
                    <span className="text-[10px] text-slate-400">Contribution to score: {step.weight}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* General Seeding info help */}
            <div className="bg-govCream p-4 rounded-xl border border-slate-200 mt-4 text-[11px] text-slate-600 flex items-start space-x-2 leading-relaxed">
              <HelpCircle className="w-4 h-4 text-govNavy shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-govNavy mb-0.5">Need Forms?</p>
                <p>You can download the NPCI consent form from our <a href="/resources" className="text-govSaffron font-bold hover:underline">Awareness Center</a>, fill it out, and submit it directly to your bank teller.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
