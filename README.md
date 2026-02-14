# CareOps — Unified Operations Platform

CareOps is a web-based operations platform designed to replace the chaos of disconnected tools used by service businesses. It centralizes bookings, communication, automation, forms, and inventory tracking into a single operational dashboard.

This project was built as a hackathon MVP to demonstrate a unified system where businesses can **see**, **act**, and **operate** clearly from one place.

---

## 🚀 Live Deployment

👉 https://careops-puce.vercel.app/

---

## 🚀 Core Features

### Workspace Onboarding
- Business workspace creation
- Role-based system (Owner / Staff)
- Activation gating before system goes live
- Configuration-first onboarding flow

### Contact & CRM System
- Public contact form (no customer login required)
- Automatic contact creation
- Conversation thread per contact
- Full message history

### Booking Engine
- Public booking page
- Service scheduling
- Booking-to-contact linking
- Automated confirmation flow

### Inbox System
- Single unified inbox
- Contact-based conversation threads
- Automation pauses when staff replies
- System-generated messages supported

### Automation Engine
Event-driven triggers:
- New contact → welcome message
- Booking created → confirmation
- Pending form reminder
- Inventory alert
- Staff reply → automation pause

Strictly predictable logic (no hidden AI behavior)

### Dashboard Analytics
Owner dashboard displays:
- Today’s bookings
- Upcoming bookings
- New inquiries
- Pending forms
- Unanswered messages
- Inventory alerts
- Operational risk indicators

Each alert links directly to action pages.

### Inventory Tracking
- Resource quantity management
- Low-stock thresholds
- Alert banners
- Dashboard risk visibility

### Role System
Owner:
- Configuration control
- Dashboard oversight
- Staff management

Staff:
- Inbox management
- Booking execution
- Status updates
- Cannot modify system logic

---

## 🧠 Architecture Overview

CareOps follows a modular SaaS architecture:

Frontend → Next.js App Router + React + Tailwind  
Backend → Next.js server logic  
Database → Supabase PostgreSQL  
Auth → Supabase Authentication  
Deployment → Vercel  

The system is event-driven and relational, ensuring predictable automation and clean operational flows.

Customers never log in. All external interaction happens via forms, booking pages, and automated messaging.

---

## 🔄 Demo Flow

Contact → Booking → Automation → Inbox → Dashboard Update → Inventory Alert → Staff Action

All modules are connected into a unified operations pipeline.

---

## 🧰 Technologies Used

Frontend:
- Next.js
- React
- Tailwind CSS

Backend:
- Next.js Server Actions / API Routes

Database & Auth:
- Supabase PostgreSQL
- Supabase Authentication

Deployment:
- Vercel

Architecture:
- Event-driven automation
- Relational data modeling
- Modular SaaS dashboard design

---

## ⚙️ Steps to Run Locally

```bash
git clone <your-repo-url>
cd careops
npm install
npm run dev
```

Create a `.env.local` file in the root:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_key
```

Then open:

```
http://localhost:3000
```

---

## 🌍 Deployment

This project is deployed via Vercel:

👉 https://careops-puce.vercel.app/

Environment variables required in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

After setting variables → redeploy.

---

## 🎯 Goal

CareOps demonstrates how service businesses can replace fragmented tools with one operational system that provides visibility, automation, and control from a single dashboard.

---

## 🏁 Status

Hackathon MVP — demo-ready prototype  
Built to showcase architecture, flows, and product thinking.

Future expansion could include:
- advanced automation engine
- calendar integrations
- reporting analytics
- AI scheduling
- team collaboration tools

---

Built with focus on clarity, structure, and operational intelligence.
