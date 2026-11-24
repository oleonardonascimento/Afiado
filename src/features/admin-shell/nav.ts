import {
  BarChart3,
  CalendarDays,
  Crown,
  LayoutDashboard,
  Package,
  Percent,
  Receipt,
  Scissors,
  Settings,
  Star,
  Users,
  UserSquare2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { StaffRole } from "@/domain/entities";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: StaffRole[];
  /** Aparece na barra inferior do celular (o resto fica em "Mais"). */
  mobile: boolean;
};

const ALL: StaffRole[] = ["owner", "barber", "reception"];
const DESK: StaffRole[] = ["owner", "reception"];
const OWNER: StaffRole[] = ["owner"];

export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays, roles: ALL, mobile: true },
  { href: "/admin/comandas", label: "Comandas", icon: Receipt, roles: ALL, mobile: true },
  { href: "/admin/clientes", label: "Clientes", icon: Users, roles: DESK, mobile: true },
  { href: "/admin/caixa", label: "Caixa", icon: Wallet, roles: DESK, mobile: true },
  { href: "/admin", label: "Início", icon: LayoutDashboard, roles: ALL, mobile: false },
  { href: "/admin/clube", label: "Clube", icon: Crown, roles: DESK, mobile: false },
  { href: "/admin/comissoes", label: "Comissões", icon: Percent, roles: ["owner", "barber"], mobile: false },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors, roles: OWNER, mobile: false },
  { href: "/admin/produtos", label: "Produtos", icon: Package, roles: DESK, mobile: false },
  { href: "/admin/equipe", label: "Equipe", icon: UserSquare2, roles: OWNER, mobile: false },
  { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3, roles: OWNER, mobile: false },
  { href: "/admin/avaliacoes", label: "Avaliações", icon: Star, roles: OWNER, mobile: false },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings, roles: OWNER, mobile: false },
];

export function navForRole(role: StaffRole): AdminNavItem[] {
  return ADMIN_NAV.filter((item) => item.roles.includes(role));
}

export function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}
