const required = {
  PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL,
};

const missing = Object.entries(required)
  .filter(([, value]) => !value || /example\.com|github\.com\/$|linkedin\.com\/$/.test(value))
  .map(([name]) => name);

if (missing.length > 0) {
  throw new Error(`Release blocked: replace placeholder identity values for ${missing.join(', ')}.`);
}

for (const value of Object.values(required)) new URL(value);

console.log('Release identity is complete.');
