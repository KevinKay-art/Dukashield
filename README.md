# DukaShield 🛡️

> **Smart Business Assistant & Automated Communication Engine for East African Shopkeepers**

DukaShield is a tailored management application designed specifically for small shopkeepers (*duka* owners) across East Africa (Kenya, Uganda, Tanzania, Rwanda). It digitizes paper-based sales logs and informal customer debt ledgers, monitors inventory levels, generates real-time business health diagnostics, and connects seamlessly to mobile networks via **Africa's Talking SMS and USSD Gateways**.

---

## 🌟 Key Features

### 📊 Real-Time Dashboard & Analytics
- **Live Metrics**: Monitor daily revenue, estimated profit margins, total outstanding debt, overdue balances, and low-stock item counts at a glance.
- **Date Filtering**: Review sales performance and daily summaries for today or historical dates.
- **Interactive Visuals**: Visual financial health summaries and transaction feeds.

### 🛍️ Sales Ledger & POS System
- **Fast Checkout**: Multi-item basket builder supporting Cash, M-Pesa, and Debt/Credit payment methods.
- **Automated Stock Deduction**: Every completed transaction automatically deducts inventory and triggers stock alerts if stock drops below designated thresholds.
- **Receipt Generation**: Formats custom receipt reference numbers (`RCP-YYYYMMDD-XXX`) for record keeping.

### 📖 Customer Debt & Credit Management
- **Digital Debt Ledger**: Track individual customer debt balances, payment due dates, and repayment history.
- **Partial Repayments**: Record partial or full repayments with M-Pesa or cash reference codes.
- **Automated SMS Debt Reminders**: Dispatches polite, context-aware SMS debt reminders via Africa's Talking Sandbox API formatted with customer name, shop name, balance, and due date.

### 📦 Smart Inventory Control
- **Stock Tracking**: Monitor product SKUs, cost prices, selling prices, and current stock levels across categories.
- **Low-Stock Alerts**: Automatic system alerts when stock falls below low-stock thresholds.
- **SMS Restock Alerts**: Send automated SMS restock notifications directly to the shopkeeper's phone.

### 📞 Africa's Talking USSD Gateway Integration (`*384*88924#`)
- **Offline Access**: Complete USSD menu interface accessible via feature phones without internet connections.
- **USSD Capabilities**:
  1. Check today's sales and profit totals.
  2. Inspect low-stock products.
  3. View overdue customer debt balances.
  4. Record quick cash sales directly from feature phones.
  5. Dispatch debt reminder SMS messages to overdue customers.
  6. Trigger daily business summary SMS dispatch.
- **Built-in USSD Simulator**: In-app modal simulator to test USSD dial strings (`*384*88924#`) in real-time.

### ✉️ SMS Engine & Delivery Reports
- **Real SMS Dispatch**: Direct integration with Africa's Talking Sandbox API (`/version1/messaging`).
- **Phone Normalization**: Normalizes all East African / Kenyan phone numbers to international E.164 format (`+254XXXXXXXXX`).
- **Delivery Callbacks**: Handles webhook callbacks (`POST /api/sms/delivery-report`) from Africa's Talking to update SMS delivery statuses (`delivered`, `buffered`, `failed`).
- **Demo Mode Simulation**: Optional simulated network error testing to verify UI error handling without consuming credits.

### 🩺 Business Health Check Diagnostics
- **Automated Business Health Score**: Computes an aggregate score based on cash-to-credit ratio, overdue debt risk, profit margins, and stock availability.
- **Actionable Insights**: Suggestions to improve cash flow and reduce working capital bottlenecks.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React Icons, Framer Motion, Canvas Confetti.
- **Backend**: Express.js, TypeScript, `tsx` runtime.
- **Telecommunications API**: Africa's Talking Sandbox API (SMS & USSD Gateways).
- **AI Integration**: Google GenAI SDK (`@google/genai`) for intelligent insights (optional).
- **Data Store**: Persistent JSON file database (`data/dukashield_db.json`) with atomic write updates and pre-loaded Kenyan duka seed data.

---

## 📁 Directory Structure

```
.
├── data/
│   └── dukashield_db.json    # Persistent JSON database store
├── server/
│   ├── africasTalking.ts     # Africa's Talking SMS API client & phone normalizer
│   ├── db.ts                 # Database management layer & schema methods
│   ├── healthCheck.ts        # Business health calculation engine
│   ├── routes.ts             # REST API endpoints & callback webhooks
│   └── ussd.ts               # Africa's Talking USSD state machine handler
├── src/
│   ├── components/           # React views (Dashboard, Sales, Debts, Inventory, USSD Simulator, etc.)
│   ├── services/             # Frontend API client
│   ├── types/                # Shared TypeScript interfaces & types
│   ├── App.tsx               # Main UI router and application root
│   ├── main.tsx              # Entry point for React DOM
│   └── index.css             # Tailwind CSS imports and global styles
├── .env.example              # Template for environment variables
├── server.ts                 # Express server & Vite middleware setup
├── vite.config.ts            # Vite configuration
└── package.json              # Dependencies and run scripts
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` or configure environment variables in your deployment environment:

```env
# Server Port (Defaults to 3000)
PORT=3000

# Africa's Talking Sandbox Credentials
AFRICASTALKING_API_KEY="your_africastalking_sandbox_api_key"
AFRICASTALKING_USERNAME="sandbox"

# Default Shop & Shopkeeper Details
SHOPKEEPER_PHONE="+254712345678"
SHOP_NAME="Mama Boi Duka & General Supplies"
USSD_SERVICE_CODE="*384*88924#"

# Public Application URL (for delivery report callbacks)
APP_URL="https://your-app-domain.run.app"

# Optional Gemini AI API Key
GEMINI_API_KEY="your_gemini_api_key"
```

> **Note**: You can also enter and update your Africa's Talking Sandbox API key directly inside the app's **Settings** or **API Secrets** modal.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+) or [Bun](https://bun.sh/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd react-example
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

### Development

Start the Express development server with Vite hot module replacement (HMR):

```bash
bun run dev
# or
npm run dev
```

Open your browser at `http://localhost:3000` to access DukaShield.

### Code Quality & Building

- **Type Check / Lint**:
  ```bash
  bun run lint
  ```
- **Build Production Bundle**:
  ```bash
  bun run build
  ```
- **Start Production Server**:
  ```bash
  bun run start
  ```

---

## 📡 API Reference

### USSD Gateway Callback
- **`POST /api/ussd`**
  - Callback endpoint configured in Africa's Talking USSD dashboard.
  - Accepts `application/x-www-form-urlencoded` or `json` with `sessionId`, `serviceCode`, `phoneNumber`, and `text`.
  - Returns raw plain text with `CON` or `END` prefixes per Africa's Talking protocol specification.

### Sales & Inventory
- **`GET /api/dashboard`**: Fetch key business metrics, recent sales, low stock alerts, and settings.
- **`GET /api/products`**: List all inventory products.
- **`POST /api/products`**: Add a new product to inventory.
- **`GET /api/sales`**: Retrieve transaction history.
- **`POST /api/sales`**: Record a new sale (deducts stock and generates debt records if payment method is `debt`).

### Customer Debt Management
- **`GET /api/debts`**: List all customer debt ledgers.
- **`POST /api/debts/:id/repay`**: Record a full or partial debt repayment.
- **`POST /api/debts/:id/remind`**: Dispatch a polite debt reminder SMS via Africa's Talking to the customer.

### SMS Messaging & Callbacks
- **`GET /api/sms/logs`**: Get SMS activity logs and delivery statistics.
- **`POST /api/sms/send-test`**: Trigger a test SMS dispatch or run a demo network error simulation.
- **`POST /api/sms/delivery-report`**: Webhook callback endpoint for Africa's Talking delivery receipts. Updates message status (`delivered`, `failed`, `rejected`).
- **`POST /api/summary/send-sms`**: Send daily business financial summary via SMS to the shopkeeper's phone.

### Settings & Database Management
- **`GET /api/settings`**: Fetch current duka settings.
- **`PUT /api/settings`**: Update shop name, shopkeeper phone, or USSD code.
- **`POST /api/settings/api-key`**: Configure Africa's Talking API key dynamically.
- **`POST /api/demo/reset-seed`**: Reset database to initial seed dataset (useful for live demo walkthroughs).

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
