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

export const ABOUT_PARAGRAPHS = [
  'Hi, I’m James! I’m someone who likes building things and figuring out how stuff works. I especially enjoy projects that have some kind of physical aspect to them. There’s something really satisfying about writing code and then actually seeing it do something in the real world instead of it just living on a screen.',
  'I made this website because I wanted something a little different from the usual portfolio that’s just “here are my projects and here’s my experience.” I wanted it to also be a place where people can get to know me, my hobbies, the things I’m interested in, and whatever else I end up working on. I also wanted the website itself to feel like one of my projects, so I’ve been trying to make it fun, unique, and something you can actually explore.',
] as const;

export const ABOUT_SUMMARY = ABOUT_PARAGRAPHS.join(' ');
