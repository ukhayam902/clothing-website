import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { PRODUCTS, CATEGORIES, SIZES, type Product, type Category } from '../data/catalog'
import { demoMode, supabase } from '../lib/supabase'

// UK Threads (clothing) — store state. Mirrors the UK Accessories pattern:
// live Supabase data first (clothing_* tables), local sample catalogue only
// as a fallback when Supabase is not configured or a query fails, and
// server-side order creation through the create_clothing_order() RPC.
// Brand name "UK Threads" is a placeholder (not confirmed); all prices are
// sample prices in PKR and all photos are representative, until the owner
// confirms the real range, prices and policies.

export type CartItem = { product: Product; qty: number; size: string }
export type Order = {
  id: string; date: string; items: CartItem[]; total: number; status: string;
  payment: string; paymentStatus: string; txnId?: string; name: string; city: string;
  phone?: string; address?: string;
}
export type User = { id?: string; email: string; name: string; isAdmin: boolean } | null
export type AuthResult = { error?: string; user?: NonNullable<User>; needsConfirmation?: boolean }
export type LiveShipping = { id: string; name: string; price: number; freeOver?: number | null; zone: string; estimateDays?: string | null; active: boolean }
export type StoreSettings = { storeName: string; slogan: string; currency: string; announcement?: string | null; codFee: number }
export type CheckoutInput = { name: string; city: string; phone: string; email: string; country: string; address: string; postalCode?: string; notes?: string; payment?: string; txnId?: string }

type Shop = {
  cart: CartItem[]; orders: Order[]; user: User;
  products: Product[]; categories: Category[];
  toast: string | null; authLoading: boolean; cartOpen: boolean;
  liveDataError: string | null; refreshLiveData: () => Promise<void>;
  shippingMethods: LiveShipping[]; storeSettings: StoreSettings | null;
  shippingFor: (subtotal: number) => number;
  placeOrderLive: (input: CheckoutInput) => Promise<{ order?: Order; error?: string }>;
  updateOrderStatusLive: (id: string, status: string, paymentStatus?: string) => Promise<{ error?: string }>;
  saveProductLive: (p: Partial<Product> & { id?: string }) => Promise<{ error?: string }>;
  deleteProductLive: (id: string) => Promise<{ error?: string }>;
  approveProductLive: (id: string) => Promise<{ error?: string }>;
  saveCategoryLive: (c: { id: string; name: string; slug: string; description: string }) => Promise<{ error?: string }>;
  deleteCategoryLive: (id: string) => Promise<{ error?: string }>;
  saveShippingLive: (m: LiveShipping) => Promise<{ error?: string }>;
  deleteShippingLive: (id: string) => Promise<{ error?: string }>;
  saveSettingsLive: (s: StoreSettings) => Promise<{ error?: string }>;
  updateStockLive: (id: string, stock: number) => Promise<{ error?: string }>;
  addToCart: (p: Product, qty?: number, size?: string) => void;
  removeFromCart: (id: string, size: string) => void; setQty: (id: string, size: string, qty: number) => void;
  clearCart: () => void; setCartOpen: (open: boolean) => void;
  login: (email: string, admin?: boolean) => void; logout: () => void;
  loginWithPassword: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  placeOrder: (o: Omit<Order, 'id' | 'date' | 'status' | 'paymentStatus'>) => Order;
  updateOrderStatus: (id: string, status: string, paymentStatus?: string) => void;
  setProducts: (p: Product[]) => void;
  setToast: (t: string | null) => void; demoMode: boolean;
}
const Ctx = createContext<Shop | null>(null)
export const useShop = () => useContext(Ctx)!
export const categoryNameFor = (categories: Category[], id: string) =>
  categories.find(c => c.id === id)?.name ?? CATEGORIES.find(c => c.id === id)?.name ?? id

const load = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) as T : fb } catch { return fb } }

const mapDbProduct = (row: Record<string, unknown>): Product => {
  const local = PRODUCTS.find(x => x.id === row.id || x.slug === row.slug)
  const sizes = Array.isArray(row.sizes) && row.sizes.length ? (row.sizes as string[]) : (local?.sizes ?? [...SIZES])
  return {
    id: String(row.id),
    sku: String(row.sku ?? local?.sku ?? ''),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category_id),
    price: Number(row.price ?? local?.price ?? 0),
    compareAt: row.compare_at != null ? Number(row.compare_at) : undefined,
    stock: Number(row.stock ?? local?.stock ?? 0),
    image: String(row.image_url || local?.image || '/images/product-01.webp'),
    description: String(row.description ?? local?.description ?? ''),
    fabric: String(row.fabric ?? local?.fabric ?? ''),
    sizes,
    featured: Boolean(row.featured),
    bestseller: Boolean(row.bestseller),
    isNew: Boolean(row.is_new),
    isDemo: Boolean(row.is_demo),
    seoTitle: String(row.seo_title ?? local?.seoTitle ?? `${row.name} — UK Threads`),
    seoDescription: String(row.seo_description ?? local?.seoDescription ?? ''),
  }
}

async function fetchRole(userId: string): Promise<boolean> {
  if (!supabase) return false
  // Admin status is read from public.user_roles, never from a client button.
  try {
    const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).single()
    if (error || !data) return false
    return (data as { role?: string }).role === 'admin'
  } catch { return false }
}

async function fetchProfileName(userId: string, email: string): Promise<string> {
  if (!supabase) return email.split('@')[0]
  try {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
    const name = (data as { full_name?: string } | null)?.full_name
    return name || email.split('@')[0]
  } catch { return email.split('@')[0] }
}

async function ensureProfile(userId: string, email: string, name: string): Promise<void> {
  if (!supabase) return
  try {
    await supabase.from('profiles').upsert({ id: userId, email, full_name: name }, { onConflict: 'id' })
  } catch { /* ignore: profile creation is not sign-in critical */ }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => load('ukt-cart', []))
  const [orders, setOrders] = useState<Order[]>(() => (demoMode ? load('ukt-orders', []) : []))
  const [user, setUser] = useState<User>(() => (demoMode ? load('ukt-user', null) : null))
  const [authLoading, setAuthLoading] = useState<boolean>(() => !demoMode)
  const [products, setProductsState] = useState<Product[]>(() => (demoMode ? PRODUCTS : []))
  const [categories, setCategories] = useState<Category[]>(CATEGORIES)
  const [toast, setToast] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [shippingMethods, setShippingMethods] = useState<LiveShipping[]>([])
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)
  const [liveDataError, setLiveDataError] = useState<string | null>(null)
  useEffect(() => { localStorage.setItem('ukt-cart', JSON.stringify(cart)) }, [cart])
  useEffect(() => { localStorage.setItem('ukt-orders', JSON.stringify(orders)) }, [orders])
  useEffect(() => { if (demoMode) localStorage.setItem('ukt-user', JSON.stringify(user)) }, [user])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) } }, [toast])

  // Live catalogue: Supabase clothing_products/clothing_categories first.
  // A successful query returning 0 rows means the shop is empty and must
  // set products to [], NOT fall back to the local catalogue. The local
  // catalogue is kept only when the query errors or Supabase is unconfigured.
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('clothing_products').select('*').eq('published', true).order('created_at', { ascending: false }),
          supabase.from('clothing_categories').select('*').order('name'),
        ])
        if (cancelled) return
        if (!prodRes.error && prodRes.data) {
          setProductsState((prodRes.data as Record<string, unknown>[]).map(mapDbProduct))
        }
        if (!catRes.error && catRes.data && catRes.data.length > 0) {
          setCategories((catRes.data as Record<string, unknown>[]).map(r => ({
            id: String(r.id), name: String(r.name), slug: String(r.slug),
            description: String(r.description ?? ''), image: String(r.image_url ?? ''),
          })))
        }
      } catch {
        // Network/query failure: keep the local catalogue fallback.
      }
    })()
    return () => { cancelled = true }
  }, [])

  const fetchLiveData = async (forUser: User) => {
    if (!supabase) return
    try {
      const prodQuery = supabase.from('clothing_products').select('*').order('created_at', { ascending: false })
      const prodRes = forUser?.isAdmin ? await prodQuery : await prodQuery.eq('published', true)
      const mappedProducts = !prodRes.error && prodRes.data
        ? (prodRes.data as Record<string, unknown>[]).map(mapDbProduct)
        : null
      if (mappedProducts) setProductsState(mappedProducts)
      const productById = new Map<string, Product>()
      ;(mappedProducts ?? PRODUCTS).forEach(p => productById.set(p.id, p))
      const mapDbOrder = (row: Record<string, unknown>, items: Record<string, unknown>[]): Order => ({
        id: String(row.id),
        date: String(row.created_at ?? '').slice(0, 10),
        items: items.map(it => {
          const prod = productById.get(String(it.product_id)) ?? {
            id: String(it.product_id), sku: String(it.product_id), slug: String(it.product_id), name: String(it.product_id),
            category: 'shirts', price: Number(it.unit_price ?? 0), stock: 0, image: '/images/product-01.webp',
            description: '', fabric: '', sizes: [...SIZES],
            seoTitle: String(it.product_id), seoDescription: '',
          }
          return { product: prod, qty: Number(it.qty ?? 0), size: String(it.size ?? prod.sizes[0] ?? 'M') }
        }),
        total: Number(row.total ?? 0),
        status: String(row.status ?? 'Pending'),
        payment: String(row.payment_method ?? 'Cash on Delivery'),
        paymentStatus: String(row.payment_status ?? 'Pay on delivery'),
        txnId: row.txn_id ? String(row.txn_id) : undefined,
        name: String(row.customer_name ?? ''),
        city: String(row.city ?? ''),
        phone: String(row.phone ?? ''),
        address: String(row.address ?? ''),
      })
      let dbOrders: Order[] = []
      if (forUser?.isAdmin) {
        const ordRes = await supabase.from('clothing_orders').select('*').order('created_at', { ascending: false }).limit(100)
        if (!ordRes.error && ordRes.data) {
          const ids = (ordRes.data as Record<string, unknown>[]).map(r => String(r.id))
          const itemsRes = ids.length ? await supabase.from('clothing_order_items').select('*').in('order_id', ids) : { data: [] as Record<string, unknown>[], error: null }
          const byOrder = new Map<string, Record<string, unknown>[]>()
          ;((itemsRes.data ?? []) as Record<string, unknown>[]).forEach(it => {
            const arr = byOrder.get(String(it.order_id)) ?? []
            arr.push(it); byOrder.set(String(it.order_id), arr)
          })
          dbOrders = (ordRes.data as Record<string, unknown>[]).map(r => mapDbOrder(r, byOrder.get(String(r.id)) ?? []))
        }
      } else if (forUser?.id) {
        const ordRes = await supabase.from('clothing_orders').select('*').eq('user_id', forUser.id).order('created_at', { ascending: false }).limit(100)
        if (!ordRes.error && ordRes.data) {
          const ids = (ordRes.data as Record<string, unknown>[]).map(r => String(r.id))
          const itemsRes = ids.length ? await supabase.from('clothing_order_items').select('*').in('order_id', ids) : { data: [] as Record<string, unknown>[], error: null }
          const byOrder = new Map<string, Record<string, unknown>[]>()
          ;((itemsRes.data ?? []) as Record<string, unknown>[]).forEach(it => {
            const arr = byOrder.get(String(it.order_id)) ?? []
            arr.push(it); byOrder.set(String(it.order_id), arr)
          })
          dbOrders = (ordRes.data as Record<string, unknown>[]).map(r => mapDbOrder(r, byOrder.get(String(r.id)) ?? []))
        }
      }
      if (forUser) setOrders(dbOrders)
      const shipRes = await supabase.from('clothing_shipping_methods').select('*').order('price')
      if (!shipRes.error && shipRes.data) setShippingMethods((shipRes.data as Record<string, unknown>[]).map(r => ({
        id: String(r.id), name: String(r.name), price: Number(r.price ?? 0), freeOver: r.free_over as number | null,
        zone: String(r.zone ?? 'Pakistan'), estimateDays: r.estimate_days as string | null, active: Boolean(r.active),
      })))
      const setRes = await supabase.from('clothing_store_settings').select('*').eq('id', 1).single()
      if (!setRes.error && setRes.data) {
        const s = setRes.data as Record<string, unknown>
        setStoreSettings({
          storeName: String(s.store_name ?? 'UK Threads'), slogan: String(s.slogan ?? 'Premium Shirts & Tees'),
          currency: String(s.currency ?? 'PKR'), announcement: s.announcement as string | null,
          codFee: Number(s.cod_fee ?? 250),
        })
      }
      setLiveDataError(null)
    } catch (e) {
      setLiveDataError(e instanceof Error ? e.message : 'Live data could not be loaded.')
    }
  }
  useEffect(() => {
    if (supabase) void fetchLiveData(user)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.isAdmin])

  // Live session restore: getSession on load + onAuthStateChange afterwards.
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    let cancelled = false
    const applySession = async (userId: string, email: string) => {
      const [isAdmin, name] = await Promise.all([fetchRole(userId), fetchProfileName(userId, email)])
      if (!cancelled) setUser({ id: userId, email, name, isAdmin })
      await ensureProfile(userId, email, name)
    }
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      const s = data.session
      if (s?.user?.email) await applySession(s.user.id, s.user.email)
    }).catch(() => {
      if (!cancelled) setUser(null)
    }).finally(() => {
      if (!cancelled) setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return
      if (event === 'SIGNED_OUT' || !session?.user?.email) { setUser(null); return }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await applySession(session.user.id, session.user.email)
      }
    })
    return () => { cancelled = true; listener.subscription.unsubscribe() }
  }, [])

  const value = useMemo<Shop>(() => ({
    cart, orders, user, products, categories, toast, demoMode, authLoading, cartOpen,
    shippingMethods, storeSettings, liveDataError,
    refreshLiveData: () => fetchLiveData(user),
    addToCart: (p, qty = 1, size) => {
      const s = size || p.sizes[0] || 'M'
      setCart(c => {
        const ex = c.find(i => i.product.id === p.id && i.size === s)
        return ex ? c.map(i => i.product.id === p.id && i.size === s ? { ...i, qty: Math.min(p.stock, i.qty + qty) } : i) : [...c, { product: p, qty, size: s }]
      })
      setToast(`${p.name} (${s}) added to cart`)
    },
    removeFromCart: (id, size) => setCart(c => c.filter(i => !(i.product.id === id && i.size === size))),
    setQty: (id, size, qty) => setCart(c => qty <= 0 ? c.filter(i => !(i.product.id === id && i.size === size)) : c.map(i => i.product.id === id && i.size === size ? { ...i, qty: Math.min(i.product.stock, qty) } : i)),
    clearCart: () => setCart([]),
    setCartOpen,
    login: (email, admin = false) => {
      if (!demoMode) { setToast('Please sign in with your Supabase account.'); return }
      setUser({ email, name: email.split('@')[0], isAdmin: admin })
    },
    logout: async () => {
      if (supabase) { try { await supabase.auth.signOut() } catch { /* fall through to local clear */ } }
      setUser(null)
      try { localStorage.removeItem('ukt-user') } catch { /* ignore */ }
    },
    loginWithPassword: async (email, password) => {
      if (!supabase) { setUser({ email, name: email.split('@')[0], isAdmin: false }); return { user: { email, name: email.split('@')[0], isAdmin: false } } }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user?.email) return { error: error?.message || 'Sign-in failed. Please check your email and password.' }
      const [isAdmin, name] = await Promise.all([fetchRole(data.user.id), fetchProfileName(data.user.id, data.user.email)])
      const u = { id: data.user.id, email: data.user.email, name, isAdmin }
      setUser(u)
      return { user: u }
    },
    register: async (name, email, password) => {
      if (!supabase) { setUser({ email, name, isAdmin: false }); return { user: { email, name, isAdmin: false } } }
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      if (error) return { error: error.message }
      if (!data.session) return { needsConfirmation: true }
      const u = { id: data.user!.id, email, name, isAdmin: false }
      setUser(u)
      await ensureProfile(u.id, email, name)
      return { user: u }
    },
    resetPassword: async (email) => {
      if (!supabase) return {}
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
      if (error) return { error: error.message }
      return {}
    },
    placeOrder: (o) => {
      const method = o.payment || 'Cash on Delivery'
      const order: Order = { ...o, id: `UT-${Date.now().toString().slice(-6)}`, date: new Date().toISOString().slice(0, 10), status: 'Pending', payment: method, paymentStatus: method === 'Cash on Delivery' ? 'Pay on delivery' : 'Awaiting verification' }
      setOrders(prev => [order, ...prev]); setCart([])
      if (demoMode) setProductsState(prev => prev.map(pr => { const item = o.items.find(i => i.product.id === pr.id); return item ? { ...pr, stock: Math.max(0, pr.stock - item.qty) } : pr }))
      return order
    },
    updateOrderStatus: (id, status, paymentStatus) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o)),
    setProducts: setProductsState,
    shippingFor: (subtotal) => {
      if (subtotal <= 0) return 0
      const method = shippingMethods.find(m => m.active)
      if (method) return method.freeOver != null && subtotal >= method.freeOver ? 0 : method.price
      if (storeSettings) return subtotal >= 5000 ? 0 : storeSettings.codFee
      return subtotal >= 5000 ? 0 : 250
    },
    placeOrderLive: async (input) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      try {
        const itemsJson = cart.map(i => ({ product_id: i.product.id, qty: i.qty, size: i.size }))
        if (!itemsJson.length) return { error: 'Your cart is empty.' }
        const { data, error } = await supabase.rpc('create_clothing_order', {
          p_customer_name: input.name, p_phone: input.phone, p_email: input.email,
          p_city: input.city, p_address: input.address, p_postal_code: input.postalCode ?? '',
          p_country: input.country, p_items: itemsJson, p_notes: input.notes ?? '',
          p_payment_method: input.payment ?? 'Cash on Delivery',
          p_txn_id: input.txnId ? input.txnId : null,
        })
        if (error || !data) return { error: error?.message || 'Order could not be created. Your cart was kept.' }
        const orderId = String(data)
        const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
        const method = shippingMethods.find(m => m.active)
        const shipping = subtotal <= 0 ? 0 : (method ? (method.freeOver != null && subtotal >= method.freeOver ? 0 : method.price) : (subtotal >= 5000 ? 0 : 250))
        const payMethod = input.payment ?? 'Cash on Delivery'
        const order: Order = {
          id: orderId, date: new Date().toISOString().slice(0, 10), items: cart,
          total: subtotal + shipping, status: 'Pending',
          payment: payMethod, paymentStatus: payMethod === 'Cash on Delivery' ? 'Pay on delivery' : 'Awaiting verification',
          txnId: input.txnId ? input.txnId : undefined,
          name: input.name, city: input.city, phone: input.phone, address: input.address,
        }
        setOrders(prev => [order, ...prev.filter(o => o.id !== orderId)])
        setCart([])
        await fetchLiveData(user)
        return { order }
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'Order could not be created. Your cart was kept.' }
      }
    },
    updateOrderStatusLive: async (id, status, paymentStatus) => {
      if (!supabase) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o))
        return {}
      }
      const prev = orders.find(o => o.id === id)
      if ((status === 'Cancelled') && prev && prev.status !== 'Cancelled') {
        for (const item of prev.items) {
          try {
            const { data: prod } = await supabase.from('clothing_products').select('stock').eq('id', item.product.id).single()
            if (prod) await supabase.from('clothing_products').update({ stock: Number((prod as Record<string, unknown>).stock ?? 0) + item.qty }).eq('id', item.product.id)
          } catch { /* stock restore is best-effort; the status change still applies */ }
        }
      }
      const updates: Record<string, unknown> = { status }
      if (paymentStatus) updates.payment_status = paymentStatus
      const { error } = await supabase.from('clothing_orders').update(updates).eq('id', id)
      if (error) return { error: error.message }
      setOrders(prevOrders => prevOrders.map(o => o.id === id ? { ...o, status, ...(paymentStatus ? { paymentStatus } : {}) } : o))
      await fetchLiveData(user)
      return {}
    },
    saveProductLive: async (p) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const slug = (p.slug || p.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `product-${Date.now()}`
      const row = {
        id: p.id ?? slug, sku: p.sku ?? `UKT-${slug.toUpperCase().slice(0, 20)}`, slug,
        name: p.name ?? 'Untitled product', category_id: p.category ?? 'shirts',
        price: p.price ?? 0, compare_at: p.compareAt ?? null, stock: p.stock ?? 0,
        description: p.description ?? '', image_url: p.image ?? '/images/product-01.webp',
        fabric: p.fabric ?? '', sizes: p.sizes ?? [...SIZES],
        featured: Boolean(p.featured), bestseller: Boolean(p.bestseller),
        is_new: Boolean(p.isNew), is_demo: p.isDemo ?? true, published: true,
        seo_title: p.seoTitle ?? p.name ?? slug, seo_description: p.seoDescription ?? '',
      }
      const { error } = p.id
        ? await supabase.from('clothing_products').update(row).eq('id', p.id)
        : await supabase.from('clothing_products').insert(row)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    deleteProductLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('clothing_products').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    approveProductLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('clothing_products').update({ is_demo: false }).eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    saveCategoryLive: async (c) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('clothing_categories').upsert({ id: c.id, name: c.name, slug: c.slug, description: c.description }, { onConflict: 'id' })
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    deleteCategoryLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('clothing_categories').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    saveShippingLive: async (m) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('clothing_shipping_methods').upsert({
        id: m.id, name: m.name, price: m.price, free_over: m.freeOver ?? null,
        zone: m.zone, estimate_days: m.estimateDays ?? null, active: m.active,
      }, { onConflict: 'id' })
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    deleteShippingLive: async (id) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('clothing_shipping_methods').delete().eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    saveSettingsLive: async (s) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('clothing_store_settings').upsert({
        id: 1, store_name: s.storeName, slogan: s.slogan, currency: s.currency,
        announcement: s.announcement ?? null, cod_fee: s.codFee,
      }, { onConflict: 'id' })
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    updateStockLive: async (id, stock) => {
      if (!supabase) return { error: 'Supabase is not configured.' }
      const { error } = await supabase.from('clothing_products').update({ stock }).eq('id', id)
      if (error) return { error: error.message }
      await fetchLiveData(user)
      return {}
    },
    setToast,
  }), [cart, orders, user, products, categories, toast, authLoading, cartOpen, shippingMethods, storeSettings, liveDataError])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
