import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  ClipboardList,
  BarChart3,
  Sparkles,
  Warehouse,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const navMain = [
  {
    title: "Tổng quan Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Danh mục Vật tư",
    url: "/materials",
    icon: Package,
  },
  {
    title: "Nhập / Xuất kho",
    url: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    title: "Đề xuất Mua hàng",
    url: "/procurements",
    icon: ClipboardList,
    badge: "3",
  },
  {
    title: "Báo cáo Định mức",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Trích xuất OCR AI",
    url: "/ocr",
    icon: Sparkles,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/70 bg-card/60 backdrop-blur-md">
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
            <Warehouse className="h-5 w-5" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm font-bold tracking-tight text-foreground">
              SMART WAREHOUSE
            </span>
            <span className="text-xs text-muted-foreground">
              Quản lý kho & Vật tư
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-2">
            Nghiệp vụ kho
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navMain.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`gap-3 transition-all duration-150 ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold"
                          : "hover:bg-accent/70 hover:text-foreground text-muted-foreground"
                      }`}
                    >
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Cảnh báo nhanh Widget */}
        <div className="mx-2 mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Cảnh báo định mức</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Hệ thống phát hiện vật tư dưới ngưỡng tối thiểu. Cần lập đề xuất mua hàng.
          </p>
        </div>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-border/50 p-3">
        <div className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-accent/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white dark:bg-slate-700">
            TK
          </div>
          <div className="flex flex-1 flex-col truncate">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-xs font-semibold text-foreground">
                Thủ kho Nguyễn Văn A
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="truncate text-[10px] text-muted-foreground">
              Kho Trung Tâm • Admin
            </span>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
