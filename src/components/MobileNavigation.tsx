import { NavLink } from "react-router-dom";
import { Home, Calendar, BookOpen, MessageCircle } from "lucide-react";

const navItems = [
  { to: "/", icon: Home, label: "Today" },
  { to: "/plan", icon: Calendar, label: "Plan" },
  { to: "/library", icon: BookOpen, label: "Library" },
  { to: "/chat", icon: MessageCircle, label: "AI Chat" },
];

export function MobileNavigation() {
  return (
    <nav className="fixed left-0 right-0 w-full bg-card/95 backdrop-blur-md border-t border-border/50 px-1 py-2 z-50 [bottom:env(safe-area-inset-bottom,0px)] [padding-bottom:env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around max-w-sm mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`
            }
          >
            <Icon size={20} strokeWidth={1.5} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}