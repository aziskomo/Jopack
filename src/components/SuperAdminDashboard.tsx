/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  getTenants, 
  getLogs, 
  addTenant, 
  updateTenantQuota, 
  updateTenantStatus, 
  runAutoDeleteCron, 
  CronReport 
} from '../lib/db';
import { Tenant, TenantStatus } from '../types';
import { 
  Users, 
  Video, 
  HardDrive, 
  Calendar, 
  Sliders, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Plus, 
  Trash2, 
  Clock, 
  Info,
  ChevronRight,
  UserX,
  UserCheck
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface SuperAdminDashboardProps {
  onDataChange: () => void;
  lastUpdated: number;
}

export default function SuperAdminDashboard({ onDataChange, lastUpdated }: SuperAdminDashboardProps) {
  const tenants = getTenants();
  const logs = getLogs();

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantQuota, setNewTenantQuota] = useState(100);
  
  // Selected tenant for quota adjustment
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [editQuotaValue, setEditQuotaValue] = useState<number>(100);

  // Cron execution results
  const [cronReport, setCronReport] = useState<CronReport | null>(null);
  const [showCronResult, setShowCronResult] = useState(false);
  const [isRunningCron, setIsRunningCron] = useState(false);

  // --- CALCULATE SCORECARDS (Spec 5.1) ---
  const activeTenantsCount = tenants.filter(t => t.status === 'ACTIVE').length;
  const totalVideosStored = logs.filter(l => l.status === 'READY').length;
  const totalFileSizeMb = logs.filter(l => l.status === 'READY').reduce((sum, l) => sum + l.file_size_mb, 0);
  
  // Transactions today (or in last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const transactionsToday = logs.filter(l => new Date(l.created_at) >= oneDayAgo).length;

  // --- CHART DATA PREPARATION ---
  // Trend chart of last 7 days (Order vs Return)
  const getTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(dateStr => {
      const dayLogs = logs.filter(l => l.created_at.startsWith(dateStr));
      const orders = dayLogs.filter(l => l.type === 'ORDER').length;
      const returns = dayLogs.filter(l => l.type === 'RETURN').length;
      
      // Formatting date label
      const dateObj = new Date(dateStr);
      const label = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

      return {
        date: label,
        'Paket Keluar (ORDER)': orders,
        'Paket Retur (RETURN)': returns,
      };
    });
  };

  const trendData = getTrendData();

  // Tenant Quota chart for visual representation
  const getPieData = () => {
    return tenants.map(t => ({
      name: t.company_name,
      value: t.video_used
    })).filter(t => t.value > 0);
  };

  const pieData = getPieData();
  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Handle Tenant additions
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    addTenant(newTenantName.trim(), newTenantQuota);
    setNewTenantName('');
    setNewTenantQuota(100);
    setShowAddModal(false);
    onDataChange();
  };

  // Handle Tenant Quota edits
  const handleSaveQuota = (companyId: string) => {
    updateTenantQuota(companyId, editQuotaValue);
    setEditingTenantId(null);
    onDataChange();
  };

  // Handle status toggle
  const handleToggleStatus = (companyId: string, currentStatus: TenantStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateTenantStatus(companyId, nextStatus);
    onDataChange();
  };

  // Handle Cron Simulation (BR-03)
  const triggerCron = () => {
    setIsRunningCron(true);
    setCronReport(null);
    
    // Simulate slight network delay
    setTimeout(() => {
      const report = runAutoDeleteCron();
      setCronReport(report);
      setIsRunningCron(false);
      setShowCronResult(true);
      onDataChange();
    }, 1200);
  };

  // Filtered Tenants List
  const filteredTenants = tenants.filter(t => 
    t.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.company_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* SaaS Dashboard Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0B0915]/90 p-6 rounded-3xl border border-white/5 shadow-2xl gap-4 backdrop-blur-lg relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/10 text-purple-300 text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border border-purple-500/20 font-mono tracking-wider">
              Super Admin Console
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2 font-display">RS Solusi Global Hub</h1>
          <p className="text-xs text-neutral-400 mt-1">Monitoring multi-tenant quota, transactions, and daily auto-delete tasks.</p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex flex-wrap gap-3 z-10">
          <button
            id="btn-trigger-cron"
            onClick={triggerCron}
            disabled={isRunningCron}
            className={`flex items-center gap-2 px-5 py-3 border font-mono text-xs shadow-lg transition-all cursor-pointer rounded-xl ${
              isRunningCron 
                ? 'bg-neutral-900 text-neutral-500 border-white/5 cursor-not-allowed'
                : 'bg-neutral-900/60 hover:bg-neutral-800 text-neutral-200 border-white/5 font-semibold'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 text-purple-400 ${isRunningCron ? 'animate-spin' : ''}`} />
            <span>{isRunningCron ? 'RUNNING CRON...' : 'TRIGGER DAILY CRON'}</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="hd-button-primary"
          >
            <Plus className="w-4 h-4" />
            <span>REGISTER NEW TENANT</span>
          </button>
        </div>
      </div>

      {/* 5.1 Looker Studio Global View Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Tenants */}
        <div className="bg-[#0B0915]/90 p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between backdrop-blur-lg hover:border-purple-500/20 transition-all group">
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block font-mono">
              Total Active Tenant
            </span>
            <span className="text-2xl font-black font-mono tracking-tight text-white block mt-1.5">
              {activeTenantsCount} <span className="text-xs text-neutral-400 font-normal">/ {tenants.length}</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              All systems operational
            </span>
          </div>
          <div className="p-3.5 bg-purple-500/10 text-purple-300 rounded-xl border border-purple-500/20 group-hover:scale-105 transition-all">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Videos Stored */}
        <div className="bg-[#0B0915]/90 p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between backdrop-blur-lg hover:border-purple-500/20 transition-all group">
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block font-mono">
              Total Videos Stored
            </span>
            <span className="text-2xl font-black font-mono tracking-tight text-white block mt-1.5">
              {totalVideosStored}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono uppercase flex items-center gap-1 mt-2">
              <span>Flat-Table Logs count</span>
            </span>
          </div>
          <div className="p-3.5 bg-pink-500/10 text-pink-300 rounded-xl border border-pink-500/20 group-hover:scale-105 transition-all">
            <Video className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total File Size */}
        <div className="bg-[#0B0915]/90 p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between backdrop-blur-lg hover:border-purple-500/20 transition-all group">
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block font-mono">
              Total File Size (MB)
            </span>
            <span className="text-2xl font-black font-mono tracking-tight text-white block mt-1.5">
              {totalFileSizeMb.toFixed(1)} <span className="text-xs text-neutral-400 font-normal">MB</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono uppercase flex items-center gap-1 mt-2">
              <span>Compressed Drive Files</span>
            </span>
          </div>
          <div className="p-3.5 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/20 group-hover:scale-105 transition-all">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Transactions Today */}
        <div className="bg-[#0B0915]/90 p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between backdrop-blur-lg hover:border-purple-500/20 transition-all group">
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider block font-mono">
              Transactions (24H)
            </span>
            <span className="text-2xl font-black font-mono tracking-tight text-white block mt-1.5">
              {transactionsToday}
            </span>
            <span className="text-[10px] text-purple-300 font-mono uppercase flex items-center gap-1 mt-2">
              <span>Real-time packing feeds</span>
            </span>
          </div>
          <div className="p-3.5 bg-amber-500/10 text-amber-300 rounded-xl border border-amber-500/20 group-hover:scale-105 transition-all">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Daily Cron Results Box (BR-03 Feedback) */}
      {showCronResult && cronReport && (
        <div id="cron-report-panel" className="bg-[#0B0915]/95 text-white p-6 rounded-3xl shadow-2xl border border-purple-500/20 space-y-4 backdrop-blur-lg relative overflow-hidden">
          {/* Decorative scanner line simulation in cron block */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500"></div>

          <div className="flex justify-between items-start border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">BR-03 Auto-Delete Cron Job Report</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Job completed at: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            <button 
              onClick={() => setShowCronResult(false)} 
              className="text-[10px] text-neutral-300 hover:text-white bg-neutral-900/60 border border-white/5 hover:bg-neutral-800 px-3.5 py-1.5 rounded-xl cursor-pointer uppercase font-mono font-bold transition-all"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-neutral-950/40 p-4 rounded-2xl border border-white/5">
              <span className="text-neutral-400 text-[10px] uppercase font-bold font-mono tracking-wider block">Scanned Database Rows</span>
              <span className="text-lg font-bold font-mono text-white mt-1 block">{cronReport.scanned_count} Logs</span>
            </div>
            <div className="bg-neutral-950/40 p-4 rounded-2xl border border-white/5">
              <span className="text-neutral-400 text-[10px] uppercase font-bold font-mono tracking-wider block">Deleted (Age &gt; 21 Days)</span>
              <span className="text-lg font-bold font-mono text-emerald-400 mt-1 block">{cronReport.deleted_count} Files</span>
            </div>
            <div className="bg-neutral-950/40 p-4 rounded-2xl border border-white/5">
              <span className="text-neutral-400 text-[10px] uppercase font-bold font-mono tracking-wider block">Drive Storage Space Freed</span>
              <span className="text-lg font-bold font-mono text-amber-400 mt-1 block">{cronReport.space_freed_mb} MB</span>
            </div>
          </div>

          <div className="text-xs space-y-2.5">
            <p className="font-bold text-purple-300 font-mono uppercase text-[10px] tracking-wider">File Deletion Logs (Google Drive & Sheets Sync):</p>
            <div className="bg-neutral-950 p-4 rounded-2xl border border-white/5 max-h-[160px] overflow-y-auto font-mono text-[11px] text-neutral-300 space-y-2 scrollbar-thin scrollbar-thumb-white/5">
              {cronReport.details.map((detail, index) => (
                <div key={detail.transaction_id} className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <span>
                    <span className="text-purple-400 font-bold">[{index + 1}]</span> {detail.transaction_id} ({detail.company_name})
                  </span>
                  <span className="text-neutral-400">
                    Resi: {detail.tracking_number} • Age: {detail.age_days}d • Status: <span className="text-rose-400 font-bold uppercase">Deleted</span>
                  </span>
                </div>
              ))}
              {cronReport.details.length === 0 && (
                <p className="text-neutral-500 italic text-center py-2">No expired video files (&gt;21 days) with status "READY" were found.</p>
              )}
            </div>
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 rounded-2xl mt-2 font-sans">
              <Info className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Drive API files removed physically. Sheets records updated to <strong>DELETED</strong>, and Tenant's <strong>video_used</strong> counters decreased by 1 respectively.</span>
            </div>
          </div>
        </div>
      )}

      {/* Looker Studio Trend Chart Spec 5.1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (Col span 2) */}
        <div className="bg-[#0B0915]/90 p-6 rounded-3xl border border-white/5 shadow-2xl lg:col-span-2 space-y-4 backdrop-blur-lg">
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Looker Studio: Global Daily Upload Trend
            </h3>
            <p className="text-xs text-neutral-400">Daily upload rate of shipping logs (Orders vs Returns) globally.</p>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0B0915', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontFamily: 'monospace', fontSize: '11px' }}
                />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px', color: '#9ca3af' }} />
                <Area type="monotone" dataKey="Paket Keluar (ORDER)" stroke="#a855f7" strokeWidth={3} fillOpacity={0.1} fill="url(#colorPurple)" />
                <Area type="monotone" dataKey="Paket Retur (RETURN)" stroke="#ec4899" strokeWidth={2} fillOpacity={0.05} fill="url(#colorPink)" />
                <defs>
                  <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tenant quota allocation breakdown */}
        <div className="bg-[#0B0915]/90 p-6 rounded-3xl border border-white/5 shadow-2xl flex flex-col space-y-4 backdrop-blur-lg">
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              Video Quota Usage
            </h3>
            <p className="text-xs text-neutral-400">Breakdown of total stored videos by tenant.</p>
          </div>
          <div className="h-[200px] flex items-center justify-center relative">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Videos`, 'Quota Stored']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-neutral-500 font-mono italic">No stored videos yet</div>
            )}
          </div>
          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[100px] scrollbar-thin">
            {tenants.map((tenant, index) => (
              <div key={tenant.company_id} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span className="text-white font-semibold truncate max-w-[150px]">{tenant.company_name}</span>
                </div>
                <span className="text-neutral-400">{tenant.video_used} video</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5.1 Looker Studio Grid: Monitoring Quota Seluruh Tenant */}
      <div className="bg-[#0B0915]/90 rounded-3xl border border-white/5 shadow-2xl overflow-hidden space-y-4 backdrop-blur-lg">
        {/* Header and Controls */}
        <div className="p-6 pb-2 border-b border-white/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-400" />
              SaaS Tenants Quota Monitor & Control
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">Live configuration of subscription limits, status, and company metadata.</p>
          </div>
          <div className="relative w-full sm:w-[250px]">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-3 bg-neutral-900/60 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/40 text-white font-mono"
            />
          </div>
        </div>

        {/* Table Grid (Looker Studio style) */}
        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950/40 border border-white/5 text-neutral-300 font-bold uppercase tracking-wider text-[10px] font-mono whitespace-nowrap">
                <th className="p-4 border-b border-white/5">Company ID</th>
                <th className="p-4 border-b border-white/5">Tenant Name</th>
                <th className="p-4 text-center border-b border-white/5">Status</th>
                <th className="p-4 text-right border-b border-white/5">Max Quota</th>
                <th className="p-4 text-right border-b border-white/5">Video Used</th>
                <th className="p-4 border-b border-white/5">Quota Usage Bar</th>
                <th className="p-4 text-center border-b border-white/5">Settings</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => {
                const isEditing = editingTenantId === tenant.company_id;
                const percentage = Math.min(100, Math.round((tenant.video_used / tenant.max_video_quota) * 100)) || 0;
                
                // Color alert states
                let barColor = 'bg-purple-500';
                if (percentage >= 100) barColor = 'bg-rose-500';
                else if (percentage >= 80) barColor = 'bg-amber-500';

                return (
                  <tr key={tenant.company_id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="p-4 font-mono font-bold text-neutral-400">{tenant.company_id}</td>
                    <td className="p-4 font-bold text-white">{tenant.company_name}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(tenant.company_id, tenant.status)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border cursor-pointer transition-all ${
                          tenant.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                        title="Click to toggle status"
                      >
                        {tenant.status === 'ACTIVE' ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                        <span>{tenant.status}</span>
                      </button>
                    </td>
                    <td className="p-4 text-right font-mono">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            value={editQuotaValue}
                            onChange={(e) => setEditQuotaValue(Math.max(1, parseInt(e.target.value) || 0))}
                            className="w-16 px-2 py-1.5 text-center font-mono border border-white/10 rounded-lg bg-neutral-900 focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveQuota(tenant.company_id)}
                            className="bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer hover:bg-neutral-200"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2 group">
                          <span className="font-bold text-white">{tenant.max_video_quota}</span>
                          <button
                            onClick={() => {
                              setEditingTenantId(tenant.company_id);
                              setEditQuotaValue(tenant.max_video_quota);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/5 border border-transparent rounded-lg text-purple-400 transition-all cursor-pointer"
                            title="Edit Max Quota"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-white">
                      {tenant.video_used}
                    </td>
                    <td className="p-4 min-w-[150px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono font-bold text-neutral-400">
                          <span>{percentage}% Used</span>
                          {percentage >= 100 && (
                            <span className="text-rose-400 font-black flex items-center gap-0.5">
                              <AlertTriangle className="w-3.5 h-3.5" /> EXHAUSTED
                            </span>
                          )}
                        </div>
                        <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-white/5">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Reg: {new Date(tenant.created_at).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500 italic">
                    No tenants found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Tenant */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] font-sans p-4">
          <div className="bg-[#0B0915]/95 rounded-3xl shadow-2xl border border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl relative">
            <div className="bg-neutral-950/80 px-6 py-5 flex justify-between items-center border-b border-white/5">
              <h3 className="font-display font-bold text-white tracking-wide text-sm">Register New Tenant Profile</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer font-mono font-bold uppercase"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sinar Ritel Utama"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 bg-neutral-900/60 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/40 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider block">Initial Video Quota Limit</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newTenantQuota}
                  onChange={(e) => setNewTenantQuota(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full text-xs px-3.5 py-3 bg-neutral-900/60 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/40 text-white font-mono"
                />
                <p className="text-[9px] text-neutral-400 font-sans leading-relaxed">Determines the maximum video files allowed to be active in Google Drive simultaneously.</p>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer uppercase font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hd-button-primary flex-1 py-3"
                >
                  Create Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
