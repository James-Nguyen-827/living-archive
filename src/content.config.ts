import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const status = z.enum(['complete', 'in-progress', 'maintained', 'archived']);

const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    year: z.number().int(),
    role: z.string(),
    status,
    featured: z.boolean().default(false),
    disciplines: z.array(z.string()).min(1),
    outcome: z.string(),
    order: z.number().int(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const archive = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/archive' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    kind: z.enum(['experiment', 'hobby']),
    status,
    year: z.number().int(),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = { work, notes, archive };
