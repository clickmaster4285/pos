"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "./SectionHeader";
import { LandingContainer } from "./LandingContainer";
import { Button } from "@/components/ui/button";
import {
  FLOW_TABS,
  REGISTRATION_FLOW,
  SETUP_FLOW,
  DAILY_USAGE_FLOW,
  ROLE_PATHS,
  FLOW_DIAGRAM_STEPS,
} from "@/constants/landingContent";
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  UserPlus,
  Settings,
  Activity,
  Users,
  MapPin,
  Home,
  Mail,
  KeyRound,
  Rocket,
  ChevronRight,
  Sparkles,
  Shield,
  LayoutDashboard,
} from "lucide-react";
import { useRouter } from "next/navigation";

const TAB_ICONS = {
  register: UserPlus,
  setup: Settings,
  daily: Activity,
  roles: Users,
};

const DIAGRAM_ICONS = {
  home: Home,
  "user-plus": UserPlus,
  mail: Mail,
  key: KeyRound,
  settings: Settings,
  rocket: Rocket,
};

const FLOW_DATA = {
  register: REGISTRATION_FLOW,
  setup: SETUP_FLOW,
  daily: DAILY_USAGE_FLOW,
};

const SIDEBAR_CONTENT = {
  register: {
    summary:
      "Create your company in 3 steps, verify your email with OTP, then sign in to access your admin dashboard.",
    cta: { label: "Start Registration", href: "/sign-up", primary: true },
  },
  setup: {
    summary:
      "After login, complete payment if needed, create your branch, add products, and invite your team.",
    tip: "Restaurant accounts also get Tables & Ingredients modules.",
  },
  daily: {
    summary:
      "Run orders, billing, inventory, and reports daily. Staff use permission-scoped dashboards.",
    cta: { label: "Sign In to Dashboard", href: "/login", primary: false },
  },
  roles: {
    summary:
      "Admin owns full company setup. Staff operate with limited permissions on their own dashboard.",
    footnote: "* Modules depend on plan features or assigned permissions.",
  },
};

function FlowDiagram() {
  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
      <div className="relative flex items-start justify-between min-w-[680px] lg:min-w-0 gap-0 px-2 sm:px-4">
        {/* Background track */}
        <div className="absolute top-6 sm:top-7 left-8 right-8 h-0.5 bg-border/80 rounded-full hidden sm:block" aria-hidden />
        <motion.div
          className="absolute top-6 sm:top-7 left-8 h-0.5 bg-gradient-to-r from-primary via-purple-500 to-emerald-500 rounded-full hidden sm:block"
          initial={{ width: 0 }}
          whileInView={{ width: "calc(100% - 4rem)" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          viewport={{ once: true }}
          aria-hidden
        />

        {FLOW_DIAGRAM_STEPS.map((item, i) => {
          const Icon = DIAGRAM_ICONS[item.icon] || Sparkles;
          return (
            <div key={item.label} className="flex flex-col items-center flex-1 min-w-0 relative z-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-md scale-110" />
                <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 border-2 border-background">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-primary text-[10px] font-bold flex items-center justify-center text-primary">
                  {i + 1}
                </span>
              </motion.div>
              <span className="mt-3 text-xs sm:text-sm font-bold text-foreground text-center">{item.label}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground text-center mt-0.5 px-1">
                {item.sub}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FlowStepCard({ item, index, accent, total }) {
  const isLast = index === total - 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="relative"
    >
      <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden hover:border-primary/30 hover:shadow-xl transition-all duration-300 group h-full">
        <div className={`h-1 w-full bg-gradient-to-r ${accent}`} />
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${accent} text-white font-bold text-sm shadow-md shrink-0`}
            >
              {item.step}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h4 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h4>
                {item.route && (
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-md bg-muted/80 text-primary border border-border/50">
                    {item.route}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{item.description}</p>
              {item.details && (
                <div className="flex flex-wrap gap-1.5">
                  {item.details.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 rounded-full bg-muted/60 text-muted-foreground border border-border/40"
                    >
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {!isLast && (
              <ChevronRight className="hidden xl:block h-5 w-5 text-primary/30 shrink-0 mt-2" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RolesPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
      {ROLE_PATHS.map((role, index) => (
        <motion.div
          key={role.role}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group rounded-2xl sm:rounded-3xl border border-border/60 overflow-hidden bg-card/80 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
        >
          <div className={`h-2 sm:h-2.5 bg-gradient-to-r ${role.color}`} />
          <div className="p-6 sm:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${role.color} text-white shadow-lg`}>
                {index === 0 ? (
                  <Shield className="h-6 w-6" />
                ) : (
                  <LayoutDashboard className="h-6 w-6" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-xl sm:text-2xl">{role.role}</h4>
                <code className="text-xs text-primary font-mono bg-primary/5 px-2 py-0.5 rounded mt-1 inline-block">
                  {role.route}
                </code>
              </div>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-5 leading-relaxed">
              {role.description}
            </p>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Key modules
            </p>
            <div className="flex flex-wrap gap-2">
              {role.modules.map((m) => (
                <span
                  key={m}
                  className="text-xs px-2.5 py-1 rounded-lg bg-muted/70 text-foreground border border-border/50 font-medium"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SidebarPanel({ activeTab, accent, onNavigate }) {
  const TabIcon = TAB_ICONS[activeTab];
  const tabMeta = FLOW_TABS.find((t) => t.id === activeTab);
  const content = SIDEBAR_CONTENT[activeTab];

  return (
    <div className="lg:sticky lg:top-24 rounded-2xl sm:rounded-3xl border border-border/60 overflow-hidden bg-card/90 backdrop-blur-md shadow-xl">
      <div className={`p-5 sm:p-6 bg-gradient-to-br ${accent} text-white relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
            <TabIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{tabMeta?.label}</h3>
            <p className="text-xs text-white/80">{tabMeta?.steps} steps in this phase</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground leading-relaxed">{content.summary}</p>

            {content.tip && (
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-muted-foreground p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <MapPin className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                {content.tip}
              </div>
            )}

            {content.footnote && (
              <p className="text-xs text-muted-foreground italic">{content.footnote}</p>
            )}

            {content.cta && (
              <Button
                className={`w-full group h-11 ${content.cta.primary ? "shadow-lg" : ""}`}
                variant={content.cta.primary ? "default" : "outline"}
                onClick={() => onNavigate(content.cta.href)}
              >
                {content.cta.label}
                {content.cta.primary ? (
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  <ExternalLink className="ml-2 h-4 w-4" />
                )}
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export const CompleteFlowSection = () => {
  const [activeTab, setActiveTab] = useState("register");
  const router = useRouter();
  const activeMeta = FLOW_TABS.find((t) => t.id === activeTab);
  const accent = activeMeta?.accent || "from-primary to-primary/80";
  const steps = FLOW_DATA[activeTab] || [];

  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-28 scroll-mt-20 overflow-hidden">
      <div className="absolute inset-0 landing-grid-pattern opacity-15 pointer-events-none" />
      <div className="absolute top-1/4 -left-32 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[350px] bg-purple-500/8 rounded-full blur-[90px] pointer-events-none" />

      <LandingContainer className="relative">
        <SectionHeader
          badge="Complete Guide"
          title="How SmartPOS Works — From Registration to Daily Operations"
          description="Follow this end-to-end guide: register your company, set up your store, invite staff, and run orders, billing, and inventory — all from the cloud."
        />

        {/* Journey diagram */}
        <motion.div
          className="mb-10 sm:mb-12 p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/8 via-card/90 to-purple-500/8 shadow-xl w-full"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8 sm:mb-10">
            <div>
              <p className="text-sm font-bold text-foreground">Your journey at a glance</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                6 phases from first visit to daily operations
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 w-fit">
              <Sparkles className="h-3.5 w-3.5" />
              Interactive guide below
            </span>
          </div>
          <FlowDiagram />
        </motion.div>

        {/* Tab bar — segmented style */}
        <div className="mb-8 sm:mb-10 p-1.5 sm:p-2 rounded-2xl border border-border/60 bg-muted/40 backdrop-blur-sm w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 sm:gap-1.5 min-w-max sm:min-w-0 sm:flex-wrap lg:flex-nowrap">
            {FLOW_TABS.map(({ id, label, accent: tabAccent, steps: stepCount }) => {
              const Icon = TAB_ICONS[id];
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-sm font-medium transition-all duration-300 flex-1 sm:flex-none min-w-[140px] sm:min-w-0 ${
                    isActive
                      ? "text-white shadow-lg"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="flow-tab-bg"
                      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${tabAccent} shadow-lg`}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className={`h-4 w-4 shrink-0 relative z-10 ${isActive ? "text-white" : ""}`} />
                  <span className="relative z-10 truncate">{label}</span>
                  <span
                    className={`relative z-10 ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {stepCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 w-full">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <SidebarPanel
              activeTab={activeTab}
              accent={accent}
              onNavigate={(href) => router.push(href)}
            />
          </div>

          <div className="lg:col-span-8 order-1 lg:order-2">
            <AnimatePresence mode="wait">
              {activeTab === "roles" ? (
                <motion.div
                  key="roles"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3 }}
                >
                  <RolesPanel />
                </motion.div>
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5"
                >
                  {steps.map((item, index) => (
                    <FlowStepCard
                      key={`${activeTab}-${item.step}`}
                      item={item}
                      index={index}
                      accent={accent}
                      total={steps.length}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </LandingContainer>
    </section>
  );
};
