'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Utensils, ChefHat, BarChart3, Users, Settings, Bell,
  Search, Plus, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Menu, X,
  CreditCard, Building2, Zap, QrCode, Download, Eye, Edit, Trash2, Clock, Star
} from 'lucide-react';
import { useOrderStore } from '@/lib/store';

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'orders', icon: ShoppingCart, label: 'Orders' },
  { id: 'menu', icon: Utensils, label: 'Menu' },
  { id: 'tables', icon: QrCode, label: 'Tables' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'payments', icon: CreditCard, label: 'Payments' },
  { id: 'settings', icon: Settings, label: 'Settings' }
];

const menuItems = [
  { id: 1, name: 'Tandoori Chicken', category: 'Starters', price: 350, stock: 'In Stock', popular: true },
  { id: 2, name: 'Palak Paneer', category: 'Main Course', price: 280, stock: 'In Stock', popular: true },
  { id: 3, name: 'Chicken Biryani', category: 'Biryani', price: 320, stock: 'Low Stock', popular: true },
  { id: 4, name: 'Masala Chai', category: 'Beverages', price: 40, stock: 'In Stock', popular: false },
  { id: 5, name: 'Butter Chicken', category: 'Main Course', price: 380, stock: 'In Stock', popular: true }
];

const timeAgo = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
};

export default function AdminPage() {
  const orders = useOrderStore((s) => s.orders);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const activeOrders = useMemo(() => orders.filter(o => o.status !== 'served'), [orders]);
  const totalRevenue = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders]);
  const avgOrderValue = useMemo(() => orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0, [orders, totalRevenue]);

  const stats = [
    { label: "Today's Revenue", value: `₹${totalRevenue.toLocaleString()}`, change: '+12.5%', up: true, icon: DollarSign },
    { label: 'Active Orders', value: `${activeOrders.length}`, change: '+8', up: true, icon: ShoppingCart },
    { label: 'Avg. Order Value', value: `₹${avgOrderValue}`, change: '+5.2%', up: true, icon: TrendingUp },
    { label: 'Table Occupancy', value: `${Math.min(100, activeOrders.length * 8)}%`, change: '-3%', up: false, icon: Building2 }
  ];

  const recentOrders = useMemo(() => [...orders].sort((a, b) => b.createdAt - a.createdAt).slice(0, 10).map(o => ({
    id: o.id,
    table: o.table.replace('table-', 'T-'),
    items: o.items.map(i => i.name).join(', '),
    total: o.total,
    time: timeAgo(o.createdAt),
    status: o.status === 'served' ? 'completed' : o.status,
  })), [orders]);

  const notifications = useMemo(() => [
    ...orders.filter(o => o.status === 'pending').slice(0, 3).map(o => ({
      id: Date.now() + Math.random(),
      type: 'order' as const,
      message: `New order from ${o.table.replace('table-', 'Table ')}`,
      time: timeAgo(o.createdAt),
      priority: 'high' as const,
    })),
    ...orders.filter(o => o.status === 'served').slice(0, 3).map(o => ({
      id: Date.now() + Math.random() + 1,
      type: 'payment' as const,
      message: `Payment received: ₹${o.total}`,
      time: timeAgo(o.createdAt),
      priority: 'low' as const,
    })),
  ], [orders]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blur-blob w-[600px] h-[600px] bg-[#ff6b35] top-[-200px] left-[-200px]" />
        <div className="blur-blob w-[400px] h-[400px] bg-[#00d4ff] bottom-0 right-[-100px]" />
        <div className="absolute inset-0 grid-bg opacity-30" />
      </div>

      <motion.aside initial={false} animate={{ width: sidebarOpen ? 260 : 80 }} className="fixed left-0 top-0 bottom-0 glass border-r border-[#2a2a3a] z-40 flex flex-col">
        <div className="p-4 border-b border-[#2a2a3a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-bold text-gradient">RestroDyn</motion.span>}
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveNav(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeNav === item.id ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] text-white' : 'text-gray-400 hover:bg-[#1a1a24] hover:text-white'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{item.label}</motion.span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[#2a2a3a]">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center justify-center p-3 rounded-xl text-gray-400 hover:bg-[#1a1a24] hover:text-white transition-all">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.aside>

      <main className="flex-1 ml-[260px] transition-all">
        <header className="sticky top-0 z-30 glass border-b border-[#2a2a3a]">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold capitalize">{activeNav.replace('-', ' ')}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="live-indicator"><span className="live-dot" /></span><span>Live</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Search..." className="w-64 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl py-2.5 pl-12 pr-4 text-white placeholder-gray-500 input-glow" />
              </div>
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-10 h-10 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center">
                <Bell className="w-5 h-5 text-gray-400" /><span className="notification-badge">{notifications.length}</span>
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7] to-[#6366f1] flex items-center justify-center"><span className="font-bold">A</span></div>
                <div className="hidden md:block"><p className="font-semibold">Admin User</p><p className="text-xs text-gray-400">Demo Restaurant</p></div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-[#ff6b35]/10 flex items-center justify-center"><stat.icon className="w-6 h-6 text-[#ff6b35]" /></div>
                      <div className={`flex items-center gap-1 text-sm ${stat.up ? 'text-green-500' : 'text-red-500'}`}>{stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}{stat.change}</div>
                    </div>
                    <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="analytics-widget">
                  <h3 className="text-lg font-bold mb-6">Recent Orders</h3>
                  <div className="space-y-3">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#ff6b35]/10 flex items-center justify-center"><span className="font-bold text-[#ff6b35]">{order.table}</span></div>
                          <div><p className="font-semibold">{order.id}</p><p className="text-xs text-gray-400">{order.items}</p></div>
                        </div>
                        <div className="text-right"><p className="font-bold text-[#ff6b35]">₹{order.total}</p><span className={`text-xs px-2 py-0.5 rounded-full status-${order.status}`}>{order.status}</span></div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="analytics-widget">
                  <h3 className="text-lg font-bold mb-6">Popular Items</h3>
                  <div className="space-y-3">
                    {menuItems.map((item, i) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-[#1a1a24] flex items-center justify-center text-gray-400 font-bold">#{i + 1}</div>
                          <div><p className="font-semibold flex items-center gap-2">{item.name}{item.popular && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}</p><p className="text-xs text-gray-400">{item.category}</p></div>
                        </div>
                        <div className="text-right"><p className="font-bold">₹{item.price}</p><span className={`text-xs ${item.stock === 'Low Stock' ? 'text-yellow-500' : 'text-green-500'}`}>{item.stock}</span></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ icon: Plus, label: 'Add Menu Item', color: '#ff6b35' }, { icon: QrCode, label: 'Generate QR', color: '#00d4ff' }, { icon: Users, label: 'Add Staff', color: '#a855f7' }, { icon: Settings, label: 'Settings', color: '#22c55e' }].map((action, i) => (
                  <button key={i} className="stat-card flex items-center justify-center gap-3 hover:scale-105 transition-transform">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${action.color}20` }}><action.icon className="w-5 h-5" style={{ color: action.color }} /></div>
                    <span className="font-semibold">{action.label}</span>
                  </button>
                ))}
              </motion.div>
            </div>
          )}

          {activeNav === 'orders' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">All Orders</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{orders.filter(o => o.status === 'pending').length} pending</span>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-400">{orders.filter(o => o.status === 'preparing').length} preparing</span>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-400">{orders.filter(o => o.status === 'ready').length} ready</span>
                </div>
              </div>
              <div className="space-y-3">
                {[...orders].sort((a, b) => b.createdAt - a.createdAt).map((order) => (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a24] border border-[#2a2a3a]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#ff6b35]/10 flex items-center justify-center">
                        <span className="font-bold text-[#ff6b35]">{order.table.replace('table-', 'T-')}</span>
                      </div>
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="text-xs text-gray-400">{order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
                        <p className="text-xs text-gray-500">{timeAgo(order.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#ff6b35]">₹{order.total}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full status-${order.status === 'served' ? 'completed' : order.status}`}>{order.status === 'served' ? 'completed' : order.status}</span>
                    </div>
                  </motion.div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No orders yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeNav === 'menu' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Search menu items..." className="w-80 bg-[#1a1a24] border border-[#2a2a3a] rounded-xl py-2.5 pl-12 pr-4 text-white placeholder-gray-500" />
                  </div>
                  <select className="bg-[#1a1a24] border border-[#2a2a3a] rounded-xl px-4 py-2.5 text-white">
                    <option>All Categories</option><option>Starters</option><option>Main Course</option><option>Biryani</option>
                  </select>
                </div>
                <button className="btn-primary"><Plus className="w-4 h-4 mr-2 inline" />Add Item</button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map((item, i) => (
                  <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="menu-item-card">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div><h3 className="font-bold text-lg">{item.name}</h3><p className="text-sm text-gray-400">{item.category}</p></div>
                        <div className="flex items-center gap-1"><button className="p-2 rounded-lg hover:bg-[#2a2a3a]"><Edit className="w-4 h-4 text-gray-400" /></button><button className="p-2 rounded-lg hover:bg-[#2a2a3a]"><Trash2 className="w-4 h-4 text-red-500" /></button></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[#ff6b35]">₹{item.price}</span>
                        <span className={`text-sm ${item.stock === 'Low Stock' ? 'text-yellow-500' : 'text-green-500'}`}>{item.stock}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'tables' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Table Management</h2>
                <button className="btn-primary"><Plus className="w-4 h-4 mr-2 inline" />Generate QR Code</button>
              </div>
              <div className="grid md:grid-cols-4 gap-6">
                {[...Array(12)].map((_, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="stat-card text-center">
                    <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${i < 8 ? 'bg-green-500/20' : i < 10 ? 'bg-yellow-500/20' : 'bg-[#2a2a3a]'}`}>
                      <span className={`text-2xl font-bold ${i < 8 ? 'text-green-500' : i < 10 ? 'text-yellow-500' : 'text-gray-400'}`}>{i + 1}</span>
                    </div>
                    <p className="font-semibold mb-1">Table {i + 1}</p>
                    <p className={`text-sm ${i < 8 ? 'text-green-500' : i < 10 ? 'text-yellow-500' : 'text-gray-400'}`}>{i < 8 ? 'Occupied' : i < 10 ? 'Reserved' : 'Available'}</p>
                    <button className="mt-4 text-sm text-[#ff6b35] hover:underline">View QR</button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'settings' && (
            <div className="max-w-3xl space-y-6">
              <div className="stat-card">
                <h3 className="text-lg font-bold mb-6">Restaurant Profile</h3>
                <div className="space-y-4">
                  <div><label className="text-gray-400 text-sm mb-2 block">Restaurant Name</label><input type="text" defaultValue="Demo Restaurant" className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl py-3 px-4 text-white input-glow" /></div>
                  <div><label className="text-gray-400 text-sm mb-2 block">Phone</label><input type="tel" defaultValue="+91 98765 43210" className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl py-3 px-4 text-white input-glow" /></div>
                  <div><label className="text-gray-400 text-sm mb-2 block">Email</label><input type="email" defaultValue="contact@demorestaurant.com" className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl py-3 px-4 text-white input-glow" /></div>
                </div>
              </div>
              <button className="btn-primary w-full py-4">Save Changes</button>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showNotifications && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} className="fixed inset-0 bg-black/50 z-50" />
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="fixed right-0 top-0 bottom-0 w-96 bg-[#12121a] border-l border-[#2a2a3a] z-50 flex flex-col">
              <div className="p-6 border-b border-[#2a2a3a] flex items-center justify-between">
                <h2 className="text-xl font-bold">Notifications</h2>
                <button onClick={() => setShowNotifications(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {notifications.map((notif) => (<div key={notif.id} className={`notification-item priority-${notif.priority}`}><p className="font-semibold mb-1">{notif.message}</p><p className="text-sm text-gray-400">{notif.time}</p></div>))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}