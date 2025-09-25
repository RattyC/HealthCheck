import { z } from "zod";

export const packageSearchSchema = z.object({
  q: z.string().max(120).optional(),
  hospitalId: z.string().cuid().optional(),
  minPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  maxPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  gender: z.enum(["any", "male", "female"]).optional(),
  age: z.coerce.number().min(0).max(120).optional(),
  category: z.string().max(60).optional(),
  sort: z.enum(["priceAsc", "priceDesc", "updated"]).default("priceAsc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export const adminPackageQuerySchema = z.object({
  q: z.string().max(120).optional(),
  status: z.enum(["all", "DRAFT", "APPROVED", "ARCHIVED"]).default("all"),
  sort: z.enum(["updatedDesc", "updatedAsc", "priceAsc", "priceDesc", "titleAsc"]).default("updatedDesc"),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(10).max(100).default(20),
});

export const adminStatusUpdateSchema = z.object({
  action: z.enum(["approve", "reject", "archive"]),
  reason: z.string().max(280).nullish(),
});

export const savedSearchSchema = z.object({
  name: z.string().min(2).max(60),
  params: z.record(z.string(), z.any()),
});

export type PackageSearchInput = z.infer<typeof packageSearchSchema>;
export type AdminPackageQueryInput = z.infer<typeof adminPackageQuerySchema>;
