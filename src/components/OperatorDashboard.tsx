/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  checkQuota, 
  addTransaction, 
  getLogs, 
  getShops 
} from '../lib/db';
import { Shop, TransactionType, TransactionLog } from '../types';
import { 
  Scan, 
  Video, 
  VideoOff, 
  Sparkles, 
  AlertTriangle, 
  RotateCcw, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Tv, 
  Layers, 
  Check, 
  Volume2, 
  VolumeX,
  History
} from 'lucide-react';

interface OperatorDashboardProps {
  operatorEmail: string;
  operatorName: string;
  companyId: string;
  companyName: string;
  onDataChange: () => void;
  lastUpdated: number;
}

export default function OperatorDashboard({ 
  operatorEmail, 
  operatorName, 
  companyId, 
  companyName, 
  onDataChange, 
  lastUpdated 
}: OperatorDashboardProps) {
  
  // Database states
  const shops = getShops().filter(s => s.company_id === companyId);
  const myLogs = getLogs().filter(l => l.operator_email === operatorEmail);
  const quota = checkQuota(companyId);

  // Scanner States
  const [selectedShopId, setSelectedShopId] = useState(shops[0]?.id || '');
  const [txType, setTxType] = useState<TransactionType>('ORDER');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Recording States
  const [isReadyToRecord, setIsReadyToRecord] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [originalVideoSize, setOriginalVideoSize] = useState(0);
  
  // Pipeline Processing states
  const [processingState, setProcessingState] = useState<'IDLE' | 'COMPRESSING' | 'UPLOADING' | 'SUCCESS'>('IDLE');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [finalSizeMb, setFinalSizeMb] = useState(0);

  // Camera settings
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Initialize camera for recording
  const startCameraStream = async () => {
    setCameraError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'environment' }, 
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera not accessible or denied, falling back to simulated pipeline', err);
      setCameraError(true);
    }
  };

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  // Generate synthesizer Beep Sound on scan (Audit feedback)
  const playScanBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // High A beep
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.log('AudioContext not allowed or failed to initialize', e);
    }
  };

  // Simulate barcode scanner laser
  const handleSimulateScan = () => {
    // Check Quota first (BR-04)
    const currentQuota = checkQuota(companyId);
    if (!currentQuota.allowed) {
      playErrorBeep();
      alert(`BR-04 Quota Violation: Video used (${currentQuota.used}) has reached quota limit (${currentQuota.max}). Can't process more packages!`);
      return;
    }

    if (shops.length === 0) {
      alert('Anda belum memiliki toko terdaftar. Daftarkan toko di Company Admin terlebih dahulu.');
      return;
    }

    setIsScanning(true);
    
    setTimeout(() => {
      // Generate realistic shipping tracking code
      const randNum = Math.floor(100000000 + Math.random() * 900000000);
      let prefix = 'SPX';
      if (txType === 'RETURN') prefix = 'RET';
      else {
        const shop = shops.find(s => s.id === selectedShopId);
        if (shop?.marketplace === 'Tokopedia') prefix = 'TKP';
        else if (shop?.marketplace === 'Lazada') prefix = 'LZD';
      }

      setTrackingNumber(`${prefix}${randNum}`);
      setIsScanning(false);
      playScanBeep();
      setIsReadyToRecord(true);
      
      // Auto initiate camera
      startCameraStream();
    }, 1500);
  };

  // Beep sound on error (Quota violation)
  const playErrorBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sawtooth';
      oscillator.frequency.value = 180; // Low alarm buzz
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.log('AudioContext error beep failed', e);
    }
  };

  // --- RECORDING CYCLE ---
  const startRecording = () => {
    setIsRecording(true);
    setSeconds(0);
    setProcessingState('IDLE');

    // Timer countdown/up loop
    timerRef.current = window.setInterval(() => {
      setSeconds(prev => {
        const nextSec = prev + 1;
        
        // BR-02: Auto stop recording at 100 seconds
        if (nextSec >= 100) {
          stopRecording();
          return 100;
        }
        return nextSec;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsRecording(false);
    stopCameraStream();
    
    // Original raw file size simulation
    const rawSize = seconds * 0.45 + 2.5; // Average 0.45MB per second of raw video
    setOriginalVideoSize(parseFloat(rawSize.toFixed(1)));

    // Begin compression workflow (Section 6.2)
    startCompression(seconds);
  };

  // --- COMPRESSION AND UPLOAD SIMULATOR (Section 6.2) ---
  const startCompression = (duration: number) => {
    setProcessingState('COMPRESSING');
    setProcessingProgress(0);

    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Trigger Upload to Drive simulation
          setTimeout(() => {
            startUpload(duration);
          }, 300);
          return 100;
        }
        return prev + 15; // Fast loading
      });
    }, 100);
  };

  const startUpload = (duration: number) => {
    setProcessingState('UPLOADING');
    setProcessingProgress(0);

    // Calculate actual compressed target size (e.g. ~0.07MB per second of 480p/720p video)
    const compressedSize = Math.max(0.5, duration * 0.08 + 0.4);
    const finalSize = parseFloat(compressedSize.toFixed(2));
    setFinalSizeMb(finalSize);

    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          saveTransactionToSheets(finalSize);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const saveTransactionToSheets = (sizeMb: number) => {
    const shop = shops.find(s => s.id === selectedShopId);
    
    const result = addTransaction({
      company_id: companyId,
      operator_email: operatorEmail,
      shop_name: shop?.name || 'Default Store',
      marketplace: shop?.marketplace || 'Tokopedia',
      tracking_number: trackingNumber,
      type: txType,
      file_size_mb: sizeMb
    });

    if (result.success) {
      setProcessingState('SUCCESS');
      playSuccessChime();
      onDataChange();
    } else {
      setProcessingState('IDLE');
      setIsReadyToRecord(false);
      playErrorBeep();
      alert(`Gagal menyimpan data: ${result.error}`);
    }
  };

  const playSuccessChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.type = 'sine';
      osc1.frequency.value = 523.25; // C5
      osc2.type = 'sine';
      osc2.frequency.value = 659.25; // E5

      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.45);
      osc2.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.log('Chime failed', e);
    }
  };

  const resetScanner = () => {
    setTrackingNumber('');
    setIsReadyToRecord(false);
    setIsRecording(false);
    setSeconds(0);
    setProcessingState('IDLE');
    setProcessingProgress(0);
    stopCameraStream();
  };

  const quotaRatio = quota.used / quota.max;
  const isQuotaExhausted = quota.used >= quota.max;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Handheld Device Column (Col span 7) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-[#0B0915]/90 text-white rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col min-h-[600px] font-sans backdrop-blur-lg">
          
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {/* Terminal Title Bar */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4 z-10">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block">Terminal Operator</span>
                <h2 className="text-sm font-bold text-white block font-display tracking-tight">{operatorName}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 bg-neutral-900/60 hover:bg-neutral-800 rounded-xl text-neutral-400 hover:text-white transition-all cursor-pointer border border-white/5"
                title={soundEnabled ? 'Mute Scan Sounds' : 'Unmute Scan Sounds'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              </button>
              
              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 uppercase tracking-wider">
                Tenant: {companyId}
              </span>
            </div>
          </div>

          {/* Quota Exhausted Warning Panel */}
          {isQuotaExhausted && (
            <div className="bg-rose-950/40 border border-rose-500/20 text-rose-300 p-4 rounded-2xl flex items-start gap-3 mt-4 z-10 animate-pulse backdrop-blur-md">
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-400" />
              <div className="text-xs">
                <span className="font-extrabold uppercase font-mono tracking-wider text-rose-400 block">BR-04 Quota Limit Enforcement:</span>
                <p className="mt-1 font-sans leading-relaxed text-rose-200">
                  Max video quota ({quota.max} files) is fully exhausted. System denies recording or scanning new packages until storage is cleared or quota upgraded.
                </p>
              </div>
            </div>
          )}

          {/* Main Stage Panel (Flexible based on state) */}
          <div className="flex-1 my-5 bg-black/60 rounded-2xl border border-white/5 flex flex-col justify-center items-center overflow-hidden relative p-4 min-h-[260px]">
            
            {/* Background scanner glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.03)_0%,transparent_70%)] pointer-events-none"></div>

            {/* 1. Barcode scanning visual scanline anim */}
            {isScanning && (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-neutral-950/80 z-20">
                {/* Simulated red laser scanner line */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-bounce z-25"></div>
                <Scan className="w-16 h-16 text-purple-400 animate-pulse mb-3" />
                <span className="text-xs text-neutral-300 font-mono tracking-widest uppercase">Scanning Box Barcode...</span>
              </div>
            )}

            {/* 2. Ready to record stage (Streams camera or simulated stage) */}
            {!isScanning && isReadyToRecord && processingState === 'IDLE' && (
              <div className="absolute inset-0 flex flex-col justify-between p-4 bg-black">
                
                {/* Camera viewport container */}
                <div className="flex-1 bg-neutral-950 rounded-xl overflow-hidden relative border border-white/5 shadow-inner">
                  {cameraError ? (
                    /* Simulated Fallback Stage for high-fidelity offline representation */
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-neutral-950 via-neutral-900 to-purple-950/20 text-center p-6 select-none">
                      <Tv className="w-10 h-10 text-purple-400 mb-2 animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">Cardboard Conveyor Simulator</span>
                      <p className="text-[10px] text-neutral-400 max-w-[280px] mt-1 font-sans">Camera disabled or unavailable in frame. Recording process simulates packing verification flows.</p>
                      
                      {/* Interactive box mock graphic */}
                      <div className="mt-4 border border-purple-500/20 p-4 rounded-xl flex items-center gap-3 bg-purple-500/5 backdrop-blur-xs">
                        <Layers className={`w-8 h-8 text-indigo-400 ${isRecording ? 'animate-bounce' : ''}`} />
                        <div className="text-left">
                          <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest block font-mono">Evidence Package</span>
                          <span className="text-sm font-mono text-white block font-bold tracking-tight">{trackingNumber}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Real user-camera media feed */
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  )}

                  {/* Watermark Overlay details during recording */}
                  {isRecording && (
                    <div className="absolute top-3 left-3 bg-rose-600 text-white font-mono text-[9px] px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-600/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      REC
                    </div>
                  )}

                  {/* BR-02 Duration Gauge Overlay */}
                  <div className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded-full border border-white/10 font-mono text-[10px] text-neutral-300 flex items-center gap-1.5 backdrop-blur-md">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{seconds}s / 100s</span>
                  </div>
                </div>

                {/* Tracking bar */}
                <div className="mt-4 flex items-center justify-between bg-neutral-900/60 p-3 rounded-xl border border-white/5 text-xs backdrop-blur-md">
                  <div>
                    <span className="text-[9px] text-neutral-400 block uppercase font-bold font-mono">Target Tracking Code</span>
                    <strong className="font-mono text-indigo-400 font-extrabold tracking-wide text-sm">{trackingNumber}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-neutral-400 block uppercase font-bold font-mono">Channel</span>
                    <strong className="text-white block uppercase text-xs">{shops.find(s => s.id === selectedShopId)?.name || 'Store'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Processing Pipeline (Compression / Upload Simulation) */}
            {!isScanning && (processingState === 'COMPRESSING' || processingState === 'UPLOADING') && (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-neutral-950/90 p-6 font-mono z-15">
                {/* SVG dynamic loader */}
                <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle 
                      cx="40" cy="40" r="34" 
                      className="stroke-neutral-900 fill-none" 
                      strokeWidth="4" 
                    />
                    <circle 
                      cx="40" cy="40" r="34" 
                      className="stroke-purple-500 fill-none transition-all duration-300" 
                      strokeWidth="4" 
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - processingProgress / 100)}`}
                    />
                  </svg>
                  <span className="absolute text-xs font-mono font-bold text-white">{processingProgress}%</span>
                </div>

                <h3 className="font-bold text-xs tracking-wider text-purple-300 uppercase text-center">
                  {processingState === 'COMPRESSING' 
                    ? 'BR-03 / SEC-6.2 CLIENT COMPRESSION' 
                    : 'GOOGLE DRIVE UPLOADER'}
                </h3>
                
                <p className="text-[10px] text-neutral-400 max-w-sm mt-1.5 text-center leading-relaxed font-sans">
                  {processingState === 'COMPRESSING' 
                    ? `Downscaling original package raw file from ${originalVideoSize} MB to 480p/720p compressed format...` 
                    : `Uploading optimized stream file (${finalSizeMb} MB) securely via Drive API...`}
                </p>
              </div>
            )}

            {/* 4. Complete Success Screen */}
            {processingState === 'SUCCESS' && (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-neutral-950 text-center p-6 animate-in fade-in duration-250 font-mono z-15">
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-4 animate-bounce shadow-lg shadow-emerald-500/10">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">EVIDENCE SECURED!</h3>
                <p className="text-[10px] text-neutral-400 max-w-xs mt-1 leading-relaxed font-sans">
                  Video processed at 480p and saved to Drive ID. Sheet row appended successfully in database.
                </p>

                <div className="bg-neutral-900/60 border border-white/5 p-4 rounded-xl mt-4 w-full max-w-[260px] text-[10px] text-left text-neutral-300 space-y-2">
                  <div className="flex justify-between"><span>CODE:</span><span className="font-bold text-white">{trackingNumber}</span></div>
                  <div className="flex justify-between"><span>DRIVE FILE:</span><span className="font-bold text-purple-400">{finalSizeMb} MB</span></div>
                  <div className="flex justify-between"><span>TIME:</span><span className="text-neutral-400">{new Date().toLocaleTimeString()}</span></div>
                </div>

                <button
                  onClick={resetScanner}
                  className="hd-button-primary mt-6 w-full max-w-[200px]"
                >
                  Scan Next Package
                </button>
              </div>
            )}

            {/* 5. Idle Default State */}
            {!isScanning && !isReadyToRecord && processingState === 'IDLE' && (
              <div className="text-center p-6 space-y-4 z-10 font-mono">
                <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center mx-auto text-purple-400 shadow-md">
                  <Scan className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-xs tracking-widest text-neutral-300 uppercase">AWAITING SHIPMENT RESI</h3>
                  <p className="text-[10px] text-neutral-400 max-w-[280px] mt-1 mx-auto leading-relaxed font-sans">Select the shop, set the shipping type, and hit scan or generate resi below to activate terminal.</p>
                </div>
              </div>
            )}
          </div>

          {/* Core Handheld Button Controllers (Scan / Record) */}
          <div className="space-y-4 z-10 font-mono">
            {/* Input Config Row */}
            {!isReadyToRecord && (
              <div className="grid grid-cols-2 gap-3.5 text-xs">
                {/* Select Shop */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">1. Origin Shop</label>
                  <select
                    disabled={isScanning || isQuotaExhausted}
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="w-full text-xs px-3.5 py-3 bg-neutral-900/60 border border-white/5 rounded-xl text-white focus:outline-none focus:border-purple-500/40 disabled:opacity-50"
                  >
                    {shops.map(sh => (
                      <option key={sh.id} value={sh.id} className="bg-[#0B0915]">{sh.name} ({sh.marketplace})</option>
                    ))}
                    {shops.length === 0 && (
                      <option value="">No Active Shops</option>
                    )}
                  </select>
                </div>

                {/* Trans Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">2. Packet Type</label>
                  <div className="grid grid-cols-2 bg-neutral-900/60 p-1 rounded-xl border border-white/5 text-[11px] h-[42px] items-center">
                    <button
                      type="button"
                      disabled={isScanning || isQuotaExhausted}
                      onClick={() => setTxType('ORDER')}
                      className={`h-full rounded-lg font-bold transition-all cursor-pointer ${
                        txType === 'ORDER' ? 'bg-white text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      ORDER
                    </button>
                    <button
                      type="button"
                      disabled={isScanning || isQuotaExhausted}
                      onClick={() => setTxType('RETURN')}
                      className={`h-full rounded-lg font-bold transition-all cursor-pointer ${
                        txType === 'RETURN' ? 'bg-amber-500 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      RETURN
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action Button (Scanning laser or camera control) */}
            <div className="pt-2">
              {!isReadyToRecord ? (
                <button
                  id="btn-scan-resi"
                  onClick={handleSimulateScan}
                  disabled={isScanning || isQuotaExhausted}
                  className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
                    isQuotaExhausted
                      ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                      : isScanning 
                        ? 'bg-neutral-800 text-neutral-400'
                        : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white active:scale-[0.99] border-none hover:shadow-purple-500/20'
                  }`}
                >
                  <Scan className="w-4 h-4 animate-pulse" />
                  <span>{isScanning ? 'Locking barcode...' : 'Start Scan Package Resi'}</span>
                </button>
              ) : processingState === 'IDLE' ? (
                <div className="flex gap-2">
                  {/* Reset cancel */}
                  <button
                    onClick={resetScanner}
                    disabled={isRecording}
                    className="px-4 py-3.5 bg-neutral-900/60 hover:bg-neutral-800 border border-white/5 text-neutral-300 rounded-xl font-bold text-xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Start or Stop record */}
                  {!isRecording ? (
                    <button
                      id="btn-record-video"
                      onClick={startRecording}
                      className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all border border-rose-500/20"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Record Proof (Max 100s)</span>
                    </button>
                  ) : (
                    <button
                      id="btn-stop-record"
                      onClick={stopRecording}
                      className="flex-1 py-3.5 bg-white hover:bg-neutral-100 text-black rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-all border border-white"
                    >
                      <VideoOff className="w-4 h-4 text-rose-600 animate-pulse" />
                      <span>Stop & Compress ({seconds}s)</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-3.5 bg-neutral-900 text-neutral-500 border border-white/5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  <span>Processing... Please Wait</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Operator session history feed list (Col span 5) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-[#0B0915]/90 rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col h-[600px] backdrop-blur-lg">
          <div className="border-b border-white/5 pb-4 flex justify-between items-center shrink-0">
            <div>
              <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" />
                Terminal Session Feed
              </h3>
              <p className="text-xs text-neutral-400">Video records logged by you.</p>
            </div>
            <span className="bg-purple-500/10 text-purple-300 font-mono font-bold text-[10px] px-3 py-1.5 rounded-full border border-purple-500/20">
              {myLogs.length} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {myLogs.map(log => (
              <div 
                key={log.transaction_id} 
                className={`p-4 rounded-2xl border border-white/5 text-xs transition-all flex flex-col justify-between gap-3 ${
                  log.status === 'DELETED' 
                    ? 'bg-neutral-950/20 opacity-50 border-dashed border-white/5' 
                    : 'bg-neutral-950/40 hover:bg-neutral-950/60 hover:border-purple-500/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] text-neutral-400 font-mono block">ID: {log.transaction_id}</span>
                    <span className="font-bold text-white text-sm font-mono mt-1 block tracking-tight">{log.tracking_number}</span>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                    log.type === 'ORDER'
                      ? 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-mono'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-mono'
                  }`}>
                    {log.type}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[11px] text-neutral-400 pt-2 border-t border-white/5 font-sans">
                  <span>Store: <strong className="text-white font-medium">{log.shop_name}</strong></span>
                  <div className="flex items-center gap-2 font-mono">
                    <span>{log.file_size_mb} MB</span>
                    <span className="text-neutral-600">|</span>
                    <span className={`font-bold ${log.status === 'READY' ? 'text-emerald-400' : 'text-rose-400 line-through'}`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {myLogs.length === 0 && (
              <div className="h-full flex flex-col justify-center items-center text-center p-6 text-neutral-400 italic">
                <p className="font-sans text-xs">No shipment proof recorded in this session. Go ahead, trigger scan and capture your first video!</p>
              </div>
            )}
          </div>

          {/* Quick instructions Footer */}
          <div className="bg-neutral-950/40 p-4 rounded-2xl border border-white/5 shrink-0">
            <h4 className="text-[10px] font-bold text-purple-300 uppercase font-mono tracking-wider mb-1.5">Standard warehouse SOP:</h4>
            <ol className="text-[10px] text-neutral-400 list-decimal pl-4 space-y-1 leading-relaxed font-sans">
              <li>Place package box clearly in conveyor view.</li>
              <li>Scan airway bill tracking number (RESI) via scanner.</li>
              <li>Record process wrapping and pasting tracking receipt sticker.</li>
              <li>Click stop before 100 seconds cutoff. System compresses and pushes.</li>
            </ol>
          </div>
        </div>
      </div>

    </div>
  );
}
