/** Landing page media, copy & industry config for multi-industry SaaS positioning */

export const LANDING_VIDEOS = {
  hero: {
    src: "https://videos.pexels.com/video-files/4961714/4961714-hd_1920_1080_25fps.mp4",
    poster: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1280",
    title: "SmartPOS Platform Demo",
    duration: "2:30",
  },
  showcase: {
    src: "https://videos.pexels.com/video-files/6774897/6774897-hd_1920_1080_25fps.mp4",
    poster: "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=1280",
    title: "Full Platform Walkthrough",
    duration: "3:45",
  },
  tabs: {
    pos: {
      src: "https://videos.pexels.com/video-files/4961714/4961714-hd_1920_1080_25fps.mp4",
      poster: "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=800",
      label: "Point of Sale",
      description: "Lightning-fast checkout with barcode scan, split payments, and receipts.",
    },
    inventory: {
      src: "https://videos.pexels.com/video-files/6774897/6774897-hd_1920_1080_25fps.mp4",
      poster: "https://images.pexels.com/photos/4483616/pexels-photo-4483616.jpeg?auto=compress&cs=tinysrgb&w=800",
      label: "Inventory",
      description: "Real-time stock tracking, low-stock alerts, and vendor management.",
    },
    analytics: {
      src: "https://videos.pexels.com/video-files/3125156/3125156-hd_1920_1080_25fps.mp4",
      poster: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800",
      label: "Analytics",
      description: "Live dashboards, sales trends, and exportable business reports.",
    },
  },
  clips: [
    {
      src: "https://videos.pexels.com/video-files/4961714/4961714-sd_640_360_25fps.mp4",
      poster: "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "Quick Checkout",
      tag: "POS",
    },
    {
      src: "https://videos.pexels.com/video-files/6774897/6774897-sd_640_360_25fps.mp4",
      poster: "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "Retail Floor",
      tag: "Retail",
    },
    {
      src: "https://videos.pexels.com/video-files/3125156/3125156-sd_640_360_25fps.mp4",
      poster: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=600",
      title: "Live Insights",
      tag: "Analytics",
    },
  ],
};

export const INDUSTRY_CONFIG = {
  Restaurant: {
    slug: "restaurant",
    tagline: "From kitchen to counter — unified dining operations",
    description:
      "Purpose-built workflows for restaurants, cafes, and cloud kitchens with table management, KDS, and ingredient-level inventory.",
    gradient: "from-orange-500 via-amber-500 to-yellow-500",
    glow: "bg-orange-500/20",
    accent: "text-orange-500",
    accentBg: "bg-orange-500/10",
    stat: { value: "30%", label: "Less food waste" },
    features: ["Table & Order Management", "Kitchen Display System", "Recipe Costing", "Split Bills & Tips"],
    modules: ["Menu Engineering", "Ingredient Tracking", "Staff Shifts", "Multi-location"],
  },
  Fashion: {
    slug: "fashion",
    tagline: "Style-forward retail with variant intelligence",
    description:
      "Manage size, color, and seasonal collections with trend analytics built for boutiques and fashion chains.",
    gradient: "from-pink-500 via-rose-500 to-fuchsia-500",
    glow: "bg-pink-500/20",
    accent: "text-pink-500",
    accentBg: "bg-pink-500/10",
    stat: { value: "40%", label: "Sales uplift" },
    features: ["Size/Color Variants", "Seasonal Collections", "SKU & Barcode", "Customer Preferences"],
    modules: ["Trend Analytics", "Loyalty Programs", "Returns Management", "Vendor Catalogs"],
  },
  Pharmacy: {
    slug: "pharmacy",
    tagline: "Compliant pharmacy operations, simplified",
    description:
      "Prescription tracking, expiry alerts, and controlled substance reporting — built for regulatory peace of mind.",
    gradient: "from-emerald-500 via-green-500 to-teal-500",
    glow: "bg-emerald-500/20",
    accent: "text-emerald-500",
    accentBg: "bg-emerald-500/10",
    stat: { value: "100%", label: "Compliance ready" },
    features: ["Prescription Management", "Expiry Tracking", "Drug Interactions", "Insurance Claims"],
    modules: ["Batch Tracking", "Regulatory Reports", "Patient Records", "Supplier Orders"],
  },
  Electronics: {
    slug: "electronics",
    tagline: "Serial-tracked tech retail at scale",
    description:
      "IMEI/serial tracking, warranty management, and repair workflows for electronics and mobile retailers.",
    gradient: "from-blue-500 via-indigo-500 to-violet-500",
    glow: "bg-blue-500/20",
    accent: "text-blue-500",
    accentBg: "bg-blue-500/10",
    stat: { value: "50%", label: "Better CSAT" },
    features: ["Serial/IMEI Tracking", "Warranty Management", "Repair Tickets", "Trade-in Support"],
    modules: ["Spec Comparison", "Extended Warranties", "RMA Processing", "Multi-brand Catalog"],
  },
  "General Shop": {
    slug: "general-shop",
    tagline: "Flexible POS for any retail format",
    description:
      "Unlimited categories, fast barcode checkout, and loyalty tools for grocery, gift, and convenience stores.",
    gradient: "from-purple-500 via-violet-500 to-indigo-500",
    glow: "bg-purple-500/20",
    accent: "text-purple-500",
    accentBg: "bg-purple-500/10",
    stat: { value: "60%", label: "Faster checkout" },
    features: ["Multi-Category Support", "Barcode Scanning", "Quick Checkout", "Promotions & Discounts"],
    modules: ["Loyalty Rewards", "Bulk Pricing", "Vendor Management", "Offline Mode"],
  },
};

export const PLATFORM_STATS = [
  { value: "99.9%", label: "Cloud Uptime", icon: "cloud" },
  { value: "5+", label: "Industry Verticals", icon: "layers" },
  { value: "Unlimited", label: "Locations", icon: "building" },
  { value: "24/7", label: "Auto Sync", icon: "zap" },
];

export const SAAS_PILLARS = [
  {
    title: "Industry Templates",
    description: "Pre-configured workflows, fields, and dashboards tailored to your vertical — deploy in minutes, not months.",
    icon: "layers",
    highlight: true,
    metric: "5 verticals ready",
    features: ["Custom product fields", "Industry reports", "Workflow presets"],
  },
  {
    title: "Cloud-Native SaaS",
    description: "Access anywhere, automatic updates, and zero server maintenance.",
    icon: "cloud",
    metric: "99.9% uptime",
  },
  {
    title: "Subscription Billing",
    description: "Flexible plans that scale with your team, locations, and inventory.",
    icon: "credit-card",
    metric: "Pay as you grow",
  },
  {
    title: "Multi-Location",
    description: "Centralized control across stores, warehouses, and franchises.",
    icon: "building",
    metric: "One dashboard",
  },
  {
    title: "Role-Based Access",
    description: "Granular permissions for owners, managers, cashiers, and staff.",
    icon: "shield",
    metric: "Enterprise RBAC",
  },
  {
    title: "Real-Time Sync",
    description: "Inventory, sales, and reports update instantly on every device.",
    icon: "zap",
    metric: "< 1s latency",
  },
];

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose Your Plan",
    description: "Pick Starter, Professional, or Enterprise — free plans activate instantly; paid plans unlock after verification.",
    icon: "credit-card",
    accent: "from-amber-500 to-orange-500",
    accentBg: "bg-amber-500/10",
    tag: "~1 min",
  },
  {
    step: "02",
    title: "Select Your Industry",
    description: "Restaurant, Fashion, Pharmacy, Electronics, or General Shop — fields and modules auto-configure for your vertical.",
    icon: "layers",
    accent: "from-violet-500 to-purple-600",
    accentBg: "bg-violet-500/10",
    tag: "Auto-config",
  },
  {
    step: "03",
    title: "Create Your Account",
    description: "Enter company and admin details. Verify email with OTP, then sign in to your dashboard.",
    icon: "user-plus",
    accent: "from-blue-500 to-cyan-500",
    accentBg: "bg-blue-500/10",
    tag: "Email verify",
  },
  {
    step: "04",
    title: "Set Up & Go Live",
    description: "Add branch, products, and staff — then process orders, billing, and inventory from day one.",
    icon: "rocket",
    accent: "from-emerald-500 to-teal-500",
    accentBg: "bg-emerald-500/10",
    tag: "Go live",
  },
];

/** Complete registration → setup → daily usage flows (matches app routes) */
export const FLOW_TABS = [
  { id: "register", label: "How to Register", accent: "from-blue-500 to-cyan-500", steps: 6 },
  { id: "setup", label: "Account Setup", accent: "from-violet-500 to-purple-600", steps: 7 },
  { id: "daily", label: "Daily Operations", accent: "from-emerald-500 to-teal-500", steps: 6 },
  { id: "roles", label: "User Roles", accent: "from-amber-500 to-orange-500", steps: 2 },
];

export const FLOW_DIAGRAM_STEPS = [
  { label: "Landing", sub: "Plan & industry", icon: "home" },
  { label: "Sign Up", sub: "3-step wizard", icon: "user-plus" },
  { label: "Verify", sub: "Email OTP", icon: "mail" },
  { label: "Login", sub: "Secure auth", icon: "key" },
  { label: "Setup", sub: "Store & team", icon: "settings" },
  { label: "Go Live", sub: "Sell & grow", icon: "rocket" },
];

export const REGISTRATION_FLOW = [
  {
    step: 1,
    title: "Start Sign-Up",
    route: "/sign-up",
    description: "Click Get Started on the landing page or go to /sign-up. You can also sign in with Google from /login.",
    details: ["14-day free trial available", "No credit card for free plans", "Google users skip email OTP"],
  },
  {
    step: 2,
    title: "Step 1 — Choose Plan",
    route: "/sign-up?step=1",
    description: "Select a subscription plan (Starter, Professional, or Enterprise). Plan limits define max staff, vendors, and inventory items.",
    details: ["Free plan → instant activation", "Paid plan → payment after email verify", "Pricing cards on landing pre-select plan"],
  },
  {
    step: 3,
    title: "Step 2 — Pick Industry",
    route: "/sign-up?step=2",
    description: "Choose Restaurant, Fashion, Pharmacy, Electronics, or General Shop. Your POS fields, sidebar, and order forms adapt automatically.",
    details: ["Restaurant gets Tables & Ingredients", "Pharmacy gets prescription fields", "Each vertical has unique product fields"],
  },
  {
    step: 4,
    title: "Step 3 — Company Details",
    route: "/sign-up?step=3",
    description: "Enter company name, contact email, admin name, email, and password. Submit to create your tenant on the cloud platform.",
    details: ["Creates company + admin user", "Links plan and industry to company", "Sends OTP to admin email"],
  },
  {
    step: 5,
    title: "Verify Email (OTP)",
    route: "/verify-email",
    description: "Enter the 5-digit code sent to your email. This activates your company account for email/password sign-ups.",
    details: ["Valid for 5 minutes", "Google sign-up skips this step", "Redirects to /login on success"],
  },
  {
    step: 6,
    title: "Sign In",
    route: "/login",
    description: "Log in with your admin credentials. You are redirected to /admin/dashboard based on your role.",
    details: ["JWT stored securely in cookies", "Session restored on refresh", "Wrong role routes are blocked"],
  },
];

export const SETUP_FLOW = [
  {
    step: 1,
    title: "Admin Dashboard",
    route: "/admin/dashboard",
    description: "Land on your KPI dashboard — revenue charts, recent orders, and business overview.",
    details: ["Real-time metrics", "Industry-specific widgets", "Quick links to key modules"],
  },
  {
    step: 2,
    title: "Subscription (if paid plan)",
    route: "/admin/dashboard",
    description: "If your plan requires payment, the Payment Gateway appears until Stripe checkout completes or free plan is confirmed.",
    details: ["Stripe secure checkout", "Try free plan option", "Unlocks full app on success"],
  },
  {
    step: 3,
    title: "Create First Branch",
    route: "/admin/branch/create",
    description: "Add your store or restaurant location. Multi-location businesses can add more branches from Branch Management.",
    details: ["Address & contact info", "Per-branch inventory", "Centralized admin control"],
  },
  {
    step: 4,
    title: "Company Settings",
    route: "/admin/setting",
    description: "Upload logo, configure company profile, and manage subscription from Company Profile settings.",
    details: ["Branding & contact", "Plan upgrade/downgrade", "Billing history"],
  },
  {
    step: 5,
    title: "Add Products & Inventory",
    route: "/admin/product",
    description: "Catalog products with industry-specific fields (sizes for Fashion, expiry for Pharmacy, serial for Electronics, etc.).",
    details: ["Barcode & SKU support", "Stock quantity tracking", "Categories & vendors (plan-gated)"],
  },
  {
    step: 6,
    title: "Invite Staff",
    route: "/admin/staff",
    description: "Create staff accounts with sub-roles (Manager, Seller, Waiter, Chef for restaurants) and granular permissions.",
    details: ["Role-based access", "Attendance & salaries (plan-gated)", "Staff get /staff/{role}/dashboard"],
  },
  {
    step: 7,
    title: "Restaurant Extras",
    route: "/admin/tables",
    description: "Restaurant industry only: configure tables, ingredients, and kitchen display workflows.",
    details: ["/admin/ingredient for stock", "/admin/tables for floor plan", "Waiter & Chef staff roles"],
  },
];

export const DAILY_USAGE_FLOW = [
  {
    step: 1,
    title: "Login & Dashboard",
    route: "/login",
    description: "Admin and staff sign in daily. Each role lands on their scoped dashboard with permitted modules only.",
    details: ["Admin → /admin/dashboard", "Staff → /staff/{role}/dashboard", "Auto logout on session expiry"],
  },
  {
    step: 2,
    title: "Process Orders",
    route: "/admin/orders",
    description: "Create and manage orders — assign tables (restaurant), attach customers, track kitchen/status updates.",
    details: ["Industry-specific order fields", "Dine-in / takeaway / delivery", "Real-time status sync"],
  },
  {
    step: 3,
    title: "Billing & Checkout",
    route: "/admin/billing",
    description: "Point-of-sale checkout — scan barcodes, apply discounts, split payments, and print receipts.",
    details: ["Multi-payment methods", "Invoice generation", "Staff billing if permitted"],
  },
  {
    step: 4,
    title: "Inventory Management",
    route: "/admin/product",
    description: "Update stock, receive shipments, set low-stock alerts. Restaurant tracks ingredients separately.",
    details: ["Stock in/out logs", "Vendor management", "Expiry alerts (Pharmacy)"],
  },
  {
    step: 5,
    title: "Reports & Analytics",
    route: "/admin/dashboard",
    description: "Review sales trends, top products, and staff performance from the dashboard and built-in reports.",
    details: ["Revenue by period", "Order volume", "Exportable data"],
  },
  {
    step: 6,
    title: "Multi-Branch Ops",
    route: "/admin/branch",
    description: "Switch between locations, compare performance, and manage inventory per branch from one admin panel.",
    details: ["Centralized control", "Per-branch staff", "Unified subscription"],
  },
];

export const ROLE_PATHS = [
  {
    role: "Admin (Owner)",
    route: "/admin/dashboard",
    color: "from-blue-500 to-indigo-600",
    description: "Company owner created at sign-up. Full access to products, orders, billing, staff, branches, and settings.",
    modules: ["Dashboard", "Products", "Orders", "Billing", "Staff", "Branches", "Settings", "Permissions*"],
  },
  {
    role: "Staff",
    route: "/staff/{role}/dashboard",
    color: "from-emerald-500 to-teal-600",
    description: "Operational team members with assigned sub-roles and permission sets defined by admin.",
    modules: ["Dashboard", "Orders*", "Billing*", "Products*", "Vendors*", "Tables* (Restaurant)"],
  },
];

export const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "Owner, Bloom Boutique",
    industry: "Fashion",
    avatar: "SM",
    rating: 5,
    quote:
      "Switching to this SaaS platform let us manage 3 locations from one dashboard. Fashion-specific variants just work.",
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "James Chen",
    role: "Manager, Golden Dragon Restaurant",
    industry: "Restaurant",
    avatar: "JC",
    rating: 5,
    quote:
      "Industry templates saved weeks of setup. Table management and KDS were ready on day one.",
    color: "from-orange-500 to-amber-500",
  },
  {
    name: "Maria Rodriguez",
    role: "CEO, TechHub Electronics",
    industry: "Electronics",
    avatar: "MR",
    rating: 5,
    quote:
      "Serial tracking across 12 stores with one subscription. This is what multi-location SaaS should feel like.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "David Okonkwo",
    role: "Pharmacist, HealthFirst Pharmacy",
    industry: "Pharmacy",
    avatar: "DO",
    rating: 5,
    quote:
      "Pharmacy compliance modules are built-in. We migrated from legacy POS with zero downtime.",
    color: "from-emerald-500 to-teal-500",
  },
];

export const TRUSTED_BRANDS = [
  "Microsoft", "Stripe", "Square", "Shopify", "Visa", "Mastercard", "PayPal", "QuickBooks",
];

export const FAQ_ITEMS = [
  {
    question: "How does industry-specific setup work?",
    answer:
      "During sign-up you select your industry (Restaurant, Fashion, Pharmacy, etc.). SmartPOS automatically configures product fields, workflows, reports, and dashboards tailored to that vertical. You can customize further anytime.",
  },
  {
    question: "Can I manage multiple store locations?",
    answer:
      "Yes. All plans support multi-location management from a single SaaS dashboard. Upgrade your subscription as you add stores, staff, and inventory volume.",
  },
  {
    question: "How long is the free trial?",
    answer:
      "Every plan includes a 14-day free trial with full access to all features for your chosen industry. No credit card required.",
  },
  {
    question: "Is my data secure in the cloud?",
    answer:
      "We use bank-level encryption, automatic cloud backups, SOC 2 practices, and role-based access control. Your data is isolated per tenant.",
  },
  {
    question: "Can I switch industries or add another vertical later?",
    answer:
      "Each account is optimized for one primary industry, but General Shop templates offer flexibility. Contact support for multi-vertical enterprise setups.",
  },
  {
    question: "Can I migrate from another POS?",
    answer:
      "Yes. We offer free migration assistance to import products, customers, and inventory from most major POS platforms.",
  },
];
