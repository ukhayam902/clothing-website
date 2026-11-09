import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, Search, ShoppingCart, User, X, Minus, Plus } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useShop } from '../store/shop'
import { formatPKR } from '../data/catalog'
import { demoMode } from '../lib/supabase'

// UK Threads — clean white/black storefront. Brand name is a placeholder
// (not confirmed); photos are representative and prices are samples.

export function Logo() {
  return <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="UK Threads home"><span className="leading-none"><span className="block font-extrabold tracking-[0.08em] text-[19px] sm:text-[21px]">UK <span className="font-normal">THREADS</span></span></span></Link>
}

const ICON_BTN = 'relative inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#F7F7F7] transition-colors shrink-0'

function CartDrawer() {
  const { cart, cartOpen, setCartOpen, setQty, removeFromCart, shippingFor } = useShop()
  const nav = useNavigate()
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const shipping = shippingFor(subtotal)
  if (!cartOpen) return null
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
          <h2 className="font-bold text-lg">Your Cart ({cart.reduce((s, i) => s + i.qty, 0)})</h2>
          <button aria-label="Close cart" onClick={() => setCartOpen(false)} className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-[#F7F7F7]"><X size={22} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? <p className="text-neutral-500 text-sm">Your cart is empty.</p> : cart.map(i => (
            <div key={`${i.product.id}-${i.size}`} className="flex gap-3 py-3 border-b border-neutral-100 last:border-0">
              <Link to={`/product/${i.product.slug}`} onClick={() => setCartOpen(false)} className="shrink-0"><img src={i.product.image} alt={`${i.product.name} — representative sample photo`} className="w-20 h-20 rounded-xl bg-[#F7F7F7] object-contain p-1.5" /></Link>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${i.product.slug}`} onClick={() => setCartOpen(false)} className="font-semibold text-sm leading-snug hover:underline block">{i.product.name}</Link>
                <p className="text-xs text-neutral-500 mt-0.5">Size {i.size} • {formatPKR(i.product.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-neutral-300 rounded-full">
                    <button aria-label="Decrease quantity" onClick={() => setQty(i.product.id, i.size, i.qty - 1)} className="w-8 h-8 flex items-center justify-center"><Minus size={13} /></button>
                    <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                    <button aria-label="Increase quantity" onClick={() => setQty(i.product.id, i.size, i.qty + 1)} className="w-8 h-8 flex items-center justify-center"><Plus size={13} /></button>
                  </div>
                  <button onClick={() => removeFromCart(i.product.id, i.size)} className="text-red-600 text-xs font-medium px-2 py-1.5">Remove</button>
                </div>
              </div>
              <span className="font-bold text-sm shrink-0">{formatPKR(i.product.price * i.qty)}</span>
            </div>
          ))}
        </div>
        {cart.length > 0 && <div className="border-t border-neutral-200 px-5 py-4">
          <p className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPKR(subtotal)}</span></p>
          <p className="flex justify-between text-sm mt-1.5"><span>Delivery (sample)</span><span>{formatPKR(shipping)}</span></p>
          <p className="flex justify-between font-bold mt-2 pt-2 border-t border-neutral-200"><span>Total</span><span>{formatPKR(subtotal + shipping)}</span></p>
          <button onClick={() => { setCartOpen(false); nav('/checkout') }} className="bg-black text-white rounded-full font-semibold w-full py-3.5 text-sm mt-4">Proceed to Checkout</button>
          <p className="text-xs text-neutral-500 mt-3 text-center">Cash on Delivery at checkout (sample policy).</p>
        </div>}
      </aside>
    </div>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { cart, user, categories, setCartOpen } = useShop()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const count = cart.reduce((s, i) => s + i.qty, 0)
  const goSearch = (value: string) => {
    setOpen(false)
    nav(value.trim() ? `/shop?search=${encodeURIComponent(value.trim())}` : '/shop')
  }
  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col">
      <div className="bg-[#111111] text-white text-center text-[11px] sm:text-xs py-2.5 px-4 leading-relaxed tracking-[0.18em] font-semibold">PREMIUM SHIRTS &amp; TEES — COMFORT. STYLE. EVERYDAY.</div>
      <div className="bg-[#F5F4F1] border-b border-neutral-200 text-neutral-700 text-xs text-center px-4 py-2 leading-relaxed"><strong>Sample catalogue:</strong> product photos are representative, all prices are samples, and the store policies on this page are sample text — the final range, prices and policies will be confirmed by the owner.</div>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="py-3 flex items-center gap-2 sm:gap-3 min-w-0">
            <button className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#F7F7F7] shrink-0" aria-label="Open menu" onClick={() => setOpen(true)}><Menu size={22} /></button>
            <Logo />
            <nav className="hidden lg:flex gap-5 ml-6 text-sm font-medium shrink-0" aria-label="Main navigation">
              <NavLink to="/" className={({ isActive }) => isActive ? 'underline underline-offset-4 decoration-2' : 'text-neutral-600 hover:text-black'}>Home</NavLink>
              <NavLink to="/shop" className={({ isActive }) => isActive ? 'underline underline-offset-4 decoration-2' : 'text-neutral-600 hover:text-black'}>Shop All</NavLink>
              {categories.slice(0, 4).map(c => <NavLink key={c.id} to={`/shop?category=${c.id}`} className="text-neutral-600 hover:text-black">{c.name}</NavLink>)}
            </nav>
            <form className="hidden md:flex flex-1 max-w-md ml-auto items-center border border-neutral-300 rounded-full px-4 py-2 gap-2 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 transition" onSubmit={e => { e.preventDefault(); goSearch(q) }} role="search">
              <Search size={18} className="text-neutral-500 shrink-0" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search shirts, tees, polos…" aria-label="Search products" className="outline-none text-sm w-full bg-transparent" />
            </form>
            <div className="flex items-center gap-0.5 ml-auto md:ml-0 shrink-0">
              <Link to={user ? '/profile' : '/login'} aria-label="Account" className={ICON_BTN}><User size={22} /></Link>
              <button onClick={() => setCartOpen(true)} aria-label="Open cart" className={ICON_BTN}><ShoppingCart size={22} />{count > 0 && <span className="absolute top-0.5 right-0.5 bg-black text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">{count}</span>}</button>
            </div>
          </div>
          <form className="md:hidden flex items-center border border-neutral-300 rounded-full px-4 py-2.5 gap-2 mb-3 focus-within:border-black" onSubmit={e => { e.preventDefault(); goSearch(q) }} role="search">
            <Search size={18} className="text-neutral-500 shrink-0" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search shirts, tees, polos…" aria-label="Search products" className="outline-none text-sm w-full bg-transparent" />
          </form>
        </div>
      </header>
      {open && <div className="fixed inset-0 z-50 bg-white overflow-y-auto" role="dialog" aria-label="Menu">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center"><Logo /><button aria-label="Close menu" onClick={() => setOpen(false)} className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-[#F7F7F7]"><X size={24} /></button></div>
          <form className="flex items-center border border-neutral-300 rounded-full px-4 py-3 gap-2 mt-6" onSubmit={e => { e.preventDefault(); goSearch(q) }} role="search">
            <Search size={18} className="text-neutral-500 shrink-0" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search shirts, tees, polos…" aria-label="Search products" className="outline-none text-sm w-full bg-transparent" />
          </form>
          <nav className="grid gap-1 mt-6 text-lg font-medium" onClick={() => setOpen(false)}>
            <Link to="/" className="py-3 border-b border-neutral-100">Home</Link>
            <Link to="/shop" className="py-3 border-b border-neutral-100">Shop All</Link>
            <button onClick={() => { setOpen(false); setCartOpen(true) }} className="py-3 border-b border-neutral-100 text-left">Cart{count > 0 ? ` (${count})` : ''}</button>
            <Link to="/track" className="py-3 border-b border-neutral-100">Order Tracking</Link>
            <Link to={user ? '/profile' : '/login'} className="py-3 border-b border-neutral-100">{user ? 'My Profile' : 'Login / Register'}</Link>
            <Link to="/admin" className="py-3 border-b border-neutral-100">Admin</Link>
          </nav>
          <h2 className="text-xs font-bold tracking-[0.2em] text-neutral-500 mt-8 mb-2">SHOP BY CATEGORY</h2>
          <nav className="grid gap-1 text-base" onClick={() => setOpen(false)}>
            {categories.map(c => <Link key={c.id} to={`/shop?category=${c.id}`} className="py-2.5 text-neutral-700">{c.name}</Link>)}
          </nav>
        </div>
      </div>}
      {demoMode && <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm text-center px-4 py-2.5 leading-relaxed">Demo mode: Supabase live connection is not configured yet (anon key still missing). Cart, checkout and admin below run on demo data in this browser. Prices are demo samples, not confirmed shop prices. <Link to="/admin" className="underline font-semibold">Admin setup →</Link></div>}
      <main className="flex-1 min-w-0">{children}</main>
      <CartDrawer />
      <footer className="bg-[#111111] text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div><Logo /><p className="text-neutral-400 text-sm mt-4 leading-relaxed">Premium Shirts &amp; Tees. Comfort. Style. Everyday.</p><p className="text-neutral-400 text-sm mt-3 leading-relaxed">Sample catalogue — brand name, products, prices and policies are to be confirmed by the owner.</p></div>
          <nav aria-label="Shop"><h3 className="font-bold mb-4">Shop</h3><ul className="space-y-2.5 text-neutral-300 text-sm"><li><Link to="/shop" className="hover:text-white">Shop All</Link></li>{categories.map(c => <li key={c.id}><Link to={`/shop?category=${c.id}`} className="hover:text-white">{c.name}</Link></li>)}</ul></nav>
          <nav aria-label="Help"><h3 className="font-bold mb-4">Help</h3><ul className="space-y-2.5 text-neutral-300 text-sm"><li><Link to="/faq" className="hover:text-white">FAQ</Link></li><li><Link to="/shipping" className="hover:text-white">Shipping Policy</Link></li><li><Link to="/returns" className="hover:text-white">Return and Refund Policy</Link></li><li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li><li><Link to="/terms" className="hover:text-white">Terms and Conditions</Link></li><li><Link to="/track" className="hover:text-white">Order Tracking</Link></li><li><Link to="/admin" className="hover:text-white">Admin</Link></li></ul></nav>
          <div><h3 className="font-bold mb-4">Get in Touch</h3><p className="text-neutral-400 text-sm leading-relaxed">Questions about a size, an order or a product? Send a message.</p><p className="text-neutral-400 text-sm mt-3 leading-relaxed">No shop address, phone number or business email has been confirmed for this clothing store yet — none is published here.</p></div>
        </div>
        <div className="border-t border-neutral-800 text-center text-xs text-neutral-500 py-5 px-4 leading-relaxed">© {new Date().getFullYear()} UK Threads (placeholder brand name). All photos are representative and all prices are samples until confirmed by the owner.</div>
      </footer>
    </div>
  )
}
