'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Globe } from 'lucide-react';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  mocked?: boolean;
}

const NAV_ITEMS: SidebarItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Hosted zones', href: '/zones', icon: Globe },
];


export default function AwsSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="w-[220px] bg-white border-r border-[#eaeded] fixed top-[48px] bottom-0 left-0 z-40 flex flex-col overflow-y-auto">
      <div className="py-3 flex-1">
        <p className="px-4 mb-2 text-[11px] font-bold uppercase tracking-widest text-gray-400">
          Route 53
        </p>

        <nav className="flex flex-col">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-4 py-2 text-[13px] border-l-[3px] transition-colors ${
                  active
                    ? 'border-[#ec7211] text-[#ec7211] font-semibold bg-orange-50/40'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#ec7211]' : 'text-gray-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-[#eaeded] text-[10px] text-gray-400">
        <p className="font-medium">Route 53 Clone v1.0</p>
        <p>FastAPI · SQLite · Next.js</p>
      </div>
    </aside>
  );
}
