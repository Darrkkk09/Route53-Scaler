'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Globe, ArrowRight, Database, RefreshCw, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const { data: zones, isLoading, isError } = useQuery({
    queryKey: ['hostedZones'],
    queryFn: () => api.listHostedZones(),
  });

  const publicZones = zones?.filter((z) => !z.private_zone).length ?? 0;
  const privateZones = zones?.filter((z) => z.private_zone).length ?? 0;

  return (
    <div className="space-y-5">
      {/* Page title */}
      <div className="border-b border-gray-300 pb-4">
        <h1 className="text-[20px] font-bold text-gray-900">Route 53 dashboard</h1>
        <p className="text-[12px] text-gray-500 mt-0.5">
          Highly available and scalable Domain Name System (DNS) web service.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total hosted zones */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Total hosted zones
              </p>
              <p className="text-[28px] font-bold text-gray-900 mt-1 leading-none">
                {isLoading ? (
                  <span className="text-[18px] text-gray-400 animate-pulse">Loading…</span>
                ) : isError ? (
                  <span className="text-red-500 text-[16px]">Error</span>
                ) : (
                  zones?.length ?? 0
                )}
              </p>
            </div>
            <div className="w-9 h-9 bg-blue-50 text-[#0073bb] rounded flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <Link
            href="/zones"
            className="inline-flex items-center gap-1 mt-3 text-[#0073bb] hover:underline text-[12px] font-semibold"
          >
            View hosted zones <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Public zones */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Public zones
              </p>
              <p className="text-[28px] font-bold text-gray-900 mt-1 leading-none">
                {isLoading ? <span className="text-gray-400 text-[18px] animate-pulse">…</span> : publicZones}
              </p>
            </div>
            <div className="w-9 h-9 bg-green-50 text-green-600 rounded flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">Publicly resolvable DNS zones</p>
        </div>

        {/* Private zones */}
        <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Private zones
              </p>
              <p className="text-[28px] font-bold text-gray-900 mt-1 leading-none">
                {isLoading ? <span className="text-gray-400 text-[18px] animate-pulse">…</span> : privateZones}
              </p>
            </div>
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">VPC-restricted DNS zones</p>
        </div>
      </div>

      {/* Backend connectivity status */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-4">
        <h2 className="text-[13px] font-bold text-gray-800 mb-3">System status</h2>
        <div className="flex items-center gap-2 text-[12px]">
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
              <span className="text-gray-500">Connecting to backend API…</span>
            </>
          ) : isError ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-600 font-medium">
                Backend API unreachable — make sure the FastAPI server is running on port 8000.
              </span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="text-green-700 font-medium">Backend API connected — FastAPI on port 8000</span>
            </>
          )}
        </div>
      </div>

      {/* Recent zones quick view */}
      {!isLoading && !isError && zones && zones.length > 0 && (
        <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[#eaeded] flex items-center justify-between">
            <h2 className="text-[13px] font-bold text-gray-800">Recent hosted zones</h2>
            <Link href="/zones" className="text-[#0073bb] hover:underline text-[12px] font-semibold">
              View all
            </Link>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-gray-50 border-b border-[#eaeded] text-gray-500 uppercase text-[10px] tracking-wider">
                <th className="px-4 py-2 text-left font-semibold">Domain name</th>
                <th className="px-4 py-2 text-left font-semibold">Type</th>
                <th className="px-4 py-2 text-left font-semibold">Description</th>
              </tr>
            </thead>
            <tbody>
              {zones.slice(0, 5).map((zone) => (
                <tr key={zone.id} className="border-b border-[#eaeded] last:border-b-0 hover:bg-gray-50/60 transition-colors">
                  <td className="px-4 py-2.5">
                    <Link href={`/zones/${zone.id}`} className="text-[#0073bb] font-semibold hover:underline font-mono">
                      {zone.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      zone.private_zone
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {zone.private_zone ? 'Private' : 'Public'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{zone.comment || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
