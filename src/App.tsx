import { Component, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { ShopProvider, useShop } from './store/shop'

// A render crash used to leave a completely blank page (no header, no
// message), most visibly on a direct load of /admin. An error boundary
// turns that into a visible, recoverable message instead of a blank screen.
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) { console.error('UK Threads render error', error) }
  render() {
    if (this.state.error) {
      return <div className="max-w-2xl mx-auto px-4 py-16"><h1 className="text-3xl font-bold">Something went wrong</h1><p className="text-neutral-600 mt-3">The page hit a rendering error instead of loading. Reloading usually clears it; if it repeats on /admin, sign out and sign in again at /login, then return to /admin.</p><p className="text-sm text-neutral-500 mt-3 break-words">{this.state.error.message}</p><button onClick={() => window.location.reload()} className="mt-5 bg-black text-white px-6 py-2.5 rounded-full">Reload page</button></div>
    }
    return this.props.children
  }
}
import { Layout } from './components/layout'
import { AuthPage, CheckoutPage, Home, ProductPage, ProfilePage, ShopPage, STATIC, StaticPage, TrackPage } from './pages/pages'
import { AdminPage } from './pages/admin'

// Scroll restoration: opening a product from the bottom of a page must land
// at the top of the new page (the old static site opened product pages at
// the footer until this was added). Hash anchors are left untouched.
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname, search])
  return null
}

function Toast() {
  const { toast } = useShop()
  if (!toast) return null
  return <div role="status" className="toast-in fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3 rounded-2xl shadow-xl text-sm text-center max-w-[calc(100vw-2rem)] leading-relaxed">{toast}</div>
}

export default function App() {
  return (
    <ShopProvider>
      <BrowserRouter>
        <ErrorBoundary>
        <ScrollToTop />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/admin" element={<AdminPage />} />
            {Object.entries(STATIC).map(([slug, page]) => (
              <Route key={slug} path={`/${slug}`} element={<StaticPage title={page.title} body={page.body} />} />
            ))}
            <Route path="*" element={<StaticPage title="Page not found" body="Sorry — that page does not exist. Use the menu to return to the shop." />} />
          </Routes>
        </Layout>
        <Toast />
        </ErrorBoundary>
      </BrowserRouter>
    </ShopProvider>
  )
}
