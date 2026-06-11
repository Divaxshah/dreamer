"use client";

import { useMemo, useState } from "react";
import { Check, KeyRound, Loader2, RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";

const PROVIDERS = [
  { id: "openrouter", label: "OpenRouter" },
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "gemini", label: "Google Gemini" },
  { id: "xai", label: "xAI" },
];

interface HermesModelsResponse {
  provider?: string;
  models?: string[];
  error?: string;
}

export function ModelSettingsDialog() {
  const modelSettings = useAppStore((state) => state.modelSettings);
  const setModelSettings = useAppStore((state) => state.setModelSettings);

  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState(modelSettings?.provider || "openrouter");
  const [apiKey, setApiKey] = useState(modelSettings?.apiKey || "");
  const [model, setModel] = useState(modelSettings?.model || "");
  const [models, setModels] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return models.slice(0, 80);
    return models.filter((item) => item.toLowerCase().includes(q)).slice(0, 80);
  }, [models, query]);

  const activeLabel = modelSettings?.model
    ? `${modelSettings.model} via ${modelSettings.provider}`
    : "Hermes default";

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/hermes/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      const payload = (await response.json()) as HermesModelsResponse;
      if (!response.ok) {
        throw new Error(payload.error || "Failed to fetch models from Hermes.");
      }
      const nextModels = payload.models ?? [];
      setModels(nextModels);
      if (!model && nextModels[0]) {
        setModel(nextModels[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch models.");
    } finally {
      setLoading(false);
    }
  };

  const save = () => {
    if (!model.trim() || !provider.trim()) {
      setError("Choose a provider and model before saving.");
      return;
    }
    setModelSettings({
      provider: provider.trim(),
      model: model.trim(),
      apiKey: apiKey.trim(),
    });
    setOpen(false);
  };

  const clear = () => {
    setModelSettings(null);
    setModel("");
    setApiKey("");
    setModels([]);
    setQuery("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <Settings2 className="size-4" />
        <span className="hidden xl:inline">Model</span>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border border-border bg-background p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-muted/30 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-bold tracking-tight">
                Model settings
              </DialogTitle>
              <DialogDescription className="mt-1">
                Paste a provider key, fetch Hermes models, then choose the runtime for this browser session.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 px-5 py-5">
          <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Active: <span className="font-semibold text-foreground">{activeLabel}</span>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Provider
            </label>
            <select
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value);
                setModels([]);
                setModel("");
                setQuery("");
              }}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              {PROVIDERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              API key
            </label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Paste key for model discovery and generation"
                className="h-9"
              />
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => void fetchModels()}
                disabled={loading}
                className="min-w-32"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Fetch
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Model
            </label>
            <Input
              value={model}
              onChange={(event) => setModel(event.target.value)}
              placeholder="Fetch models or type a Hermes model id"
              className="h-9"
            />
          </div>

          {models.length > 0 ? (
            <div className="grid gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${models.length} models`}
                className="h-9"
              />
              <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-background p-1">
                {filteredModels.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setModel(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
                  >
                    <span className="min-w-0 truncate">{item}</span>
                    {model === item ? <Check className="size-4 shrink-0 text-primary" /> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none">
          <Button type="button" variant="ghost" onClick={clear}>
            Use Hermes default
          </Button>
          <Button type="button" onClick={save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
