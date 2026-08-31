export const site = {
  name: 'James Nguyen',
  owner: 'James Nguyen',
  description:
    "James Nguyen's employment history, blogs, projects, interests, and the ideas connecting them.",
  email: import.meta.env.PUBLIC_EMAIL ?? 'JamesKhoiNguyen@yahoo.com',
  url: import.meta.env.PUBLIC_SITE_URL || null,
  profiles: [
    { label: 'GitHub', href: import.meta.env.PUBLIC_GITHUB_URL ?? 'https://github.com/James-Nguyen-827' },
    { label: 'LinkedIn', href: import.meta.env.PUBLIC_LINKEDIN_URL ?? 'https://www.linkedin.com/in/jameskhoinguyen/' },
  ],
} as const;

export const navigation = [
  { label: 'Employment', href: '/employment' },
  { label: 'Blogs', href: '/writing' },
  { label: 'Projects', href: '/projects' },
  { label: 'Interests', href: '/interests' },
  { label: 'About', href: '/about' },
] as const;

export const BLOGS_EMPTY_MESSAGE =
  'The Field Notes archive has no published entries yet. The Index Engine is ready for the first note worth keeping.';

export const INTERESTS_EMPTY_MESSAGE =
  'The Interests archive is being rebuilt from real notes, recordings, and sketches. It will reopen when the first artifacts are ready.';
