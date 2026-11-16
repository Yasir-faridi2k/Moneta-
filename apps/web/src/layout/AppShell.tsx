import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowDownLeft, BarChart3, LayoutDashboard, Menu, Tags, WalletCards, X } from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowDownLeft },
  { to: '/budgets', label: 'Budgets', icon: WalletCards },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return <div className="app-frame">
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-mark">m</span><span>moneta<span className="brand-period">.</span></span></NavLink>
      <div className="sidebar-caption">YOUR FINANCES</div>
      <nav className="side-nav">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><div className="sidebar-note-dot" /><span>Your money, in focus.</span></div><div className="sidebar-version">MONETA · PERSONAL FINANCE</div></div>
    </aside>

    <div className="main-column">
      <header className="mobile-header"><NavLink to="/" className="brand"><span className="brand-mark">m</span><span>moneta<span className="brand-period">.</span></span></NavLink><button className="icon-button mobile-menu-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button></header>
      {menuOpen && <div className="mobile-nav">{navigation.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}</div>}
      <main className="main-content"><Outlet key={location.pathname} /></main>
      <footer className="mobile-footer">Personal Finance, Simplified<span> · </span>MONETA</footer>
    </div>
  </div>;
}
