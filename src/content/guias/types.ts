export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type GuideRelated = {
  name: string;
  slug: string;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  category: string;
  updatedAt: string; // YYYY-MM-DD
  readingMinutes: number;
  relatedCollections?: GuideRelated[];
  sections: GuideSection[];
};
