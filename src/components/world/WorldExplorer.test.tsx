import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ZoneData } from './world-content';
import { WorldExplorer } from './WorldExplorer';

const zones: ZoneData[] = [
  { id: 'work', label: 'Work', summary: 'Selected work.', href: '/work', entries: [{ title: 'Civic Signal', href: '/work/civic-signal', meta: '2026', summary: 'A public-service design system.' }] },
  { id: 'field-notes', label: 'Field Notes', summary: 'Short notes.', href: '/notes', entries: [] },
  { id: 'experiments', label: 'Experiments', summary: 'Small tests.', href: '/experiments', entries: [] },
  { id: 'hobbies', label: 'Hobbies', summary: 'Ongoing practices.', href: '/hobbies', entries: [] },
  { id: 'about', label: 'About', summary: 'About James.', href: '/about', entries: [] },
];

describe('WorldExplorer accessible shell', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  afterEach(cleanup);

  it('keeps a complete linked fallback and opens an HTML zone panel', async () => {
    const { container } = render(<WorldExplorer zones={zones} />);
    await screen.findByText(/WebGL2 is not supported/i);
    const fallbackLinks = container.querySelectorAll('.world-fallback__index a');
    expect(fallbackLinks).toHaveLength(5);

    fireEvent.click(fallbackLinks[0]);
    expect(await screen.findByRole('heading', { name: 'Work' })).toBeVisible();
    await waitFor(() => expect(document.querySelector('.archive-window')).toHaveFocus());
    const previewButton = screen.getByRole('button', { name: /Civic Signal/ });
    expect(previewButton).toBeVisible();
    fireEvent.click(previewButton);
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/work/civic-signal');
    expect(window.location.search).toBe('?zone=work');
    fireEvent.click(screen.getByRole('button', { name: 'Close archive window' }));
    await waitFor(() => expect(document.querySelector('.archive-window')).toBeNull());
    expect(fallbackLinks[0]).toHaveFocus();
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

  it('nudges by 22.5 degrees with Q/E and exposes the index window', async () => {
    const { container } = render(<WorldExplorer zones={zones} />);
    const world = container.querySelector<HTMLElement>('.world-explorer')!;
    await screen.findByText(/WebGL2 is not supported/i);
    fireEvent.keyDown(world, { key: 'e' });
    expect(Number(world.dataset.angle)).toBeCloseTo(Math.PI / 8);

    fireEvent.click(screen.getByRole('button', { name: 'Open index' }));
    expect(await screen.findByRole('heading', { name: 'Index' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Work/ }));
    expect(await screen.findByRole('heading', { name: 'Work' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Close archive window' }));
    await waitFor(() => expect(document.querySelector('.archive-window')).toBeNull());
    expect(container.querySelector('.world-zone-labels a[href="/work"]')).toHaveFocus();
  });
});
