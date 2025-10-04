import { getFallbackHospitalSummaries } from "@/lib/fallback-data";

const FALLBACK_LOGOS = (() => {
  const map: Record<string, string> = {};
  for (const hospital of getFallbackHospitalSummaries()) {
    if (!hospital.logoUrl) continue;
    const keys = [hospital.id, hospital.name, hospital.shortName].filter(Boolean) as string[];
    for (const key of keys) {
      map[key.trim().toLowerCase()] = hospital.logoUrl;
    }
  }
  return map;
})();

function lookupFallback(key: string | null | undefined) {
  if (!key) return null;
  const cleaned = key.trim().toLowerCase();
  if (!cleaned) return null;
  return FALLBACK_LOGOS[cleaned] ?? null;
}

export function resolveHospitalLogo(input: { id?: string | null; name?: string | null; logoUrl?: string | null }) {
  if (!input) return null;
  if (input.logoUrl) return input.logoUrl;
  return lookupFallback(input.id) ?? lookupFallback(input.name);
}

export function withResolvedHospitalLogo<T extends { id?: string | null; name?: string | null; logoUrl?: string | null }>(
  hospital: T,
): T & { logoUrl: string | null } {
  const logoUrl = resolveHospitalLogo(hospital);
  return { ...hospital, logoUrl };
}
