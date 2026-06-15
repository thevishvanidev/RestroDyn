'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  QrCode,
  Smartphone,
  TrendingUp,
  Users,
  ChefHat,
  CreditCard,
  Building2,
  Zap,
  BarChart3,
  MessageSquare,
  Languages,
  Bell,
  Wifi,
  Shield,
  Globe,
  ArrowRight,
  Star,
  Check,
  Play,
  Menu,
  X,
  Sparkles,
  Layers,
  Cpu,
  WifiOff
} from 'lucide-react';

const features = [
  { icon: QrCode, title: 'Smart QR Ordering', desc: 'Customers scan & order instantly. No waiter needed.', color: '#ff6b35' },
  { icon: Bell, title: 'AI Waiter Call', desc: 'Real-time notifications with priority system.', color: '#00d4ff' },
  { icon: ChefHat, title: 'Kitchen Dashboard', desc: 'Live order tracking with preparation timers.', color: '#22c55e' },
  { icon: BarChart3, title: 'AI Analytics', desc: 'Predictive insights & revenue forecasting.', color: '#a855f7' },
  { icon: CreditCard, title: 'Smart Payments', desc: 'UPI, split billing, GST & digital invoices.', color: '#fbbf24' },
  { icon: Building2, title: 'Multi-Branch', desc: 'Manage unlimited restaurants from one dashboard.', color: '#ec4899' },
  { icon: MessageSquare, title: 'AI Chat Support', desc: '24/7 intelligent customer assistance.', color: '#06b6d4' },
  { icon: Languages, title: 'Multi-Language', desc: 'Support for global customers & staff.', color: '#8b5cf6' }
];

const testimonials = [
  { name: 'Raj Sharma', role: 'Owner, Spice Garden', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', text: 'RestroDyn transformed our operations. Orders increased 40% and wait time dropped to zero.', rating: 5 },
  { name: 'Priya Mehta', role: 'Manager, Cafe Velvet', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', text: 'The analytics are incredible. We can predict demand and optimize staffing perfectly.', rating: 5 },
  { name: 'Vikram Singh', role: 'Director, Hotel Grand', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', text: 'Multi-branch management has never been easier. A complete game-changer.', rating: 5 }
];

const pricingPlans = [
  { name: 'Starter', price: '₹2,999', period: '/month', desc: 'Perfect for small restaurants', features: ['Single Branch', '50 Tables', 'Basic Analytics', 'QR Ordering', 'Email Support'], popular: false, color: '#ff6b35' },
  { name: 'Professional', price: '₹7,999', period: '/month', desc: 'For growing businesses', features: ['5 Branches', 'Unlimited Tables', 'AI Analytics', 'Kitchen Display', 'Priority Support', 'POS Integration'], popular: true, color: '#00d4ff' },
  { name: 'Enterprise', price: 'Custom', period: '', desc: 'For large chains', features: ['Unlimited Branches', 'Custom Development', 'Dedicated Manager', '24/7 Support', 'API Access', 'White-label'], popular: false, color: '#a855f7' }
];

const faqs = [
  { q: 'How does QR ordering work?', a: 'Customers scan the QR code on their table, browse the digital menu, and place orders directly from their phone. No app download required.' },
  { q: 'Can I manage multiple restaurants?', a: 'Yes! The Professional and Enterprise plans support multi-branch management with centralized analytics and control.' },
  { q: 'Is there a free trial?', a: 'We offer a 14-day free trial with full access to all features. No credit card required.' },
  { q: 'What payment methods are supported?', a: 'We support UPI, cards, wallets, bank transfers, and can integrate with any payment gateway.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use enterprise-grade encryption and are GDPR compliant. Your data is safe with us.' }
];

const stats = [
  { value: '50K+', label: 'Restaurants' },
  { value: '10M+', label: 'Orders/Month' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9★', label: 'Rating' }
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blur-blob w-[600px] h-[600px] bg-[#ff6b35] top-[-200px] left-[-200px]" />
        <div className="blur-blob w-[500px] h-[500px] bg-[#00d4ff] top-[40%] right-[-150px]" />
        <div className="blur-blob w-[400px] h-[400px] bg-[#a855f7] bottom-[-100px] left-[30%]" />
        <div className="absolute inset-0 grid-bg opacity-50" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">RestroDyn</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-[#ff6b35] transition-colors">Features</a>
            <a href="#pricing" className="text-gray-300 hover:text-[#ff6b35] transition-colors">Pricing</a>
            <a href="#faq" className="text-gray-300 hover:text-[#ff6b35] transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <a href="/admin" className="text-gray-300 hover:text-white transition-colors">Login</a>
            <a href="/admin" className="btn-primary">Get Started</a>
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden glass border-t border-[#2a2a3a] p-6">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-gray-300 py-2">Features</a>
              <a href="#pricing" className="text-gray-300 py-2">Pricing</a>
              <a href="#faq" className="text-gray-300 py-2">FAQ</a>
              <a href="/admin" className="btn-primary text-center">Get Started</a>
            </div>
          </motion.div>
        )}
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8">
              <Sparkles className="w-4 h-4 text-[#ff6b35]" />
              <span className="text-sm text-gray-300">AI-Powered Hospitality Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              The Future of<br /><span className="text-gradient">Restaurant Management</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Transform your restaurant into a smart digital powerhouse. QR ordering, AI analytics, kitchen automation — everything you need to dominate.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <a href="/admin" className="btn-primary text-lg px-8 py-4">
                Start Free Trial<ArrowRight className="inline ml-2 w-5 h-5" />
              </a>
              <a href="/menu/table-1" className="btn-secondary text-lg px-8 py-4">
                <Play className="inline mr-2 w-5 h-5" />View Demo
              </a>
            </div>
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} className="relative max-w-5xl mx-auto">
              <div className="glass rounded-3xl p-2 neon-border">
                <div className="bg-[#12121a] rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-[#2a2a3a]">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="ml-4 text-gray-500 text-sm">RestroDyn Admin Dashboard</span>
                  </div>
                  <div className="p-6 grid grid-cols-4 gap-4">
                    <div className="stat-card col-span-1">
                      <div className="text-gray-400 text-sm mb-2">Today's Revenue</div>
                      <div className="text-3xl font-bold text-[#ff6b35]">₹45,230</div>
                      <div className="text-green-500 text-sm mt-2">↑ 12% vs yesterday</div>
                    </div>
                    <div className="stat-card col-span-1">
                      <div className="text-gray-400 text-sm mb-2">Active Orders</div>
                      <div className="text-3xl font-bold text-[#00d4ff]">23</div>
                      <div className="text-gray-500 text-sm mt-2">Live updates</div>
                    </div>
                    <div className="stat-card col-span-1">
                      <div className="text-gray-400 text-sm mb-2">Tables Served</div>
                      <div className="text-3xl font-bold text-[#a855f7]">18/25</div>
                      <div className="text-gray-500 text-sm mt-2">72% occupancy</div>
                    </div>
                    <div className="stat-card col-span-1">
                      <div className="text-gray-400 text-sm mb-2">Avg. Order Time</div>
                      <div className="text-3xl font-bold text-[#22c55e]">8m</div>
                      <div className="text-green-500 text-sm mt-2">↓ 2min improvement</div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-10 -left-10 glass rounded-2xl p-4 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center"><QrCode className="w-5 h-5 text-green-500" /></div>
                  <div><div className="text-sm font-semibold">New Order</div><div className="text-xs text-gray-400">Table 5 - ₹450</div></div>
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-5 -right-5 glass rounded-2xl p-4 hidden lg:block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ff6b35]/20 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-[#ff6b35]" /></div>
                  <div><div className="text-sm font-semibold">Revenue Today</div><div className="text-xs text-[#ff6b35] font-bold">+24%</div></div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-4">
              <Cpu className="w-4 h-4 text-[#00d4ff]" /><span className="text-sm text-gray-300">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need to <span className="text-gradient">Dominate</span></h2>
            <p className="text-gray-400 max-w-2xl mx-auto">A complete suite of tools designed to streamline operations, boost revenue, and delight customers.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="stat-card card-hover group">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${feature.color}20` }}>
                  <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-3xl p-12 text-center neon-glow">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Restaurant?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">Join 50,000+ restaurants already using RestroDyn to automate operations and boost revenue.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/admin" className="btn-primary text-lg px-10 py-4">Start Free Trial</a>
              <a href="/kitchen" className="btn-secondary text-lg px-10 py-4">Kitchen Demo</a>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Simple, <span className="text-gradient">Transparent</span> Pricing</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className={`stat-card relative ${plan.popular ? 'neon-border' : ''}`}>
                {plan.popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2"><span className="bg-gradient text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</span></div>}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1"><span className="text-4xl font-bold" style={{ color: plan.color }}>{plan.price}</span><span className="text-gray-400">{plan.period}</span></div>
                  <p className="text-gray-400 text-sm mt-2">{plan.desc}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-300"><Check className="w-5 h-5" style={{ color: plan.color }} />{feature}</li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'btn-primary' : 'border border-[#2a2a3a] hover:border-[#ff6b35] hover:text-[#ff6b35]'}`}>Get Started</button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked <span className="text-gradient">Questions</span></h2>
          </motion.div>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="glass rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left">
                  <span className="font-semibold text-lg">{faq.q}</span>
                  <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform ${openFaq === i ? 'rotate-90' : ''}`} />
                </button>
                {openFaq === i && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-6 pb-6 text-gray-400">{faq.a}</motion.div>}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} className="stat-card">
                <div className="flex gap-1 mb-4">{[...Array(testimonial.rating)].map((_, j) => (<Star key={j} className="w-5 h-5 fill-[#fbbf24] text-[#fbbf24]" />))}</div>
                <p className="text-gray-300 mb-6">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full object-cover" />
                  <div><div className="font-semibold">{testimonial.name}</div><div className="text-sm text-gray-400">{testimonial.role}</div></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t border-[#2a2a3a]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-[#ff8c5a] flex items-center justify-center"><Zap className="w-6 h-6 text-white" /></div>
                <span className="text-2xl font-bold text-gradient">RestroDyn</span>
              </div>
              <p className="text-gray-400 text-sm">Revolutionizing restaurant experience with smart digital dining.</p>
            </div>
            <div><h4 className="font-bold mb-4">Product</h4><ul className="space-y-2 text-gray-400 text-sm"><li>Features</li><li>Pricing</li><li>Demo</li></ul></div>
            <div><h4 className="font-bold mb-4">Company</h4><ul className="space-y-2 text-gray-400 text-sm"><li>About</li><li>Blog</li><li>Careers</li></ul></div>
            <div><h4 className="font-bold mb-4">Legal</h4><ul className="space-y-2 text-gray-400 text-sm"><li>Privacy</li><li>Terms</li><li>Security</li></ul></div>
          </div>
          <div className="text-center text-gray-500 text-sm pt-8 border-t border-[#2a2a3a]">© 2026 RestroDyn. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}