export const site = {
  name: 'Living Archive',
  owner: 'James',
  description:
    'A living archive of selected work, field notes, experiments, hobbies, and the ideas connecting them.',
  email: import.meta.env.PUBLIC_EMAIL ?? 'hello@example.com',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'https://example.com',
  profiles: [
    { label: 'GitHub', href: import.meta.env.PUBLIC_GITHUB_URL ?? 'https://github.com/' },
    { label: 'LinkedIn', href: import.meta.env.PUBLIC_LINKEDIN_URL ?? 'https://www.linkedin.com/' },
  ],
} as const;

export const navigation = [
  { label: 'Work', href: '/work' },
  { label: 'Field Notes', href: '/notes' },
  { label: 'Experiments', href: '/experiments' },
  { label: 'Hobbies', href: '/hobbies' },
  { label: 'About', href: '/about' },
] as const;
