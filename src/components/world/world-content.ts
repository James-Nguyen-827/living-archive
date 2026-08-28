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
  href: string;
  entries: readonly ZoneEntry[];
}

export const ZONE_LABELS: Record<ZoneId, string> = {
  work: 'Work',
  'field-notes': 'Field Notes',
  experiments: 'Experiments',
  hobbies: 'Hobbies',
  about: 'About',
};
