import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, GraduationCap, PlusCircle, Users, FileBarChart, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Trainings', path: '/trainings', icon: GraduationCap },
    { name: 'Add Training', path: '/add-training', icon: PlusCircle },
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Reports', path: '/reports', icon: FileBarChart },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col transition-all duration-300">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-2 text-primary-600">
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900 tracking-tight">SIDP</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="rounded-lg bg-gray-50 p-3 flex flex-col items-center text-center">
          <p className="text-xs text-gray-500 font-medium">Sistem Informasi Diklat Pegawai</p>
          <p className="text-[10px] text-gray-400 mt-1">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
