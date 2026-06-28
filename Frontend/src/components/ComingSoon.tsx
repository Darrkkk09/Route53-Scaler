'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="space-y-4">
      <div className="border-b border-gray-300 pb-4">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="bg-white border border-[#eaeded] rounded shadow-sm">
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            {icon}
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-700">This feature is not implemented</h2>
            <p className="text-[13px] text-gray-500 mt-1 max-w-md">{description}</p>
          </div>
          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-[11px] font-semibold rounded-full uppercase tracking-wider">
            Coming Soon
          </div>
          <Link
            href="/"
            className="flex items-center gap-1 text-[#0073bb] hover:underline text-[12px] font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
