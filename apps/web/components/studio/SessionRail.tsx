"use client";

import { PanelLeftOpen, PanelLeftClose, Plus, Trash2, FolderTree, MessageSquare } from "lucide-react";
import type { Session } from "@/lib/types";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";

interface SessionRailProps {
  sessions: Session[];
  activeSessionId: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewSession: () => void;
}

const formatLabel = (session: Session): string => {
  const firstUserMessage = session.messages.find((message) => message.role === "user");
  if (firstUserMessage) {
    return firstUserMessage.content;
  }
  return session.currentProject.title;
};

export function SessionRail({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  onNewSession,
}: SessionRailProps) {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      side="left"
      variant="sidebar"
      collapsible="icon"
      className="bg-background border-none p-4 group-data-[state=collapsed]:bg-primary/10 group-data-[state=collapsed]:border-r-2 group-data-[state=collapsed]:border-primary/40 group-data-[state=collapsed]:p-3"
    >
      {isCollapsed ? (
        <div className="flex h-full flex-col items-center justify-center py-4">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            title="Open sidebar"
            aria-label="Open sidebar"
          >
            <PanelLeftOpen size={22} />
          </button>
        </div>
      ) : (
        <>
      <SidebarHeader className="p-0 mb-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose size={20} />
        </button>
        <button
          type="button"
          onClick={onNewSession}
          className="flex items-center justify-center gap-3 bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all w-full h-14 font-bold text-sm rounded-2xl shadow-lg shadow-primary/20"
        >
          <Plus size={20} className="shrink-0" />
          <span>New Session</span>
        </button>
      </SidebarHeader>

      <SidebarContent className="bg-secondary/30 rounded-3xl p-2 overflow-hidden">
        <SidebarGroup className="p-0 w-full">
          <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground px-4 py-6 h-auto">
            Recent Activity
          </SidebarGroupLabel>
          <SidebarGroupContent className="p-0">
            <SidebarMenu className="gap-2">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                const label = formatLabel(session);
                const fileCount = Object.keys(session.currentProject.files).length;
                
                return (
                  <SidebarMenuItem key={session.id} className="relative group/item min-w-0">
                    <SidebarMenuButton
                      onClick={() => onSelect(session.id)}
                      isActive={isActive}
                      className="h-auto w-full min-w-0 flex-col items-start gap-0 p-4 pr-10 rounded-2xl transition-all overflow-hidden text-foreground hover:bg-background shadow-none hover:shadow-sm data-[active]:!bg-background data-[active]:!shadow-md data-[active]:!ring-1 data-[active]:!ring-primary/20"
                    >
                      <div className="flex w-full min-w-0 items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <MessageSquare size={16} className={`shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className={`min-w-0 truncate text-sm font-bold tracking-tight ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {session.currentProject.title}
                          </span>
                        </div>
                      </div>
                      <div className="flex w-full min-w-0 flex-col gap-2 mt-2">
                        <p className="min-w-0 text-xs line-clamp-2 leading-relaxed text-muted-foreground/80">
                          {label}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold shrink-0 text-primary">
                          <FolderTree size={12} />
                          {fileCount} files
                        </div>
                      </div>
                    </SidebarMenuButton>

                    {/* Delete button */}
                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(session.id);
                        }}
                        className="absolute right-4 top-4 opacity-0 group-hover/item:opacity-100 p-1.5 bg-card text-muted-foreground rounded-lg hover:bg-destructive hover:text-white transition-all shadow-sm"
                        title="Delete Session"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 mt-auto">
        <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50">
        </div>
      </SidebarFooter>
        </>
      )}
    </Sidebar>
  );
}
