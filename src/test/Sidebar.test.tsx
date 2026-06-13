import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '@/components/layout/Sidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/dashboard' }));
vi.mock('next/link', () => ({ default: ({ href, children, ...p }: { href: string; children: React.ReactNode; [k: string]: unknown }) => <a href={href} {...p}>{children}</a> }));
vi.mock('@/app/actions/auth', () => ({ logout: vi.fn() }));

describe('Sidebar', () => {
  it('renders all nav links', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeTruthy();
    expect(screen.getByText('Properties')).toBeTruthy();
    expect(screen.getByText('Tenants')).toBeTruthy();
    expect(screen.getByText('Finance')).toBeTruthy();
    expect(screen.getByText('Documents')).toBeTruthy();
    expect(screen.getByText('Bookings')).toBeTruthy();
  });

  it('highlights the active link', () => {
    render(<Sidebar />);
    const dashLink = screen.getByText('Dashboard').closest('a');
    expect(dashLink?.className).toContain('text-blue-700');
  });

  it('toggles mobile sidebar on hamburger click', async () => {
    render(<Sidebar />);
    const toggle = screen.getByLabelText('Toggle navigation');
    const sidebar = screen.getByRole('complementary');
    expect(sidebar.className).toContain('-translate-x-full');
    await userEvent.click(toggle);
    expect(sidebar.className).toContain('translate-x-0');
    expect(sidebar.className).not.toContain('-translate-x-full');
  });
});
