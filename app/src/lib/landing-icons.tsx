import {
  BarChart3,
  FileText,
  HardHat,
  Mail,
  Scale,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  BarChart3,
  Scale,
  Users,
  FileText,
  Mail,
  HardHat,
};

export function resolveLandingIcon(name: string | null | undefined, fallback: LucideIcon = Shield) {
  if (!name) return fallback;
  return ICON_MAP[name] ?? fallback;
}
