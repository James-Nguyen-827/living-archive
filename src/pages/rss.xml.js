import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { site } from '../config/site';

export async function GET(context) {
  const notes = (await getCollection('notes')).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf(),
  );

  return rss({
    title: `${site.name} — Field Notes`,
    description: 'Observations on design, architecture, interfaces, and the practice around them.',
    site: context.site,
    items: notes.map((note) => ({
      title: note.data.title,
      description: note.data.summary,
      pubDate: note.data.publishDate,
      link: `/notes/${note.id}`,
      categories: note.data.tags,
    })),
  });
}

