"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Loader2, Hospital, Stethoscope } from "lucide-react";

type PackageHit = {
  id: string;
  title: string;
  slug: string;
  basePrice: number;
  hospital: { name: string | null } | null;
};

type HospitalHit = {
  id: string;
  name: string;
  district: string | null;
};

type SearchResponse = {
  packages: PackageHit[];
  hospitals: HospitalHit[];
};

const INITIAL_RESULTS: SearchResponse = { packages: [], hospitals: [] };

export default function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(INITIAL_RESULTS);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(
    async (term: string, controller: AbortController) => {
      const response = await fetch(`/api/v1/search/global?q=${encodeURIComponent(term)}`, {
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("failed");
      const data = (await response.json()) as SearchResponse;
      return data;
    },
    []
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const value = query.trim();
    setLoading(true);
    const timer = setTimeout(() => {
      performSearch(value, controller)
        .then((data) => {
          setResults(data);
        })
        .catch(() => {
          setResults(INITIAL_RESULTS);
        })
        .finally(() => {
          setLoading(false);
        });
    }, value ? 120 : 0);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [open, query, performSearch]);

  const hasResults = useMemo(() => {
    return results.packages.length > 0 || results.hospitals.length > 0;
  }, [results]);

  function handleSelect(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global search"
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm"
    >
      <div className="cmdk-panel">
        <div className="cmdk-header">
          <Search size={16} className="text-slate-400" />
          <Command.Input
            autoFocus
            placeholder="ค้นหาแพ็กเกจหรือโรงพยาบาล..."
            onValueChange={(value) => setQuery(value)}
            value={query}
            className="cmdk-input"
          />
          <span className="cmdk-shortcut">⌘K</span>
        </div>

        <Command.List className="cmdk-list">
          {loading && (
            <div className="cmdk-loading">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังค้นหา...</span>
            </div>
          )}

          {!loading && !hasResults && (
            <Command.Empty className="py-6 text-center text-sm text-slate-500">
              ไม่พบผลลัพธ์ ลองคำศัพท์อื่นหรือชื่อโรงพยาบาล
            </Command.Empty>
          )}

          {results.packages.length > 0 && (
            <Command.Group heading="แพ็กเกจ">
              {results.packages.map((pkg) => (
                <Command.Item key={pkg.id} value={`${pkg.title} ${pkg.hospital?.name ?? ""}`}
                  onSelect={() => handleSelect(`/packages/${pkg.id}`)}>
                  <div className="cmdk-item">
                    <div className="cmdk-item__icon">
                      <Stethoscope size={16} />
                    </div>
                    <div className="cmdk-item__meta">
                      <div className="cmdk-item__title">{pkg.title}</div>
                      <div className="cmdk-item__subtitle">
                        {pkg.hospital?.name ?? "-"} · ฿{pkg.basePrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {results.hospitals.length > 0 && (
            <Command.Group heading="โรงพยาบาล">
              {results.hospitals.map((hospital) => (
                <Command.Item
                  key={hospital.id}
                  value={`${hospital.name} ${hospital.district ?? ""}`}
                  onSelect={() => handleSelect(`/packages?hospitalId=${hospital.id}`)}
                >
                  <div className="cmdk-item">
                    <div className="cmdk-item__icon">
                      <Hospital size={16} />
                    </div>
                    <div className="cmdk-item__meta">
                      <div className="cmdk-item__title">{hospital.name}</div>
                      {hospital.district && (
                        <div className="cmdk-item__subtitle">{hospital.district}</div>
                      )}
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
