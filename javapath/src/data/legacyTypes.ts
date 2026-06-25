export interface LegacyUnit {
  id: string;
  group: string;
  title: string;
  tags: string[];
  concept: Array<[string, string?]>;
  code: string;
  qa: Array<[string, string]>;
}

export interface LegacyChapter {
  chapter: string;
  module: string;
  order: number;
  lang?: string;
  groups: string[];
  units: LegacyUnit[];
}
