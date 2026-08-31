import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const status = z.enum(['complete', 'in-progress', 'maintained', 'archived']);

const employment = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/employment' }),
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

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const archiveEntry = z.object({
  title: z.string(),
  summary: z.string(),
  draft: z.boolean().default(false),
  status,
  year: z.number().int(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

const projectCaseStudy = z.object({
  role: z.string(),
  collaboration: z.string().optional(),
  contribution: z.string(),
  outcome: z.string(),
  repository: z.url(),
  hero: z.object({
    src: z.string(),
    alt: z.string().min(1),
    caption: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).optional(),
  diagram: z.enum(['dual-path', 'well-plate', 'deploy-pipeline']).optional(),
  nextProject: reference('projects').optional(),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: archiveEntry.extend({
    previewImage: z.string().optional(),
    previewAlt: z.string().min(1).optional(),
    caseStudy: projectCaseStudy.optional(),
  }).refine((entry) => !entry.previewImage || Boolean(entry.previewAlt), {
    message: 'previewAlt is required when previewImage is present',
    path: ['previewAlt'],
  }),
});

const interests = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/interests' }),
  schema: archiveEntry,
});

export const collections = { employment, writing, projects, interests };
