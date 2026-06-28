'use client';

import React, { useEffect, useState } from 'react';
import { Bell, HelpCircle, Terminal, Search, Globe, ChevronDown, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AwsHeader() {
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Read username from session cookie
    const match = document.cookie.match(/r53_session=([^;]+)/);
    if (match) {
      try {
        setUsername(atob(match[1]));
      } catch {
        setUsername('user');
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear session cookie
    document.cookie = 'r53_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };

  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  return (
    <header className="h-[48px] bg-[#1b2530] text-white flex items-center justify-between px-4 select-none fixed top-0 left-0 right-0 z-50 border-b border-[#2e3b4e]">
      {/* Left: AWS Logo & Service Title */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="font-bold text-[15px] tracking-wide text-white flex items-center">
            aws<span className="text-[#ec7211]">.</span>
          </span>
          <div className="w-[1px] h-4 bg-gray-600"></div>
          <span className="font-semibold text-[14px] text-gray-200 group-hover:text-white transition-colors">
            Route 53
          </span>
        </Link>
      </div>

      {/* Middle: Search */}
      <div className="hidden md:flex items-center w-[400px] lg:w-[520px] h-[30px] bg-[#2e3b4e] border border-gray-600 rounded px-3 text-gray-400 transition-all">
        <Search className="w-4 h-4 mr-2 text-gray-400" />
        <input
          type="text"
          placeholder="Search for services, features, or docs"
          className="bg-transparent border-none outline-none text-[12px] w-full text-inherit placeholder-gray-400"
          disabled
        />
        <span className="text-[10px] bg-[#1b2530] text-gray-400 px-1 py-0.5 rounded border border-gray-600">
          Alt+S
        </span>
      </div>

      {/* Right: Tools, Region, Profile, Logout */}
      <div className="flex items-center gap-2 text-gray-300 text-[12px]">
        <button title="CloudShell" className="hover:text-white hover:bg-gray-700/30 p-1.5 rounded transition-all">
          <Terminal className="w-[18px] h-[18px]" />
        </button>

        <button title="Notifications" className="hover:text-white hover:bg-gray-700/30 p-1.5 rounded relative transition-all">
          <Bell className="w-[18px] h-[18px]" />
        </button>

        <button title="Support" className="hover:text-white hover:bg-gray-700/30 p-1.5 rounded transition-all">
          <HelpCircle className="w-[18px] h-[18px]" />
        </button>

        <div className="w-[1px] h-5 bg-gray-700"></div>

        <div className="flex items-center gap-1 cursor-default px-2 py-1 text-gray-300 font-medium">
          <Globe className="w-4 h-4" />
          <span>Global</span>
          <ChevronDown className="w-3 h-3 text-gray-500" />
        </div>

        {/* User account */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-white font-semibold">
          <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-[11px] font-bold">
            {initials}
          </div>
          <span className="text-[12px]">{username || '...'}</span>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="flex items-center gap-1 px-2 py-1 text-gray-300 hover:text-red-400 hover:bg-gray-700/30 rounded transition-all text-[12px]"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
