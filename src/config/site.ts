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
  "The Blogs archive is empty for now. I'm still figuring out what I want to write about.";

export const INTERESTS_EMPTY_MESSAGE =
  'Still working on this—there are a lot of interests to catalog.';

export const EMPLOYMENT_INTRO =
  'A look at the work I’ve done and the decisions behind it.';

export const BLOGS_INTRO =
  'Notes, experiments, and small things worth writing down.';

export const PROJECTS_INTRO =
  'Things I’ve built, from finished projects to ideas I’m still figuring out.';

export const INTERESTS_INTRO =
  'Things I enjoy doing in my free time.';

export const ABOUT_PARAGRAPHS = [
  'Hi, I’m James! I’m someone who likes building things and figuring out how stuff works. I especially enjoy projects that have some kind of physical aspect to them. There’s something really satisfying about writing code and then actually seeing it do something in the real world instead of it just living on a screen.',
  'I made this website because I wanted something a little different from the usual portfolio that’s just “here are my projects and here’s my experience.” I wanted it to also be a place where people can get to know me, my hobbies, the things I’m interested in, and whatever else I end up working on. I also wanted the website itself to feel like one of my projects, so I’ve been trying to make it fun, unique, and something you can actually explore.',
] as const;

export const ABOUT_SUMMARY = ABOUT_PARAGRAPHS.join(' ');
