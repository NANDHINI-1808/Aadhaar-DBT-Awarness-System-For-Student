import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { ChevronRight, ChevronLeft, Upload, AlertCircle, CheckCircle } from 'lucide-react';

export const ProfileWizard: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUserWizardStatus } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [state, setState] = useState('');
  const [gender, setGender] = useState('MALE');
  const [phone, setPhone] = useState('');

  const [college, setCollege] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState(1);
  const [semester, setSemester] = useState(1);
  const [cgpa, setCgpa] = useState('');

  const [familyIncome, setFamilyIncome] = useState('');
  const [casteCertificatePath, setCasteCertificatePath] = useState('');
  const [casteCertificateName, setCasteCertificateName] = useState('');
  const [incomeCertificatePath, setIncomeCertificatePath] = useState('');
  const [incomeCertificateName, setIncomeCertificateName] = useState('');
  const [priorScholarshipHistory, setPriorScholarshipHistory] = useState('');

  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarSeedingStatus, setAadhaarSeedingStatus] = useState('NOT_SURE');

  // File upload state trackers
  const [casteUploading, setCasteUploading] = useState(false);
  const [incomeUploading, setIncomeUploading] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    // Load existing profile if any
    const loadProfile = async () => {
      try {
        const res = await fetch(`${backendUrl}/profile`);
        if (res.ok) {
          const p = await res.json();
          setName(p.name || '');
          setCategory(p.category || 'General');
          setState(p.state || '');
          setGender(p.gender || 'MALE');
          setPhone(p.phone || '');
          setCollege(p.college || '');
          setUniversity(p.university || '');
          setDepartment(p.department || '');
          setCourse(p.course || '');
          setYearOfStudy(p.yearOfStudy || 1);
          setSemester(p.semester || 1);
          setCgpa(p.cgpa ? String(p.cgpa) : '');
          setFamilyIncome(p.familyIncome ? String(p.familyIncome) : '');
          setCasteCertificatePath(p.casteCertificatePath || '');
          setCasteCertificateName(p.casteCertificateName || '');
          setIncomeCertificatePath(p.incomeCertificatePath || '');
          setIncomeCertificateName(p.incomeCertificateName || '');
          setPriorScholarshipHistory(p.priorScholarshipHistory || '');
          setBankName(p.bankName || '');
          setBankAccount(p.bankAccount || '');
          setAadhaar(p.aadhaarSet ? '************' : '');
          setAadhaarSeedingStatus(p.aadhaarSeedingStatus || 'NOT_SURE');
          
          if (p.currentWizardStep) {
            setStep(p.currentWizardStep);
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Handle files upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'caste' | 'income') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('document', file);

    if (type === 'caste') setCasteUploading(true);
    else setIncomeUploading(true);

    try {
      const res = await fetch(`${backendUrl}/profile/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'File upload failed');
      }

      const data = await res.json();
      if (type === 'caste') {
        setCasteCertificatePath(data.filepath);
        setCasteCertificateName(data.filename);
      } else {
        setIncomeCertificatePath(data.filepath);
        setIncomeCertificateName(data.filename);
      }
    } catch (err: any) {
      setError(err.message || 'Upload error');
    } finally {
      if (type === 'caste') setCasteUploading(false);
      else setIncomeUploading(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let bodyData: any = {};

    if (step === 1) {
      bodyData = { name, category, state, gender, phone };
    } else if (step === 2) {
      bodyData = {
        college,
        university,
        department,
        course,
        yearOfStudy: Number(yearOfStudy),
        semester: Number(semester),
        cgpa: Number(cgpa),
      };
    } else if (step === 3) {
      bodyData = {
        familyIncome: Number(familyIncome),
        casteCertificatePath,
        casteCertificateName,
        incomeCertificatePath,
        incomeCertificateName,
        priorScholarshipHistory,
      };
    } else if (step === 4) {
      bodyData = {
        bankName,
        bankAccount,
        aadhaar,
        aadhaarSeedingStatus,
      };
    }

    try {
      const res = await fetch(`${backendUrl}/profile/${step}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.errors) {
          throw new Error(data.errors[0]?.message || 'Validation error');
        }
        throw new Error(data.message || 'Update failed');
      }

      if (step < 4) {
        setStep(step + 1);
      } else {
        // Complete wizard
        updateUserWizardStatus(true);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: t('wizard.personal') },
    { num: 2, label: t('wizard.academic') },
    { num: 3, label: t('wizard.eligibility') },
    { num: 4, label: t('wizard.bank_dbt') },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Step Stepper Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className="h-full bg-govNavy transition-all duration-300"
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center relative">
          {stepsList.map((s) => (
            <div key={s.num} className="flex flex-col items-center space-y-2 flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition ${
                  step === s.num
                    ? 'border-govNavy bg-govNavy text-white'
                    : step > s.num
                    ? 'border-govGreen bg-govGreen text-white'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step === s.num ? 'text-govNavy' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main wizard forms */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-govNavy"></div>

        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-xl font-bold font-serifDisplay">
            {t('wizard.title')} — {t('wizard.step')} {step}/4
          </h3>
          {error && (
            <div className="bg-red-50 text-red-700 text-xs border border-red-200 px-3 py-1.5 rounded-lg flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleNext} className="space-y-6">
          {/* STEP 1: Personal */}
          {step === 1 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.name')}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.category')}</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="General">General / Open</option>
                  <option value="OBC">OBC (Other Backward Classes)</option>
                  <option value="SC">SC (Scheduled Caste)</option>
                  <option value="ST">ST (Scheduled Tribe)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.state')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tamil Nadu / Bihar / Delhi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.gender')}</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.phone')}</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Academic */}
          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.college')}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.university')}</label>
                <input
                  type="text"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.department')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science / Science"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.course')}</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Tech / B.Sc / Class 12"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.year')}</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={yearOfStudy}
                  onChange={(e) => setYearOfStudy(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.semester')}</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.cgpa')}</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={10}
                  required
                  placeholder="e.g. 8.2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Eligibility & Uploads */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.income')}</label>
                  <input
                    type="number"
                    required
                    placeholder="Annual Family income in Rs."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                    value={familyIncome}
                    onChange={(e) => setFamilyIncome(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.prior_history')}</label>
                  <input
                    type="text"
                    placeholder="e.g. None / State Pre-Matric 2024"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                    value={priorScholarshipHistory}
                    onChange={(e) => setPriorScholarshipHistory(e.target.value)}
                  />
                </div>
              </div>

              {/* Caste Cert Upload */}
              <div className="grid md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.caste_cert')}</label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer bg-govNavy hover:bg-[#071f3b] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{casteUploading ? 'Uploading...' : 'Choose File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, 'caste')}
                        className="hidden"
                      />
                    </label>
                    {casteCertificateName && (
                      <span className="text-xs text-govGreen font-semibold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{casteCertificateName}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Income Cert Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.income_cert')}</label>
                  <div className="flex items-center space-x-4">
                    <label className="cursor-pointer bg-govNavy hover:bg-[#071f3b] text-white px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center space-x-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{incomeUploading ? 'Uploading...' : 'Choose File'}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, 'income')}
                        className="hidden"
                      />
                    </label>
                    {incomeCertificateName && (
                      <span className="text-xs text-govGreen font-semibold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{incomeCertificateName}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Bank & DBT Seeding */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.bank_name')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. State Bank of India"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.bank_acc')}</label>
                  <input
                    type="text"
                    required
                    placeholder="Full account number (e.g. 3020192837)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.aadhaar_num')}</label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    placeholder="12-digit Aadhaar number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t('wizard.seeding_status')}</label>
                  <select
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm transition focus:bg-white"
                    value={aadhaarSeedingStatus}
                    onChange={(e) => setAadhaarSeedingStatus(e.target.value)}
                  >
                    <option value="YES">{t('wizard.seeding_yes')}</option>
                    <option value="NO">{t('wizard.seeding_no')}</option>
                    <option value="NOT_SURE">{t('wizard.seeding_not_sure')}</option>
                  </select>
                </div>
              </div>

              {/* Explainer for NOT SURE seeding status */}
              {aadhaarSeedingStatus === 'NOT_SURE' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-5 flex items-start space-x-3 text-xs leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-govSaffron shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-govNavy mb-1">NPCI Aadhaar Seeding Action Required</p>
                    <p>{t('wizard.not_sure_explainer')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stepper controls */}
          <div className="flex justify-between items-center pt-8 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center space-x-1.5 border border-slate-300 hover:bg-slate-50 px-5 py-2.5 rounded-lg text-xs font-bold transition text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t('wizard.prev')}</span>
              </button>
            ) : (
              <div></div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-1.5 bg-govNavy hover:bg-[#071f3b] text-white px-6 py-2.5 rounded-lg text-xs font-bold transition shadow-md disabled:opacity-50"
            >
              <span>{step === 4 ? t('wizard.submit') : t('wizard.next')}</span>
              {step < 4 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
