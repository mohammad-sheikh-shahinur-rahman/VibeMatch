import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/auth';
import { Users as UsersIcon, Video, Shield, DollarSign, Settings as SettingsIcon, LogOut, Lock, Search, Plus, Ban, CheckCircle, XCircle, AlertTriangle, Save, RefreshCw, Key, Database, Globe, Smartphone, Mail, Zap, ShieldCheck, Gift as GiftIcon, ShoppingBag, Trash2, ChevronDown, Server, Calendar, MessageSquare, Diamond, Crown, Activity, PieChart, TrendingUp, DollarSign as Dollar } from 'lucide-react';

export const OverviewTab = (props: any) => {
  const { serverHealth, navigate } = props;

  const [period, setPeriod] = useState('today');
  const [metrics, setMetrics] = useState<any>({
    activeUsers: 0,
    matchSessions: 0,
    messagesSent: 0,
    giftsSent: 0,
    gemsSpent: 0,
    activeVips: 0,
    totalRevenue: 0,
    totalPurchases: 0,
    genderDistribution: { male: 0, female: 0 },
    topCountries: [],
    chartData: [],
    loading: true
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchMetrics = async (selectedPeriod: string) => {
    setMetrics((prev: any) => ({ ...prev, loading: true }));
    try {
      const data = await apiFetch(`/api/admin/metrics?period=${selectedPeriod}`);
      if (data) {
        setMetrics({
          ...data,
          loading: false
        });
      } else {
        setMetrics((prev: any) => ({ ...prev, loading: false }));
      }
    } catch (e) {
      console.error(e);
      setMetrics((prev: any) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchMetrics(period);
  }, [period]);

  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7days', label: '7 Days' },
    { value: '1month', label: '1 Month' },
    { value: '3months', label: '3 Months' },
    { value: '1year', label: '1 Year' },
    { value: 'alltime', label: 'All Time' }
  ];

  // Logic to calculate max height for charts
  const maxChartValue = Math.max(...(metrics.chartData || []).map((d: any) => Math.max(d.users || 0, d.matches || 0, d.messages || 0, 1)));

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 bg-gray-900/50 p-2 rounded-2xl w-max mb-6 border border-gray-800">
            <button className="px-6 py-2 bg-[#1a1c23] text-white font-bold text-sm rounded-xl border border-gray-700 shadow-sm flex items-center space-x-2">
              <Activity className="w-4 h-4 text-[#00E676]" />
              <span>Real-time</span>
            </button>
            <button className="px-6 py-2 text-gray-400 font-bold text-sm hover:text-white transition" onClick={() => navigate('/')}>
              Go to Web App
            </button>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white flex items-center space-x-3 tracking-tight">
            <Activity className="w-8 h-8 text-[#00E676]" />
            <span>System Dashboard</span>
          </h1>
          <p className="text-xs text-gray-400 mt-2">Professional real-time telemetry & server metrics</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-5 py-3 rounded-xl border border-gray-700 flex items-center space-x-3 transition shadow-inner"
            >
              <Calendar className="w-4 h-4 text-[#00E676]" />
              <span>{periodOptions.find(p => p.value === period)?.label}</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full mt-2 right-0 w-48 bg-[#1a1c23] border border-gray-700 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                {periodOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setPeriod(opt.value);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-xs font-bold transition-colors ${
                      period === opt.value ? 'bg-[#00E676]/10 text-[#00E676]' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards PRO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-[#181a20] border border-gray-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:border-[#00E676]/30 transition-all">
          {metrics.loading && <div className="absolute inset-0 bg-[#181a20]/80 flex items-center justify-center backdrop-blur-sm z-10"><RefreshCw className="w-5 h-5 text-[#00E676] animate-spin" /></div>}
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">New Users</span>
            <UsersIcon className="w-4 h-4 text-[#00E676] opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{metrics.activeUsers.toLocaleString()}</div>
          <span className="text-[10px] text-[#00E676] font-bold mt-2 block">Registered {periodOptions.find(p => p.value === period)?.label.toLowerCase()}</span>
        </div>

        <div className="bg-[#181a20] border border-gray-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          {metrics.loading && <div className="absolute inset-0 bg-[#181a20]/80 flex items-center justify-center backdrop-blur-sm z-10"><RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" /></div>}
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Video Matches</span>
            <Video className="w-4 h-4 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{metrics.matchSessions.toLocaleString()}</div>
          <span className="text-[10px] text-gray-400 mt-2 block">Total sessions</span>
        </div>

        <div className="bg-[#181a20] border border-gray-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:border-amber-400/30 transition-all">
          {metrics.loading && <div className="absolute inset-0 bg-[#181a20]/80 flex items-center justify-center backdrop-blur-sm z-10"><RefreshCw className="w-5 h-5 text-amber-400 animate-spin" /></div>}
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Revenue</span>
            <Dollar className="w-4 h-4 text-amber-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-white mt-3">${metrics.totalRevenue.toLocaleString()}</div>
          <span className="text-[10px] text-amber-400 mt-2 block">{metrics.totalPurchases} purchases</span>
        </div>

        <div className="bg-[#181a20] border border-gray-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-all">
          {metrics.loading && <div className="absolute inset-0 bg-[#181a20]/80 flex items-center justify-center backdrop-blur-sm z-10"><RefreshCw className="w-5 h-5 text-purple-400 animate-spin" /></div>}
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gems Spent</span>
            <Diamond className="w-4 h-4 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{metrics.gemsSpent.toLocaleString()}</div>
          <span className="text-[10px] text-gray-400 mt-2 block">Total virtual gems used</span>
        </div>

        <div className="bg-[#181a20] border border-gray-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:border-blue-400/30 transition-all">
          {metrics.loading && <div className="absolute inset-0 bg-[#181a20]/80 flex items-center justify-center backdrop-blur-sm z-10"><RefreshCw className="w-5 h-5 text-blue-400 animate-spin" /></div>}
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Messages</span>
            <MessageSquare className="w-4 h-4 text-blue-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{metrics.messagesSent.toLocaleString()}</div>
          <span className="text-[10px] text-gray-400 mt-2 block">Total text messages</span>
        </div>

        <div className="bg-[#181a20] border border-gray-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:border-yellow-400/30 transition-all">
          {metrics.loading && <div className="absolute inset-0 bg-[#181a20]/80 flex items-center justify-center backdrop-blur-sm z-10"><RefreshCw className="w-5 h-5 text-yellow-400 animate-spin" /></div>}
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Active VIPs</span>
            <Crown className="w-4 h-4 text-yellow-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{metrics.activeVips.toLocaleString()}</div>
          <span className="text-[10px] text-gray-400 mt-2 block">Currently subscribed users</span>
        </div>

        <div className="bg-[#181a20] border border-gray-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:border-pink-400/30 transition-all">
          {metrics.loading && <div className="absolute inset-0 bg-[#181a20]/80 flex items-center justify-center backdrop-blur-sm z-10"><RefreshCw className="w-5 h-5 text-pink-400 animate-spin" /></div>}
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gifts Sent</span>
            <GiftIcon className="w-4 h-4 text-pink-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{metrics.giftsSent.toLocaleString()}</div>
          <span className="text-[10px] text-gray-400 mt-2 block">Total virtual gifts sent</span>
        </div>

        <div className="bg-[#181a20] border border-gray-800 p-5 rounded-3xl shadow-lg relative overflow-hidden group hover:border-emerald-400/30 transition-all">
          {metrics.loading && <div className="absolute inset-0 bg-[#181a20]/80 flex items-center justify-center backdrop-blur-sm z-10"><RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" /></div>}
          <div className="flex items-start justify-between">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Purchases</span>
            <ShoppingBag className="w-4 h-4 text-emerald-400 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-3xl font-black text-white mt-3">{metrics.totalPurchases.toLocaleString()}</div>
          <span className="text-[10px] text-gray-400 mt-2 block">Total payment transactions</span>
        </div>

      </div>

      {/* Analytics Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Chart Visualiser */}
        <div className="lg:col-span-2 bg-[#181a20] border border-gray-800 p-6 rounded-3xl shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-white">Activity Volume Timeline</h3>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-[#00E676]"></div><span className="text-[10px] text-gray-400">Users</span></div>
              <div className="flex items-center space-x-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] text-gray-400">Matches</span></div>
            </div>
          </div>
          
          <div className="h-56 flex items-end justify-between space-x-1 sm:space-x-2 pt-6">
            {metrics.chartData && metrics.chartData.length > 0 ? metrics.chartData.map((d: any, idx: number) => {
              const uHeight = maxChartValue > 0 ? (d.users / maxChartValue) * 100 : 0;
              const mHeight = maxChartValue > 0 ? (d.matches / maxChartValue) * 100 : 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-16 bg-gray-900 border border-gray-700 text-xs p-2 rounded-lg pointer-events-none transition-opacity z-10 w-max shadow-xl">
                    <div className="font-bold text-white mb-1">{d.label}</div>
                    <div className="text-[#00E676]">{d.users} Users</div>
                    <div className="text-indigo-400">{d.matches} Matches</div>
                  </div>

                  <div className="w-full flex flex-row items-end justify-center space-x-[1px] h-full">
                    <div style={{ height: `${Math.max(uHeight, 2)}%` }} className="w-1/2 bg-[#00E676]/40 group-hover:bg-[#00E676] rounded-t-sm transition-all duration-300" />
                    <div style={{ height: `${Math.max(mHeight, 2)}%` }} className="w-1/2 bg-indigo-500/40 group-hover:bg-indigo-500 rounded-t-sm transition-all duration-300" />
                  </div>
                  <span className="text-[8px] sm:text-[9px] text-gray-600 mt-2 font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{d.label}</span>
                </div>
              );
            }) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">No activity recorded for this period</div>
            )}
          </div>
        </div>

        {/* Demographics */}
        <div className="bg-[#181a20] border border-gray-800 p-6 rounded-3xl shadow-lg flex flex-col">
          <h3 className="text-sm font-black text-white mb-6">User Demographics</h3>
          
          {/* Gender Split */}
          <div className="mb-8">
            <div className="flex justify-between text-xs mb-2">
              <span className="text-blue-400 font-bold">Male ({metrics.genderDistribution?.male || 0})</span>
              <span className="text-pink-400 font-bold">Female ({metrics.genderDistribution?.female || 0})</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${((metrics.genderDistribution?.male || 0) / (Math.max(1, (metrics.genderDistribution?.male || 0) + (metrics.genderDistribution?.female || 0)))) * 100}%` }}
              />
              <div 
                className="bg-pink-500 h-full" 
                style={{ width: `${((metrics.genderDistribution?.female || 0) / (Math.max(1, (metrics.genderDistribution?.male || 0) + (metrics.genderDistribution?.female || 0)))) * 100}%` }}
              />
            </div>
          </div>

          {/* Top Countries */}
          <div className="flex-1">
            <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-4">Top Countries</h4>
            <div className="space-y-4">
              {metrics.topCountries && metrics.topCountries.length > 0 ? metrics.topCountries.map((c: any, i: number) => {
                const totalUsers = Math.max(1, (metrics.activeUsers || 1));
                const percentage = ((c.count / totalUsers) * 100).toFixed(1);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300 font-bold">{c.country}</span>
                      <span className="text-gray-500">{c.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="bg-[#00E676] h-full" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              }) : (
                <div className="text-gray-500 text-xs text-center py-4">No country data</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
