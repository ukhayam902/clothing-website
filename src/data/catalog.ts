export type Category = { id: string; name: string; slug: string; description: string; image: string }
export type Product = {
  id: string; sku: string; slug: string; name: string; category: string;
  price: number; compareAt?: number; stock: number; image: string;
  description: string; fabric: string; sizes: string[];
  featured?: boolean; bestseller?: boolean; isNew?: boolean;
  isDemo?: boolean; seoTitle: string; seoDescription: string;
}

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'] as const
export const SHIPPING_FEE_SAMPLE = 250
export const formatPKR = (n: number) => `Rs. ${n.toLocaleString('en-PK')}`

// Contact & payment details confirmed by the owner 2026-11-09 for this
// clothing store: WhatsApp, Easypaisa and JazzCash all on the same number.
export const WHATSAPP_NUMBER = '03170851250'
export const WHATSAPP_DISPLAY = '0317 0851250'
export const WHATSAPP_URL = 'https://wa.me/923170851250'
export const PAYMENT_ACCOUNT_TITLE = 'Umar Khayam'
export const PAYMENT_METHODS = ['Cash on Delivery', 'Easypaisa', 'JazzCash'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

// SAMPLE CATALOGUE — brand name 'UK Threads' is a placeholder, not confirmed;
// every photo is a representative sample photo and every price is a sample price
// in PKR, to be confirmed by the owner. WhatsApp and Easypaisa/JazzCash
// payment details above are the only confirmed contact details.
export const CATEGORIES: Category[] = [
  { id: 'shirts', name: 'Shirts', slug: 'shirts', description: 'Classic and casual shirts in soft cotton.', image: '/images/category-shirts.webp' },
  { id: 'tees', name: 'T-Shirts', slug: 't-shirts', description: 'Everyday crew tees, stripes and graphic tees.', image: '/images/category-tees.jpeg' },
  { id: 'polos', name: 'Polo Shirts', slug: 'polo-shirts', description: 'Smart-casual polo shirts in pique cotton.', image: '/images/category-polos.webp' },
  { id: 'oversized', name: 'Oversized', slug: 'oversized', description: 'Relaxed, heavyweight oversized fits.', image: '/images/category-oversized.jpeg' },
]

const p = (o: Omit<Product, 'seoTitle' | 'seoDescription' | 'isDemo'>): Product => ({
  ...o,
  // Every local catalogue product is a demo sample until the owner approves it.
  isDemo: true,
  seoTitle: `${o.name} — UK Threads`,
  seoDescription: `${o.name} in Pakistan. Sample product — price to be confirmed by the shop owner.`,
})

export const PRODUCTS: Product[] = [
  p({ id: 'c1', sku: 'UKT-001', slug: 'classic-black-casual-shirt', name: 'Classic Black Casual Shirt', category: 'shirts', price: 1799, compareAt: 2299, stock: 50, image: '/images/product-01.webp', description: 'The shirt that started it all — a clean black button-down with a modern slim fit. Wear it open over a tee or buttoned up for a sharper look.', fabric: 'Cotton twill', sizes: [...SIZES], featured: true, bestseller: true }),
  p({ id: 'c2', sku: 'UKT-002', slug: 'sand-beige-linen-shirt', name: 'Sand Beige Linen Shirt', category: 'shirts', price: 2199, compareAt: 2699, stock: 50, image: '/images/product-02.webp', description: 'A light, breathable short-sleeve linen shirt in a warm sand tone. Relaxed, easy and perfect for warm days.', fabric: 'Linen blend', sizes: [...SIZES], featured: true, bestseller: true }),
  p({ id: 'c3', sku: 'UKT-003', slug: 'white-oxford-shirt', name: 'White Oxford Shirt', category: 'shirts', price: 1999, stock: 50, image: '/images/product-03.jpeg', description: 'A crisp white Oxford with a button-down collar — the most versatile shirt you can own, from office to evenings out.', fabric: 'Oxford cotton', sizes: [...SIZES] }),
  p({ id: 'c4', sku: 'UKT-004', slug: 'sky-blue-oxford-shirt', name: 'Sky Blue Oxford Shirt', category: 'shirts', price: 1899, compareAt: 2299, stock: 50, image: '/images/product-04.jpeg', description: 'Fresh sky blue Oxford cotton with a smooth finish. Smart with trousers, easy with jeans.', fabric: 'Oxford cotton', sizes: [...SIZES] }),
  p({ id: 'c5', sku: 'UKT-005', slug: 'olive-casual-shirt', name: 'Olive Casual Shirt', category: 'shirts', price: 1849, stock: 50, image: '/images/product-05.jpeg', description: 'An easy olive shirt with roll-up sleeves and a soft hand feel. A quiet colour that pairs with everything.', fabric: 'Cotton poplin', sizes: [...SIZES] }),
  p({ id: 'c6', sku: 'UKT-006', slug: 'indigo-denim-shirt', name: 'Indigo Denim Shirt', category: 'shirts', price: 2399, compareAt: 2899, stock: 50, image: '/images/product-06.jpeg', description: 'A sturdy mid-wash denim shirt with snap-style buttons and chest pockets. Gets better with every wear.', fabric: 'Denim cotton', sizes: [...SIZES], featured: true, bestseller: true }),
  p({ id: 'c7', sku: 'UKT-007', slug: 'red-check-flannel-shirt', name: 'Red Check Flannel Shirt', category: 'shirts', price: 2099, stock: 50, image: '/images/product-07.jpeg', description: 'Bold red-and-black checks in soft brushed flannel. Warm, rugged and made for cooler evenings.', fabric: 'Brushed flannel', sizes: [...SIZES] }),
  p({ id: 'c8', sku: 'UKT-008', slug: 'navy-formal-shirt', name: 'Navy Formal Shirt', category: 'shirts', price: 2299, compareAt: 2799, stock: 50, image: '/images/product-08.jpeg', description: 'A deep navy formal shirt with a smooth sateen finish and a tailored cut. Boardroom-ready.', fabric: 'Cotton sateen', sizes: [...SIZES] }),
  p({ id: 'c9', sku: 'UKT-009', slug: 'mono-stripe-resort-shirt', name: 'Mono Stripe Resort Shirt', category: 'shirts', price: 1999, stock: 50, image: '/images/product-09.jpeg', description: 'Black-and-white vertical stripes on a relaxed resort collar. A statement shirt for days out.', fabric: 'Viscose blend', sizes: [...SIZES] }),
  p({ id: 'c10', sku: 'UKT-010', slug: 'charcoal-dress-shirt', name: 'Charcoal Dress Shirt', category: 'shirts', price: 1899, compareAt: 2249, stock: 50, image: '/images/product-10.jpeg', description: 'A smooth charcoal shirt that sits between casual and formal — clean lines, no fuss.', fabric: 'Cotton blend', sizes: [...SIZES] }),
  p({ id: 'c11', sku: 'UKT-011', slug: 'maroon-casual-shirt', name: 'Maroon Casual Shirt', category: 'shirts', price: 1799, stock: 50, image: '/images/product-11.jpeg', description: 'Rich maroon tones in a breathable everyday shirt. Roll the sleeves and go.', fabric: 'Cotton poplin', sizes: [...SIZES] }),
  p({ id: 'c12', sku: 'UKT-012', slug: 'khaki-utility-shirt', name: 'Khaki Utility Shirt', category: 'shirts', price: 2049, compareAt: 2499, stock: 50, image: '/images/product-12.jpeg', description: 'A khaki utility shirt with twin chest pockets and shoulder detailing. Practical, sharp, dependable.', fabric: 'Cotton twill', sizes: [...SIZES] }),
  p({ id: 'c13', sku: 'UKT-013', slug: 'essential-white-crew-tee', name: 'Essential White Crew Tee', category: 'tees', price: 1299, compareAt: 1599, stock: 50, image: '/images/product-13.webp', description: 'The perfect white tee — soft combed cotton, a clean crew neck and a fit that sits just right. A true everyday essential.', fabric: 'Combed cotton', sizes: [...SIZES], featured: true, bestseller: true }),
  p({ id: 'c14', sku: 'UKT-014', slug: 'jet-black-crew-tee', name: 'Jet Black Crew Tee', category: 'tees', price: 1199, stock: 50, image: '/images/product-14.jpeg', description: 'A deep black crew-neck tee in soft cotton. The one you will reach for every single day.', fabric: 'Combed cotton', sizes: [...SIZES], bestseller: true }),
  p({ id: 'c15', sku: 'UKT-015', slug: 'olive-everyday-tee', name: 'Olive Everyday Tee', category: 'tees', price: 1249, stock: 50, image: '/images/product-15.webp', description: 'A muted olive tee in smooth cotton jersey. Easy colour, easy fit, endless pairings.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c16', sku: 'UKT-016', slug: 'slate-grey-crew-tee', name: 'Slate Grey Crew Tee', category: 'tees', price: 1349, compareAt: 1649, stock: 50, image: '/images/product-16.webp', description: 'A dark slate crew tee with a soft melange texture. Understated and endlessly wearable.', fabric: 'Melange cotton', sizes: [...SIZES] }),
  p({ id: 'c17', sku: 'UKT-017', slug: 'navy-blue-crew-tee', name: 'Navy Blue Crew Tee', category: 'tees', price: 1199, stock: 50, image: '/images/product-17.webp', description: 'Classic navy in a breathable jersey knit. Clean, simple and always in style.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c18', sku: 'UKT-018', slug: 'maroon-crew-tee', name: 'Maroon Crew Tee', category: 'tees', price: 1249, compareAt: 1499, stock: 50, image: '/images/product-18.webp', description: 'A rich maroon tee that adds colour without shouting. Soft feel, regular fit.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c19', sku: 'UKT-019', slug: 'navy-stripe-tee', name: 'Navy Stripe Tee', category: 'tees', price: 1499, stock: 50, image: '/images/product-19.jpeg', description: 'Fine white stripes on deep navy. A nautical classic with a modern, relaxed cut.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c20', sku: 'UKT-020', slug: 'surfer-graphic-tee', name: 'Surfer Graphic Tee', category: 'tees', price: 1599, compareAt: 1899, stock: 50, image: '/images/product-20.jpeg', description: 'A white tee with a laid-back surf graphic print. Weekend energy, everyday comfort.', fabric: 'Cotton jersey', sizes: [...SIZES], bestseller: true }),
  p({ id: 'c21', sku: 'UKT-021', slug: 'mustard-yellow-tee', name: 'Mustard Yellow Tee', category: 'tees', price: 1299, stock: 50, image: '/images/product-21.jpeg', description: 'A warm mustard tee that brightens any outfit. Soft, breathable and easy to style.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c22', sku: 'UKT-022', slug: 'charcoal-v-neck-tee', name: 'Charcoal V-Neck Tee', category: 'tees', price: 1399, compareAt: 1699, stock: 50, image: '/images/product-22.jpeg', description: 'A clean charcoal V-neck with a sharp, modern neckline. Minimal and versatile.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c23', sku: 'UKT-023', slug: 'cream-everyday-tee', name: 'Cream Everyday Tee', category: 'tees', price: 1449, stock: 50, image: '/images/product-23.jpeg', description: 'A soft cream tee with a slightly relaxed fit. Warmer than white, easier than colour.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c24', sku: 'UKT-024', slug: 'blue-tie-dye-tee', name: 'Blue Tie-Dye Tee', category: 'tees', price: 1699, compareAt: 1999, stock: 50, image: '/images/product-24.jpeg', description: 'A blue tie-dye wash — no two pieces exactly alike. Stand out without trying.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c25', sku: 'UKT-025', slug: 'forest-green-polo', name: 'Forest Green Polo', category: 'polos', price: 1899, compareAt: 2299, stock: 50, image: '/images/product-25.webp', description: 'A rich forest green polo in breathable pique cotton with a smart two-button placket. Smart-casual done right.', fabric: 'Pique cotton', sizes: [...SIZES], featured: true, bestseller: true }),
  p({ id: 'c26', sku: 'UKT-026', slug: 'jet-black-polo', name: 'Jet Black Polo', category: 'polos', price: 1849, stock: 50, image: '/images/product-26.jpeg', description: 'A sleek black polo that works everywhere — with chinos, jeans or shorts.', fabric: 'Pique cotton', sizes: [...SIZES] }),
  p({ id: 'c27', sku: 'UKT-027', slug: 'classic-white-polo', name: 'Classic White Polo', category: 'polos', price: 1799, compareAt: 2149, stock: 50, image: '/images/product-27.jpeg', description: 'A crisp white polo with a structured collar. Clean, fresh and endlessly pairable.', fabric: 'Pique cotton', sizes: [...SIZES] }),
  p({ id: 'c28', sku: 'UKT-028', slug: 'rose-pink-oxford-shirt', name: 'Rose Pink Oxford Shirt', category: 'shirts', price: 1949, compareAt: 2349, stock: 50, image: '/images/product-28.jpeg', description: 'A soft rose pink Oxford with a button-down collar. A fresh, confident colour that lifts any outfit.', fabric: 'Oxford cotton', sizes: [...SIZES], bestseller: true }),
  p({ id: 'c29', sku: 'UKT-029', slug: 'heather-grey-henley-tee', name: 'Heather Grey Henley Tee', category: 'tees', price: 1499, stock: 50, image: '/images/product-29.jpeg', description: 'A heather grey Henley with a three-button placket. A step up from a basic tee, just as easy to wear.', fabric: 'Cotton jersey', sizes: [...SIZES] }),
  p({ id: 'c30', sku: 'UKT-030', slug: 'oversized-sand-tee', name: 'Oversized Sand Tee', category: 'oversized', price: 1699, compareAt: 1999, stock: 50, image: '/images/product-30.jpeg', description: 'A drop-shoulder oversized tee in a warm sand tone. Heavyweight cotton with a relaxed street fit.', fabric: 'Heavyweight cotton', sizes: [...SIZES], bestseller: true }),
]

export const categoryName = (id: string) => CATEGORIES.find(c => c.id === id)?.name ?? id
export const productBySlug = (slug: string) => PRODUCTS.find(x => x.slug === slug)

// The site's exact 6 FAQs, copied from the static storefront (sample policies).
export const FAQS: { q: string; a: string }[] = [
  { q: "How do I find my size?", a: "Sample size guide: our shirts and tees are listed in sizes S to XXL. As a guide, S fits a 38-inch chest, M a 40-inch, L a 42-inch, XL a 44-inch and XXL a 46-inch chest. If you are between sizes or like a relaxed fit, we recommend going one size up. The owner will confirm the final size guide with the real range." },
  { q: "How do I place an order?", a: "Pick a product, choose your size, and tap Add to Cart — or Buy Now to go straight to checkout. Fill in your name, phone number and address, choose your payment method — Cash on Delivery, Easypaisa or JazzCash — and your order is placed." },
  { q: "How do I pay?", a: "Three ways: Cash on Delivery — pay in cash when your order arrives at your door, no advance payment needed; Easypaisa or JazzCash — pay in advance to 03170851250 (Umar Khayam), enter your transaction ID at checkout and share the screenshot on WhatsApp 0317 0851250 for verification." },
  { q: "How long does delivery take?", a: "Orders are confirmed on your phone number first, then dispatched. Delivery across Pakistan usually takes a few working days; the delivery fee at checkout is a sample and will be confirmed with your order." },
  { q: "Can I exchange a size?", a: "Under the sample exchange policy, if the size is not right you can contact us with your order number to arrange a size exchange for an unworn item with its tags on. The owner will confirm the final exchange policy." },
  { q: "Are these the final products and prices?", a: "This page is a sample catalogue: the photos are representative sample photos and the prices are sample prices. The owner will confirm the final product range and prices — everything marked as a sample will be updated then." },
]

export const HERO_IMAGES = {
  'main': '/images/hero-main.webp',
  'hero-black-shirt': '/images/hero-black-shirt.webp',
  'hero-white-tee': '/images/hero-white-tee.webp',
  'hero-green-polo': '/images/hero-green-polo.webp',
  'hero-beige-shirt': '/images/hero-beige-shirt.webp',
  'style-split': '/images/style-split.webp',
}
