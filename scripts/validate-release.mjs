const required = {
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
  PUBLIC_EMAIL: process.env.PUBLIC_EMAIL,
  PUBLIC_GITHUB_URL: process.env.PUBLIC_GITHUB_URL,
  PUBLIC_LINKEDIN_URL: process.env.PUBLIC_LINKEDIN_URL,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value || /example\.com|github\.com\/$|linkedin\.com\/$/.test(value))
  .map(([name]) => name);

if (missing.length > 0) {
  throw new Error(`Release blocked: replace placeholder identity values for ${missing.join(', ')}.`);
}

for (const [name, value] of Object.entries(required)) {
  if (name !== 'PUBLIC_EMAIL') new URL(value);
}

console.log('Release identity is complete.');
