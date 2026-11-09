import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { formatPKR, SIZES } from '../data/catalog'
import { categoryNameFor, useShop } from '../store/shop'
import { demoMode, supabase } from '../lib/supabase'

// UK Threads admin — same pattern as UK Accessories: hooks before any early
// return (a direct load of /admin must not change hook count between renders),
// admin gate from Supabase user_roles via the store, RLS enforces writes.

const TABS = ['Overview', 'Products', 'Orders', 'Shipping', 'Settings'] as const
const ORDER_STATUSES = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
const PAYMENT_STATUSES = ['Pay on delivery', 'Paid', 'Pending verification']

export function AdminPage() {
  const {
    user, orders, products, categories, updateOrderStatus, setToast, authLoading,
    shippingMethods, storeSettings, liveDataError, refreshLiveData,
    updateOrderStatusLive, saveProductLive, deleteProductLive, approveProductLive,
    saveShippingLive, deleteShippingLive, saveSettingsLive, updateStockLive, setProducts, logout,
  } = useShop()
  const nav = useNavigate()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Overview')
  // All hooks and derived values are computed unconditionally, before any
  // early return, so the hook count never changes between renders.
  const revenue = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0)
  const lowStock = products.filter(p => p.stock < 20)
  const stats = [
    ['Total Revenue (live orders)', formatPKR(revenue)],
    ['Total Orders', String(orders.length)],
    ['Total Products', String(products.length)],
    ['Pending Orders', String(orders.filter(o => o.status === 'Pending').length)],
    ['Delivered', String(orders.filter(o => o.status === 'Delivered').length)],
    ['Cancelled Orders', String(orders.filter(o => o.status === 'Cancelled').length)],
    ['Low Stock Products', String(lowStock.length)],
  ]
  const top = useMemo(() => {
    const m = new Map<string, number>()
    orders.forEach(o => o.items.forEach(i => m.set(i.product.name, (m.get(i.product.name) || 0) + i.qty)))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [orders])
  const [busy, setBusy] = useState<string | null>(null)
  const [formMsg, setFormMsg] = useState<string | null>(null)
  const [prodForm, setProdForm] = useState({ id: '', name: '', price: '', stock: '', category: 'shirts', description: '', image: '', fabric: '', sizes: [...SIZES] as string[], featured: false, bestseller: false })
  const [prodPrevImage, setProdPrevImage] = useState('')
  const [prodImageFile, setProdImageFile] = useState<File | null>(null)
  const [prodUploadPreview, setProdUploadPreview] = useState<string | null>(null)
  const [prodUploading, setProdUploading] = useState(false)
  const prodDisplayImage = prodUploadPreview ?? (prodForm.image || '')
  const clearProdImageUpload = () => { setProdImageFile(null); setProdUploadPreview(null) }
  const resetProdForm = () => { setProdForm({ id: '', name: '', price: '', stock: '', category: 'shirts', description: '', image: '', fabric: '', sizes: [...SIZES], featured: false, bestseller: false }); setProdPrevImage(''); clearProdImageUpload() }
  const [shipForm, setShipForm] = useState({ id: '', name: '', price: '', freeOver: '', zone: 'Pakistan', estimateDays: '', active: true })
  const [settingsForm, setSettingsForm] = useState({ storeName: 'UK Threads', slogan: 'Premium Shirts & Tees', currency: 'PKR', announcement: '', codFee: '250' })
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({})
  useEffect(() => {
    if (storeSettings) setSettingsForm({
      storeName: storeSettings.storeName, slogan: storeSettings.slogan,
      currency: storeSettings.currency, announcement: storeSettings.announcement ?? '',
      codFee: String(storeSettings.codFee),
    })
  }, [storeSettings])
  const run = async (label: string, fn: () => Promise<{ error?: string }>) => {
    setBusy(label); setFormMsg(null)
    const res = await fn()
    setBusy(null)
    if (res.error) setFormMsg(`${label} failed: ${res.error}`)
    else { setFormMsg(`${label} saved.`); setToast(`${label} saved.`) }
    return !res.error
  }
  const inputCls = 'border rounded px-3 py-2 text-sm w-full'
  if (authLoading) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Admin — Loading…</h1><p className="text-neutral-600 mt-3">Checking your Supabase session and admin role… If this stays here, reload the page — your session is stored by Supabase, it is not lost.</p></div>
  }
  if (!user) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Admin — Sign in first</h1><p className="text-neutral-600 mt-3">You are not signed in on this device/browser, so /admin cannot show the dashboard yet — this is not a denial of your account. Sign in at /login first (with the admin Supabase account), then return to /admin and it will open. If you just signed in on another device, sign in here too: sessions are per-browser.</p><Link to="/login" className="inline-block mt-5 bg-black text-white px-6 py-2.5 rounded-full">Go to Login</Link></div>
  }
  if (!user.isAdmin) {
    return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Admin — Protected</h1><p className="text-neutral-600 mt-3">You are signed in as {user.email}, but that account does not have an <code>admin</code> row in Supabase <code>user_roles</code>, so it cannot open the dashboard. Ask an existing admin (or run the SQL in README “First admin setup”) to set that account's role to admin, then sign out and sign in again.</p>{demoMode && <p className="text-sm mt-3">In demo mode only, use the demo admin sign-in on the Login page to preview the dashboard. Frontend checks alone never grant admin rights in live mode — Supabase RLS enforces them.</p>}<Link to="/login" className="inline-block mt-5 bg-black text-white px-6 py-2.5 rounded-full">Go to Login</Link></div>
  }
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap justify-between gap-3"><div><h1 className="text-3xl font-bold">Admin Dashboard</h1><p className="text-sm text-neutral-600">Signed in as {user.email} {demoMode ? '(demo admin preview)' : '(live admin, verified via Supabase user_roles)'}. {demoMode ? 'Figures below are calculated from orders in this browser — no fake statistics.' : 'Figures below are calculated from live Supabase orders — no fake statistics.'}</p></div><button onClick={() => nav('/')} className="border rounded-full px-4 py-2 text-sm h-fit">View Store</button></div>
      <div className="flex gap-2 mt-5 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">{TABS.map(t => <button key={t} onClick={() => setTab(t)} className={`border rounded-full px-4 py-2.5 text-sm shrink-0 ${tab === t ? 'bg-black text-white border-black' : 'border-neutral-300 hover:border-black'}`}>{t}</button>)}<button onClick={async () => { await logout(); nav('/login') }} className="border border-neutral-300 rounded-full px-4 py-2.5 text-sm shrink-0">Logout</button></div>
      {!demoMode && liveDataError && <p className="mt-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">Live data could not be loaded: {liveDataError} <button onClick={() => void refreshLiveData()} className="underline font-semibold ml-2">Retry</button></p>}
      {!demoMode && <button onClick={() => void refreshLiveData()} className="mt-4 border rounded-full px-3 py-1.5 text-sm">Refresh live data</button>}
      {formMsg && <p className="mt-4 bg-neutral-100 border rounded-xl px-4 py-3 text-sm">{formMsg}</p>}
      {busy && <p className="mt-4 text-sm text-neutral-500">Working: {busy}…</p>}

      {tab === 'Overview' && <div className="mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">{stats.map(([k, v]) => <div key={k} className="border border-neutral-200 rounded-2xl p-4 bg-white shadow-sm hover:shadow transition-shadow"><p className="text-xs text-neutral-500">{k}</p><p className="text-xl font-bold mt-1">{v}</p></div>)}</div>
        <div className="grid md:grid-cols-2 gap-4 mt-4"><div className="border rounded-2xl p-5"><h2 className="font-bold">Recent Orders</h2>{orders.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No orders yet.</p> : orders.slice(0, 5).map(o => <p key={o.id} className="text-sm py-1 border-b last:border-0">{o.id} — {o.status} — {formatPKR(o.total)} — {o.payment}</p>)}</div>
        <div className="border rounded-2xl p-5"><h2 className="font-bold">Top Selling Products (from orders above)</h2>{top.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No sales yet.</p> : top.map(([n, q]) => <p key={n} className="text-sm py-1 border-b last:border-0">{n} — {q} sold</p>)}<h2 className="font-bold mt-5">Low Stock</h2>{lowStock.length === 0 ? <p className="text-sm text-neutral-500 mt-2">No low-stock products.</p> : lowStock.map(p => <p key={p.id} className="text-sm py-1 border-b last:border-0">{p.name} — {p.stock} left</p>)}</div></div>
      </div>}

      {tab === 'Products' && <div className="mt-6"><h2 className="font-bold mb-3">Products ({products.length}{products.some(p => p.isDemo) ? ' — sample-flagged products are labelled as such' : ''})</h2>
        <div className="border rounded-2xl p-4 mb-4">
          <h3 className="font-semibold">{prodForm.id ? 'Edit product' : 'Add product'}</h3>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <input className={inputCls} placeholder="Product name" value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} />
            <input className={inputCls} placeholder="Price (PKR, sample)" type="number" value={prodForm.price} onChange={e => setProdForm({ ...prodForm, price: e.target.value })} />
            <input className={inputCls} placeholder="Stock" type="number" value={prodForm.stock} onChange={e => setProdForm({ ...prodForm, stock: e.target.value })} />
            <select className={inputCls} value={prodForm.category} onChange={e => setProdForm({ ...prodForm, category: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            <input className={inputCls} placeholder="Fabric (e.g. Cotton jersey)" value={prodForm.fabric} onChange={e => setProdForm({ ...prodForm, fabric: e.target.value })} />
            <div className="border rounded px-3 py-2 text-sm"><span className="font-semibold">Sizes: </span>{SIZES.map(s => <label key={s} className="mr-3"><input type="checkbox" checked={prodForm.sizes.includes(s)} onChange={e => setProdForm({ ...prodForm, sizes: e.target.checked ? [...prodForm.sizes, s] : prodForm.sizes.filter(x => x !== s) })} /> {s}</label>)}</div>
            <textarea className={`${inputCls} sm:col-span-2`} placeholder="Description" value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} />
          </div>
          <div className="border rounded-xl p-3 mt-3">
            <p className="font-semibold text-sm">Product image</p>
            {prodDisplayImage ? <img src={prodDisplayImage} alt="Product image preview" className="w-24 h-24 object-contain bg-[#F7F7F7] rounded-xl mt-2" /> : <p className="text-sm text-neutral-500 mt-2">No image yet — a default image will be used.</p>}
            <label className="block text-sm font-semibold mt-3">Upload image
              <input className="block mt-1 text-sm font-normal" type="file" accept="image/*" onChange={e => {
                const f = e.target.files?.[0] ?? null
                if (!f) return
                if (!f.type.startsWith('image/')) { setFormMsg('Image upload failed: please choose an image file.'); return }
                if (f.size > 5 * 1024 * 1024) { setFormMsg('Image upload failed: please choose an image under 5 MB.'); return }
                setFormMsg(null); setProdImageFile(f); setProdUploadPreview(URL.createObjectURL(f))
              }} />
            </label>
            {prodUploadPreview && <p className="text-sm text-neutral-500 mt-1">New upload preview — it is saved only when you click Save product.</p>}
            <label className="block text-sm font-semibold mt-3">Or paste image URL
              <input className={`${inputCls} mt-1`} placeholder="https://… or /images/… (leave blank to keep the current image)" value={prodForm.image} onChange={e => { setProdForm({ ...prodForm, image: e.target.value }); clearProdImageUpload() }} />
            </label>
            {(prodUploadPreview || prodForm.image !== prodPrevImage) && <button onClick={() => { clearProdImageUpload(); setProdForm({ ...prodForm, image: prodPrevImage }) }} className="border rounded-full px-3 py-1.5 text-sm mt-3">Remove / restore previous image</button>}
            {prodUploading && <p className="text-sm text-neutral-500 mt-2">Uploading image…</p>}
            <p className="text-sm text-neutral-500 mt-2">Live mode: the uploaded file goes to Supabase Storage bucket <code>clothing-product-images</code> and its public URL is saved as the product image. Demo mode: uploads are local-only in this browser and are not saved to Supabase. Images are representative photos, not exact photos of a specific model, until real shop photos are added.</p>
          </div>
          <label className="text-sm mr-4"><input type="checkbox" checked={prodForm.featured} onChange={e => setProdForm({ ...prodForm, featured: e.target.checked })} /> Featured</label>
          <label className="text-sm"><input type="checkbox" checked={prodForm.bestseller} onChange={e => setProdForm({ ...prodForm, bestseller: e.target.checked })} /> Bestseller</label>
          <div className="flex gap-2 mt-3">
            <button disabled={busy !== null || prodUploading} onClick={async () => {
              if (!prodForm.name.trim()) { setFormMsg('Enter a product name first.'); return }
              if (prodForm.sizes.length === 0) { setFormMsg('Choose at least one size.'); return }
              let image = prodForm.image.trim()
              if (prodImageFile) {
                if (demoMode) {
                  image = prodUploadPreview ?? image
                } else {
                  if (!supabase) { setFormMsg('Image upload failed: Supabase is not configured.'); return }
                  setProdUploading(true); setFormMsg(null)
                  const ext = prodImageFile.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
                  const key = prodForm.id || prodForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                  const path = `products/${key}-${Date.now()}.${ext}`
                  const { error: upErr } = await supabase.storage.from('clothing-product-images').upload(path, prodImageFile, { upsert: true })
                  setProdUploading(false)
                  if (upErr) { setFormMsg(`Image upload failed: ${upErr.message} — product was not saved. Please try again.`); return }
                  image = supabase.storage.from('clothing-product-images').getPublicUrl(path).data.publicUrl
                }
              }
              const existingImage = prodForm.id ? products.find(x => x.id === prodForm.id)?.image : undefined
              const finalImage = image || existingImage || '/images/product-01.webp'
              const payload = { name: prodForm.name.trim(), price: Number(prodForm.price) || 0, stock: Number(prodForm.stock) || 0, category: prodForm.category, description: prodForm.description, image: finalImage, fabric: prodForm.fabric, sizes: prodForm.sizes, featured: prodForm.featured, bestseller: prodForm.bestseller }
              if (demoMode) {
                setProducts(prodForm.id ? products.map(p => p.id === prodForm.id ? { ...p, ...payload } : p) : [...products, { id: prodForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), sku: `UKT-${prodForm.name.toUpperCase().slice(0, 20)}`, slug: prodForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), seoTitle: prodForm.name, seoDescription: '', isDemo: true, ...payload }])
                setFormMsg('Product saved in this browser only (demo mode). Uploaded images are local-only in demo mode.'); resetProdForm()
              } else if (await run('Product', () => saveProductLive(prodForm.id ? { ...payload, id: prodForm.id, slug: products.find(p => p.id === prodForm.id)?.slug } : payload))) {
                resetProdForm()
              }
            }} className="bg-black text-white rounded-full px-4 py-2 text-sm">Save product</button>
            {prodForm.id && <button onClick={() => resetProdForm()} className="border rounded-full px-4 py-2 text-sm">Cancel edit</button>}
          </div>
          {demoMode && <p className="text-sm text-neutral-500 mt-2">Demo mode: product edits stay in this browser. In live mode the same form writes to Supabase <code>clothing_products</code> (RLS admin-only).</p>}
        </div>
        {products.map(p => <div key={p.id} className="border rounded-xl p-3 mb-2 flex flex-wrap justify-between gap-3 items-center"><img src={p.image} alt="" className="w-12 h-12 object-contain bg-[#F7F7F7] rounded-lg shrink-0" /><div className="flex-1 min-w-0"><p className="font-semibold">{p.name}</p><p className="text-sm text-neutral-500">{categoryNameFor(categories, p.category)} • SKU {p.sku} • Stock {p.stock} • {formatPKR(p.price)} • Sizes {p.sizes.join(', ')}{p.isDemo ? ' • Sample price — approve only after the owner confirms it' : ''}</p></div><span className="flex gap-2 text-sm">
          <button onClick={() => { setProdForm({ id: p.id, name: p.name, price: String(p.price), stock: String(p.stock), category: p.category, description: p.description, image: p.image, fabric: p.fabric, sizes: [...p.sizes], featured: Boolean(p.featured), bestseller: Boolean(p.bestseller) }); setProdPrevImage(p.image); clearProdImageUpload() }} className="border rounded-full px-3 py-1">Edit</button>
          {!demoMode && p.isDemo && <button onClick={() => void run('Approve product', () => approveProductLive(p.id))} className="border rounded-full px-3 py-1">Approve (remove sample label)</button>}
          <button onClick={async () => { if (!window.confirm(`Delete ${p.name}?`)) return; if (demoMode) { setProducts(products.filter(x => x.id !== p.id)); setFormMsg('Product deleted in this browser only (demo mode).') } else await run('Delete product', () => deleteProductLive(p.id)) }} className="border rounded-full px-3 py-1">Delete</button>
        </span></div>)}
        <h2 className="font-bold mt-6 mb-3">Inventory — quick stock edit</h2>
        <p className="text-sm text-neutral-500 mb-3">Low stock = under 20 units. {demoMode ? 'Demo orders decrement browser stock.' : 'Live orders decrement stock in the server transaction; cancelling restores it.'}</p>
        {products.map(p => <div key={p.id} className={`border rounded-xl p-3 mb-2 flex flex-wrap gap-2 justify-between items-center ${p.stock < 20 ? 'border-amber-400 bg-amber-50' : ''}`}><span>{p.name} — {p.stock} in stock {p.stock < 20 ? '• LOW STOCK' : ''} {p.stock === 0 ? '• OUT OF STOCK' : ''}</span><span className="flex gap-2"><input className="border rounded px-2 py-1 text-sm w-24" type="number" placeholder="New stock" value={stockDraft[p.id] ?? ''} onChange={e => setStockDraft({ ...stockDraft, [p.id]: e.target.value })} /><button onClick={async () => { const v = Number(stockDraft[p.id]); if (Number.isNaN(v) || v < 0) { setFormMsg('Enter a stock number of 0 or more.'); return } if (demoMode) { setProducts(products.map(x => x.id === p.id ? { ...x, stock: v } : x)); setFormMsg('Stock changed in this browser only (demo mode).') } else await run('Stock', () => updateStockLive(p.id, v)) }} className="border rounded-full px-3 py-1 text-sm">Save</button></span></div>)}
      </div>}

      {tab === 'Orders' && <div className="mt-6"><h2 className="font-bold mb-3">Orders</h2>{orders.length === 0 ? <p className="text-neutral-500">No orders yet.</p> : orders.map(o => <div key={o.id} className="border rounded-xl p-4 mb-3"><p className="font-semibold">{o.id} — {o.date} — {o.name}, {o.city} — {formatPKR(o.total)}</p><p className="text-sm">{o.items.map(i => `${i.product.name} (${i.size}) × ${i.qty}`).join(', ')}</p><p className="text-sm">Payment: {o.payment} ({o.paymentStatus}) • Status: {o.status}</p>{o.phone && <p className="text-sm text-neutral-500">Phone: {o.phone}{o.address ? ` • ${o.address}` : ''}</p>}
        <div className="flex flex-wrap gap-4 mt-2">
          <label className="text-sm">Change status: <select value={o.status} onChange={e => { if (demoMode) { updateOrderStatus(o.id, e.target.value); setFormMsg('Order status changed in this browser only (demo mode).') } else void run('Order status', () => updateOrderStatusLive(o.id, e.target.value)) }} className="border rounded px-2 py-1">{ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
          <label className="text-sm">Payment status: <select value={o.paymentStatus} onChange={e => { if (demoMode) { updateOrderStatus(o.id, o.status, e.target.value); setFormMsg('Payment status changed in this browser only (demo mode).') } else void run('Payment status', () => updateOrderStatusLive(o.id, o.status, e.target.value)) }} className="border rounded px-2 py-1">{PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
        </div>
      </div>)}</div>}

      {tab === 'Shipping' && <div className="mt-6"><h2 className="font-bold">Shipping</h2>
        <div className="border rounded-2xl p-4 my-4"><h3 className="font-semibold">{shipForm.id ? 'Edit shipping method' : 'Add shipping method'}</h3><div className="grid sm:grid-cols-2 gap-3 mt-3">
          <input className={inputCls} placeholder="Name (e.g. Cash on Delivery — Pakistan)" value={shipForm.name} onChange={e => setShipForm({ ...shipForm, name: e.target.value })} />
          <input className={inputCls} placeholder="Price (Rs.)" type="number" value={shipForm.price} onChange={e => setShipForm({ ...shipForm, price: e.target.value })} />
          <input className={inputCls} placeholder="Free over (Rs., optional)" type="number" value={shipForm.freeOver} onChange={e => setShipForm({ ...shipForm, freeOver: e.target.value })} />
          <input className={inputCls} placeholder="Zone (e.g. Pakistan)" value={shipForm.zone} onChange={e => setShipForm({ ...shipForm, zone: e.target.value })} />
          <input className={`${inputCls} sm:col-span-2`} placeholder="Estimate (e.g. 2-4 days)" value={shipForm.estimateDays} onChange={e => setShipForm({ ...shipForm, estimateDays: e.target.value })} />
        </div><label className="text-sm mt-3 block"><input type="checkbox" checked={shipForm.active} onChange={e => setShipForm({ ...shipForm, active: e.target.checked })} /> Active (checkout uses the first active method)</label>
        <button disabled={busy !== null} onClick={async () => {
          if (!shipForm.name.trim()) { setFormMsg('Enter a shipping method name first.'); return }
          if (demoMode) { setFormMsg('Shipping edits need live mode. Demo rule: Rs. 250, free over Rs. 5,000.'); return }
          const id = shipForm.id || `ship-${Date.now()}`
          if (await run('Shipping method', () => saveShippingLive({ id, name: shipForm.name.trim(), price: Number(shipForm.price) || 0, freeOver: shipForm.freeOver ? Number(shipForm.freeOver) : null, zone: shipForm.zone || 'Pakistan', estimateDays: shipForm.estimateDays || null, active: shipForm.active }))) setShipForm({ id: '', name: '', price: '', freeOver: '', zone: 'Pakistan', estimateDays: '', active: true })
        }} className="bg-black text-white rounded-full px-4 py-2 text-sm mt-3">Save shipping method</button></div>
        {demoMode ? <p className="text-sm mt-2">Demo rule: Rs. 250, free over Rs. 5,000.</p> : shippingMethods.length === 0 ? <p className="text-sm text-neutral-500">No live shipping methods yet — add one above, otherwise checkout falls back to Rs. 250 / free over Rs. 5,000.</p> : shippingMethods.map(m => <p key={m.id} className="border rounded-xl p-3 mb-2 text-sm flex flex-wrap justify-between gap-2"><span>{m.name} — {formatPKR(m.price)}{m.freeOver != null ? ` — free over ${formatPKR(m.freeOver)}` : ''} — {m.zone}{m.estimateDays ? ` — ${m.estimateDays}` : ''} — {m.active ? 'Active' : 'Inactive'}</span><span className="flex gap-2"><button onClick={() => setShipForm({ id: m.id, name: m.name, price: String(m.price), freeOver: m.freeOver != null ? String(m.freeOver) : '', zone: m.zone, estimateDays: m.estimateDays ?? '', active: m.active })} className="border rounded-full px-3 py-1">Edit</button><button onClick={() => void run('Delete shipping method', () => deleteShippingLive(m.id))} className="border rounded-full px-3 py-1">Delete</button></span></p>)}
        <p className="text-sm text-neutral-500 mt-2">International delivery is not enabled until courier rates are confirmed.</p></div>}

      {tab === 'Settings' && <div className="mt-6"><h2 className="font-bold">Store Settings</h2>
        {demoMode ? <ul className="text-sm space-y-1 mt-2 list-disc ml-5"><li>Store name: UK Threads (placeholder brand name — not confirmed)</li><li>Slogan: Premium Shirts &amp; Tees</li><li>Currency: PKR</li><li>Cash on Delivery fee: Rs. 250 (sample)</li><li>Supabase live: NOT configured — anon key missing</li><li>No shop address, phone number or business email confirmed for this clothing store</li></ul> : <>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            <input className={inputCls} placeholder="Store name" value={settingsForm.storeName} onChange={e => setSettingsForm({ ...settingsForm, storeName: e.target.value })} />
            <input className={inputCls} placeholder="Slogan" value={settingsForm.slogan} onChange={e => setSettingsForm({ ...settingsForm, slogan: e.target.value })} />
            <input className={inputCls} placeholder="Currency" value={settingsForm.currency} onChange={e => setSettingsForm({ ...settingsForm, currency: e.target.value })} />
            <input className={inputCls} placeholder="Cash on Delivery fee (Rs.)" type="number" value={settingsForm.codFee} onChange={e => setSettingsForm({ ...settingsForm, codFee: e.target.value })} />
            <input className={`${inputCls} sm:col-span-2`} placeholder="Announcement bar text (optional)" value={settingsForm.announcement} onChange={e => setSettingsForm({ ...settingsForm, announcement: e.target.value })} />
          </div>
          <button disabled={busy !== null} onClick={() => void run('Settings', () => saveSettingsLive({ storeName: settingsForm.storeName, slogan: settingsForm.slogan, currency: settingsForm.currency, announcement: settingsForm.announcement || null, codFee: Number(settingsForm.codFee) || 250 }))} className="bg-black text-white rounded-full px-4 py-2 text-sm mt-3">Save settings</button>
          <p className="text-sm text-neutral-500 mt-2">Saved to Supabase <code>clothing_store_settings</code> (id 1). The store name stays a placeholder until the owner confirms the final brand name.</p>
        </>}
        <h2 className="font-bold mt-8">Admin Profile</h2><p className="text-sm mt-2">{user.email} — {demoMode ? 'demo admin preview' : 'live admin (Supabase user_roles)'} . Real admin accounts are managed in Supabase Auth + <code>user_roles</code>, never by self-registration. To change this account's password, use the password-reset flow or Supabase Dashboard → Authentication → Users; the app never stores passwords.</p><button onClick={async () => { await logout(); nav('/login') }} className="mt-4 bg-black text-white rounded-full px-4 py-2 text-sm">Logout</button>
      </div>}
      <p className="text-xs text-neutral-400 mt-8">Catalogue source: Supabase in live mode, local fallback only on query failure/empty (see src/store/shop.tsx). No fake reviews or fake statistics are used anywhere in this dashboard.</p>
    </div>
  )
}
