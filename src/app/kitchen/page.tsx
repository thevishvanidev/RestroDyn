'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat, Clock, Bell, CheckCircle, AlertCircle, Play, Pause, RefreshCw,
  Flame, Utensils, TrendingUp, X, Volume2, VolumeX, Maximize, Star
} from 'lucide-react';
import { useOrderStore } from '@/lib/store';

interface KitchenOrder {
  id: string;
  table: string;
  items: { name: string; quantity: number; notes: string }[];
  time: number;
  status: 'new' | 'preparing' | 'ready' | 'delayed';
  priority: 'normal' | 'rush' | 'vip';
}

export default function KitchenPage() {
  const storeOrders = useOrderStore((s) => s.orders);
  const updateStoreStatus = useOrderStore((s) => s.updateOrderStatus);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'preparing' | 'ready'>('all');
  const [fullscreen, setFullscreen] = useState(false);
  const [delayedOrders, setDelayedOrders] = useState<Set<string>>(new Set());
  const [, tick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const toKitchenStatus = (s: string): 'new' | 'preparing' | 'ready' | 'delayed' => {
    if (s === 'pending') return 'new';
    if (s === 'preparing') return 'preparing';
    if (s === 'ready') return 'ready';
    return 'new';
  };

  const toStoreStatus = (s: string) => {
    if (s === 'new') return 'pending';
    if (s === 'preparing') return 'preparing';
    if (s === 'ready') return 'ready';
    return 'pending';
  };

  const orders: KitchenOrder[] = storeOrders
    .filter(order => order.status !== 'served')
    .map(order => ({
      id: order.id,
      table: order.table.replace('table-', 'T-'),
      items: order.items.map(i => ({ name: i.name, quantity: i.quantity, notes: i.notes })),
      time: Math.floor((Date.now() - order.createdAt) / 1000),
      status: delayedOrders.has(order.id) ? 'delayed' : toKitchenStatus(order.status),
      priority: 'normal' as const,
    }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#ff6b35';
      case 'preparing': return '#00d4ff';
      case 'ready': return '#22c55e';
      case 'delayed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'rush': return { bg: 'bg-red-500', text: 'RUSH', icon: Flame };
      case 'vip': return { bg: 'bg-yellow-500', text: 'VIP', icon: Star };
      default: return null;
    }
  };

  const updateOrderStatus = (id: string, status: string) => {
    updateStoreStatus(id, toStoreStatus(status) as 'pending' | 'preparing' | 'ready' | 'served');
  };

  const filteredOrders = orders.filter(order => filter === 'all' || order.status === filter);
  const orderStats = { new: orders.filter(o => o.status === 'new').length, preparing: orders.filter(o => o.status === 'preparing').length, ready: orders.filter(o => o.status === 'ready').length, delayed: orders.filter(o => o.status === 'delayed').length };

  return (
    <div className={`min-h-screen bg-[#0a0a0f] ${fullscreen ? 'fixed inset-0 z-50' : ''}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blur-blob w-[800px] h-[800px] bg-[#ff6b35]/20 top-[-400px] left-[-200px]" />
        <div className="blur-blob w-[600px] h-[600px] bg-[#00d4ff]/10 bottom-[-200px] right-[-200px]" />
      </div>

      <header className="relative z-10 glass border-b border-[#2a2a3a]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] flex items-center justify-center">
              <ChefHat className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gradient">Kitchen Display</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="live-indicator"><span className="live-dot" /></span><span>Live Updates</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6b35]/10 border border-[#ff6b35]/30">
                <div className="w-3 h-3 rounded-full bg-[#ff6b35]" /><span className="font-bold text-[#ff6b35]">{orderStats.new}</span><span className="text-gray-400 text-sm">New</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00d4ff]/10 border border-[#00d4ff]/30">
                <div className="w-3 h-3 rounded-full bg-[#00d4ff]" /><span className="font-bold text-[#00d4ff]">{orderStats.preparing}</span><span className="text-gray-400 text-sm">Preparing</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30">
                <div className="w-3 h-3 rounded-full bg-green-500" /><span className="font-bold text-green-500">{orderStats.ready}</span><span className="text-gray-400 text-sm">Ready</span>
              </div>
              {orderStats.delayed > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" /><span className="font-bold text-red-500">{orderStats.delayed}</span><span className="text-gray-400 text-sm">Delayed</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${soundEnabled ? 'bg-[#22c55e]/20 text-green-500' : 'bg-[#1a1a24] text-gray-400'}`}>
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button onClick={() => setFullscreen(!fullscreen)} className="w-10 h-10 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-6 pb-4">
          {(['all', 'new', 'preparing', 'ready'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-6 py-2 rounded-xl font-semibold transition-all ${filter === f ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] text-white' : 'bg-[#1a1a24] text-gray-400 hover:text-white border border-[#2a2a3a] hover:border-[#ff6b35]'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && <span className="ml-2 px-2 py-0.5 rounded-lg bg-white/10 text-xs">{f === 'new' ? orderStats.new : f === 'preparing' ? orderStats.preparing : orderStats.ready}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 p-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.sort((a, b) => { const priorityOrder = { vip: 0, rush: 1, normal: 2 }; return priorityOrder[a.priority] - priorityOrder[b.priority]; }).map((order) => {
              const priorityBadge = getPriorityBadge(order.priority);
              const isOverTime = order.time > 300;
              return (
                <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`kitchen-card ${order.status === 'delayed' || isOverTime ? 'urgent' : order.status}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold" style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}>
                        {order.table.replace('T-', '')}
                      </div>
                      <div><p className="font-bold text-lg">{order.id}</p><p className="text-sm text-gray-400">Table {order.table}</p></div>
                    </div>
                    {priorityBadge && <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${priorityBadge.bg}`}><priorityBadge.icon className="w-4 h-4 text-white" /><span className="text-xs font-bold text-white">{priorityBadge.text}</span></div>}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2"><Clock className={`w-5 h-5 ${isOverTime ? 'text-red-500' : 'text-gray-400'}`} /><span className={`order-timer ${isOverTime ? 'text-red-500' : ''}`}>{formatTime(order.time)}</span></div>
                    <span className={`text-xs px-3 py-1 rounded-full status-${order.status}`}>{order.status}</span>
                  </div>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[#12121a]">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded bg-[#ff6b35] text-white text-xs font-bold flex items-center justify-center">{item.quantity}</span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        {item.notes && <span className="text-xs text-yellow-500 truncate max-w-[100px]">{item.notes}</span>}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {order.status === 'new' && <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="flex-1 py-3 rounded-xl bg-[#00d4ff]/20 text-[#00d4ff] font-semibold hover:bg-[#00d4ff]/30 transition-all flex items-center justify-center gap-2"><Play className="w-4 h-4" />Start</button>}
                    {order.status === 'preparing' && <button onClick={() => updateOrderStatus(order.id, 'ready')} className="flex-1 py-3 rounded-xl bg-green-500/20 text-green-500 font-semibold hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" />Ready</button>}
                    {order.status === 'ready' && <button onClick={() => updateStoreStatus(order.id, 'served')} className="flex-1 py-3 rounded-xl bg-[#a855f7]/20 text-[#a855f7] font-semibold hover:bg-[#a855f7]/30 transition-all flex items-center justify-center gap-2"><Utensils className="w-4 h-4" />Served</button>}
                    <button onClick={() => {
                      if (delayedOrders.has(order.id)) {
                        setDelayedOrders(prev => { const next = new Set(prev); next.delete(order.id); return next; });
                      } else {
                        setDelayedOrders(prev => new Set(prev).add(order.id));
                      }
                    }} className={`py-3 px-4 rounded-xl border transition-all ${delayedOrders.has(order.id) ? 'border-green-500 text-green-500 hover:bg-green-500/10' : 'border-[#2a2a3a] text-gray-400 hover:border-red-500 hover:text-red-500'}`}>
                      {delayedOrders.has(order.id) ? <Play className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        {filteredOrders.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-[#1a1a24] mx-auto mb-6 flex items-center justify-center"><CheckCircle className="w-12 h-12 text-green-500" /></div>
            <h2 className="text-2xl font-bold mb-2">All Caught Up!</h2><p className="text-gray-400">No orders in this category</p>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 glass border-t border-[#2a2a3a] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2"><Utensils className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Total Orders Today:</span><span className="font-bold text-[#ff6b35]">{orders.length}</span></div>
            <div className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-gray-400" /><span className="text-gray-400">Avg. Prep Time:</span><span className="font-bold text-[#00d4ff]">8:45</span></div>
          </div>
          <div className="flex items-center gap-4"><span className="text-sm text-gray-400">Last updated: {new Date().toLocaleTimeString()}</span></div>
        </div>
      </footer>
    </div>
  );
}