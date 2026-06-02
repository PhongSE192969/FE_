import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, Clock, Play, RefreshCw, Save, CheckCircle2,
  AlertTriangle, Loader2, Sliders, Zap, Database, Settings2, Info
} from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useLanguageStore } from '@/stores';
import { translations } from '@/locales';

const CARD = "bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow";
const LABEL = "text-sm font-semibold text-gray-700";
const INPUT = "w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all";
const BTN_PRIMARY = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";

export default function AISettingsManagement() {
  const { language } = useLanguageStore();
  const t = (translations[language] || translations.vi).admin?.aiSettingsManagement || {};

  // ─── State ───────────────────────────────────────────────────
  const [config, setConfig] = useState({
    w_core: 0.4,
    w_desc: 0.6,
    schedule_enabled: false,
    schedule_interval_hours: 24,
  });
  const [editWeights, setEditWeights] = useState({ w_core: '0.4', w_desc: '0.6' });
  const [editSchedule, setEditSchedule] = useState({ enabled: false, interval: '24' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ weights: false, schedule: false });
  const [training, setTraining] = useState({ async: false, vectorStore: false });
  const [modelStatus, setModelStatus] = useState(null);
  const [toast, setToast] = useState(null);

  // ─── Toast ───────────────────────────────────────────────────
  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ─── Load config ─────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await aiService.getConfig();
      const data = res?.data || res;
      setConfig(data);
      setEditWeights({ w_core: String(data.w_core), w_desc: String(data.w_desc) });
      setEditSchedule({ enabled: data.schedule_enabled, interval: String(data.schedule_interval_hours) });
    } catch (err) {
      console.error('Failed to load config:', err);
      showToast('error', t.alerts?.loadFailed || 'Không thể tải config từ AI Service');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await aiService.getRecommendModelStatus();
      setModelStatus(res?.data || res);
    } catch {
      setModelStatus(null);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchConfig, fetchStatus]);

  // ─── Handlers ────────────────────────────────────────────────
  const handleWeightChange = (field, value) => {
    // Allow empty or valid decimal input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      const newW = { ...editWeights, [field]: value };
      // Auto-calculate the other field
      const num = parseFloat(value);
      if (!isNaN(num) && num >= 0 && num <= 1) {
        const other = field === 'w_core' ? 'w_desc' : 'w_core';
        newW[other] = (1 - num).toFixed(4).replace(/\.?0+$/, '');
      }
      setEditWeights(newW);
    }
  };

  const saveWeights = async () => {
    const wCore = parseFloat(editWeights.w_core);
    const wDesc = parseFloat(editWeights.w_desc);
    if (isNaN(wCore) || isNaN(wDesc) || wCore < 0 || wDesc < 0) {
      showToast('error', t.alerts?.invalidWeight || 'Giá trị weight không hợp lệ');
      return;
    }
    if (Math.abs(wCore + wDesc - 1.0) > 0.01) {
      showToast('error', (t.alerts?.weightSum || 'Tổng weights phải bằng 1.0') + ` (hiện tại = ${(wCore + wDesc).toFixed(4)})`);
      return;
    }
    setSaving(s => ({ ...s, weights: true }));
    try {
      const res = await aiService.updateConfig({ w_core: wCore, w_desc: wDesc });
      const data = res?.data || res;
      setConfig(c => ({ ...c, w_core: data.w_core, w_desc: data.w_desc }));
      showToast('success', t.alerts?.updateWeightsSuccess || 'Cập nhật weights thành công!');
    } catch (err) {
      showToast('error', err?.response?.data?.detail || 'Lỗi khi cập nhật weights');
    } finally {
      setSaving(s => ({ ...s, weights: false }));
    }
  };

  const saveSchedule = async () => {
    const interval = parseInt(editSchedule.interval);
    if (isNaN(interval) || interval < 1) {
      showToast('error', 'Interval phải >= 1 giờ');
      return;
    }
    setSaving(s => ({ ...s, schedule: true }));
    try {
      await aiService.updateConfig({
        schedule_enabled: editSchedule.enabled,
        schedule_interval_hours: interval,
      });
      setConfig(c => ({ ...c, schedule_enabled: editSchedule.enabled, schedule_interval_hours: interval }));
      showToast('success', t.alerts?.updateScheduleSuccess || 'Cập nhật lịch tự động thành công!');
    } catch (err) {
      showToast('error', err?.response?.data?.detail || 'Lỗi khi cập nhật schedule');
    } finally {
      setSaving(s => ({ ...s, schedule: false }));
    }
  };

  const trainNow = async () => {
    setTraining(t => ({ ...t, async: true }));
    try {
      const res = await aiService.trainRecommendModelAsync();
      showToast('success', t.alerts?.trainStarted || 'Đã bắt đầu train model!');
      setTimeout(fetchStatus, 2000);
    } catch (err) {
      showToast('error', err?.response?.data?.detail || 'Lỗi khi train model');
    } finally {
      setTraining(t => ({ ...t, async: false }));
    }
  };

  const updateVectorStore = async () => {
    setTraining(t => ({ ...t, vectorStore: true }));
    try {
      const res = await aiService.updateVectorStore();
      showToast('success', t.alerts?.updateVectorSuccess || 'Cập nhật Vector Store thành công!');
    } catch (err) {
      showToast('error', err?.response?.data?.detail || 'Lỗi khi cập nhật Vector Store');
    } finally {
      setTraining(t => ({ ...t, vectorStore: false }));
    }
  };

  // ─── Computed ────────────────────────────────────────────────
  const wCoreNum = parseFloat(editWeights.w_core) || 0;
  const wDescNum = parseFloat(editWeights.w_desc) || 0;
  const weightSum = wCoreNum + wDescNum;
  const weightsValid = Math.abs(weightSum - 1.0) <= 0.01 && wCoreNum >= 0 && wDescNum >= 0;
  const weightsChanged = parseFloat(editWeights.w_core) !== config.w_core || parseFloat(editWeights.w_desc) !== config.w_desc;

  // ─── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t.loading || "Đang tải AI Settings..."}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-7xl mx-auto pb-10"
    >
      {/* ─── Toast ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className={`fixed top-6 left-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl text-sm font-bold flex items-center gap-2 ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Header & Actions ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Brain size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900">{t.title || "AI Settings Management"}</h2>
            <p className="text-sm text-gray-500">{t.subtitle || "Monitor and configure AI system parameters"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => { fetchConfig(); fetchStatus(); }}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
            title={t.actions?.buttons?.refresh || "Refresh"}
          >
            <RefreshCw size={18} />
          </button>
          
          <button
            onClick={updateVectorStore}
            disabled={training.vectorStore}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            {training.vectorStore ? (
              <Loader2 size={16} className="animate-spin text-teal-500" />
            ) : (
              <Database size={16} className="text-teal-500" />
            )}
            {t.overview?.syncVector || t.actions?.buttons?.updateVector || "Sync Vector Store"}
          </button>

          <button
            onClick={trainNow}
            disabled={training.async || modelStatus?.is_training}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50"
          >
            {training.async || modelStatus?.is_training ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Play size={18} fill="currentColor" />
            )}
            {t.actions?.buttons?.buildNow || "Build Recommendation Model"}
          </button>
        </div>
      </div>

      {/* ─── System Overview Cards (Top) ───────────────────────── */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 px-1">
          <Settings2 size={20} className="text-gray-400" />
          {t.overview?.systemStatus || t.actions?.buttons?.currentConfig || "Current System Status"}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Weights Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="flex justify-between items-start mb-6 relative">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <Sliders size={24} />
              </div>
            </div>
            <div className="relative">
              <p className="text-gray-500 text-sm font-semibold mb-2">{t.overview?.semanticWeights || t.searchWeights?.title || "Semantic Weights"}</p>
              <div className="flex items-end gap-3">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">{t.overview?.core || "Core"}</span>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">{config.w_core}</div>
                </div>
                <div className="w-px h-8 bg-gray-200 mb-0.5" />
                <div>
                  <span className="text-gray-400 text-[10px] uppercase tracking-wider font-bold">{t.overview?.desc || "Desc"}</span>
                  <div className="text-2xl font-black text-gray-900 leading-none mt-1">{config.w_desc}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${config.schedule_enabled ? 'bg-amber-50/50' : 'bg-gray-50/50'}`} />
            <div className="flex justify-between items-start mb-6 relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.schedule_enabled ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                <Clock size={24} />
              </div>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${config.schedule_enabled ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                {config.schedule_enabled ? (t.overview?.active || 'Active') : (t.overview?.disabled || 'Disabled')}
              </span>
            </div>
            <div className="relative">
              <p className="text-gray-500 text-sm font-semibold mb-2">{t.schedule?.title || "Auto-Train Schedule"}</p>
              <div className="text-2xl font-black text-gray-900 leading-none">
                {config.schedule_enabled ? (
                  <span className="flex items-baseline gap-1">
                    {config.schedule_interval_hours}<span className="text-sm font-semibold text-gray-500">{t.overview?.hours || "h"}</span>
                  </span>
                ) : 'OFF'}
              </div>
            </div>
          </div>

          {/* Model Status Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 ${!modelStatus ? 'bg-gray-50/50' : modelStatus.is_training ? 'bg-indigo-50/50' : modelStatus.is_ready ? 'bg-emerald-50/50' : 'bg-red-50/50'}`} />
            <div className="flex justify-between items-start mb-6 relative">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${!modelStatus ? 'bg-gray-100 text-gray-400' : modelStatus.is_training ? 'bg-indigo-100 text-indigo-600' : modelStatus.is_ready ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {modelStatus?.is_training ? <Loader2 size={24} className="animate-spin" /> : <Brain size={24} />}
              </div>
              {modelStatus?.is_training && (
                <span className="px-2.5 py-1 text-[10px] uppercase tracking-wider font-extrabold bg-indigo-100 text-indigo-700 rounded-full animate-pulse border border-indigo-200 shadow-sm">
                  Training
                </span>
              )}
            </div>
            <div className="relative">
              <p className="text-gray-500 text-sm font-semibold mb-2">{t.actions?.status?.model || "Recommendation Model"}</p>
              <div className="text-xl font-black text-gray-900 leading-tight">
                {!modelStatus ? (t.overview?.loading || 'Loading...') : modelStatus.is_training ? (t.actions?.status?.trainingActive || 'Training...') : modelStatus.is_ready ? (t.actions?.status?.ready || 'Ready to use') : (t.actions?.status?.notTrained || 'Not trained')}
              </div>
            </div>
          </div>

          {/* Snapshot Card */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            <div className="flex justify-between items-start mb-6 relative">
              <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                <Database size={24} />
              </div>
            </div>
            <div className="relative overflow-hidden">
              <p className="text-gray-500 text-sm font-semibold mb-2">{t.actions?.status?.snapshot || "Current Snapshot"}</p>
              <div className="text-lg font-bold text-gray-900 truncate" title={modelStatus?.current_snapshot}>
                {modelStatus?.current_snapshot || t.overview?.none || 'None'}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Configuration Details ─────────────────────────────── */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 px-1">
          <Sliders size={20} className="text-gray-400" />
          {t.overview?.detailedConfig || "Detailed Configurations"}
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* 1. Semantic Search Weights */}
          <div className={CARD + " overflow-hidden flex flex-col"}>
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Sliders size={22} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t.searchWeights?.title || "Semantic Search Weights"}</h3>
                  <p className="text-sm text-gray-500">{t.searchWeights?.subtitle || "Điều chỉnh trọng số các thành phần cho semantic search"}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6 flex-1 flex flex-col">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <Info size={18} className="text-blue-500 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800 leading-relaxed">
                  {t.searchWeights?.info || (
                    <>
                      <strong>w_core</strong> — trọng số cho tên sản phẩm + danh mục.<br />
                      <strong>w_desc</strong> — trọng số cho mô tả sản phẩm.<br />
                      Tổng <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-sm shadow-sm">w_core + w_desc</code> phải bằng <strong>1.0</strong>.
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                {/* w_core */}
                <div className="space-y-2">
                  <label className={LABEL + " flex justify-between"}>
                    <span>w_core</span>
                    <span className="text-gray-400 font-normal">({t.searchWeights?.wCoreLabel || "tên + danh mục"})</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editWeights.w_core}
                    onChange={(e) => handleWeightChange('w_core', e.target.value)}
                    className={INPUT + " text-lg font-bold"}
                    placeholder="0.4"
                  />
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full shadow-inner"
                      initial={false}
                      animate={{ width: `${Math.min(wCoreNum * 100, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* w_desc */}
                <div className="space-y-2">
                  <label className={LABEL + " flex justify-between"}>
                    <span>w_desc</span>
                    <span className="text-gray-400 font-normal">({t.searchWeights?.wDescLabel || "mô tả"})</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editWeights.w_desc}
                    onChange={(e) => handleWeightChange('w_desc', e.target.value)}
                    className={INPUT + " text-lg font-bold"}
                    placeholder="0.6"
                  />
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden mt-3">
                    <motion.div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full shadow-inner"
                      initial={false}
                      animate={{ width: `${Math.min(wDescNum * 100, 100)}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 gap-4">
                <div className={`text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-xl ${weightsValid ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {weightsValid ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                  {t.searchWeights?.sumLabel || "Tổng:"} {weightSum.toFixed(4)} {weightsValid ? '✓' : '(≠ 1.0)'}
                </div>
                <button
                  onClick={saveWeights}
                  disabled={saving.weights || !weightsValid || !weightsChanged}
                  className={`${BTN_PRIMARY} px-6 w-full sm:w-auto justify-center ${
                    weightsValid && weightsChanged
                      ? 'bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {saving.weights ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {t.searchWeights?.updateBtn || "Cập nhật Weights"}
                </button>
              </div>
            </div>
          </div>

          {/* 2. Schedule Auto-Train */}
          <div className={CARD + " overflow-hidden flex flex-col"}>
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                  <Clock size={22} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t.schedule?.title || "Lịch Auto-Train Recommendation"}</h3>
                  <p className="text-sm text-gray-500">{t.schedule?.subtitle || "Tự động build lại model gợi ý sản phẩm theo chu kỳ"}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6 flex-1 flex flex-col">
              <div className={`flex items-center justify-between p-5 border rounded-xl transition-colors duration-300 ${editSchedule.enabled ? 'bg-amber-50/50 border-amber-100' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <p className="text-base font-bold text-gray-900">{t.schedule?.autoTrain || "Tự động train"}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{t.schedule?.autoTrainDesc || "Model sẽ tự động build lại theo chu kỳ đã thiết lập"}</p>
                </div>
                <button
                  onClick={() => setEditSchedule(s => ({ ...s, enabled: !s.enabled }))}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 shadow-inner ${
                    editSchedule.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <motion.div
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                    initial={false}
                    animate={{ left: editSchedule.enabled ? '1.75rem' : '0.25rem' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              <div className="space-y-3">
                <label className={LABEL}>{t.schedule?.interval || "Chu kỳ (giờ)"}</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    min="1"
                    max="720"
                    value={editSchedule.interval}
                    onChange={(e) => setEditSchedule(s => ({ ...s, interval: e.target.value }))}
                    disabled={!editSchedule.enabled}
                    className={`${INPUT} disabled:opacity-50 disabled:bg-gray-50 max-w-[140px] text-lg font-bold text-center`}
                  />
                  <div className={`text-sm py-2.5 px-4 rounded-xl font-medium border flex-1 text-center transition-colors ${editSchedule.enabled ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                    {(() => {
                      const h = parseInt(editSchedule.interval) || 0;
                      const d = Math.floor(h / 24);
                      const rem = h % 24;
                      const label = t.schedule?.intervalLabel || "= {day} ngày {hour} giờ";
                      return label.replace("{day}", d).replace("{hour}", rem > 0 ? rem : 0);
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 flex justify-end border-t border-gray-100">
                <button
                  onClick={saveSchedule}
                  disabled={saving.schedule || (editSchedule.enabled === config.schedule_enabled && editSchedule.interval === String(config.schedule_interval_hours))}
                  className={`${BTN_PRIMARY} px-6 w-full sm:w-auto justify-center ${
                    !(editSchedule.enabled === config.schedule_enabled && editSchedule.interval === String(config.schedule_interval_hours))
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-md shadow-amber-500/20 text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-200'
                  }`}
                >
                  {saving.schedule ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {t.schedule?.saveBtn || "Lưu lịch tự động"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

    </motion.div>
  );
}
