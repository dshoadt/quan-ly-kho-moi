import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Bell,
  Search,
  PlusCircle,
} from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-md transition-[width,height] ease-linear">
      {/* Left: Sidebar trigger & breadcrumb title */}
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-4" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Hệ Thống Quản Lý Kho & Đề Xuất Vật Tư
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            PostgreSQL v18 Live
          </span>
        </div>
      </div>

      {/* Right: Actions, Search, Notifications, Theme toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block w-56 lg:w-72">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm mã VT, tên, phiếu..."
            className="h-8 pl-8 pr-12 text-xs bg-muted/40 focus-visible:bg-background"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Tạo phiếu</span>
        </Button>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Thông báo"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-4" />

        <ThemeToggle />
      </div>
    </header>
  );
}
