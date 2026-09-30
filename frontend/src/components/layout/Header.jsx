import React, { useState } from 'react';
import { Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

const Header = ({ user, onMenuClick }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { settings } = useSettings();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 h-14 md:h-16 bg-white border-b border-gray-100 z-50 flex items-center px-4 md:px-6">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 hover:bg-gray-50 rounded-lg md:hidden text-gray-600"
        >
          <Menu size={24} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
            NL
          </div>
          <h1 className="font-bold text-gray-800 hidden sm:block tracking-tight">
            {settings.schoolName}
          </h1>
        </div>
      </div>

      <div className="flex-grow" />

      {/* Right: Profile */}
      <div className="relative">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-full transition-all"
        >
          <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-50 rounded-full flex items-center justify-center text-primary border border-indigo-100 shadow-sm overflow-hidden">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
          />
        </button>

        {showProfileMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-2 animate-in fade-in zoom-in-95 duration-100">
              {/* User info */}
              <div className="px-4 py-2 border-b border-gray-50">
                <p className="text-xs font-bold text-gray-900">{user.name}</p>
                <p className="text-[10px] text-secondary uppercase font-bold">{user.role}</p>
                {user.branch && (
                  <p className="text-[10px] text-primary font-bold truncate mt-0.5">
                    {user.branch.name}
                  </p>
                )}
              </div>

              {/* Profile link — admin only */}
              {user.role === 'admin' && (
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/admin/profile'); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 text-left"
                >
                  <User size={16} /> My Profile
                </button>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-red-50 text-left"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
