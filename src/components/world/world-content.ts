import type { ZoneId } from './world-types';

export interface ZoneEntry {
  title: string;
  href: string;
  meta: string;
  summary: string;
  previewImage?: string;
  previewAlt?: string;
}

export interface ZoneData {
  id: ZoneId;
  label: string;
  summary: string;
  emptyMessage?: string;
  href: string;
  entries: readonly ZoneEntry[];
}

export const ZONE_LABELS: Record<ZoneId, string> = {
  employment: 'Employment',
  writing: 'Blogs',
  projects: 'Projects',
  interests: 'Interests',
  about: 'About',
};
