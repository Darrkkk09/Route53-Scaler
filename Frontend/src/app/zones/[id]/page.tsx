'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, DNSRecord, DNSRecordCreateInput, ApiError } from '@/lib/api';
import Link from 'next/link';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle,
  RefreshCw, CheckCircle, ArrowLeft, Info,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'];
const PAGE_SIZES = [10, 25, 50];

export default function ZoneRecordsPage({ params }: PageProps) {
  const queryClient = useQueryClient();
  const { id: rawId } = React.use(params);
  const zoneId = parseInt(rawId, 10);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<DNSRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<DNSRecord | null>(null);

  // Create form
  const [newPrefix, setNewPrefix] = useState('');
  const [newType, setNewType] = useState('A');
  const [newTtl, setNewTtl] = useState(300);
  const [newValue, setNewValue] = useState('');

  // Edit form
  const [editTtl, setEditTtl] = useState(300);
  const [editValue, setEditValue] = useState('');

  // Banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const notify = (type: 'success' | 'error', msg: string) => {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), 5000);
  };

  // Zone query
  const { data: zone, isLoading: zoneLoading, isError: zoneError } = useQuery({
    queryKey: ['hostedZone', zoneId],
    queryFn: () => api.getHostedZone(zoneId),
  });

  // Records query
  const { data: records = [], isLoading: recLoading, isError: recError, refetch } = useQuery({
    queryKey: ['dnsRecords', zoneId],
    queryFn: () => api.listDNSRecords(zoneId),
  });

  // Filtered records
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchName = r.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchType = typeFilter === 'ALL' || r.type === typeFilter;
      return matchName && matchType;
    });
  }, [records, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedRecords = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleTypeChange = (v: string) => { setTypeFilter(v); setPage(1); };

  // Mutations
  const createMut = useMutation({
    mutationFn: (input: DNSRecordCreateInput) => api.createDNSRecord(zoneId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnsRecords', zoneId] });
      setCreateOpen(false);
      setNewPrefix(''); setNewType('A'); setNewTtl(300); setNewValue('');
      notify('success', 'Record created successfully.');
    },
    onError: (e) => notify('error', (e as ApiError).detail || 'Failed to create record.'),
  });

  const editMut = useMutation({
    mutationFn: ({ recordId, ttl, value }: { recordId: number; ttl: number; value: string }) =>
      api.updateDNSRecord(zoneId, recordId, { ttl, value }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnsRecords', zoneId] });
      setEditRecord(null);
      notify('success', 'Record updated successfully.');
    },
    onError: (e) => notify('error', (e as ApiError).detail || 'Failed to update record.'),
  });

  const deleteMut = useMutation({
    mutationFn: (recordId: number) => api.deleteDNSRecord(zoneId, recordId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dnsRecords', zoneId] });
      setDeleteRecord(null);
      notify('success', 'Record deleted.');
    },
    onError: (e) => notify('error', (e as ApiError).detail || 'Failed to delete record.'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zone) return;
    const prefix = newPrefix.trim().toLowerCase();
    let finalName: string;
    if (prefix === '') {
      finalName = zone.name;
    } else {
      finalName = prefix.endsWith('.') ? `${prefix}${zone.name}` : `${prefix}.${zone.name}`;
    }
    createMut.mutate({ name: finalName, type: newType, ttl: Number(newTtl), value: newValue.trim() });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;
    editMut.mutate({ recordId: editRecord.id, ttl: Number(editTtl), value: editValue.trim() });
  };

  // Zone error / loading states
  if (zoneLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <RefreshCw className="w-6 h-6 animate-spin text-[#ec7211]" />
        <span className="text-[12px] text-gray-500">Loading zone details…</span>
      </div>
    );
  }

  if (zoneError || !zone) {
    return (
      <div className="max-w-lg mx-auto mt-10 bg-red-50 border border-red-200 rounded p-6 text-center space-y-3">
        <AlertCircle className="w-7 h-7 text-red-500 mx-auto" />
        <p className="font-bold text-red-700 text-[14px]">Zone not found</p>
        <p className="text-[12px] text-red-600">The requested hosted zone does not exist or the API is unreachable.</p>
        <Link href="/zones" className="inline-flex items-center gap-1 text-[#0073bb] text-[12px] font-semibold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Hosted zones
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Link href="/zones" className="inline-flex items-center gap-1 text-[#0073bb] text-[12px] font-semibold hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" /> Hosted zones
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-300 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[20px] font-bold text-gray-900 font-mono">{zone.name}</h1>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              zone.private_zone
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {zone.private_zone ? 'Private' : 'Public'}
            </span>
          </div>
          <p className="text-[12px] text-gray-500 mt-0.5">
            ID: <span className="font-mono font-semibold bg-gray-100 px-1 rounded text-gray-700 text-[11px]">
              Z{zone.id.toString().padStart(8, '0')}
            </span>
            {zone.comment && <span className="ml-3">{zone.comment}</span>}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-[#ec7211] hover:bg-[#dd6200] text-white text-[12px] font-semibold px-3 py-1.5 rounded shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create record
        </button>
      </div>

      {/* Banner */}
      {banner && (
        <div className={`flex items-start gap-2.5 p-3 rounded border text-[12px] ${
          banner.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {banner.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            : <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />}
          <span>{banner.msg}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center h-[30px] border border-gray-300 rounded px-2 gap-1.5 bg-white focus-within:border-[#0073bb] w-[260px]">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by record name"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="text-[12px] outline-none w-full placeholder-gray-400 bg-transparent"
          />
          {search && (
            <button onClick={() => handleSearchChange('')} className="text-gray-400 hover:text-gray-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-gray-500 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="h-[30px] border border-gray-300 rounded px-1.5 bg-white text-[12px] outline-none focus:border-[#0073bb]"
          >
            <option value="ALL">All types</option>
            {RECORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex-1" />

        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 h-[30px] px-2.5 border border-gray-300 rounded text-[12px] text-gray-600 hover:bg-gray-50 bg-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Records table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-[#eaeded] text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left font-semibold">Record name</th>
              <th className="px-4 py-2.5 text-left font-semibold">Type</th>
              <th className="px-4 py-2.5 text-left font-semibold">TTL (s)</th>
              <th className="px-4 py-2.5 text-left font-semibold">Value / Route traffic to</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {recLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#ec7211]" />
                    <span>Loading records…</span>
                  </div>
                </td>
              </tr>
            ) : recError ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <p className="text-red-600 text-[12px] font-medium">Failed to load DNS records.</p>
                </td>
              </tr>
            ) : paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-[12px]">
                  {filtered.length === 0 && records.length > 0
                    ? 'No records match your filters.'
                    : 'No records yet. Click "Create record" to add the first one.'}
                </td>
              </tr>
            ) : (
              paginatedRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-[#eaeded] last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800 select-all">{record.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {record.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-600">{record.ttl}</td>
                  <td className="px-4 py-2.5 font-mono text-gray-700 break-all max-w-[360px]">{record.value}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Edit"
                        onClick={() => { setEditRecord(record); setEditTtl(record.ttl); setEditValue(record.value); }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteRecord(record)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between text-[12px] text-gray-500">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-gray-300 rounded px-1 py-0.5 text-[12px] outline-none focus:border-[#0073bb]"
            >
              {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span>
              {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)} of {filtered.length}
            </span>
            <button
              disabled={safePage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1 rounded disabled:opacity-30 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 rounded disabled:opacity-30 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {createOpen && (
        <Modal title="Create record" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Record name" hint={`Leave blank for the apex record (${zone.name})`}>
              <div className="flex">
                <input
                  type="text"
                  value={newPrefix}
                  onChange={(e) => setNewPrefix(e.target.value)}
                  placeholder="e.g. www"
                  className="flex-1 h-[30px] border border-gray-300 rounded-l px-2.5 text-[12px] outline-none focus:border-[#0073bb] bg-white"
                />
                <span className="h-[30px] px-2.5 bg-gray-100 border border-l-0 border-gray-300 rounded-r flex items-center font-mono text-[11px] text-gray-500 select-none whitespace-nowrap">
                  .{zone.name}
                </span>
              </div>
            </Field>

            <Field label="Record type">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full h-[30px] border border-gray-300 rounded px-2 text-[12px] outline-none focus:border-[#0073bb] bg-white"
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>

            <Field label="TTL (seconds)">
              <input
                type="number"
                required
                min={1}
                value={newTtl}
                onChange={(e) => setNewTtl(Number(e.target.value))}
                className="w-full h-[30px] border border-gray-300 rounded px-2.5 text-[12px] outline-none focus:border-[#0073bb] bg-white font-mono"
              />
            </Field>

            <Field
              label="Value"
              hint={
                newType === 'A' ? 'e.g. 192.0.2.1' :
                newType === 'AAAA' ? 'e.g. 2001:db8::1' :
                newType === 'CNAME' ? 'e.g. target.example.com.' :
                newType === 'MX' ? 'Priority and mail server, e.g. 10 mail.example.com.' :
                newType === 'TXT' ? 'Wrap text in double quotes, e.g. "v=spf1 include:example.com ~all"' :
                'Enter the record value appropriate for this type'
              }
            >
              <textarea
                required
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-2.5 py-2 text-[12px] outline-none focus:border-[#0073bb] bg-white font-mono resize-none"
              />
            </Field>

            <ModalFooter
              onCancel={() => setCreateOpen(false)}
              submitLabel={createMut.isPending ? 'Creating…' : 'Create record'}
              disabled={createMut.isPending}
            />
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editRecord && (
        <Modal title={`Edit: ${editRecord.name} (${editRecord.type})`} onClose={() => setEditRecord(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="TTL (seconds)">
              <input
                type="number"
                required
                min={1}
                value={editTtl}
                onChange={(e) => setEditTtl(Number(e.target.value))}
                className="w-full h-[30px] border border-gray-300 rounded px-2.5 text-[12px] outline-none focus:border-[#0073bb] bg-white font-mono"
              />
            </Field>
            <Field label="Value">
              <textarea
                required
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded px-2.5 py-2 text-[12px] outline-none focus:border-[#0073bb] bg-white font-mono resize-none"
              />
            </Field>
            <ModalFooter
              onCancel={() => setEditRecord(null)}
              submitLabel={editMut.isPending ? 'Saving…' : 'Save changes'}
              disabled={editMut.isPending}
            />
          </form>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {deleteRecord && (
        <Modal title="Delete record" onClose={() => setDeleteRecord(null)}>
          <div className="space-y-3 text-[12px]">
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded p-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">Confirm deletion</p>
                <p className="text-red-700 mt-0.5">
                  Delete <span className="font-mono font-bold">{deleteRecord.name} ({deleteRecord.type})</span>?
                  This cannot be undone.
                </p>
              </div>
            </div>
            <ModalFooter
              onCancel={() => setDeleteRecord(null)}
              submitLabel={deleteMut.isPending ? 'Deleting…' : 'Delete'}
              disabled={deleteMut.isPending}
              danger
              onSubmit={() => deleteMut.mutate(deleteRecord.id)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Shared modal primitives ──────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-gray-300 shadow-xl w-full max-w-[480px] overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h3 className="font-bold text-[13px] text-gray-800 truncate">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors ml-2 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[12px] font-semibold text-gray-700">{label}</label>
      {children}
      {hint && (
        <p className="flex items-start gap-1 text-[10px] text-gray-400">
          <Info className="w-3 h-3 shrink-0 mt-0.5" /> {hint}
        </p>
      )}
    </div>
  );
}

function ModalFooter({ onCancel, submitLabel, disabled, danger = false, onSubmit }: {
  onCancel: () => void;
  submitLabel: string;
  disabled?: boolean;
  danger?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
      <button type="button" onClick={onCancel} className="text-[12px] font-semibold px-3 py-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition-colors">
        Cancel
      </button>
      <button
        type={onSubmit ? 'button' : 'submit'}
        onClick={onSubmit}
        disabled={disabled}
        className={`text-[12px] font-semibold px-3 py-1.5 rounded shadow-sm text-white disabled:opacity-50 transition-colors ${
          danger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#ec7211] hover:bg-[#dd6200]'
        }`}
      >
        {submitLabel}
      </button>
    </div>
  );
}
