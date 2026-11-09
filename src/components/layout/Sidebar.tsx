import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Piano, Kanban, Calendar,
  BarChart3, Users, Settings, LogOut, Music, Scale, BookOpen
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/inventory', icon: Piano, label: 'Inventory' },
  { to: '/triage', icon: Scale, label: 'Acquisition Triage' },
  { to: '/renovation', icon: Kanban, label: 'Renovation Progress' },
  { to: '/catalogue', icon: BookOpen, label: 'Catalogue' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
  onClose: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user, profile, role, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const displayName = profile?.full_name || user?.email || 'Workshop account';
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const leave = async () => {
    if (working.current) return;
    working.current = true; setBusy(true);
    try { await signOut(); }
    catch { /* The provider retains a safe error on the login screen after unmount. */ }
    finally { working.current = false; setBusy(false); }
  };
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Music className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold text-primary">Nick's Piano Services</h2>
          <p className="text-xs text-muted-foreground">Workshop Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors touch-target ${
                isActive
                  ? 'bg-sidebar-accent text-primary border-l-2 border-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              }`
            }
          >
            <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
            <p className="text-xs text-sidebar-foreground/60">{role}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email}</p>
          </div>
        </div>
        <button type="button" onClick={() => { void leave(); }} disabled={busy} className="flex items-center gap-2 rounded px-3 py-2 text-sm touch-target">
          <LogOut className="h-4 w-4" aria-hidden="true" />{busy ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
