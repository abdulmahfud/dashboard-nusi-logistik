"use client";

import { CornerDownLeft, PackageSearch, Search, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { filterSidebarByPermission } from "@/lib/sidebar-permissions";
import { cn } from "@/lib/utils";
import { sidebarData, sidebarGroupOrder } from "@/components/sidebar-data";

interface SearchEntry {
  key: string;
  title: string;
  url: string;
  icon: LucideIcon;
  group: string;
}

interface NavItemLike {
  title: string;
  url: string;
  icon: LucideIcon;
  permission?: string;
  permissionAny?: string[];
}

/** Nomor resi/AWB: alfanumerik (boleh strip), minimal 6 karakter. */
const RESI_PATTERN = /^[A-Za-z0-9-]{6,}$/;

/**
 * Pencarian global di top bar: cari menu (sesuai izin akun) dan lacak nomor resi.
 * Pintasan: Ctrl/Cmd + K.
 */
export function GlobalSearch() {
  const router = useRouter();
  const { hasPermission, loading } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const menuEntries = React.useMemo<SearchEntry[]>(() => {
    if (loading) return [];
    return sidebarGroupOrder.flatMap(({ key, label }) => {
      const items: NavItemLike[] = sidebarData[key];
      return filterSidebarByPermission(items, hasPermission, loading).map(
        (item) => ({
          key: `${key}:${item.url}:${item.title}`,
          title: item.title,
          url: item.url,
          icon: item.icon,
          group: label,
        })
      );
    });
  }, [hasPermission, loading]);

  const results = React.useMemo<SearchEntry[]>(() => {
    const q = query.trim();
    const needle = q.toLowerCase();
    const matches = needle
      ? menuEntries.filter(
          (e) =>
            e.title.toLowerCase().includes(needle) ||
            e.group.toLowerCase().includes(needle)
        )
      : menuEntries;

    if (RESI_PATTERN.test(q) && hasPermission("expedition.tracking.view")) {
      return [
        ...matches,
        {
          key: "resi",
          title: `Lacak resi “${q}”`,
          url: `/dashboard/tracking?resi=${encodeURIComponent(q)}`,
          icon: PackageSearch,
          group: "Lacak Paket",
        },
      ];
    }
    return matches;
  }, [query, menuEntries, hasPermission]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActive(0);
    }
  };

  const go = (entry: SearchEntry) => {
    handleOpenChange(false);
    router.push(entry.url);
  };

  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, results]);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) =>
        results.length ? (i - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = results[active];
      if (entry) go(entry);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-11 w-full max-w-xl items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-sm text-slate-400 transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 md:flex"
        aria-label="Buka pencarian"
      >
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <span className="flex-1 truncate">Cari menu atau nomor resi...</span>
        <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
          ⌘ K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="Buka pencarian"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="top-[20%] translate-y-0 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-xl">
          <DialogTitle className="sr-only">Pencarian</DialogTitle>
          <DialogDescription className="sr-only">
            Cari menu atau lacak nomor resi. Gunakan panah untuk memilih dan
            Enter untuk membuka.
          </DialogDescription>

          <div className="flex items-center gap-3 border-b border-slate-100 px-4">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onInputKeyDown}
              placeholder="Cari menu atau nomor resi..."
              className="h-14 flex-1 bg-transparent pr-8 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              role="combobox"
              aria-expanded
              aria-controls="global-search-results"
              aria-autocomplete="list"
            />
          </div>

          <div
            ref={listRef}
            id="global-search-results"
            role="listbox"
            className="max-h-[22rem] overflow-y-auto p-2"
          >
            {results.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-slate-500">
                {loading
                  ? "Memuat..."
                  : `Tidak ada hasil untuk “${query.trim()}”.`}
              </p>
            ) : (
              results.map((entry, index) => {
                const Icon = entry.icon;
                const selected = index === active;
                return (
                  <button
                    key={entry.key}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(entry)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      selected
                        ? "bg-blue-100/70 text-blue-600"
                        : "text-slate-700"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                    <span className="flex-1 truncate font-medium">
                      {entry.title}
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">
                      {entry.group}
                    </span>
                    {selected && (
                      <CornerDownLeft
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
