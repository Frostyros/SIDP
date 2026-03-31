import { useAuthStore } from '../../store/authStore';
import { LogOut, Bell, Search, User } from 'lucide-react';

const Header = () => {
  const { user, logout } = useAuthStore();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-10">
      <div className="flex-1 flex items-center">
        <div className="relative w-full max-w-md hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Search trainings, employees..."
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none transition-colors">
          <Bell className="h-5 w-5 relative" />
          <span className="absolute top-3 right-[4.5rem] block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-gray-900">{user?.name || 'Administrator'}</span>
            <span className="text-xs text-blue-600 font-medium">{user?.role || 'ADMIN'}</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
            {user?.name?.charAt(0).toUpperCase() || <User className="h-5 w-5" />}
          </div>
          <button
            onClick={logout}
            className="ml-2 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Log out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
