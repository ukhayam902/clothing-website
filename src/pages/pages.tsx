import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, CheckCircle2, ChevronDown, Minus, Package, Plus, Search, ShoppingCart, Truck, ShieldCheck, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { FAQS, HERO_IMAGES, formatPKR, type Product } from '../data/catalog'
import { categoryNameFor, useShop } from '../store/shop'
import { demoMode } from '../lib/supabase'

const INPUT = 'border border-neutral-300 rounded-xl w-full px-3.5 py-3 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition bg-white'
const BTN_BLACK = 'bg-black text-white rounded-full font-semibold hover:bg-[#171717] transition-colors disabled:opacity-50'
const BTN_OUTLINE = 'border border-neutral-300 rounded-full font-semibold hover:border-black transition-colors'
const CARD = 'border border-neutral-200 rounded-3xl bg-white shadow-sm'

export const DemoNote = () => <p className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-3.5 py-2.5 leading-relaxed">Sample product — price is a sample price and the photo is a representative photo, not confirmed by the owner yet.</p>

export function StatusPill({ status }: { status: string }) {
  const cls = status === 'Delivered' ? 'bg-green-100 text-green-800'
    : status === 'Cancelled' ? 'bg-red-100 text-red-800'
    : status === 'Pending' ? 'bg-amber-100 text-amber-800'
    : 'bg-neutral-100 text-neutral-800'
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{status}</span>
}

export function ProductCard({ p }: { p: Product }) {
  const { addToCart, setCartOpen, categories } = useShop()
  const stockLabel = p.stock <= 0 ? 'Out of stock' : p.stock < 20 ? `Only ${p.stock} left` : 'In stock'
  const stockCls = p.stock <= 0 ? 'text-red-600' : p.stock < 20 ? 'text-amber-700' : 'text-green-700'
  return (
    <article className="border border-neutral-200 rounded-3xl overflow-hidden bg-white flex flex-col shadow-sm hover:shadow-md transition-shadow">
      <div className="relative bg-[#F7F7F7]">
        <Link to={`/product/${p.slug}`} aria-label={p.name}><img src={p.image} alt={`${p.name} — representative sample photo`} loading="lazy" className="w-full aspect-square object-contain p-6 transition-transform duration-300 hover:scale-105" /></Link>
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">{p.bestseller && <span className="text-[11px] font-semibold bg-black text-white px-2.5 py-1 rounded-full">Best Seller</span>}{p.isNew && <span className="text-[11px] font-semibold bg-white border border-neutral-200 px-2.5 py-1 rounded-full">New</span>}</div>
      </div>
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-neutral-500 uppercase">{categoryNameFor(categories, p.category)}</p>
        <Link to={`/product/${p.slug}`} className="font-semibold text-[17px] leading-snug hover:underline">{p.name}</Link>
        <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">{p.description}</p>
        {p.isDemo && <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full w-fit">Sample price — to be confirmed</span>}
        <div className="mt-auto pt-2 flex items-end justify-between gap-2"><span className="flex items-baseline gap-2"><span className="font-extrabold text-xl">{formatPKR(p.price)}</span>{p.compareAt && <span className="text-sm text-neutral-400 line-through">{formatPKR(p.compareAt)}</span>}</span><span className={`text-xs font-medium ${stockCls}`}>{stockLabel}</span></div>
        <div className="flex gap-2 mt-1">
          <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className={`${BTN_BLACK} flex-1 py-3 text-sm disabled:opacity-40`}>{p.stock <= 0 ? 'Out of stock' : 'Add to Cart'}</button>
          <button onClick={() => { addToCart(p); setCartOpen(true) }} disabled={p.stock <= 0} className={`${BTN_OUTLINE} px-4 py-3 text-sm disabled:opacity-40`}>Buy Now</button>
        </div>
      </div>
    </article>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return }
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}>{children}</div>
}

function SectionHeader({ title, subtitle, actionTo, actionLabel }: { title: string; subtitle?: string; actionTo?: string; actionLabel?: string }) {
  return <div className="flex flex-wrap items-end justify-between gap-3 mb-5"><div><h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h2>{subtitle && <p className="text-neutral-600 mt-1.5 text-sm sm:text-base">{subtitle}</p>}</div>{actionTo && <Link to={actionTo} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:underline shrink-0">{actionLabel || 'View all'} <ArrowRight size={16} /></Link>}</div>
}

const HERO_LOOKS = [
  { key: 'hero-black-shirt', label: 'Black shirt look', alt: 'Store owner modelling a black casual shirt over a white tee' },
  { key: 'hero-white-tee', label: 'White tee look', alt: 'Store owner modelling a white crew tee' },
  { key: 'hero-green-polo', label: 'Green polo look', alt: 'Store owner modelling a forest green polo' },
  { key: 'hero-beige-shirt', label: 'Beige shirt look', alt: 'Store owner wearing a sand beige linen shirt with white trousers' },
] as const

export function Home() {
  const { products, categories } = useShop()
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [heroLook, setHeroLook] = useState<(typeof HERO_LOOKS)[number]['key']>('hero-black-shirt')
  const [faqOpen, setFaqOpen] = useState(0)
  const best = products.filter(p => p.bestseller)
  const featured = products.filter(p => p.featured)
  const heroImg = HERO_IMAGES[heroLook] ?? HERO_IMAGES.main
  const heroAlt = HERO_LOOKS.find(l => l.key === heroLook)?.alt ?? 'Store owner modelling a black casual shirt over a white tee'
  return (
    <div>
      <section className="max-w-7xl mx-auto px-4 pt-8 sm:pt-12 pb-4">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">FEATURED COLLECTION</p>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tight mt-4">Premium<br />Shirts &amp; Tees</h1>
            <p className="text-xl font-semibold mt-4">Comfort. Style. Everyday.</p>
            <p className="text-neutral-600 mt-3 leading-relaxed max-w-lg">Clean cuts, soft cotton and fits that work from morning to night. Shop the new season drop of shirts, tees and polos.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 text-sm font-medium">
              <span>Premium Cotton Fabric</span><span>Long-Lasting Quality</span><span>Breathable</span><span>All Day</span><span>Modern</span><span>Slim Fit</span>
            </div>
            <div className="flex flex-wrap gap-3 mt-8">
              <Link to="/shop" className={`${BTN_BLACK} px-8 py-3.5 inline-flex items-center gap-2 text-sm`}>Shop the Collection <ArrowRight size={18} /></Link>
              <a href="#categories" className={`${BTN_OUTLINE} px-8 py-3.5 inline-flex items-center gap-2 text-sm`}>Shop by Category</a>
            </div>
            <p className="text-xs text-neutral-500 mt-6 leading-relaxed">30 shirts &amp; tees — every photo is a representative sample photo and every price is a sample price.</p>
          </div>
          <div>
            <div className="bg-[#F7F7F7] border border-neutral-200 rounded-3xl overflow-hidden">
              <img src={heroImg} alt={heroAlt} className="w-full aspect-[4/5] sm:aspect-[5/5] object-cover" />
            </div>
            <div className="flex gap-3 mt-3" role="group" aria-label="Change hero look">
              {HERO_LOOKS.map(l => (
                <button key={l.key} type="button" aria-label={l.label} aria-pressed={heroLook === l.key} onClick={() => setHeroLook(l.key)} className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 shrink-0 ${heroLook === l.key ? 'border-black' : 'border-neutral-200 hover:border-neutral-400'}`}>
                  <img src={HERO_IMAGES[l.key]} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-3">Modelled by the store owner — studio-style photos, representative looks.</p>
          </div>
        </div>
      </section>

      <Reveal><section id="categories" className="max-w-7xl mx-auto px-4 py-10 sm:py-12 scroll-mt-24">
        <SectionHeader title="Shop by Category" subtitle="Shirts, tees, polos and oversized fits." actionTo="/shop" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(c => (
            <Link key={c.id} to={`/shop?category=${c.id}`} className="group text-center">
              <span className="block w-full aspect-square rounded-full overflow-hidden bg-[#F7F7F7] border border-neutral-200 group-hover:border-black transition-colors"><img src={c.image} alt={`${c.name} — representative sample photo`} loading="lazy" className="w-full h-full object-cover" /></span>
              <span className="block font-semibold text-sm mt-3">{c.name}</span>
              <span className="block text-xs text-neutral-500 mt-0.5">{products.filter(p => p.category === c.id).length} styles</span>
            </Link>
          ))}
          <Link to="/shop?sort=popular" className="group text-center">
            <span className="block w-full aspect-square rounded-full overflow-hidden bg-[#F7F7F7] border border-neutral-200 group-hover:border-black transition-colors"><img src="/images/category-best.webp" alt="Best sellers — representative sample photo" loading="lazy" className="w-full h-full object-cover" /></span>
            <span className="block font-semibold text-sm mt-3">Best Sellers</span>
            <span className="block text-xs text-neutral-500 mt-0.5">Top picks</span>
          </Link>
          <Link to="/shop" className="group text-center">
            <span className="block w-full aspect-square rounded-full overflow-hidden bg-[#F7F7F7] border border-neutral-200 group-hover:border-black transition-colors"><img src="/images/category-all.webp" alt="Shop all — representative sample photo" loading="lazy" className="w-full h-full object-cover" /></span>
            <span className="block font-semibold text-sm mt-3">Shop All</span>
            <span className="block text-xs text-neutral-500 mt-0.5">{products.length} designs</span>
          </Link>
        </div>
      </section></Reveal>

      <Reveal><section className="max-w-7xl mx-auto px-4 py-10 sm:py-12"><SectionHeader title="Best Sellers" subtitle="The pieces customers reach for most." actionTo="/shop?sort=popular" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">{best.slice(0, 8).map(p => <ProductCard key={p.id} p={p} />)}</div></section></Reveal>

      <Reveal><section className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="bg-[#F7F7F7] border border-neutral-200 rounded-3xl overflow-hidden"><img src={HERO_IMAGES['style-split']} alt="Store owner wearing a sand beige linen shirt with white trousers" loading="lazy" className="w-full aspect-[4/5] object-cover" /></div>
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-neutral-500">THE LOOK</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-3">Style That Speaks</h2>
            <p className="text-neutral-600 mt-4 leading-relaxed">Discover your style with timeless classics to modern everyday essentials. Every piece in this collection is picked to keep you looking sharp and feeling confident — whether you are heading out with friends or keeping it relaxed.</p>
            <p className="font-semibold mt-5">Simple style. Everyday comfort. Timeless confidence.</p>
            <ul className="space-y-2.5 mt-5 text-sm text-neutral-700">
              <li className="flex gap-2"><Check size={16} className="shrink-0 mt-0.5" /> Soft, breathable cotton that stays comfortable all day</li>
              <li className="flex gap-2"><Check size={16} className="shrink-0 mt-0.5" /> Clean fits in sizes S to XXL</li>
              <li className="flex gap-2"><Check size={16} className="shrink-0 mt-0.5" /> Colours that pair with anything in your wardrobe</li>
            </ul>
            <Link to="/shop" className={`${BTN_BLACK} inline-flex items-center gap-2 px-7 py-3 text-sm mt-7`}>Shop the Look <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section></Reveal>

      <Reveal><section className="max-w-7xl mx-auto px-4 py-10 sm:py-12"><div className="bg-[#111111] text-white rounded-3xl p-7 sm:p-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Why Choose UK Threads</h2>
        <p className="text-neutral-300 mt-2 max-w-2xl leading-relaxed">Everyday essentials, made properly.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-7">
          <div className="bg-[#1d1d1d] rounded-2xl p-5"><h3 className="font-bold">Premium Cotton</h3><p className="text-neutral-300 text-sm mt-1.5 leading-relaxed">Soft, breathable cotton-rich fabric that feels good on the skin and keeps its shape wash after wash.</p></div>
          <div className="bg-[#1d1d1d] rounded-2xl p-5"><h3 className="font-bold">Stitching That Lasts</h3><p className="text-neutral-300 text-sm mt-1.5 leading-relaxed">Reinforced seams and tidy finishing, checked piece by piece before anything is listed in the shop.</p></div>
          <div className="bg-[#1d1d1d] rounded-2xl p-5"><h3 className="font-bold">True-to-Size Fit</h3><p className="text-neutral-300 text-sm mt-1.5 leading-relaxed">Honest sizing from S to XXL with a clear size guide, so what you order is what fits when it arrives.</p></div>
          <div className="bg-[#1d1d1d] rounded-2xl p-5"><h3 className="font-bold">Cash on Delivery</h3><p className="text-neutral-300 text-sm mt-1.5 leading-relaxed">Order first, pay at your door. Cash on Delivery is shown at checkout as a sample payment policy, to be confirmed by the owner.</p></div>
        </div>
      </div></section></Reveal>

      {featured.length > 0 && <Reveal><section className="max-w-7xl mx-auto px-4 py-10 sm:py-12"><SectionHeader title="Featured products" subtitle="Hand-picked highlights from the catalogue." actionTo="/shop" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">{featured.map(p => <ProductCard key={p.id} p={p} />)}</div></section></Reveal>}

      <Reveal><section id="faqs" className="max-w-3xl mx-auto px-4 py-10 sm:py-12 scroll-mt-24">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">FAQs</h2>
        <p className="text-neutral-600 text-center mt-2 text-sm sm:text-base">Quick answers before you order.</p>
        <div className="mt-6">
          {FAQS.map((f, i) => (
            <div key={f.q} className="border-b border-neutral-200">
              <button type="button" onClick={() => setFaqOpen(faqOpen === i ? -1 : i)} className="w-full flex justify-between items-center gap-4 text-left py-5 font-bold text-base" aria-expanded={faqOpen === i}>{f.q}<span className="text-xl font-normal shrink-0">{faqOpen === i ? '−' : '+'}</span></button>
              {faqOpen === i && <p className="pb-5 text-neutral-600 text-[15px] leading-relaxed max-w-[68ch]">{f.a}</p>}
            </div>
          ))}
        </div>
      </section></Reveal>

      <Reveal><section className="max-w-7xl mx-auto px-4 pb-4"><div className="bg-[#F7F7F7] border border-neutral-200 rounded-3xl p-6 sm:p-8"><h2 className="text-2xl font-extrabold tracking-tight">Good Style. Delivered to Your Inbox.</h2><p className="text-neutral-600 text-sm mt-1.5">Subscribe for new arrivals, style updates and subscriber-only offers from the store.</p>
        {subscribed ? <p role="status" className="mt-4 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm">Subscribed — welcome to the list. (Demo mode: this subscription is not saved anywhere yet.)</p> : <form className="flex flex-col sm:flex-row gap-2 mt-4 max-w-md" onSubmit={e => { e.preventDefault(); setSubscribed(true) }}><label htmlFor="newsletter-email" className="sr-only">Email address</label><input id="newsletter-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" className={INPUT} /><button className={`${BTN_BLACK} px-6 py-3 text-sm shrink-0`}>Subscribe</button></form>}
      </div></section></Reveal>
      <div className="max-w-7xl mx-auto px-4 pt-2"><a href="#categories" className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-black">Scroll <ChevronDown size={18} className="hero-scroll-cue" /></a></div>
    </div>
  )
}

export function ShopPage() {
  const { products, categories } = useShop()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState(params.get('search') || '')
  const [cat, setCat] = useState(params.get('category') || 'all')
  const [maxPrice, setMaxPrice] = useState(2500)
  const [sort, setSort] = useState(params.get('sort') || 'popular')
  const [visible, setVisible] = useState(12)
  const filtered = useMemo(() => {
    let list = [...products]
    if (cat !== 'all') list = list.filter(p => p.category === cat)
    if (search) list = list.filter(p => (p.name + p.description + categoryNameFor(categories, p.category)).toLowerCase().includes(search.toLowerCase()))
    list = list.filter(p => p.price <= maxPrice)
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
    if (sort === 'popular') list.sort((a, b) => Number(b.bestseller || false) - Number(a.bestseller || false))
    return list
  }, [products, categories, cat, search, maxPrice, sort])
  const resetFilters = () => { setSearch(''); setCat('all'); setMaxPrice(2500); setSort('popular'); setVisible(12); setParams({}) }
  const hasFilters = search !== '' || cat !== 'all' || maxPrice < 2500
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Shop the Collection</h1>
      <p className="text-neutral-600 mt-2">{products.length} shirts &amp; tees — every photo is a representative sample photo and every price is a sample price. <span className="font-medium text-black">{filtered.length} product{filtered.length === 1 ? '' : 's'} found.</span></p>
      <div className={`${CARD} p-4 sm:p-5 mt-6`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex items-center border border-neutral-300 rounded-full px-4 py-2.5 gap-2 focus-within:border-black focus-within:ring-2 focus-within:ring-black/10 transition"><Search size={16} className="text-neutral-500 shrink-0" /><span className="sr-only">Search products</span><input value={search} onChange={e => { setSearch(e.target.value); setVisible(12) }} placeholder="Search shirts, tees, polos…" className="outline-none text-sm w-full bg-transparent" /></label>
          <label className="sr-only" htmlFor="shop-category">Filter by category</label>
          <select id="shop-category" value={cat} onChange={e => { setCat(e.target.value); setVisible(12); setParams(e.target.value === 'all' ? {} : { category: e.target.value }) }} className="border border-neutral-300 rounded-full px-4 py-2.5 text-sm bg-white w-full"><option value="all">All categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          <label className="sr-only" htmlFor="shop-sort">Sort products</label>
          <select id="shop-sort" value={sort} onChange={e => setSort(e.target.value)} className="border border-neutral-300 rounded-full px-4 py-2.5 text-sm bg-white w-full"><option value="popular">Sort: Popularity</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option></select>
          <label className="flex items-center gap-3 text-sm border border-neutral-300 rounded-full px-4 py-2.5">Max price <strong>Rs. {maxPrice.toLocaleString('en-PK')}</strong><input aria-label="Maximum price" type="range" min={1000} max={2500} step={50} value={maxPrice} onChange={e => { setMaxPrice(Number(e.target.value)); setVisible(12) }} className="flex-1 min-w-0" /></label>
        </div>
        {hasFilters && <div className="flex flex-wrap items-center gap-2 mt-4">
          {search && <button onClick={() => setSearch('')} className="bg-black text-white rounded-full px-3.5 py-1.5 text-xs font-semibold">Search: “{search}” ✕</button>}
          {cat !== 'all' && <button onClick={() => { setCat('all'); setParams({}) }} className="bg-black text-white rounded-full px-3.5 py-1.5 text-xs font-semibold">{categoryNameFor(categories, cat)} ✕</button>}
          {maxPrice < 2500 && <button onClick={() => setMaxPrice(2500)} className="bg-black text-white rounded-full px-3.5 py-1.5 text-xs font-semibold">Under Rs. {maxPrice.toLocaleString('en-PK')} ✕</button>}
          <button onClick={resetFilters} className="underline text-sm font-medium ml-1">Clear all filters</button>
        </div>}
      </div>
      {filtered.length === 0 ? <div className={`${CARD} py-16 px-6 text-center mt-6`}><Package size={40} className="mx-auto text-neutral-400" /><h2 className="text-xl font-bold mt-4">No products match these filters</h2><p className="text-neutral-500 text-sm mt-1.5">Try a different search, category or price.</p><button onClick={resetFilters} className={`${BTN_BLACK} px-6 py-3 text-sm mt-5`}>Clear filters</button></div> : <>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mt-6">{filtered.slice(0, visible).map(p => <ProductCard key={p.id} p={p} />)}</div>
        {visible < filtered.length && <div className="text-center mt-10"><button onClick={() => setVisible(v => v + 12)} className={`${BTN_BLACK} px-8 py-3.5 text-sm`}>Load more</button></div>}
        <p className="text-center text-sm text-neutral-500 mt-4">Showing {Math.min(visible, filtered.length)} of {filtered.length} products</p>
      </>}
    </div>
  )
}

export function ProductPage() {
  const { slug } = useParams()
  const { addToCart, products, categories } = useShop(); const nav = useNavigate()
  const p = products.find(x => x.slug === slug)
  const [qty, setQty] = useState(1); const [size, setSize] = useState('M')
  useEffect(() => { setQty(1); setSize('M') }, [slug])
  if (!p) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><h1 className="text-2xl font-bold">Product not found</h1><Link to="/shop" className="underline mt-3 inline-block">Back to shop</Link></div>
  // Related: same category first, then fill with other products to 4 cards.
  const related = [...products.filter(x => x.category === p.category && x.id !== p.id), ...products.filter(x => x.category !== p.category && x.id !== p.id)].slice(0, 4)
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-neutral-500 mb-6 flex flex-wrap gap-1.5"><Link to="/" className="hover:underline">Home</Link><span>/</span><Link to="/shop" className="hover:underline">Shop</Link><span>/</span><Link to={`/shop?category=${p.category}`} className="hover:underline">{categoryNameFor(categories, p.category)}</Link><span>/</span><span className="text-neutral-900 font-medium">{p.name}</span></nav>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="relative bg-[#F7F7F7] border border-neutral-200 rounded-3xl overflow-hidden">
            <img src={p.image} alt={`${p.name} — representative sample photo`} className="w-full aspect-square object-contain p-8 sm:p-12" />
            <div className="absolute top-4 left-4 flex gap-1.5 flex-wrap">{p.bestseller && <span className="text-[11px] font-semibold bg-black text-white px-2.5 py-1 rounded-full">Best Seller</span>}{p.isNew && <span className="text-[11px] font-semibold bg-white border border-neutral-200 px-2.5 py-1 rounded-full">New</span>}</div>
          </div>
          <p className="text-xs text-neutral-500 mt-3 text-center">Representative image — not an exact photo of this model.</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.14em] text-neutral-500 uppercase">{categoryNameFor(categories, p.category)} • SKU {p.sku}</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-2 leading-tight">{p.name}</h1>
          <div className="flex flex-wrap items-baseline gap-3 mt-4"><span className="text-3xl font-extrabold">{formatPKR(p.price)}</span>{p.compareAt && <span className="text-lg text-neutral-400 line-through">{formatPKR(p.compareAt)}</span>}{p.isDemo && <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">Sample price</span>}</div>
          {p.isDemo && <div className="mt-4"><DemoNote /></div>}
          <p className="text-neutral-700 mt-5 leading-relaxed">{p.description}</p>
          <div className="mt-6"><h2 className="font-bold">Details</h2><ul className="grid sm:grid-cols-2 gap-2 mt-3">
            <li className="flex gap-2 text-sm text-neutral-700 bg-[#F7F7F7] border border-neutral-200 rounded-xl px-3.5 py-2.5"><Check size={16} className="shrink-0 mt-0.5" />Fabric: {p.fabric} (sample)</li>
            <li className="flex gap-2 text-sm text-neutral-700 bg-[#F7F7F7] border border-neutral-200 rounded-xl px-3.5 py-2.5"><Check size={16} className="shrink-0 mt-0.5" />Sizes: S to XXL</li>
          </ul></div>
          <div className="mt-6"><span className="font-semibold text-sm">Size: {size}</span><div className="flex flex-wrap gap-2 mt-2.5" role="group" aria-label="Choose size">{p.sizes.map(s => <button key={s} onClick={() => setSize(s)} aria-pressed={size === s} className={`min-w-11 min-h-11 px-4 rounded-full text-sm font-medium border transition-colors ${size === s ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>{s}</button>)}</div>
          <p className="text-xs text-neutral-500 mt-2">Sample size guide: S 38&quot;, M 40&quot;, L 42&quot;, XL 44&quot;, XXL 46&quot; chest. The owner will confirm the final size guide.</p></div>
          <p className="text-sm mt-5 flex items-center gap-2"><span className={p.stock > 0 ? 'text-green-700' : 'text-red-600'}>●</span><span className="font-medium">{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span></p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="flex items-center border border-neutral-300 rounded-full"><button aria-label="Decrease quantity" className="w-11 h-11 flex items-center justify-center disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty(q => Math.max(1, q - 1))}><Minus size={16} /></button><span className="w-8 text-center font-semibold">{qty}</span><button aria-label="Increase quantity" className="w-11 h-11 flex items-center justify-center disabled:opacity-40" disabled={qty >= p.stock} onClick={() => setQty(q => Math.min(p.stock, q + 1))}><Plus size={16} /></button></div>
            <button onClick={() => addToCart(p, qty, size)} disabled={p.stock <= 0} className={`${BTN_BLACK} px-7 py-3.5 text-sm flex items-center gap-2`}><ShoppingCart size={18} /> Add to Cart</button>
            <button onClick={() => { addToCart(p, qty, size); nav('/checkout') }} disabled={p.stock <= 0} className={`${BTN_OUTLINE} px-7 py-3.5 text-sm`}>Buy Now</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-3 mt-7 text-sm">
            <div className={`${CARD} !rounded-2xl p-4 flex gap-2.5`}><Truck size={18} className="shrink-0" /><span>Delivery across Pakistan in a few working days (sample)</span></div>
            <div className={`${CARD} !rounded-2xl p-4 flex gap-2.5`}><RotateCcw size={18} className="shrink-0" /><span>Size exchange for unworn items with tags (sample policy)</span></div>
            <div className={`${CARD} !rounded-2xl p-4 flex gap-2.5`}><ShieldCheck size={18} className="shrink-0" /><span>Cash on Delivery — pay at your door (sample policy)</span></div>
          </div>
        </div>
      </div>
      {related.length > 0 && <section className="py-10 sm:py-12"><SectionHeader title="You may also like" actionTo={`/shop?category=${p.category}`} /><div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">{related.map(x => <ProductCard key={x.id} p={x} />)}</div></section>}
    </div>
  )
}

export function CheckoutPage() {
  const { cart, placeOrder, placeOrderLive, shippingFor, user } = useShop()
  const [done, setDone] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null); const [placing, setPlacing] = useState(false)
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const shipping = shippingFor(subtotal); const total = subtotal + shipping
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setOrderError(null); setPlacing(true)
    try {
      const fd = new FormData(e.currentTarget)
      if (demoMode) {
        const order = placeOrder({ items: cart, total, name: String(fd.get('name')), city: String(fd.get('city')), phone: String(fd.get('phone')), address: String(fd.get('address')), payment: 'Cash on Delivery' })
        setDone(order.id); return
      }
      const res = await placeOrderLive({
        name: String(fd.get('name')), city: String(fd.get('city')), phone: String(fd.get('phone')),
        email: String(fd.get('email')), country: String(fd.get('country')), address: String(fd.get('address')),
        postalCode: String(fd.get('postal') || ''), notes: String(fd.get('notes') || ''),
      })
      if (res.error || !res.order) { setOrderError(res.error || 'Order could not be created. Your cart was kept.'); return }
      setDone(res.order.id)
    } finally { setPlacing(false) }
  }
  if (done) return <div className="max-w-2xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-12 px-6`}><CheckCircle2 size={48} className="mx-auto text-green-700" /><h1 className="text-3xl font-extrabold tracking-tight mt-4">Order placed — {done}</h1><p className="text-neutral-600 mt-3 leading-relaxed">Thank you! {demoMode ? 'In demo mode this order is saved in this browser only.' : 'Your order is saved and the shop can see it in /admin → Orders.'} Pay on delivery — Cash on Delivery.</p><div className="flex flex-wrap justify-center gap-3 mt-6"><Link to="/track" className={`${BTN_BLACK} px-7 py-3 text-sm`}>Track Order</Link><Link to="/shop" className={`${BTN_OUTLINE} px-7 py-3 text-sm`}>Continue shopping</Link></div></div></div>
  if (!cart.length) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-12 px-6`}><h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1><p className="mt-2 text-neutral-600">Your cart is empty.</p><Link to="/shop" className="underline mt-4 inline-block font-medium">Back to shop</Link></div></div>
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10"><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Checkout</h1>
      <ol className="flex flex-wrap gap-2 mt-5 text-sm" aria-label="Checkout steps"><li><span className="inline-flex items-center gap-1.5 bg-[#F7F7F7] border border-neutral-200 rounded-full px-3.5 py-1.5 font-medium"><Check size={14} /> 1. Cart</span></li><li><span className="inline-flex items-center gap-1.5 bg-black text-white rounded-full px-3.5 py-1.5 font-semibold">2. Checkout</span></li><li><span className="inline-flex items-center gap-1.5 bg-[#F7F7F7] border border-neutral-200 rounded-full px-3.5 py-1.5 text-neutral-500">3. Done</span></li></ol>
      {demoMode && <p className="text-sm bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 mt-5">Demo mode: orders are created in this browser only.</p>}
      {orderError && <p role="alert" className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mt-5">{orderError}</p>}
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 mt-6 items-start"><div className="grid gap-5 min-w-0">
        <div className={CARD}><div className="p-5 sm:p-6"><h2 className="font-bold text-lg mb-4">Contact &amp; delivery</h2><div className="grid sm:grid-cols-2 gap-4">
          <Field name="name" label="Full name *" required /><Field name="phone" label="Phone number *" required /><Field name="email" label="Email *" type="email" defaultValue={user?.email || ''} required /><Field name="country" label="Country *" defaultValue="Pakistan" required /><Field name="city" label="City *" required /><Field name="postal" label="Postal code" /><div className="sm:col-span-2"><label className="text-sm font-semibold block mb-1.5" htmlFor="address">Complete address *</label><textarea id="address" name="address" required className={INPUT} rows={3} /></div>
          <div className="sm:col-span-2"><label className="text-sm font-semibold block mb-1.5" htmlFor="notes">Order notes</label><textarea id="notes" name="notes" className={INPUT} rows={2} /></div>
        </div></div></div>
        <fieldset className={CARD}><div className="p-5 sm:p-6"><legend className="font-bold text-lg px-1">Payment method</legend>
          <div className="grid gap-2.5 mt-1"><label className="flex items-center gap-3 border rounded-2xl px-4 py-3.5 text-sm font-medium border-black bg-[#F7F7F7]"><input type="radio" name="payment" checked readOnly className="accent-black w-4 h-4" />Cash on Delivery<span className="ml-auto text-xs font-semibold bg-green-100 text-green-800 rounded-full px-2.5 py-1">Pay at your door</span></label></div>
          <p className="text-sm text-neutral-600 mt-4 leading-relaxed">Sample payment policy: Cash on Delivery only — you pay in cash when your order arrives at your door, so there is no need to pay anything in advance. The final payment options will be confirmed by the owner.</p>
        </div></fieldset>
        <button disabled={placing} className={`${BTN_BLACK} py-4 text-sm sm:text-base`}>{placing ? 'Placing order…' : `Place Order — ${formatPKR(total)}`}</button>
      </div><aside className={`${CARD} p-6 lg:sticky lg:top-24`}><h2 className="font-bold text-lg">Order summary</h2>{cart.map(i => <p key={`${i.product.id}-${i.size}`} className="flex justify-between gap-3 text-sm py-1.5"><span className="min-w-0">{i.product.name} ({i.size}) × {i.qty}</span><span className="shrink-0">{formatPKR(i.product.price * i.qty)}</span></p>)}<p className="flex justify-between text-sm py-1.5"><span>Delivery (sample)</span><span>{formatPKR(shipping)}</span></p><p className="flex justify-between font-bold border-t border-neutral-200 pt-3 mt-2"><span>Total</span><span>{formatPKR(total)}</span></p><p className="text-xs text-neutral-500 mt-4 leading-relaxed">All prices are sample prices. Delivery across Pakistan usually takes a few working days; the delivery fee at checkout is a sample and will be confirmed with your order.</p></aside></form></div>
  )
}
function Field({ name, label, required, type = 'text', defaultValue }: { name: string; label: string; required?: boolean; type?: string; defaultValue?: string }) {
  return <div><label className="text-sm font-semibold block mb-1.5" htmlFor={name}>{label}</label><input id={name} name={name} required={required} type={type} defaultValue={defaultValue} className={INPUT} /></div>
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, loginWithPassword, register, resetPassword } = useShop(); const nav = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null); setInfo(null); setBusy(true)
    try {
      if (mode === 'login') {
        const res = await loginWithPassword(email, password)
        if (res.error) { setError(res.error); return }
        nav(res.user?.isAdmin ? '/admin' : '/profile')
      } else {
        const res = await register(name, email, password)
        if (res.error) { setError(res.error); return }
        if (res.needsConfirmation) { setInfo('Account created. Please check your email to confirm it, then sign in.'); return }
        nav('/profile')
      }
    } finally { setBusy(false) }
  }
  const doReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(null); setInfo(null); setBusy(true)
    try {
      const res = await resetPassword(email)
      if (res.error) setError(res.error)
      else setInfo(demoMode ? 'Demo mode: password reset is not sent in this browser.' : 'Password reset link sent — check your email.')
    } finally { setBusy(false) }
  }
  return <div className="max-w-md mx-auto px-4 py-12 sm:py-16"><div className={`${CARD} p-6 sm:p-8`}><h1 className="text-3xl font-extrabold tracking-tight">{mode === 'login' ? 'Customer Login' : 'Customer Registration'}</h1>
    <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{demoMode
      ? 'Demo mode: any email signs you in locally in this browser.'
      : 'Sign in with your Supabase account. Admin access comes only from a user_roles row in Supabase — there is no public admin registration and no admin flag set from this page.'}</p>
    {error && <p role="alert" className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mt-4">{error}</p>}
    {info && <p role="status" className="text-sm bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 mt-4">{info}</p>}
    <form className="grid gap-4 mt-6" onSubmit={submit}>
      {mode === 'register' && <div><label className="text-sm font-semibold block mb-1.5" htmlFor="auth-name">Full name</label><input id="auth-name" required placeholder="Full name" value={name} onChange={e => setName(e.target.value)} className={INPUT} /></div>}
      <div><label className="text-sm font-semibold block mb-1.5" htmlFor="auth-email">Email</label><input id="auth-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={INPUT} /></div>
      <div><label className="text-sm font-semibold block mb-1.5" htmlFor="auth-password">Password</label><input id="auth-password" required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={INPUT} /></div>
      <button disabled={busy} className={`${BTN_BLACK} py-3.5 text-sm`}>{busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}</button>
    </form>
    <p className="text-sm mt-5 text-center">{mode === 'login' ? <>New here? <Link to="/register" className="underline font-medium">Register</Link></> : <>Already have an account? <Link to="/login" className="underline font-medium">Login</Link></>} • <button onClick={() => setShowReset(s => !s)} className="underline font-medium">Password reset</button></p>
    {showReset && <form className="grid gap-3 mt-5 bg-[#F7F7F7] border border-neutral-200 rounded-2xl p-4" onSubmit={doReset}>
      <p className="text-sm text-neutral-600 leading-relaxed">{demoMode ? 'Demo mode: reset links are not sent.' : 'Enter your email and we will send a Supabase password reset link.'}</p>
      <label className="text-sm font-semibold" htmlFor="reset-email">Email</label>
      <input id="reset-email" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className={INPUT} />
      <button disabled={busy} className={`${BTN_OUTLINE} py-3 text-sm`}>Send reset link</button>
    </form>}
    {demoMode && <button onClick={() => { login('admin@ukthreads.demo', true); nav('/admin') }} className={`${BTN_OUTLINE} mt-6 w-full py-3 text-sm`}>Demo: sign in as admin (demo only — not a real admin account)</button>}
  </div></div>
}

export function ProfilePage() {
  const { user, orders, logout, authLoading } = useShop(); const nav = useNavigate()
  if (authLoading) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-12 px-6`}><h1 className="text-2xl font-bold">Loading your profile…</h1><p className="text-neutral-500 text-sm mt-2">Checking your session.</p></div></div>
  if (!user) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><div className={`${CARD} py-12 px-6`}><h1 className="text-2xl font-bold">Please login first</h1><p className="text-neutral-500 text-sm mt-2">Sign in to see your profile and orders.</p><Link to="/login" className={`${BTN_BLACK} inline-block px-7 py-3 text-sm mt-5`}>Go to login</Link></div></div>
  return <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">
    <div className={`${CARD} p-6 sm:p-7 flex flex-wrap gap-4 items-center`}><span className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center text-xl font-extrabold shrink-0">{(user.name || user.email).charAt(0).toUpperCase()}</span><div className="min-w-0 flex-1"><h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">{user.name}</h1><p className="text-neutral-600 text-sm mt-0.5 truncate">{user.email} {user.isAdmin && <span className="ml-1 font-semibold text-black">• {demoMode ? 'Admin (demo)' : 'Admin'}</span>}</p></div><button onClick={() => { logout(); nav('/') }} className={`${BTN_OUTLINE} px-5 py-2.5 text-sm shrink-0`}>Logout</button></div>
    <h2 className="text-xl font-bold mt-10 mb-4">My Orders</h2>{orders.length === 0 ? <div className={`${CARD} p-6 text-center`}><Package size={36} className="mx-auto text-neutral-400" /><p className="text-neutral-500 mt-3">No orders yet.</p><Link to="/shop" className={`${BTN_BLACK} inline-block px-6 py-3 text-sm mt-4`}>Shop Now</Link></div> : <div className="grid gap-3">{orders.map(o => <div key={o.id} className={`${CARD} p-5 flex flex-wrap justify-between gap-3`}><div className="min-w-0"><p className="font-semibold">{o.id} — {o.date}</p><p className="text-sm text-neutral-600 mt-1">{o.items.map(i => `${i.product.name} (${i.size}) × ${i.qty}`).join(', ')}</p><p className="text-sm text-neutral-500 mt-1">{o.payment} • {o.paymentStatus}</p></div><div className="text-right shrink-0"><p className="font-bold">{formatPKR(o.total)}</p><div className="mt-2"><StatusPill status={o.status} /></div></div></div>)}</div>}
  </div>
}

const TRACK_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered']

export function TrackPage() {
  const { orders } = useShop(); const [id, setId] = useState(''); const [found, setFound] = useState<typeof orders[0] | null>(null); const [searched, setSearched] = useState(false)
  const stepIndex = found ? TRACK_STEPS.indexOf(found.status) : -1
  return <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12"><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Order Tracking</h1><p className="text-neutral-600 mt-2">Enter your order ID to check its status.</p>
    <div className={CARD}><form className="flex flex-col sm:flex-row gap-2 p-4 sm:p-5" onSubmit={e => { e.preventDefault(); setSearched(true); setFound(orders.find(o => o.id === id.trim()) || null) }}><label htmlFor="track-id" className="sr-only">Order ID</label><input id="track-id" value={id} onChange={e => setId(e.target.value)} placeholder="Order ID, e.g. UT-123456" className={`${INPUT} flex-1`} /><button className={`${BTN_BLACK} px-7 py-3 text-sm shrink-0`}>Track</button></form></div>
    {found && <div className={`${CARD} p-5 sm:p-6 mt-5`}>
      <div className="flex flex-wrap justify-between gap-3 items-start"><div><p className="font-bold text-lg">{found.id}</p><p className="text-sm text-neutral-600 mt-1">{found.items.map(i => `${i.product.name} (${i.size}) × ${i.qty}`).join(', ')}</p><p className="text-sm text-neutral-500 mt-1">Payment: {found.payment} ({found.paymentStatus}) • Total {formatPKR(found.total)}</p></div><StatusPill status={found.status} /></div>
      {(found.status === 'Cancelled') ? <p className="text-sm bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 mt-5">This order is cancelled. For questions, contact the shop — no contact details are published here yet.</p> : <ol className="mt-6 space-y-0">{TRACK_STEPS.map((s, i) => <li key={s} className="flex gap-3"><span className="flex flex-col items-center"><span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i < stepIndex ? 'bg-black text-white' : i === stepIndex ? 'bg-black text-white ring-4 ring-black/10' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}>{i < stepIndex || i === stepIndex ? <Check size={14} /> : i + 1}</span>{i < TRACK_STEPS.length - 1 && <span className={`w-0.5 flex-1 min-h-5 ${i < stepIndex ? 'bg-black' : 'bg-neutral-200'}`} />}</span><span className={`py-1 text-sm pb-5 ${i === stepIndex ? 'font-bold' : i < stepIndex ? 'text-neutral-700' : 'text-neutral-400'}`}>{s}{i === stepIndex ? ' — current status' : ''}</span></li>)}</ol>}
    </div>}
    {searched && !found && <p className="text-neutral-600 bg-[#F7F7F7] border border-neutral-200 rounded-2xl px-4 py-3.5 mt-5 text-sm leading-relaxed">No order found with that ID here. Signed-in customers see their Supabase orders below; guest live orders appear here in the browser they were placed in.</p>}
    <h2 className="font-bold text-lg mt-10 mb-3">Your orders</h2>{orders.length === 0 ? <p className="text-neutral-500 text-sm">No orders in this browser yet.</p> : <div className="grid gap-3">{orders.map(o => <div key={o.id} className={`${CARD} !rounded-2xl p-4 flex flex-wrap justify-between gap-3 items-center`}><span className="text-sm"><strong>{o.id}</strong> — {formatPKR(o.total)}</span><span className="flex items-center gap-2"><StatusPill status={o.status} /><button onClick={() => { setId(o.id); setSearched(true); setFound(o) }} className={`${BTN_OUTLINE} px-4 py-2 text-xs`}>Track</button></span></div>)}</div>}
  </div>
}

export function StaticPage({ title, body }: { title: string; body: string }) {
  return <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12"><h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1><div className={`${CARD} p-6 sm:p-8 mt-6 whitespace-pre-line text-neutral-700 leading-relaxed`}>{body}</div></div>
}

export const STATIC: Record<string, { title: string; body: string }> = {
  about: { title: 'About Us', body: 'UK Threads is a clothing storefront for premium shirts and tees. (Brand name "UK Threads" is a placeholder and is not confirmed as the final brand name.)\n\nThe catalogue is a sample catalogue: 30 shirts and tees in sizes S to XXL, with representative photos and sample prices in PKR. The final product range, prices and policies will be confirmed by the owner.\n\nNo shop address, phone number or business email has been confirmed for this clothing store yet, so none is published here.' },
  contact: { title: 'Contact Us', body: 'Questions about a size, an order or a product? Send a message.\n\nNo shop address, phone number or business email has been confirmed for this clothing store yet — none is published here. Social media links are placeholders until the owner provides them.' },
  faq: { title: 'FAQ', body: FAQS.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n') },
  privacy: { title: 'Privacy Policy', body: 'We collect only the information needed to process orders: name, phone, email, address and order details. In demo mode this stays in your browser. In live mode it is stored in Supabase with Row Level Security — customers can only access their own data. We do not sell personal data.' },
  terms: { title: 'Terms and Conditions', body: 'By using UK Threads you agree to these terms. Products shown are sample products until approved. Prices are in PKR and are sample prices. Orders are subject to confirmation and stock availability. The final payment options and policies will be confirmed by the owner.' },
  shipping: { title: 'Shipping Policy', body: 'Delivery across Pakistan usually takes a few working days. The delivery fee at checkout is a sample (Rs. 250, free over Rs. 5,000) and will be confirmed with your order.\n\nDelivery estimates, zones and rates are admin-configurable in the live store and must be confirmed by the owner before they are promised to customers. International delivery is not advertised as available yet.' },
  returns: { title: 'Return and Refund Policy', body: 'Under the sample exchange policy, if the size is not right you can contact us with your order number to arrange a size exchange for an unworn item with its tags on.\n\nThe owner will confirm the final exchange and return policy. Eligible cancellations restore stock in the admin system.' },
}
