"use client";

import { useAuth, Role } from "@/context/AuthContext";
import { UserCircle, Settings, LogOut, Activity } from "lucide-react";

export default function Navbar() {
  const { role, setRole } = useAuth();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value as Role);
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-indigo-600 mr-2" />
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              GoalTracker
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-1.5 shadow-inner">
              <span className="text-sm text-gray-500 mr-2">Viewing as:</span>
              <select
                value={role}
                onChange={handleRoleChange}
                className="bg-transparent text-sm font-semibold text-indigo-700 focus:outline-none cursor-pointer"
              >
                <option value="Employee">Employee</option>
                <option value="Manager (L1)">Manager (L1)</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center space-x-4 text-gray-500">
              <button className="hover:text-indigo-600 transition-colors">
                <Settings className="h-5 w-5" />
              </button>
              <button className="hover:text-indigo-600 transition-colors">
                <UserCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
