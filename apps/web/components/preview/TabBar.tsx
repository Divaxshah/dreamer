"use client";

export type PreviewTab = "preview" | "code" | "console";

interface TabBarProps {
  activeTab: PreviewTab;
  onChange: (tab: PreviewTab) => void;
}

const tabs: Array<{ id: PreviewTab; label: string }> = [
  { id: "preview", label: "Preview" },
  { id: "code", label: "Code" },
  { id: "console", label: "Console" },
];

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <div className="flex bg-secondary/50 p-1 rounded-full m-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-6 py-2 text-xs font-bold transition-all rounded-full ${
            activeTab === tab.id
              ? "bg-foreground text-background shadow-lg"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
