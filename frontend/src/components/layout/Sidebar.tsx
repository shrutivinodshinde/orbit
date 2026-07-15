import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '▦', roles: ['Super Admin', 'Country Admin', 'Manager', 'Team Lead', 'Employee', 'Intern'] },
  { to: '/sales', label: 'Sales', icon: '◎', roles: ['Super Admin', 'Country Admin', 'Manager', 'Team Lead', 'Employee'] },
  { to: '/export', label: 'Export', icon: '⬆', roles: ['Super Admin', 'Country Admin', 'Manager', 'Team Lead', 'Employee'] },
  { to: '/attendance', label: 'Attendance', icon: '◷', roles: ['Super Admin', 'Country Admin', 'Manager', 'Team Lead', 'Employee', 'Intern'] },
  { to: '/users', label: 'Users', icon: '◉', roles: ['Super Admin', 'Country Admin', 'Manager'] },
  { to: '/audit-logs', label: 'Audit Logs', icon: '≡', roles: ['Super Admin', 'Country Admin'] },
  { to: '/ai-assistant', label: 'AI Assistant', icon: '✦', roles: ['Super Admin', 'Country Admin', 'Manager', 'Team Lead'] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const visible = NAV.filter((n) => user && n.roles.includes(user.role));

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col min-h-screen">
      <div className="h-14 flex items-center px-5 border-b border-gray-200">
        <span className="font-semibold text-brand-600 tracking-tight text-lg">Orbit</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {visible.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'
              }`
            }
          >
            <span className="text-base leading-none">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 truncate px-3">{user?.email}</p>
        <p className="text-xs text-brand-600 font-medium px-3">{user?.role}</p>
      </div>
    </aside>
  );
}