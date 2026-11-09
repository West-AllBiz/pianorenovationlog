import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

const fixtures = vi.hoisted(() => {
  const rows = [
    ['business', 'business_inventory', 'acquired'],
    ['client', 'client_piano', 'client_pickup'],
    ['donation', 'donation_project', 'donation_delivery'],
    ['restoration', 'business_inventory', 'restoration_work'],
    ['regulation', 'client_piano', 'regulation'],
    ['voicing', 'client_piano', 'voicing'],
    ['tuning', 'business_inventory', 'tuning'],
    ['cabinet', 'donation_project', 'cabinet_work'],
    ['parts', 'business_inventory', 'awaiting_parts'],
    ['ready', 'business_inventory', 'ready_for_sale'],
    ['archive', 'restoration_archive', 'archived'],
  ];
  return rows.map(([id, ownership_category, status]) => ({ id, ownership_category, status, inventory_id: id, brand: 'Fixture', model: id, item_kind: 'piano', piano_type: 'upright', tag: '', percent_complete: 0 }));
});
vi.mock('@/hooks/usePianos', () => ({ usePianos: () => ({ data: fixtures, isLoading: false }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ profile: { full_name: 'Fixture Owner' }, canEdit: false }) }));
vi.mock('@/components/AddPianoDialog', () => ({ AddPianoDialog: () => null }));
vi.mock('@/components/PianoPhotos', () => ({ PianoPhotoThumbnail: () => null }));
import Dashboard from './Dashboard';
import Inventory from './Inventory';
import { readInventoryFilters } from '@/lib/inventoryFilters';

function Location() { const location = useLocation(); const navigate = useNavigate(); return <><output data-testid="location">{location.pathname}{location.search}</output><button onClick={() => navigate(-1)}>Go back</button></>; }
function app(path = '/dashboard') { return render(<MemoryRouter initialEntries={[path]}><Location /><Routes><Route path="/dashboard" element={<Dashboard />} /><Route path="/inventory" element={<Inventory />} /></Routes></MemoryRouter>); }
const inventoryIds = () => screen.queryAllByRole('link').map(e => e.getAttribute('href')).filter(href => href?.startsWith('/piano/')).map(href => href!.slice(7));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const cases = [
  ['Total Pianos', '/inventory', fixtures.map(p => p.id)],
  ['Business Inventory', '/inventory?ownership=business_inventory', ['business', 'restoration', 'tuning', 'parts', 'ready']],
  ['Client Pianos', '/inventory?ownership=client_piano', ['client', 'regulation', 'voicing']],
  ['Donation Projects', '/inventory?ownership=donation_project', ['donation', 'cabinet']],
  ['In Restoration', '/inventory?status=in_restoration', ['restoration', 'regulation', 'voicing', 'tuning', 'cabinet']],
  ['Awaiting Parts', '/inventory?status=awaiting_parts', ['parts']],
  ['Ready for Sale', '/inventory?status=ready_for_sale', ['ready']],
] as const;
for (const [label, href, ids] of cases) it(`links ${label} to precisely its counted items`, () => {
  vi.stubGlobal('fetch', vi.fn(() => { throw Error('No network allowed'); }));
  app();
  const link = screen.getByRole('link', { name: `View ${label}: ${ids.length}` });
  expect(link).toHaveAttribute('href', href);
  expect(within(link).getByText(String(ids.length))).toBeInTheDocument();
  expect(link.tagName).toBe('A');
  fireEvent.click(link);
  expect(screen.getByTestId('location')).toHaveTextContent(href);
  expect(inventoryIds()).toEqual(ids);
  expect(fetch).not.toHaveBeenCalled();
});
it('deep links combine ownership and grouped status and display active filters', () => {
  app('/inventory?status=in_restoration&ownership=client_piano');
  expect(inventoryIds()).toEqual(['regulation', 'voicing']);
  expect(screen.getByRole('button', { name: 'Client Piano' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: 'In Restoration' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText('2 of 11 pianos in catalog')).toBeInTheDocument();
});
it('allows changing, clearing and browser-back restoration of URL filters', () => {
  app('/inventory?ownership=client_piano&other=keep');
  fireEvent.click(screen.getByRole('button', { name: 'In Restoration' }));
  expect(inventoryIds()).toEqual(['regulation', 'voicing']);
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(inventoryIds()).toHaveLength(11);
  expect(screen.getByTestId('location')).toHaveTextContent('/inventory?other=keep');
  fireEvent.click(screen.getByRole('button', { name: 'Go back' }));
  expect(inventoryIds()).toEqual(['regulation', 'voicing']);
});
it('keeps text search available within a linked subset', () => {
  app('/inventory?status=in_restoration');
  fireEvent.change(screen.getByPlaceholderText('Search by brand, serial, ID, or tag...'), { target: { value: 'cabinet' } });
  expect(inventoryIds()).toEqual(['cabinet']);
});
it('shows a proper empty result for a valid combination with no records', () => {
  app('/inventory?status=ready_for_sale&ownership=client_piano');
  expect(screen.getByText('No pianos found')).toBeInTheDocument();
  expect(screen.getByText('0 of 11 pianos in catalog')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  expect(inventoryIds()).toHaveLength(11);
});
it('ignores invalid URL values, including object prototype names', () => {
  for (const value of ['unknown', '__proto__', 'constructor']) expect(readInventoryFilters(new URLSearchParams(`status=${value}&ownership=${value}`))).toEqual({ status: 'all', ownership: 'all' });
  app('/inventory?status=invalid&ownership=invalid');
  expect(inventoryIds()).toHaveLength(11);
});
