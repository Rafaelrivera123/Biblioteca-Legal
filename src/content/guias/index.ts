import { guidesBatchA } from "./batch-a";
import { guidesBatchB } from "./batch-b";
import { guidesBatchC } from "./batch-c";
import { guidesBatchD } from "./batch-d";
import type { Guide } from "./types";

export type { Guide, GuideSection, GuideRelated } from "./types";

export const GUIDES: Guide[] = [
  ...guidesBatchA,
  ...guidesBatchB,
  ...guidesBatchC,
  ...guidesBatchD,
];

export function getAllGuides(): Guide[] {
  return [...GUIDES].sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((guide) => guide.slug === slug);
}

export function getGuideCategories(): string[] {
  return [...new Set(GUIDES.map((guide) => guide.category))].sort((a, b) =>
    a.localeCompare(b, "es")
  );
}
