'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Bell, ChefHat, Coffee, Utensils, Wine, Home, Plus, Minus, X, Clock, Star, Flame, MessageSquare, Droplets, Receipt, Sparkles } from 'lucide-react';
import { useOrderStore } from '@/lib/store';

const categories = [
  { id: 'all', name: 'All', icon: Home },
  { id: 'starters', name: 'Starters', icon: Utensils },
  { id: 'mains', name: 'Main Course', icon: ChefHat },
  { id: 'biryani', name: 'Biryani', icon: Coffee },
  { id: 'drinks', name: 'Beverages', icon: Wine },
  { id: 'desserts', name: 'Desserts', icon: Star }
];

const menuItems = [
  { id: 1, name: 'Tandoori Chicken', description: 'Traditional clay oven roasted chicken with aromatic spices', price: 350, category: 'starters', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop', veg: false, spicy: 2, popular: true, prepTime: 20 },
  { id: 2, name: 'Palak Paneer', description: 'Creamy spinach curry with cottage cheese cubes', price: 280, category: 'mains', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop', veg: true, spicy: 1, prepTime: 25 },
  { id: 3, name: 'Chicken Biryani', description: 'Aromatic basmati rice layered with spiced chicken', price: 320, category: 'biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop', veg: false, spicy: 2, popular: true, prepTime: 30 },
  { id: 4, name: 'Masala Chai', description: 'Traditional Indian spiced tea', price: 40, category: 'drinks', image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&h=300&fit=crop', veg: true, spicy: 0, prepTime: 5 },
  { id: 5, name: 'Butter Chicken', description: 'Rich tomato gravy with tender chicken pieces', price: 380, category: 'mains', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', veg: false, spicy: 2, popular: true, prepTime: 25 },
  { id: 6, name: 'Gulab Jamun', description: 'Classic Indian milk dessert in sugar syrup', price: 120, category: 'desserts', image: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?w=400&h=300&fit=crop', veg: true, spicy: 0, prepTime: 10 },
  { id: 7, name: 'Vegetable Fried Rice', description: 'Wok-tossed rice with fresh vegetables', price: 180, category: 'mains', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop', veg: true, spicy: 1, prepTime: 15 },
  { id: 8, name: 'Mango Lassi', description: 'Sweet yogurt drink with fresh mango', price: 80, category: 'drinks', image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=400&h=300&fit=crop', veg: true, spicy: 0, prepTime: 5 }
];

interface CartItem { id: number; name: string; price: number; quantity: number; notes: string; }
interface Customization { spiceLevel: number; extraNotes: string; }

export default function CustomerMenu({ params }: { params: Promise<{ tableId: string }> }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<typeof menuItems[0] | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customization, setCustomization] = useState<Customization>({ spiceLevel: 1, extraNotes: '' });
  const [showCallBell, setShowCallBell] = useState(false);
  const [callType, setCallType] = useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeOrder, setActiveOrder] = useState<{ id: string; status: string } | null>(null);
  const [tableId, setTableId] = useState('');

  const addOrder = useOrderStore((s) => s.addOrder);

  useEffect(() => {
    params.then(p => setTableId(p.tableId));
  }, []);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: typeof menuItems[0], qty: number) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + qty } : c));
    else setCart([...cart, { id: item.id, name: item.name, price: item.price, quantity: qty, notes: customization.extraNotes }]);
    setSelectedItem(null); setQuantity(1); setCustomization({ spiceLevel: 1, extraNotes: '' });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const placeOrder = () => {
    const items = cart.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      notes: item.notes,
    }));
    const order = addOrder(tableId || 'table-1', items);
    setActiveOrder({ id: order.id, status: order.status });
    setOrderPlaced(true);
    setCart([]);
    setCartOpen(false);
  };

  const callWaiter = (type: string) => { setCallType(type); setShowCallBell(false); setTimeout(() => setCallType(null), 3000); };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blur-blob w-[400px] h-[400px] bg-[#ff6b35] top-0 right-0" />
        <div className="blur-blob w-[300px] h-[300px] bg-[#00d4ff] bottom-0 left-0" />
      </div>

      <header className="sticky top-0 z-40 glass">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div><h1 className="text-xl font-bold text-gradient">RestroDyn</h1><p className="text-xs text-gray-400">Table {tableId?.replace('table-', '') || '1'} • Demo Restaurant</p></div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowCallBell(!showCallBell)} className="relative w-10 h-10 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#ff6b35]" />
              </button>
              <button onClick={() => setCartOpen(true)} className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-[#ff6b35] text-xs font-bold rounded-full flex items-center justify-center">{cartCount}</span>}
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" placeholder="Search dishes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 input-glow" />
          </div>
        </div>
      </header>

      <AnimatePresence>
        {showCallBell && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed top-20 left-4 right-4 z-50 glass rounded-2xl p-4 neon-border max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Call Waiter</h3><button onClick={() => setShowCallBell(false)}><X className="w-5 h-5 text-gray-400" /></button></div>
            <div className="grid grid-cols-3 gap-3">
              {[{ type: 'water', label: 'Water', icon: Droplets, color: '#00d4ff' }, { type: 'extra', label: 'Extra Order', icon: Plus, color: '#22c55e' }, { type: 'bill', label: 'Bill', icon: Receipt, color: '#a855f7' }, { type: 'assist', label: 'Help', icon: MessageSquare, color: '#fbbf24' }, { type: 'clean', label: 'Clean', icon: Sparkles, color: '#ec4899' }, { type: 'emergency', label: 'Emergency', icon: Bell, color: '#ef4444' }].map((item) => (
                <button key={item.type} onClick={() => callWaiter(item.type)} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#12121a] border border-[#2a2a3a] hover:border-[#ff6b35] transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20` }}><item.icon className="w-5 h-5" style={{ color: item.color }} /></div>
                  <span className="text-xs text-gray-400">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {callType && (
        <motion.div initial={{ opacity: 0, y: -100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -100 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 glass rounded-2xl px-6 py-4 neon-glow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><Bell className="w-5 h-5 text-green-500" /></div>
            <div><p className="font-semibold">Request Sent!</p><p className="text-sm text-gray-400">Waiter will arrive at your table</p></div>
          </div>
        </motion.div>
      )}

      {orderPlaced && activeOrder && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="fixed top-16 left-4 right-4 z-30 max-w-lg mx-auto">
          <div className="glass rounded-2xl p-4 neon-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><Check className="w-5 h-5 text-green-500" /></div>
                <div><p className="font-bold">{activeOrder.id}</p><p className="text-sm text-gray-400">Order Placed Successfully</p></div>
              </div>
              <button onClick={() => setOrderPlaced(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-[#ff6b35]" /><span className="text-sm text-gray-400">Estimated time: 20-25 mins</span></div>
          </div>
        </motion.div>
      )}

      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-gradient-to-r from-[#ff6b35] to-[#ff8c5a] text-white' : 'bg-[#1a1a24] border border-[#2a2a3a] text-gray-400 hover:border-[#ff6b35]'}`}>
              <cat.icon className="w-4 h-4" />{cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8">
        <div className="space-y-4">
          {filteredItems.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => setSelectedItem(item)} className="menu-item-card card-hover">
              <div className="relative">
                <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
                {item.popular && <div className="absolute top-3 left-3 glass rounded-full px-3 py-1"><span className="text-xs font-semibold text-[#ff6b35]">Popular</span></div>}
                <div className="absolute top-3 right-3 flex gap-2">{item.veg ? <span className="badge-veg">VEG</span> : <span className="badge-non-veg">NON-VEG</span>}</div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <div className="flex gap-1">{[...Array(item.spicy)].map((_, j) => (<Flame key={j} className="w-4 h-4 text-[#ef4444]" />))}</div>
                </div>
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-[#ff6b35]">₹{item.price}</span>
                  <div className="flex items-center gap-2 text-gray-400 text-sm"><Clock className="w-4 h-4" />{item.prepTime} min</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#12121a] border-l border-[#2a2a3a] z-50 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a3a]">
                <h2 className="text-xl font-bold">Your Order</h2>
                <button onClick={() => setCartOpen(false)}><X className="w-6 h-6 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12"><ShoppingCart className="w-16 h-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">Your cart is empty</p></div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="glass rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">{item.name}</h3><button onClick={() => setCart(cart.filter(c => c.id !== item.id))}><X className="w-4 h-4 text-gray-400" /></button></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 rounded-lg bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 rounded-lg bg-[#ff6b35] flex items-center justify-center"><Plus className="w-4 h-4 text-white" /></button>
                          </div>
                          <span className="font-bold text-[#ff6b35]">₹{item.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-4 border-t border-[#2a2a3a]">
                  <div className="flex items-center justify-between mb-4"><span className="text-gray-400">Subtotal</span><span className="text-xl font-bold">₹{cartTotal}</span></div>
                  <button onClick={placeOrder} className="w-full btn-primary py-4 text-lg">Place Order • ₹{cartTotal}</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed bottom-0 left-0 right-0 bg-[#12121a] border-t border-[#2a2a3a] rounded-t-3xl z-50 max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-48 object-cover" />
                <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div><h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2><p className="text-gray-400">{selectedItem.description}</p></div>
                  <span className="text-2xl font-bold text-[#ff6b35]">₹{selectedItem.price}</span>
                </div>
                <div className="flex items-center gap-4 mb-6">{selectedItem.veg ? <span className="badge-veg">VEG</span> : <span className="badge-non-veg">NON-VEG</span>}<div className="flex items-center gap-2 text-gray-400 text-sm"><Clock className="w-4 h-4" />{selectedItem.prepTime} min</div></div>
                <div className="mb-6"><h3 className="font-semibold mb-3">Spice Level</h3><div className="flex gap-2">{[0, 1, 2, 3].map((level) => (<button key={level} onClick={() => setCustomization({ ...customization, spiceLevel: level })} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${customization.spiceLevel === level ? 'bg-[#ff6b35] text-white' : 'bg-[#1a1a24] border border-[#2a2a3a] text-gray-400'}`}>{level === 0 ? 'None' : `${level} 🌶️`}</button>))}</div></div>
                <div className="mb-6"><h3 className="font-semibold mb-3">Special Instructions</h3><textarea value={customization.extraNotes} onChange={(e) => setCustomization({ ...customization, extraNotes: e.target.value })} placeholder="Any special requests..." className="w-full bg-[#1a1a24] border border-[#2a2a3a] rounded-xl p-4 text-white placeholder-gray-500 input-glow" rows={3} /></div>
                <div className="mb-6"><h3 className="font-semibold mb-3">Quantity</h3><div className="flex items-center justify-center gap-4"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-xl bg-[#1a1a24] border border-[#2a2a3a] flex items-center justify-center"><Minus className="w-5 h-5" /></button><span className="text-3xl font-bold w-16 text-center">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-xl bg-[#ff6b35] flex items-center justify-center"><Plus className="w-5 h-5 text-white" /></button></div></div>
                <button onClick={() => addToCart(selectedItem, quantity)} className="w-full btn-primary py-4 text-lg">Add to Cart • ₹{selectedItem.price * quantity}</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>;
}