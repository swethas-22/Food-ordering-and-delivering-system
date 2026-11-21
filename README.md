# Parcelo — Luxury Bespoke Food Delivery Web Application & AI Concierge

> *Eat Better. Live Happier.* · IEEE 830 Specification v1.0 Compliant

Parcelo is an ultra-luxury online food ordering and delivery platform featuring **Parcelo AI**, an intelligent gastronomic assistant powered by Google Gemini and strictly grounded in real-time restaurant, dish, and order records.

---

## 🏛️ Architecture Overview

The system follows a modern decoupled client-server architecture:

- **Frontend (`/frontend`)**:
  - React 18 SPA built with Vite
  - React Router DOM for seamless navigation
  - Axios with JWT token interceptors and automatic token rotation
  - Lucide React luxury icons
  - Build-time compiled Tailwind CSS with CSS custom properties for instant theme switching
  - 3 Luxury visual palettes: **Midnight Luxe** (Black & Gold), **Royal Coastal** (Sapphire & Ivory), and **Velvet Heritage** (Burgundy & Beige)
  - Responsive mobile-first design with bottom navigation on mobile screens (`< 768px`) and 2-row sticky navigation on desktop

- **Backend (`/backend`)**:
  - Python / Django 6.x & Django REST Framework
  - 7 Modular Django apps: `accounts`, `restaurants`, `menu`, `cart`, `orders`, `reviews`, and `assistant`
  - PostgreSQL / SQLite with relational constraints, `DecimalField` currency calculations, and database indexes
  - Production-grade JWT authentication with 15-minute access tokens, 7-day refresh token rotation, and blacklisting
  - Complete server-side price recalculation (front-end amounts are display-only)
  - Parcelo AI service with server-side Gemini API integration, prompt grounding, reply validation, and 20/min rate limiting

---

## 🚀 Key Modules & Functional Requirements

1. **Authentication & Profile (Module 1)**:
   - Email/password registration & login with field validations
   - Phone OTP simulation and social OAuth shortcuts
   - Profile management with dietary preferences (All Cuisines, Pure Veg, Eggetarian)
   - Saved delivery addresses (Home, Work, Villa) with default marker

2. **Home & Discovery (Module 2)**:
   - Personalized greeting, search bar with search history chips & clear history
   - Voice search overlay with animated soundwave and sample phrases
   - 9 signature cuisines strip (including Thai as required by the brief)
   - Promotional banners with clickable promo codes
   - Recommended dishes with 3 tabs: All Picks, Trending Now, and Chef's Specials
   - Privé active offers section

3. **Restaurant Discovery (Module 3)**:
   - Search by restaurant name and cuisine
   - Server-applied filters: Pure Veg, Rating 4.7+, Cuisine, and Price Tiers (Budget, Mid, Luxury)
   - Server-applied sorting: Highest Rated, Most Popular, Fastest Delivery, Min Order
   - Dimmed state for unavailable kitchens and empty state with "Clear Filters"

4. **Menu & Customisation (Module 4)**:
   - Kitchen cover banner, badge, rating, reviews, delivery time, fee, and min order
   - In-menu search, Veg Only switch, and category tabs
   - Strictly shows only items from the active kitchen
   - Item customisation modal: portion size, spice level, bespoke add-ons, special chef instructions, live dynamic total
   - Floating cart summary bar (`X Items | ₹Y`) on menu screens

5. **Cart, Checkout & Payment (Module 5)**:
   - Database-backed cart holding items from one kitchen at a time with conflict resolution modal
   - Server-calculated bill: subtotal, promo discount, delivery fee, 5% GST tax, and total
   - Active coupons: `PARCELO20` (20% off up to ₹300), `FEAST150` (flat ₹150 off on ₹500+), and `PRIVEFREE` (free delivery)
   - Checkout with saved address selector or inline address creation
   - Simulated payment options: UPI (Google Pay, PhonePe, Paytm), Cards, Net Banking, and COD with clear simulation notices

6. **Order Tracking (Module 6)**:
   - 5-stage status lifecycle: `Order Placed` ➔ `Order Confirmed` ➔ `Preparing Food` ➔ `Out for Delivery` ➔ `Delivered` (plus `Cancelled`)
   - 10-second automatic polling telemetry
   - Illustrative vector map with kitchen, destination, and animated valet scooter marker
   - Delivery partner details card (Vikram S. • Ather 450X)
   - Order cancellation allowed ONLY before `Preparing Food` (server-enforced)
   - Development mode "Simulate Next Stage" button for interactive testing

7. **Order History, Reviews & Favourites (Module 7)**:
   - 4-tab profile screen: Order History & Reorder, Edit Profile & Addresses, Saved Favourites, Settings & Privileges
   - 3-click reorder from past orders with current prices
   - 5-star interactive rating and comment modal for delivered orders
   - Saved favourites for both restaurants and dishes

8. **Parcelo AI Concierge (Module 8)**:
   - Server-side Google Gemini integration using provided API key
   - Grounded in real-time available dishes, restaurants, and user's order telemetry
   - Reply check: rejects non-context dishes and validates prices against database
   - Rich dish recommendation cards with direct `+ Add` to cart capability
   - Conversation history sidebar: New, Select, Rename, Delete, and Clear Chat
   - Voice interface with animated soundwave and sample prompts

9. **Themes & Design System (Module 9)**:
   - 3 switchable palettes: **Midnight Luxe**, **Royal Coastal**, and **Velvet Heritage**
   - CSS variables on root element for instant switching without reloads
   - WCAG 2.1 AA compliant contrast ratios

---

## 🛠️ Quick Start Guide

### 1. Run the Backend & Unified Application

```bash
cd backend

# Run migrations (already generated)
python manage.py migrate

# Seed luxury database records (already executed)
python seed_data.py

# Start Django development server
python manage.py runserver 8000
```

Once started, open **`http://127.0.0.1:8000/`** in your browser. Django serves the built React SPA for all frontend routes and handles all `/api/*` REST endpoints!

### 2. Frontend Development Server (Optional)

```bash
cd frontend

# Start Vite live-reloading dev server
npm run dev
```

Vite runs at **`http://localhost:5173/`** with an automated proxy forwarding all `/api/*` calls to the Django backend on port 8000.

---

## 🔑 Demo Privé Credentials

- **Email**: `customer@parcelo.luxury`
- **Password**: `Parcelo@2026`
- **Customer Name**: Aarav Mehta
- **Saved Addresses**: Home (Koramangala), Work (Indiranagar), Villa (Whitefield)

### Active Promotional Codes:
- `PARCELO20`: 20% off up to ₹300
- `FEAST150`: Flat ₹150 off on orders above ₹500
- `PRIVEFREE`: Complimentary white-glove delivery
