import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ZoneData } from './world-content';
import { WorldExplorer } from './WorldExplorer';

const zones: ZoneData[] = [
  { id: 'employment', label: 'Employment', summary: 'Selected work.', href: '/employment', entries: [{ title: 'Civic Signal', href: '/employment/civic-signal', meta: '2026', summary: 'A public-service design system.' }] },
  { id: 'writing', label: 'Blogs', summary: 'Short notes.', href: '/writing', entries: [] },
  { id: 'projects', label: 'Projects', summary: 'Small tests.', href: '/projects', entries: [] },
  { id: 'interests', label: 'Interests', summary: 'Ongoing practices.', href: '/interests', entries: [] },
  { id: 'about', label: 'About', summary: 'About James.', href: '/about', entries: [] },
];

describe('WorldExplorer accessible shell', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(cleanup);

  it('keeps a poster-only fallback and restores a zone panel from the URL', async () => {
    window.history.replaceState({ archive: { kind: 'zone', zone: 'employment' }, archiveDepth: 0 }, '', '/?zone=employment');
    const { container } = render(<WorldExplorer zones={zones} />);
    await screen.findByText(/WebGL2 is not supported/i);
    expect(container.querySelectorAll('.world-fallback__index a')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Open index' })).toBeNull();

    expect(await screen.findByRole('heading', { name: 'Employment' })).toBeVisible();
    await waitFor(() => expect(document.querySelector('.archive-window')).toHaveFocus());
    const previewButton = screen.getByRole('button', { name: /Civic Signal/ });
    expect(previewButton).toBeVisible();
    fireEvent.click(previewButton);
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/employment/civic-signal');
    expect(window.location.search).toBe('?zone=employment');
    fireEvent.click(screen.getByRole('button', { name: 'Close archive window' }));
    await waitFor(() => expect(document.querySelector('.archive-window')).toBeNull());
    await waitFor(() => expect(container.querySelector('.world-explorer')).toHaveAttribute('data-node', 'spawn'));
    expect(window.location.search).toBe('');
  });

  it('persists a manual theme and announces the change', async () => {
    render(<WorldExplorer zones={zones} />);
    const toggle = await screen.findByRole('button', { name: 'Switch to night theme' });
    fireEvent.click(toggle);

    expect(document.documentElement.dataset.theme).toBe('night');
    expect(localStorage.getItem('portfolio-theme')).toBe('night');
    expect(screen.getByText('Night environment active.')).toBeInTheDocument();
  });

  it('tracks free drag rotation and keeps keyboard movement disabled', async () => {
    const { container } = render(<WorldExplorer zones={zones} />);
    const world = container.querySelector<HTMLElement>('.world-explorer')!;
    await screen.findByText(/WebGL2 is not supported/i);

    fireEvent.pointerDown(world, { clientX: 220, pointerId: 7 });
    fireEvent.pointerMove(world, { clientX: 100, pointerId: 7 });
    fireEvent.lostPointerCapture(world, { pointerId: 7 });
    fireEvent.pointerMove(world, { clientX: 40, pointerId: 7 });

    await waitFor(() => expect(Number(world.dataset.angle)).toBeCloseTo(0.96));
    const originalNode = world.dataset.node;
    fireEvent.keyDown(world, { key: 'w' });
    fireEvent.keyDown(world, { key: 'ArrowRight' });
    expect(world.dataset.node).toBe(originalNode);
  });

  it('nudges by 22.5 degrees with Q/E in fallback mode', async () => {
    const { container } = render(<WorldExplorer zones={zones} />);
    const world = container.querySelector<HTMLElement>('.world-explorer')!;
    await screen.findByText(/WebGL2 is not supported/i);

    const region = screen.getByRole('region', { name: 'Interactive portfolio world for James Nguyen' });
    expect(region.tagName).toBe('DIV');
    expect(region).toHaveAttribute('tabindex', '0');

    fireEvent.keyDown(world, { key: 'e' });
    expect(Number(world.dataset.angle)).toBeCloseTo(Math.PI / 8);
  });
});
