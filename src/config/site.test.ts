import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { site } from './site';

const projectRoot = process.cwd();
const releaseScript = resolve(projectRoot, 'scripts', 'validate-release.mjs');
const astroCli = resolve(projectRoot, 'node_modules', 'astro', 'bin', 'astro.mjs');
const builtIndex = resolve(projectRoot, 'dist', 'index.html');

function releaseEnvironment(siteUrl?: string) {
  const environment = { ...process.env };
  delete environment.PUBLIC_EMAIL;
  delete environment.PUBLIC_GITHUB_URL;
  delete environment.PUBLIC_LINKEDIN_URL;
  delete environment.PUBLIC_SITE_URL;
  if (siteUrl) environment.PUBLIC_SITE_URL = siteUrl;
  return environment;
}

describe('public site identity', () => {
  it('uses the real public contact and profile defaults without a fake canonical URL', () => {
    expect(site).toMatchObject({
      email: 'JamesKhoiNguyen@yahoo.com',
      url: null,
      profiles: [
        { label: 'GitHub', href: 'https://github.com/James-Nguyen-827' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/jameskhoinguyen/' },
      ],
    });
  });

  it('blocks release only until the canonical URL is supplied', () => {
    const missingUrl = spawnSync(process.execPath, [releaseScript], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: releaseEnvironment(),
    });

    expect(missingUrl.status).not.toBe(0);
    expect(missingUrl.stderr).toContain('PUBLIC_SITE_URL');
    expect(missingUrl.stderr).not.toContain('PUBLIC_EMAIL');

    expect(() => execFileSync(process.execPath, [releaseScript], {
      cwd: projectRoot,
      env: releaseEnvironment('https://james-nguyen.dev'),
      stdio: 'pipe',
    })).not.toThrow();
  });

  it('omits URL metadata locally and restores it when a public URL is supplied', () => {
    execFileSync(process.execPath, [astroCli, 'build'], {
      cwd: projectRoot,
      env: releaseEnvironment(),
      stdio: 'pipe',
    });

    const localHtml = readFileSync(builtIndex, 'utf8');
    expect(localHtml).not.toContain('rel="canonical"');
    expect(localHtml).not.toContain('property="og:url"');
    expect(localHtml).not.toContain('property="og:image"');
    expect(localHtml).not.toContain('example.com');
    expect(existsSync(resolve(projectRoot, 'dist', 'sitemap-index.xml'))).toBe(false);

    execFileSync(process.execPath, [astroCli, 'build'], {
      cwd: projectRoot,
      env: releaseEnvironment('https://james-nguyen.dev'),
      stdio: 'pipe',
    });

    const publicHtml = readFileSync(builtIndex, 'utf8');
    expect(publicHtml).toContain('<link rel="canonical" href="https://james-nguyen.dev/">');
    expect(publicHtml).toContain('<meta property="og:url" content="https://james-nguyen.dev/">');
    expect(publicHtml).toContain('<meta property="og:image" content="https://james-nguyen.dev/og/default.png">');
    expect(publicHtml).toContain('"url":"https://james-nguyen.dev"');
    expect(readFileSync(resolve(projectRoot, 'dist', 'rss.xml'), 'utf8')).toContain('https://james-nguyen.dev/');
    expect(readFileSync(resolve(projectRoot, 'dist', 'sitemap-index.xml'), 'utf8')).toContain('https://james-nguyen.dev/');
  }, 30_000);
});
