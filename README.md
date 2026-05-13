# Frontend — Angular SPA

The frontend is a single-page application built with Angular 19 using standalone components and a feature-based architecture. It communicates exclusively with the Spring Boot backend over REST.

---

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Angular | 19.2.0 | SPA framework (standalone components) |
| TypeScript | 5.7.2 | Language |
| RxJS | 7.8.0 | Reactive streams, HTTP handling |
| @ngx-translate/core | 17.0.0 | i18n (English / Turkish) |
| Bootstrap | 5.3.8 | Responsive UI layout & components |
| Chart.js | 4.5.1 | Analytics charts and dashboards |
| Lucide Angular | 1.0.0 | Icon set |
| html2canvas + jsPDF | — | Export dashboards as PDF |
| xlsx | 0.18.5 | Export data tables to Excel |
| Node.js | 20 (Docker) | Build environment |
| Nginx | alpine | Production static file serving |

---

## User Roles & Dashboards

The application renders completely different views depending on the authenticated user's role:

| Role | Route | Key Capabilities |
|------|-------|-----------------|
| **INDIVIDUAL** | `/individual` | Browse stores & products, cart, checkout, order tracking, refund requests, reviews, personal analytics, AI chatbot |
| **CORPORATE** | `/corporate` | Inventory management, incoming orders, shipment updates, refund approval/rejection, business analytics, AI chatbot |
| **ADMIN** | `/admin` | User management, store oversight, category tree, all orders, corporate upgrade approvals, audit logs |

Unauthenticated users can access public shipment tracking (`/track/:trackingNumber`) without logging in.

---

## Architecture

### Core / Shared / Features Split

```
src/app/
├── core/                   # Singleton services, guards, interceptors
│   ├── services/           # auth, cart, order, product, store, refund, review, ...
│   ├── guards/             # authGuard (JWT check), roleGuard (RBAC), homeGuard
│   ├── interceptors/       # auth.interceptor.ts (JWT), error.interceptor.ts
│   └── utils/              # Shared utility functions
├── shared/                 # Reusable models and UI widgets
│   ├── components/         # review-widget
│   └── models/             # pageable.ts, api-response.ts, order.ts, refund.ts, ...
└── features/               # Domain-specific pages
    ├── auth/               # login, register, verify-email, reset-password, oauth2-callback
    ├── admin/              # Full admin control panel
    ├── corporate/          # Store owner dashboard
    ├── individual/         # Buyer dashboard
    ├── chatbot/            # AI assistant + chat history sidebar
    ├── products/           # Shared product detail page
    └── tracking/           # Public shipment tracker
```

### Routing

Routing is defined in `app.routes.ts`. All feature routes are lazy-loaded via `loadComponent`. Role guards protect feature routes — navigating to `/admin` as an `INDIVIDUAL` user redirects to `/forbidden`.

### HTTP & Authentication

`auth.interceptor.ts` automatically attaches the JWT `Authorization: Bearer <token>` header to every outgoing request. On a `401` response, it attempts a silent token refresh; if that also fails, the user is redirected to `/login`.

### Pagination Strategy

- **Admin / Corporate views** (large datasets): Full pagination UI with page controls.
- **Individual views** (small datasets): Sends `{ pageNumber: 0, pageSize: 100 }` — all data loads in a single request.

---

## Features

### Authentication
- Email + password login with email verification flow
- Google OAuth2 social login
- Forgot password / reset password via email token
- JWT refresh token rotation with silent background renewal

### Shopping (Individual)
- Browse all stores and products, filter by category and price
- Add to cart, update quantities, remove items
- Checkout with Stripe-powered payment form
- Automatic multi-store order splitting — one payment, multiple sub-orders generated server-side
- Active orders list + order detail with per-item status and live shipment tracking
- Purchase history with search, filter (All / In Progress / Delivered / Cancelled), and CSV export
- **Refund requests:** request a refund per item within 7 days of delivery; track status (`PENDING` → `REFUNDED` / `REJECTED`)
- Product reviews with star rating (available after delivery)

### Store Management (Corporate)
- Dashboard with revenue KPIs and order volume charts
- Inventory management — add, edit, delete products with images
- Incoming order processing and shipment status updates
- **Refund management:** approve or reject customer refund requests with a reason
- Customer review monitoring with sentiment breakdown

### Administration (Admin)
- User list with role management and account suspension
- Store oversight and approval workflows
- Hierarchical category management
- Platform-wide order and payment visibility
- Corporate upgrade request approval / rejection workflow
- Full audit log viewer with role and action filters

### AI Chatbot
- Natural language interface to the database (English or Turkish)
- Persistent chat sessions saved as `ChatHistory` records
- Sidebar shows all previous sessions, switchable without page reload
- Responses include human-readable analysis and Chart.js visualizations when applicable

### Analytics
- **Individual:** personal spending trends, order frequency, category breakdown
- **Corporate:** revenue over time, top products, customer demographics, review sentiment

---

## Running Locally

### Prerequisites

- Node.js 20+ — verify with `node -v`
- Angular CLI 19+ — install with `npm install -g @angular/cli`
- Backend running at `http://localhost:8080`

### Steps

```bash
cd vendora-frontend
npm install
ng serve
```

The app is available at **http://localhost:4200**.

Hot-reload is enabled — any saved change reflects in the browser immediately.

### Proxy Configuration

The dev server proxies `/api/**` requests to `http://localhost:8080` via `proxy.conf.json`, so no CORS errors occur during local development.

---

## Running with Docker

```bash
# From the project root
docker compose -f docker-compose.prod.yml up --build frontend
```

The production build is served by Nginx on **http://localhost:80**.

---

## Building for Production

```bash
cd vendora-frontend
ng build --configuration production
```

Output is written to `dist/vendora-frontend/`. The Docker image copies this into an Nginx container for serving.

---

## Environment Configuration

The base API URL is set in `src/environments/`:

```typescript
// environment.development.ts (local dev)
export const environment = {
  production: false,
  baseUrl: 'http://localhost:8080/api',
  serverUrl: 'http://localhost:8080',
  stripePublicKey: 'pk_test_...'
};

// environment.ts (production / Docker)
export const environment = {
  production: true,
  baseUrl: '/api',   // Nginx reverse-proxy handles routing
  serverUrl: '',
  stripePublicKey: 'pk_live_...'
};
```

---

## Key Services

| Service | Responsibility |
|---------|---------------|
| `AuthService` | Login, register, token storage, OAuth2 redirect handling |
| `ProductService` | Product CRUD, search, filtering, `getImageUrl()` helper |
| `CartService` | Cart state management, `currentCart$` observable |
| `OrderService` | Place orders, fetch order history, status updates |
| `ShipmentService` | Fetch shipment by sub-order ID |
| `RefundService` | Create refund requests, get user/store requests, approve, reject |
| `ReviewService` | CRUD reviews, `getMyReviews()`, `getCorporateReviews()` |
| `StoreService` | Store CRUD, `getMyStores()` |
| `PaymentService` | Initiate Stripe checkout, handle redirect result |
| `AnalyticsService` | Fetch KPIs and chart datasets from backend |
| `AiAgentService` | Send questions to the backend AI proxy, receive structured responses |
| `ChatHistoryService` | CRUD for AI chat sessions |
| `ToastService` | `showSuccess(msg)` / `showError(msg)` global toasts |
| `ThemeService` | Light/dark mode toggle, `isDark()` signal |
| `LangService` | EN/TR toggle, `currentLang()` signal |

---

## i18n

Translation files are in `public/assets/i18n/en.json` and `tr.json`. Key sections:

`COMMON` · `AUTH` · `IND` · `CORP` · `ADMIN` · `PRODUCTS` · `ORDER_DETAIL` · `HISTORY` · `REVIEWS` · `MY_REFUNDS` · `CORP_REFUNDS` · `STORES` · `CORP_PRODUCTS` · `CORP_ORDERS` · `ADMIN_DASH`

Use `{{ 'KEY.subKey' | translate }}` in templates, `TranslateService.instant('KEY')` in TypeScript.
