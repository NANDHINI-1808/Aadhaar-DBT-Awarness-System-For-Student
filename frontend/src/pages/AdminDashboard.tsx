import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';

interface AdminStats {
  totalStudents: number;
  dbtReadyCount: number;
  dbtReadinessPercentage: number;
  seedingStatusCounts: { YES: number; NO: number; NOT_SURE: number };
  collegeBreakdowns: Record<string, { total: number; ready: number }>;
  departmentBreakdowns: Record<string, { total: number; ready: number }>;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const backendUrl = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const res = await fetch(`${backendUrl}/admin/stats`);
        if (!res.ok) {
          throw new Error('Access denied or server error loading admin statistics.');
        }
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Error occurred.');
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-govNavy border-t-govSaffron rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-red-200 text-center space-y-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
        <h4 className="text-xl font-bold font-serifDisplay text-slate-900">Administrator Access Required</h4>
        <p className="text-xs text-slate-500">{error || 'Unable to retrieve portal metrics.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden flex justify-between items-center">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-govSaffron"></div>
        <div>
          <h2 className="text-2xl font-bold font-serifDisplay">College & NGO Officers Dashboard</h2>
          <p className="text-xs text-slate-500 mt-1">
            Overview metrics tracking student registration, document uploading, and Aadhaar DBT seeding statuses.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-1">
          <span className="text-2xl font-bold block text-slate-900 font-mono">{stats.totalStudents}</span>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Total Students</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-1">
          <span className="text-2xl font-bold block text-govGreen font-mono">{stats.dbtReadyCount}</span>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">DBT-Ready Enrolled</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-1">
          <span className="text-2xl font-bold block text-govNavy font-mono">{stats.dbtReadinessPercentage}%</span>
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">% Overall DBT Readiness</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
          <div className="flex justify-between text-xs text-slate-600 font-semibold">
            <span>YES: {stats.seedingStatusCounts.YES}</span>
            <span>NO: {stats.seedingStatusCounts.NO}</span>
            <span>NOT SURE: {stats.seedingStatusCounts.NOT_SURE}</span>
          </div>
          <span className="text-xs text-slate-400 block">Bank Seeding Distribution</span>
        </div>
      </div>

      {/* Breakdowns table */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* College Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-lg font-serifDisplay text-govNavy">Registration by Institution</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3">College Name</th>
                  <th className="pb-3 text-center">Total Students</th>
                  <th className="pb-3 text-center">DBT Ready Count</th>
                  <th className="pb-3 text-right">Readiness %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Object.entries(stats.collegeBreakdowns).map(([name, breakdown]) => {
                  const pct = breakdown.total > 0 ? Math.round((breakdown.ready / breakdown.total) * 100) : 0;
                  return (
                    <tr key={name} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 text-slate-900">{name}</td>
                      <td className="py-3.5 text-center text-slate-600">{breakdown.total}</td>
                      <td className="py-3.5 text-center text-govGreen">{breakdown.ready}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-govNavy">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h4 className="font-bold text-lg font-serifDisplay text-govNavy">Registration by Department</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Department</th>
                  <th className="pb-3 text-center">Total Students</th>
                  <th className="pb-3 text-center">DBT Ready Count</th>
                  <th className="pb-3 text-right">Readiness %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {Object.entries(stats.departmentBreakdowns).map(([name, breakdown]) => {
                  const pct = breakdown.total > 0 ? Math.round((breakdown.ready / breakdown.total) * 100) : 0;
                  return (
                    <tr key={name} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 text-slate-900">{name}</td>
                      <td className="py-3.5 text-center text-slate-600">{breakdown.total}</td>
                      <td className="py-3.5 text-center text-govGreen">{breakdown.ready}</td>
                      <td className="py-3.5 text-right font-mono font-bold text-govNavy">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
