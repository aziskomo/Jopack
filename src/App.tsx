/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  initializeDB, 
  getTenants, 
  getOperators, 
  getShops 
} from './lib/db';
import { UserSession, UserRole, Tenant } from './types';
import { 
  Box, 
  Users, 
  ShieldAlert, 
  CheckCircle, 
  FileVideo, 
  LogOut, 
  RefreshCw, 
  Database, 
  AlertCircle,
  HelpCircle,
  Lock,
  Sparkles,
  Server,
  ArrowRight,
  HardDrive
} from 'lucide-react';
import SheetsInspector from './components/SheetsInspector';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import CompanyAdminDashboard from './components/CompanyAdminDashboard';
import OperatorDashboard from './components/OperatorDashboard';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [activePortalTab, setActivePortalTab] = useState<'super' | 'company' | 'operator'>('company');

  // Load database on mount
  useEffect(() => {
    initializeDB();
    setLastUpdated(Date.now());
  }, []);

  const triggerDataRefresh = () => {
    setLastUpdated(Date.now());
  };

  const handleLogout = () => {
    setSession(null);
    triggerDataRefresh();
  };

  const handleQuickLogin = (role: UserRole, companyId: string, email: string = '') => {
    const tenants = getTenants();
    const ops = getOperators();

    if (role === 'SUPER_ADMIN') {
      setSession({
        role: 'SUPER_ADMIN',
        email: 'admin@rssolusi.com',
        company_id: 'GLOBAL',
        company_name: 'RS Solusi (Global Admin)'
      });
    } else if (role === 'COMPANY_ADMIN') {
      const tenant = tenants.find(t => t.company_id === companyId);
      if (tenant) {
        if (tenant.status !== 'ACTIVE') {
          alert(`Login Terblokir: Perusahaan "${tenant.company_name}" dinonaktifkan (INACTIVE) oleh Super Admin.`);
          return;
        }
        setSession({
          role: 'COMPANY_ADMIN',
          email: `admin@${tenant.company_name.toLowerCase().replace(/\s+/g, '')}.com`,
          company_id: companyId,
          company_name: tenant.company_name
        });
      }
    } else if (role === 'OPERATOR') {
      const op = ops.find(o => o.email === email);
      const tenant = tenants.find(t => t.company_id === op?.company_id);
      
      if (op && tenant) {
        if (tenant.status !== 'ACTIVE') {
          alert(`Login Terblokir: Toko tempat Anda bekerja (${tenant.company_name}) sedang ditangguhkan (INACTIVE) oleh Super Admin.`);
          return;
        }
        setSession({
          role: 'OPERATOR',
          email: op.email,
          company_id: op.company_id,
          company_name: tenant.company_name,
          operator_name: op.name
        });
      }
    }
    triggerDataRefresh();
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans select-none antialiased text-brand-ink">
      
      {/* Top Header Workspace */}
      <header className="bg-neutral-950/60 backdrop-blur-md border-b border-brand-line sticky top-0 z-40 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 border border-white/10">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold tracking-tight text-xl bg-gradient-to-r from-white via-neutral-100 to-purple-300 bg-clip-text text-transparent">JoPacking</span>
                <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-mono font-extrabold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm shadow-purple-500/30">MVP</span>
              </div>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wide uppercase">Workspace Backend Driver</span>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-4">
            
            {/* Live Synchronizer Info */}
            <div className="hidden sm:flex items-center gap-2.5 bg-neutral-900/60 border border-white/10 rounded-full px-4 py-2 text-[11px] font-mono text-neutral-300 backdrop-blur-xs">
              <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>G-SHEETS API: <span className="text-emerald-400 font-bold">ACTIVE</span></span>
              <button 
                onClick={triggerDataRefresh}
                className="text-purple-400 hover:text-purple-300 font-bold ml-1 cursor-pointer border-l border-white/10 pl-2 uppercase tracking-wider transition-colors"
                title="Force Sheet Reload"
              >
                RELOAD
              </button>
            </div>

            {/* User Session Profile Indicator */}
            {session ? (
              <div className="flex items-center gap-3 pl-3 border-l border-white/10">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-white leading-none block">
                      {session.operator_name || session.email.split('@')[0]}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                      {session.role.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 block mt-1 font-mono uppercase tracking-wider">
                    {session.company_name}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-xl transition-all cursor-pointer border border-white/10 bg-neutral-900/40"
                  title="Switch Role / Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-purple-300 font-mono uppercase tracking-wider">EVALUATION MODE ACTIVE</span>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {session ? (
          /* ACTIVE ROLE WORKSPACE VIEWPORT */
          <div>
            {session.role === 'SUPER_ADMIN' && (
              <SuperAdminDashboard onDataChange={triggerDataRefresh} lastUpdated={lastUpdated} />
            )}
            
            {session.role === 'COMPANY_ADMIN' && (
              <CompanyAdminDashboard 
                companyId={session.company_id} 
                companyName={session.company_name} 
                onDataChange={triggerDataRefresh} 
                lastUpdated={lastUpdated} 
              />
            )}
            
            {session.role === 'OPERATOR' && (
              <OperatorDashboard 
                operatorEmail={session.email}
                operatorName={session.operator_name || 'Operator'}
                companyId={session.company_id}
                companyName={session.company_name}
                onDataChange={triggerDataRefresh}
                lastUpdated={lastUpdated}
              />
            )}
          </div>
        ) : (
          /* HIGH FIDELITY MULTI-TENANT WORKSPACE PORTAL */
          <div className="max-w-4xl mx-auto space-y-10 py-6 animate-in fade-in duration-300">
            
            {/* Hero Brand Title */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold rounded-full font-mono uppercase shadow-lg shadow-purple-500/5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                <span>Premium SaaS Logistics Gateway</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight uppercase leading-tight text-white">
                SECURE PACKING PROOF VIA <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">GOOGLE WORKSPACE</span>
              </h1>
              <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
                Capture video evidence (max 100s) based on package tracking numbers (resi) to effortlessly settle claims. Connected instantly to secure Google Sheets & Drive API storage.
              </p>
            </div>

            {/* Quick-Access Scenarios Tutorial */}
            <div className="bg-gradient-to-br from-neutral-950 via-neutral-900 to-purple-950/40 text-neutral-200 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="space-y-3 max-w-xl">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
                  <Server className="w-4 h-4" />
                  <span>Interactive Verification Walkthrough</span>
                </div>
                <h3 className="font-display font-bold text-xl text-white">SOP & MVP Sandbox Checklist</h3>
                <ul className="text-xs sm:text-sm text-neutral-400 list-disc pl-5 space-y-2 font-sans">
                  <li><strong>BR-04 Quota enforcement:</strong> Access Operator <strong>Joko Widodo</strong> (CP002). Notice the instant warning alert: their 5/5 videos quota is fully exhausted!</li>
                  <li><strong>BR-03 Daily auto-delete:</strong> Log in as <strong>Super Admin</strong>. Click "Trigger Daily Cron" to purge files older than 21 days and unlock spent quotas in real-time.</li>
                  <li><strong>BR-01 Secure Multi-Tenancy:</strong> Switch between <strong>Sinar Ritel Utama</strong> and <strong>Gudang Berkah Mandiri</strong> to verify airtight tenant isolation.</li>
                </ul>
              </div>
              <div className="bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-xs space-y-3 shrink-0 w-full md:w-[240px] backdrop-blur-sm">
                <div className="flex items-center gap-2 font-bold text-white font-mono uppercase">
                  <Database className="w-4 h-4 text-pink-400" />
                  <span>Real-time Sync Info</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                  Open the floating <strong className="text-white">Sheets & Drive Engine</strong> at the bottom right to inspect the underlying Google account records.
                </p>
              </div>
            </div>

            {/* Portal login tabs block */}
            <div className="bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              
              {/* Login Tabs Selector */}
              <div className="flex bg-neutral-950/60 p-2 gap-1 border-b border-white/5">
                <button
                  onClick={() => setActivePortalTab('company')}
                  className={`flex-1 py-3.5 text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activePortalTab === 'company'
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white font-black border border-purple-500/30'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Company Admin</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActivePortalTab('operator')}
                  className={`flex-1 py-3.5 text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activePortalTab === 'operator'
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white font-black border border-purple-500/30'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Box className="w-4 h-4 text-indigo-400" />
                    <span>Warehouse Operator</span>
                  </div>
                </button>

                <button
                  onClick={() => setActivePortalTab('super')}
                  className={`flex-1 py-3.5 text-center font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                    activePortalTab === 'super'
                      ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white font-black border border-purple-500/30'
                      : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <Lock className="w-4 h-4 text-pink-400" />
                    <span>Super Admin</span>
                  </div>
                </button>
              </div>

              {/* Portal Tab Content Profiles */}
              <div className="p-6 sm:p-8 bg-transparent">
                
                {/* 1. Super Admin Tab */}
                {activePortalTab === 'super' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Platform Owner (RS Solusi)</h3>
                      <p className="text-xs text-neutral-400">Manage all tenant quotas, access global statistics, and execute background file storage cleanup (BR-03).</p>
                    </div>

                    <div className="border border-white/5 rounded-2xl p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all bg-neutral-950/40">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center border border-purple-500/20">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white uppercase block">Global Super Admin Console</span>
                          <span className="text-xs text-neutral-400 block font-mono">admin@rssolusi.com</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleQuickLogin('SUPER_ADMIN', 'GLOBAL')}
                        className="hd-button-primary flex items-center gap-1.5"
                      >
                        <span>Access Console</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. Company Admin Tab */}
                {activePortalTab === 'company' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Marketplace Merchant Admin Profiles</h3>
                      <p className="text-xs text-neutral-400">Monitor warehouse terminals, assign operators, allocate quotas, and audit digital video logs securely.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Company 1 */}
                      <div className="border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-purple-500/20 hover:bg-white/[0.01] transition-all bg-neutral-950/40">
                        <div className="space-y-2">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full font-mono">ACTIVE</span>
                          <h4 className="font-bold text-base text-white">Sinar Ritel Utama</h4>
                          <span className="text-xs text-neutral-400 block font-mono">ID: CP001</span>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-300 font-medium font-mono">
                            <HardDrive className="w-4 h-4 text-purple-400" />
                            <span>QUOTA: 6 / 200 USED</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickLogin('COMPANY_ADMIN', 'CP001')}
                          className="hd-button-primary w-full py-2.5 flex items-center justify-center gap-1.5"
                        >
                          <span>Manage Sinar Ritel</span>
                        </button>
                      </div>

                      {/* Company 2 (QUOTA LIMIT TEST CASE) */}
                      <div className="border border-purple-500/25 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:bg-purple-950/5 transition-all bg-purple-950/10">
                        <div className="space-y-2">
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full font-mono">QUOTA FULL</span>
                          <h4 className="font-bold text-base text-white">Gudang Berkah Mandiri</h4>
                          <span className="text-xs text-neutral-400 block font-mono">ID: CP002</span>
                          <div className="flex items-center gap-1.5 text-xs text-rose-400 font-bold font-mono uppercase">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            <span>Quota exhausted (5/5)</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickLogin('COMPANY_ADMIN', 'CP002')}
                          className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <span>Manage Berkah Mandiri</span>
                        </button>
                      </div>

                      {/* Company 3 (INACTIVE TEST CASE) */}
                      <div className="border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between opacity-70 hover:opacity-100 transition-all bg-neutral-950/20">
                        <div className="space-y-2">
                          <span className="bg-neutral-800 text-neutral-400 border border-neutral-700 text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full font-mono">INACTIVE</span>
                          <h4 className="font-bold text-base text-neutral-400">Batik Cantik Nusantara</h4>
                          <span className="text-xs text-neutral-500 block font-mono">ID: CP003</span>
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono uppercase">
                            <Lock className="w-4 h-4 text-neutral-500" />
                            <span>Suspended</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickLogin('COMPANY_ADMIN', 'CP003')}
                          className="w-full py-2.5 bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-850 text-xs font-bold rounded-xl cursor-not-allowed border border-white/5 transition-all"
                        >
                          Suspended Console
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Operator Tab */}
                {activePortalTab === 'operator' && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div>
                      <h3 className="font-display font-bold text-lg text-white">Warehouse Staff Operator Terminals</h3>
                      <p className="text-xs text-neutral-400">Activate portable scanning and recording consoles. Complete fast barcode scanner emulation and direct video upload.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Operator 1 */}
                      <div className="border border-white/5 rounded-2xl p-5 flex items-center justify-between hover:border-purple-500/20 hover:bg-white/[0.01] transition-all bg-neutral-950/40">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center font-bold text-sm border border-indigo-500/20 font-mono">
                            BS
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white block uppercase">Budi Santoso</span>
                            <span className="text-xs text-neutral-400 block font-sans">Sinar Ritel Utama (CP001)</span>
                            <span className="text-[10px] font-mono text-neutral-500 mt-1 block">budi@sinar.com</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickLogin('OPERATOR', 'CP001', 'budi@sinar.com')}
                          className="hd-button-primary px-4 py-2"
                        >
                          Activate
                        </button>
                      </div>

                      {/* Operator 2 (Quota enforcement demonstration case) */}
                      <div className="border border-purple-500/25 rounded-2xl p-5 flex items-center justify-between hover:bg-purple-950/5 transition-all bg-purple-950/10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center font-bold text-sm border border-amber-500/20 font-mono">
                            JW
                          </div>
                          <div>
                            <span className="font-bold text-sm text-white block uppercase">Joko Widodo</span>
                            <span className="text-xs text-amber-300 font-bold font-mono">GUDANG BERKAH (CP002)</span>
                            <span className="text-[10px] font-mono text-neutral-400 mt-1 block">joko@berkah.com</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickLogin('OPERATOR', 'CP002', 'joko@berkah.com')}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-95 transition-all border border-amber-500/30"
                        >
                          Activate
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        )}
      </main>

      {/* Floating G-Sheets & Google Drive Engine Inspector Console */}
      <SheetsInspector onRefreshTrigger={triggerDataRefresh} lastUpdated={lastUpdated} />

      {/* Portal Footer */}
      <footer className="bg-neutral-950 border-t border-white/5 py-8 mt-16 text-center text-xs text-neutral-400 font-mono shrink-0">
        <div className="max-w-7xl mx-auto px-4">
          <p className="tracking-wide">JoPacking Multi-Tenant SaaS Platform • Backed by Google Sheets Engine & Google Drive API • © 2026</p>
        </div>
      </footer>

    </div>
  );
}
