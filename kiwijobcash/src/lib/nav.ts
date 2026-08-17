import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Zap,
  Users,
  FileText,
  Receipt,
  Briefcase,
  Wallet,
  Bot,
  BarChart3,
  Plug,
  Settings,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const DESKTOP_NAV: NavItem[] = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/actions", label: "Action Centre", icon: Zap },
  { href: "/app/leads", label: "Leads", icon: Users },
  { href: "/app/quotes", label: "Quotes", icon: FileText },
  { href: "/app/invoices", label: "Invoices", icon: Receipt },
  { href: "/app/customers", label: "Customers", icon: Users },
  { href: "/app/jobs", label: "Jobs", icon: Briefcase },
  { href: "/app/money", label: "Money", icon: Wallet },
  { href: "/app/ai", label: "AI Manager", icon: Bot },
  { href: "/app/reports", label: "Reports", icon: BarChart3 },
  { href: "/app/integrations", label: "Integrations", icon: Plug },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export const MOBILE_NAV: NavItem[] = [
  { href: "/app", label: "Home", icon: LayoutDashboard },
  { href: "/app/actions", label: "Action", icon: Zap },
  { href: "/app/customers", label: "Customers", icon: Users },
  { href: "/app/money", label: "Money", icon: Wallet },
];
