/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  getLogsByCompany, 
  checkQuota, 
  getOperators, 
  getShops, 
  addOperator, 
  addShop 
} from '../lib/db';
import { TransactionLog, Operator, Shop, VideoStatus } from '../types';
import { 
  Shield, 
  Store, 
  Users, 
  CheckCircle, 
  CornerDownLeft, 
  Video, 
  HardDrive, 
  Search, 
  ExternalLink, 
  Plus, 
  FileVideo, 
  Play, 
  AlertCircle,
  X,
  UserCheck,
  TrendingUp,
  Sliders,
  Maximize2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface CompanyAdminDashboardProps {
  companyId: string;
  companyName: string;
  onDataChange: () => void;
  lastUpdated: number;
}

export default function CompanyAdminDashboard({ companyId, companyName, onDataChange, lastUpdated }: CompanyAdminDashboardProps) {
  // Load Isolated Tenant Data (BR-01)
  const tenantLogs = getLogsByCompany(companyId);
  const quota = checkQuota(companyId);

  // Manage Operators and Shops linked to this tenant
  const allOperators = getOperators().filter(op => op.company_id === companyId);
  const allShops = getShops().filter(sh => sh.company_id === companyId);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'ORDER' | 'RETURN'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'READY' | 'DELETED'>('ALL');
  
  // Management Modals
  const [showOpModal, setShowOpModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  
  // New Operator Form
  const [newOpName, setNewOpName] = useState('');
  const [newOpEmail, setNewOpEmail] = useState('');

  // New Shop Form
  const [newShopName, setNewShopName] = useState('');
  const [newShopMarketplace, setNewShopMarketplace] = useState('Shopee');

  // Video Playback Modal
  const [playingVideo, setPlayingVideo] = useState<TransactionLog | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // --- LOOKER STUDIO MOCK METRICS SPEC 5.2 ---
  const totalSuccessPackings = tenantLogs.filter(l => l.type === 'ORDER' && l.status === 'READY').length;
  const totalReturnPackings = tenantLogs.filter(l => l.type === 'RETURN' && l.status === 'READY').length;
  const remainingQuota = Math.max(0, quota.max - quota.used);

  // --- CALCULATE MARKETPLACE DISTRIBUTION (Pie Chart) ---
  const getMarketplaceData = () => {
    const counts: Record<string, number> = {};
    tenantLogs.forEach(log => {
      counts[log.marketplace] = (counts[log.marketplace] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value
    }));
  };

  const marketplaceData = getMarketplaceData();
  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  // Form Submissions
  const handleAddOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName.trim() || !newOpEmail.trim()) return;

    addOperator({
      name: newOpName.trim(),
      email: newOpEmail.trim().toLowerCase(),
      company_id: companyId
    });

    setNewOpName('');
    setNewOpEmail('');
    setShowOpModal(false);
    onDataChange();
  };

  const handleAddShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName.trim()) return;

    addShop({
      name: newShopName.trim(),
      marketplace: newShopMarketplace,
      company_id: companyId
    });

    setNewShopName('');
    setNewShopMarketplace('Shopee');
    setShowShopModal(false);
    onDataChange();
  };

  // Filter Logs
  const filteredLogs = tenantLogs.filter(log => {
    const matchesSearch = log.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.operator_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.transaction_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || log.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title & Quota Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0B0915]/90 p-6 rounded-3xl border border-white/5 shadow-2xl gap-4 backdrop-blur-lg relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[9px] font-bold uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 font-mono tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              TENANT SECURED DASHBOARD
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">ID: {companyId}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-2.5 font-display">{companyName}</h1>
          <p className="text-xs text-neutral-400 mt-1">Manage operator terminals, check shops performance, and review packing dispute evidence.</p>
        </div>

        {/* Quota Progress */}
        <div className="bg-neutral-950/60 p-5 rounded-2xl border border-white/5 w-full md:w-[300px] space-y-2 font-mono relative z-10">
          <div className="flex justify-between text-[11px]">
            <span className="font-bold text-neutral-400 uppercase tracking-wide">Drive Storage Quota</span>
            <span className="font-bold text-white">{quota.used} / {quota.max}</span>
          </div>
          <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                quota.used >= quota.max ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
              }`} 
              style={{ width: `${Math.min(100, (quota.used / quota.max) * 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-neutral-500 font-sans">BR-01 Storage Cap</span>
            <p className="text-neutral-400 text-right">
              REMAINING: <strong className="text-purple-300">{remainingQuota} video</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Looker Studio Spec 5.2 - Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Scorecard 1: Total Paket Sukses Di-packing */}
        <div className="bg-[#0B0915]/90 p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between backdrop-blur-lg hover:border-purple-500/20 transition-all group">
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase font-mono tracking-wider block">
              TOTAL PAKET SUKSES (ORDER)
            </span>
            <span className="text-3xl font-black tracking-tight text-white block mt-1.5 font-mono">
              {totalSuccessPackings}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
               bukti video siap di-embed
            </span>
          </div>
          <div className="p-3.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-xl group-hover:scale-105 transition-all">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Scorecard 2: Total Paket Retur Diterima */}
        <div className="bg-[#0B0915]/90 p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between backdrop-blur-lg hover:border-purple-500/20 transition-all group">
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase font-mono tracking-wider block">
              TOTAL PAKET RETUR (RETURN)
            </span>
            <span className="text-3xl font-black tracking-tight text-white block mt-1.5 font-mono">
              {totalReturnPackings}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1.5 mt-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Bukti pembukaan paket retur
            </span>
          </div>
          <div className="p-3.5 bg-pink-500/10 text-pink-300 border border-pink-500/20 rounded-xl group-hover:scale-105 transition-all">
            <CornerDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Scorecard 3: Sisa Kuota Video Toko */}
        <div className="bg-[#0B0915]/90 p-5 rounded-2xl border border-white/5 shadow-xl flex items-center justify-between backdrop-blur-lg hover:border-purple-500/20 transition-all group">
          <div>
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase font-mono tracking-wider block">
              SISA KUOTA VIDEO TOKO
            </span>
            <span className="text-3xl font-black tracking-tight text-white block mt-1.5 font-mono">
              {remainingQuota} <span className="text-xs text-neutral-400 font-normal font-sans">videos</span>
            </span>
            <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1 mt-2 font-mono">
              Limit: {quota.max} video
            </span>
          </div>
          <div className="p-3.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-xl group-hover:scale-105 transition-all">
            <HardDrive className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Graphs & Quick Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Marketplace Distribution Spec 5.2 Pie Chart */}
        <div className="bg-[#0B0915]/90 p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4 backdrop-blur-lg">
          <div>
            <h3 className="font-display font-bold text-base text-white">Looker Studio: Marketplace Distribution</h3>
            <p className="text-xs text-neutral-400 font-sans">Video distribution by Marketplace channels.</p>
          </div>
          <div className="h-[200px] flex items-center justify-center">
            {marketplaceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketplaceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {marketplaceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Video proofs`, 'Volume']} />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-neutral-400 italic font-sans">No marketplace transaction history logged yet</div>
            )}
          </div>
        </div>

        {/* Shop & Operator Quick Management */}
        <div className="bg-[#0B0915]/90 p-6 rounded-3xl border border-white/5 shadow-2xl lg:col-span-2 space-y-5 backdrop-blur-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-white">Terminal Infrastructure Profiles</h3>
              <p className="text-xs text-neutral-400 font-sans">Configure retail channels and active packaging warehouse operators.</p>
            </div>
            <div className="flex gap-2.5 text-xs font-mono">
              <button
                onClick={() => setShowShopModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-white/5 font-semibold rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-purple-400" />
                <span>+ SHOP</span>
              </button>
              <button
                onClick={() => setShowOpModal(true)}
                className="hd-button-primary animate-pulse"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ OPERATOR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Operator List Column */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Users className="w-3.5 h-3.5 text-purple-400" />
                Warehouse Operators ({allOperators.length})
              </h4>
              <div className="border border-white/5 rounded-2xl divide-y divide-white/5 max-h-[150px] overflow-y-auto bg-neutral-950/40 scrollbar-thin">
                {allOperators.map(op => (
                  <div key={op.email} className="p-3 flex items-center justify-between text-xs hover:bg-white/[0.01] transition-all">
                    <div>
                      <span className="font-bold text-white">{op.name}</span>
                      <span className="text-[10px] text-neutral-400 block font-mono mt-0.5">{op.email}</span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                      ACTIVE
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shop List Column */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Store className="w-3.5 h-3.5 text-purple-400" />
                Marketplace Shops ({allShops.length})
              </h4>
              <div className="border border-white/5 rounded-2xl divide-y divide-white/5 max-h-[150px] overflow-y-auto bg-neutral-950/40 scrollbar-thin">
                {allShops.map(sh => (
                  <div key={sh.id} className="p-3 flex items-center justify-between text-xs hover:bg-white/[0.01] transition-all">
                    <div>
                      <span className="font-bold text-white">{sh.name}</span>
                      <span className="text-[10px] text-neutral-400 block font-mono mt-0.5">ID: {sh.id}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20 font-mono">
                      {sh.marketplace}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5.2 Looker Studio Table Grid: Log Riwayat Pelacakan */}
      <div className="bg-[#0B0915]/90 rounded-3xl border border-white/5 shadow-2xl overflow-hidden space-y-4 backdrop-blur-lg">
        {/* Table Filter Area */}
        <div className="p-6 pb-2 border-b border-white/5 space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-white">Looker Studio: Digital Evidence Logs</h3>
              <p className="text-xs text-neutral-400 font-sans">Complete, tamper-proof tracking audit of parcel packing records.</p>
            </div>
            <div className="relative w-full sm:w-[250px]">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="text"
                placeholder="No Resi, Operator, Toko..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-3 bg-neutral-900/60 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/40 text-white"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex bg-neutral-950/40 rounded-xl p-1 border border-white/5">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  typeFilter === 'ALL' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Type
              </button>
              <button
                onClick={() => setTypeFilter('ORDER')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  typeFilter === 'ORDER' ? 'bg-purple-500 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setTypeFilter('RETURN')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  typeFilter === 'RETURN' ? 'bg-pink-500 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Returns
              </button>
            </div>

            <div className="flex bg-neutral-950/40 rounded-xl p-1 border border-white/5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'ALL' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('READY')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'READY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Ready (Drive)
              </button>
              <button
                onClick={() => setStatusFilter('DELETED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  statusFilter === 'DELETED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Deleted (Cron)
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table Grid */}
        <div className="overflow-x-auto px-6 pb-6">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950/40 border border-white/5 text-neutral-300 font-bold uppercase tracking-wider text-[10px] font-mono whitespace-nowrap">
                <th className="p-4">Created At</th>
                <th className="p-4">Tracking Number (Resi)</th>
                <th className="p-4">Shop Name</th>
                <th className="p-4">Operator Email</th>
                <th className="p-4 text-center">Type</th>
                <th className="p-4 text-right">Size (MB)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Evidence URL</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.transaction_id} className={`border-b border-white/5 hover:bg-white/[0.01] transition-colors ${log.status === 'DELETED' ? 'opacity-70 bg-neutral-950/10' : ''}`}>
                  <td className="p-4 text-neutral-400 whitespace-nowrap font-mono">
                    {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4 font-bold text-white whitespace-nowrap font-mono tracking-wide">{log.tracking_number}</td>
                  <td className="p-4 font-bold text-neutral-200 font-sans">
                    <span className="mr-2">{log.shop_name}</span>
                    <span className="text-[9px] bg-white/5 text-neutral-300 px-2.5 py-1 rounded-full border border-white/10 font-mono font-bold uppercase tracking-wide">{log.marketplace}</span>
                  </td>
                  <td className="p-4 text-neutral-400 whitespace-nowrap font-mono">{log.operator_email}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border font-mono ${
                      log.type === 'ORDER'
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                        : 'bg-pink-500/10 text-pink-300 border-pink-500/20'
                    }`}>
                      {log.type}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono text-neutral-300">{log.file_size_mb} MB</td>
                  <td className="p-4 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border font-mono ${
                      log.status === 'READY'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20 line-through'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {log.status === 'READY' ? (
                      <button
                        onClick={() => {
                          setPlayingVideo(log);
                          setPlaybackSpeed(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-purple-300 hover:text-white text-[10px] font-bold rounded-xl border border-white/5 transition-all cursor-pointer font-mono"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play Video</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-950 text-neutral-650 text-[10px] rounded-xl border border-white/5 cursor-not-allowed font-mono"
                        title="File physically purged from Drive after 21 days."
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Purged (21d)</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-neutral-550 italic">
                    No matching shipment records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Video Playback Dialog (Hyperlink Spec) */}
      {playingVideo && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-[110] p-4 font-mono">
          <div className="bg-[#0B0915]/95 text-white rounded-3xl border border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
            {/* Header */}
            <div className="bg-neutral-950/80 border-b border-white/5 px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <FileVideo className="w-4 h-4 text-purple-400 animate-pulse" />
                <div>
                  <h3 className="font-display font-bold text-xs tracking-wide text-white uppercase">Google Drive Video Evidence Player</h3>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">File ID: {playingVideo.video_drive_id}.mp4</p>
                </div>
              </div>
              <button 
                onClick={() => setPlayingVideo(null)}
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Canvas Container */}
            <div className="aspect-video bg-black relative flex items-center justify-center group">
              {/* Custom High Fidelity Stream Simulation */}
              <img 
                src={playingVideo.video_url || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=600&auto=format&fit=crop'} 
                alt="Video Evidence Stream" 
                className="w-full h-full object-cover brightness-90 border-b border-neutral-950"
                referrerPolicy="no-referrer"
              />
              
              {/* Scanline and Video Effects Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.55))]"></div>
              
              {/* Realtime Watermark Overlay */}
              <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-xl border border-white/5 font-mono text-[9px] space-y-1 text-white select-none shadow-lg">
                <div className="font-bold text-purple-300">LIVE DIGITAL PROOF</div>
                <div>ID: {playingVideo.transaction_id}</div>
                <div>RESI: {playingVideo.tracking_number}</div>
                <div>OPERATOR: {playingVideo.operator_email}</div>
                <div>TIME: {new Date(playingVideo.created_at).toISOString()}</div>
                <div>SPEED: {playbackSpeed}x</div>
              </div>

              {/* Purged / Non-Streamable Warning if applicable */}
              {playingVideo.status === 'DELETED' && (
                <div className="absolute inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
                  <h4 className="font-bold text-sm text-white">PHYSICAL EVIDENCE DELETED</h4>
                  <p className="text-xs text-neutral-400 max-w-md mt-1.5 leading-relaxed">This video was safely purged from Google Drive storage after 21 days according to BR-03 retention policies. Transaction logs in Google Sheets persist as metadata.</p>
                </div>
              )}
            </div>

            {/* Player Controls */}
            <div className="p-5 bg-neutral-950/80 border-t border-white/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-xs text-neutral-400 font-mono">
              <div className="flex items-center gap-3">
                <span className="font-bold uppercase text-neutral-300">Playback Speed:</span>
                <div className="flex gap-1.5">
                  {[1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-3 py-1.5 rounded-lg font-bold font-mono text-[10px] cursor-pointer transition-all border ${
                        playbackSpeed === speed 
                          ? 'bg-white text-black border-white shadow-lg' 
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border-white/5'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-neutral-300">
                <span>Compressed Size: <strong className="text-white font-mono">{playingVideo.file_size_mb} MB</strong></span>
                <span className="text-neutral-700">|</span>
                <span>Marketplace: <strong className="text-white uppercase">{playingVideo.marketplace}</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operator Add Modal */}
      {showOpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0B0915]/95 rounded-3xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl relative">
            <div className="bg-neutral-950/80 px-6 py-5 flex justify-between items-center border-b border-white/5">
              <h3 className="font-display font-bold text-sm text-white tracking-wide uppercase">Register Warehouse Operator</h3>
              <button onClick={() => setShowOpModal(false)} className="text-neutral-400 hover:text-white text-xs cursor-pointer uppercase font-mono font-bold">Cancel</button>
            </div>
            <form onSubmit={handleAddOperatorSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 block uppercase font-mono tracking-wider">Operator Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Budi Santoso"
                  value={newOpName}
                  onChange={(e) => setNewOpName(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 bg-neutral-900/60 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/40 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 block uppercase font-mono tracking-wider">Operator Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. budi@sinar.com"
                  value={newOpEmail}
                  onChange={(e) => setNewOpEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 bg-neutral-900/60 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/40 text-white font-mono"
                />
                <p className="text-[9px] text-neutral-400 leading-relaxed font-sans mt-1">This email acts as the identity column in the <code>transactions_log</code> sheet for audits.</p>
              </div>

              <div className="flex gap-2.5 pt-4 font-mono">
                <button
                  type="button"
                  onClick={() => setShowOpModal(false)}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hd-button-primary flex-1 py-3"
                >
                  Register Operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shop Add Modal */}
      {showShopModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-[#0B0915]/95 rounded-3xl shadow-2xl border border-white/10 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl relative">
            <div className="bg-neutral-950/80 px-6 py-5 flex justify-between items-center border-b border-white/5">
              <h3 className="font-display font-bold text-sm text-white tracking-wide uppercase">Register Retail Shop</h3>
              <button onClick={() => setShowShopModal(false)} className="text-neutral-400 hover:text-white text-xs cursor-pointer uppercase font-mono font-bold">Cancel</button>
            </div>
            <form onSubmit={handleAddShopSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 block uppercase font-mono tracking-wider">Shop Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sinar Ritel Shopee"
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  className="w-full text-xs px-3.5 py-3 bg-neutral-900/60 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/40 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 block uppercase font-mono tracking-wider">Marketplace Platform</label>
                <select
                  value={newShopMarketplace}
                  onChange={(e) => setNewShopMarketplace(e.target.value)}
                  className="w-full text-xs px-3 py-3 bg-neutral-900/60 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/40 text-neutral-200 font-mono"
                >
                  <option value="Shopee">Shopee</option>
                  <option value="Tokopedia">Tokopedia</option>
                  <option value="Lazada">Lazada</option>
                  <option value="TikTok Shop">TikTok Shop</option>
                  <option value="Bukalapak">Bukalapak</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4 font-mono">
                <button
                  type="button"
                  onClick={() => setShowShopModal(false)}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-neutral-300 text-xs font-bold rounded-xl cursor-pointer uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hd-button-primary flex-1 py-3"
                >
                  Create Shop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
