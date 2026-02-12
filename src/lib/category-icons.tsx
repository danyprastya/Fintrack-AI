import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Clapperboard,
  FileText,
  HeartPulse,
  GraduationCap,
  Banknote,
  TrendingUp,
  Laptop,
  Gift,
  Package,
  Briefcase,
  Home,
  Wifi,
  Plane,
  Coffee,
  Music,
  Gamepad2,
  Shirt,
  Baby,
  Dog,
  Wrench,
  Fuel,
  CreditCard,
  PiggyBank,
  HandCoins,
  Gem,
  Lightbulb,
  Scissors,
  Dumbbell,
  BookOpen,
  Camera,
  Palette,
  Bike,
  Train,
  Bus,
  Phone,
  Tv,
  Smartphone,
  Globe,
  Umbrella,
  Stethoscope,
  Pill,
  Building2,
  CircleDollarSign,
  Receipt,
  Coins,
  type LucideIcon,
} from "lucide-react";

// Category name → Lucide icon mapping (replaces ALL emoji usage)
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  foodDrinks: UtensilsCrossed,
  transportation: Car,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  bills: FileText,
  health: HeartPulse,
  education: GraduationCap,
  salary: Banknote,
  investment: TrendingUp,
  freelance: Laptop,
  gift: Gift,
  others: Package,
};

// Extended icon set for icon picker (custom categories)
export const ICON_PICKER_OPTIONS: { name: string; Icon: LucideIcon }[] = [
  { name: "utensils-crossed", Icon: UtensilsCrossed },
  { name: "coffee", Icon: Coffee },
  { name: "car", Icon: Car },
  { name: "bus", Icon: Bus },
  { name: "train", Icon: Train },
  { name: "bike", Icon: Bike },
  { name: "fuel", Icon: Fuel },
  { name: "plane", Icon: Plane },
  { name: "shopping-bag", Icon: ShoppingBag },
  { name: "shirt", Icon: Shirt },
  { name: "gem", Icon: Gem },
  { name: "clapperboard", Icon: Clapperboard },
  { name: "music", Icon: Music },
  { name: "gamepad", Icon: Gamepad2 },
  { name: "file-text", Icon: FileText },
  { name: "wifi", Icon: Wifi },
  { name: "phone", Icon: Phone },
  { name: "heart-pulse", Icon: HeartPulse },
  { name: "stethoscope", Icon: Stethoscope },
  { name: "pill", Icon: Pill },
  { name: "graduation-cap", Icon: GraduationCap },
  { name: "book-open", Icon: BookOpen },
  { name: "banknote", Icon: Banknote },
  { name: "trending-up", Icon: TrendingUp },
  { name: "piggy-bank", Icon: PiggyBank },
  { name: "coins", Icon: Coins },
  { name: "credit-card", Icon: CreditCard },
  { name: "hand-coins", Icon: HandCoins },
  { name: "circle-dollar", Icon: CircleDollarSign },
  { name: "receipt", Icon: Receipt },
  { name: "laptop", Icon: Laptop },
  { name: "briefcase", Icon: Briefcase },
  { name: "gift", Icon: Gift },
  { name: "home", Icon: Home },
  { name: "building", Icon: Building2 },
  { name: "baby", Icon: Baby },
  { name: "dog", Icon: Dog },
  { name: "wrench", Icon: Wrench },
  { name: "lightbulb", Icon: Lightbulb },
  { name: "scissors", Icon: Scissors },
  { name: "dumbbell", Icon: Dumbbell },
  { name: "camera", Icon: Camera },
  { name: "palette", Icon: Palette },
  { name: "tv", Icon: Tv },
  { name: "smartphone", Icon: Smartphone },
  { name: "globe", Icon: Globe },
  { name: "umbrella", Icon: Umbrella },
  { name: "package", Icon: Package },
];

// Resolve an icon: either a known category name or an icon-picker key
export function getCategoryIcon(iconOrName: string): LucideIcon {
  // Check category map first
  if (CATEGORY_ICON_MAP[iconOrName]) return CATEGORY_ICON_MAP[iconOrName];
  // Check icon picker keys
  const picked = ICON_PICKER_OPTIONS.find((o) => o.name === iconOrName);
  if (picked) return picked.Icon;
  // Fallback
  return Package;
}

// Render a category icon with className
export function CategoryIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const IconComponent = getCategoryIcon(icon);
  return <IconComponent className={className} />;
}
