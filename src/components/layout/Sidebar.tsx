import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'University', path: '/university' },
    { label: 'Resources', path: '/resources' },
    { label: 'Finance', path: '/finance' },
    { label: 'Settings', path: '/settings' },
  ];

  return (
    <aside className='w-64 bg-gray-900 text-white min-h-screen flex flex-col'>
      <div className='p-4 text-2xl font-bold border-b border-gray-800'>Admin Panel</div>
      <nav className='flex-1 p-4'>
        <ul className='space-y-2'>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block px-4 py-2 rounded hover:bg-gray-800 transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300'}`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className='p-4 border-t border-gray-800'>
        <button
          onClick={logout}
          className='w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors'
        >
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
