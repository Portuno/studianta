import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Calendar, BookOpen, MessageCircle, Wrench } from "lucide-react";
import { ReactNode, useMemo } from "react";

type AppShellProps = {
  children: ReactNode;
};

const navItems = [
  { to: "/herramientas", icon: Wrench, label: "Herramientas" },
  { to: "/", icon: Calendar, label: "Agenda" },
  { to: "/library", icon: BookOpen, label: "Biblioteca" },
  { to: "/chat", icon: MessageCircle, label: "AI Chat" },
];

export const AppShell = ({ children }: AppShellProps) => {
  const items = useMemo(() => navItems, []);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset" className="hidden md:block">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="size-7 rounded-md bg-primary/15 grid place-items-center text-primary">📒</div>
            <span className="font-semibold">Cuaderno</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map(({ to, icon: Icon, label }) => (
                  <SidebarMenuItem key={to}>
                    <NavLink to={to} className="block">
                      {({ isActive }) => (
                        <SidebarMenuButton isActive={isActive} tooltip={label}>
                          <Icon />
                          <span>{label}</span>
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter>
          <div className="text-xs text-muted-foreground px-2">v1.0.0</div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <div className="hidden md:flex">
            <SidebarTrigger />
          </div>
          <div className="font-medium text-sm text-muted-foreground">Tu espacio de estudio</div>
        </div>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AppShell;


