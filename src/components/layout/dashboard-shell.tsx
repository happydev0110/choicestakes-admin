"use client";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { ErrorBoundary } from "@/components/error-boundary";
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex">
          <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        </aside>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="absolute left-0 top-0 h-full">
              <Sidebar
                isCollapsed={false}
                setIsCollapsed={() => setIsMobileMenuOpen(false)}
              />
            </aside>
          </div>
        )}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
          <main className="flex-1 overflow-y-auto bg-muted/40 p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
