import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Compass, Calendar, User } from 'lucide-react';

const ShellScaffold = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Discovery', path: '/discovery', icon: Compass },
    { label: 'Bookings', path: '/bookings', icon: Calendar },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <div className="mobile-shell shadow-2xl flex flex-col min-h-screen bg-slate-50">
      {/* Page content area */}
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="absolute bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full select-none"
            >
              <Icon
                className={`w-6 h-6 transition-colors ${
                  isActive ? 'text-primary' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-[10px] font-medium mt-1 transition-colors ${
                  isActive ? 'text-primary font-semibold' : 'text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default ShellScaffold;
