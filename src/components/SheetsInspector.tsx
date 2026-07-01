/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, Folder, Table, FileVideo, HardDrive, RefreshCw } from 'lucide-react';
import { getTenants, getLogs } from '../lib/db';
import { Tenant, TransactionLog } from '../types';

interface SheetsInspectorProps {
  onRefreshTrigger?: () => void;
  lastUpdated: number;
}

export default function SheetsInspector({ onRefreshTrigger, lastUpdated }: SheetsInspectorProps) {
  const [activeTab, setActiveTab] = useState<'tenants' | 'transactions' | 'drive'>('tenants');
  const [isOpen, setIsOpen] = useState(false);

  const tenants = getTenants();
  const logs = getLogs();

  // Calculate drive statistics
  const activeLogs = logs.filter(l => l.status === 'READY');
  const deletedLogs = logs.filter(l => l.status === 'DELETED');
  const totalSize = activeLogs.reduce((sum, l) => sum + l.file_size_mb, 0);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Toggle Button */}
      <button
        id="btn-toggle-inspector"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-5 py-3.5 bg-neutral-950/90 text-white rounded-full shadow-2xl hover:bg-neutral-900 transition-all border border-white/10 font-sans text-xs font-semibold uppercase tracking-wider cursor-pointer backdrop-blur-md hover:border-purple-500/30"
      >
        <Database className={`w-4 h-4 text-purple-400 ${isOpen ? 'animate-spin' : ''}`} />
        <span>{isOpen ? 'Close Engine' : 'Sheets & Drive Engine'}</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>

      {/* Main Inspector Modal */}
      {isOpen && (
        <div 
          id="sheets-inspector-panel"
          className="fixed bottom-22 right-4 w-[92vw] md:w-[750px] max-h-[75vh] bg-[#0A0814]/95 rounded-3xl shadow-2xl border border-white/10 overflow-hidden flex flex-col font-sans backdrop-blur-xl"
        >
          {/* Header */}
          <div className="bg-neutral-950/80 px-6 py-5 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">Google Workspace Mock Backend</h3>
                <p className="text-[10px] text-neutral-400 font-mono mt-0.5">Service Account API Session</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {onRefreshTrigger && (
                <button 
                  onClick={onRefreshTrigger}
                  className="p-2 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors cursor-pointer border border-white/5"
                  title="Force Refresh API Sync"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-purple-400" />
                </button>
              )}
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full font-mono font-bold">
                API 200 OK
              </span>
            </div>
          </div>

          {/* Sub Header (Warning about Sheets limitation) */}
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center gap-2 text-amber-300 text-[11px]">
            <span className="font-semibold uppercase font-mono text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-400">SaaS Architecture Rule:</span>
            <span>Flat-table structure optimized for Google Looker Studio direct connector.</span>
          </div>

          {/* Tabs */}
          <div className="flex bg-neutral-950/40 border-b border-white/5 p-2 gap-1.5 text-xs">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'tenants'
                  ? 'bg-purple-500/15 text-white border border-purple-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-mono">master_tenants</span>
              <span className="bg-white/5 text-neutral-300 px-2 py-0.5 rounded-full font-mono text-[9px]">
                {tenants.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'transactions'
                  ? 'bg-purple-500/15 text-white border border-purple-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-mono">transactions_log</span>
              <span className="bg-white/5 text-neutral-300 px-2 py-0.5 rounded-full font-mono text-[9px]">
                {logs.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all cursor-pointer ${
                activeTab === 'drive'
                  ? 'bg-purple-500/15 text-white border border-purple-500/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono font-sans">Drive Storage</span>
              <span className="bg-white/5 text-neutral-300 px-2 py-0.5 rounded-full font-mono text-[9px]">
                {activeLogs.length} Active
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-5 max-h-[45vh] scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {activeTab === 'tenants' && (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse font-mono">
                  <thead>
                    <tr className="bg-neutral-950/40 text-neutral-400 border-b border-white/5">
                      <th className="p-3 font-bold uppercase tracking-wider">company_id</th>
                      <th className="p-3 font-bold uppercase tracking-wider">company_name</th>
                      <th className="p-3 font-bold text-right uppercase tracking-wider">max_quota</th>
                      <th className="p-3 font-bold text-right uppercase tracking-wider">used</th>
                      <th className="p-3 font-bold uppercase tracking-wider">status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenants.map(tenant => (
                      <tr 
                        key={tenant.company_id} 
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-3 font-semibold text-white">{tenant.company_id}</td>
                        <td className="p-3 text-neutral-300">{tenant.company_name}</td>
                        <td className="p-3 text-right font-medium text-neutral-400">{tenant.max_video_quota}</td>
                        <td className="p-3 text-right">
                          <span className={`font-bold px-2 py-0.5 rounded-full ${
                            tenant.video_used >= tenant.max_video_quota 
                              ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' 
                              : 'text-neutral-200'
                          }`}>
                            {tenant.video_used}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            tenant.status === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {tenant.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'transactions' && (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse font-mono">
                  <thead>
                    <tr className="bg-neutral-950/40 text-neutral-400 border-b border-white/5 whitespace-nowrap">
                      <th className="p-3 font-bold uppercase tracking-wider">transaction_id</th>
                      <th className="p-3 font-bold uppercase tracking-wider">company_id</th>
                      <th className="p-3 font-bold uppercase tracking-wider">tracking_number</th>
                      <th className="p-3 font-bold uppercase tracking-wider">type</th>
                      <th className="p-3 font-bold text-right uppercase tracking-wider">file_size</th>
                      <th className="p-3 font-bold uppercase tracking-wider">status</th>
                      <th className="p-3 font-bold uppercase tracking-wider">created_at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr 
                        key={log.transaction_id} 
                        className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${
                          log.status === 'DELETED' ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="p-3 font-semibold text-neutral-400 whitespace-nowrap">{log.transaction_id}</td>
                        <td className="p-3 text-neutral-300">{log.company_id}</td>
                        <td className="p-3 font-bold text-white whitespace-nowrap">{log.tracking_number}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            log.type === 'ORDER' 
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' 
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className="p-3 text-right text-neutral-300 font-medium">{log.file_size_mb} MB</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            log.status === 'READY' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 line-through'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-neutral-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-neutral-500 italic">
                          No transactions stored yet. Make a packing recording!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'drive' && (
              <div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-neutral-950/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                      <HardDrive className="w-3 h-3 text-amber-400" />
                      <span>Total Storage</span>
                    </div>
                    <span className="text-base font-bold font-mono text-white">{totalSize.toFixed(1)} MB</span>
                  </div>
                  <div className="bg-neutral-950/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                      <FileVideo className="w-3 h-3 text-purple-400" />
                      <span>Stored Videos</span>
                    </div>
                    <span className="text-base font-bold font-mono text-white">{activeLogs.length} Files</span>
                  </div>
                  <div className="bg-neutral-950/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                      <TrashDriveIcon className="w-3 h-3 text-rose-400" />
                      <span>Cron Deleted</span>
                    </div>
                    <span className="text-base font-bold font-mono text-rose-400">{deletedLogs.length} Files</span>
                  </div>
                </div>

                <h4 className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider mb-2 font-sans">Active Drive Files Hierarchy</h4>
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto font-mono text-[11px]">
                  {activeLogs.map(log => (
                    <div key={log.transaction_id} className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-950/40 border border-white/5 hover:border-purple-500/20 transition-all">
                      <div className="flex items-center gap-3">
                        <FileVideo className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <span className="text-white font-semibold">{log.video_drive_id}.mp4</span>
                          <div className="text-[9px] text-neutral-400 mt-0.5">
                            Resi: {log.tracking_number} • Tenant: {log.company_id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className="font-semibold text-white">{log.file_size_mb} MB</span>
                        <div className="text-[8px] bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-purple-300 uppercase font-bold mt-1">
                          Drive API: Streamable
                        </div>
                      </div>
                    </div>
                  ))}
                  {activeLogs.length === 0 && (
                    <div className="p-8 text-center text-neutral-500 italic">
                      No physical video files stored in Google Drive yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-neutral-950/80 px-6 py-4 border-t border-white/5 flex justify-between items-center text-[10px] text-neutral-500 font-mono">
            <span>Last Sync: {new Date(lastUpdated).toLocaleTimeString()}</span>
            <span>JoPacking Engine v1.0.0-MVP</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Extra inline utility icon
function TrashDriveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
