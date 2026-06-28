'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, HostedZone, HostedZoneCreateInput, ApiError } from '@/lib/api';
import Link from 'next/link';
import {
  Search, Plus, Edit2, Trash2, X, AlertCircle,
  RefreshCw, CheckCircle, Info, ChevronLeft, ChevronRight,
} from 'lucide-react';

// Per-row record count fetcher
function RecordCount({ zoneId }: { zoneId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['dnsRecords', zoneId],
    queryFn: () => api.listDNSRecords(zoneId),
    staleTime: 60_000,
  });
  if (isLoading) return <span className="text-gray-300 animate-pulse">—</span>;
  return <>{data?.length ?? 0}</>;
}

const PAGE_SIZES = [10, 25, 50];

export default function HostedZonesPage() {
  const queryClient = useQueryClient();

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [editZone, setEditZone] = useState<HostedZone | null>(null);
  const [deleteZone, setDeleteZone] = useState<HostedZone | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newPrivate, setNewPrivate] = useState(false);

  // Edit form
  const [editComment, setEditComment] = useState('');
  const [editPrivate, setEditPrivate] = useState(false);

  // Notification banner
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const notify = (type: 'success' | 'error', msg: string) => {
    setBanner({ type, msg });
    setTimeout(() => setBanner(null), 5000);
  };

  // Query
  const { data: zones = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['hostedZones'],
    queryFn: () => api.listHostedZones(),
  });

  // Filter + search (client-side)
  const filtered = useMemo(() => {
    return zones.filter((z) => {
      const matchSearch = z.name.toLowerCase().includes(search.toLowerCase().trim());
      const matchType =
        typeFilter === 'ALL' ||
        (typeFilter === 'PUBLIC' && !z.private_zone) ||
        (typeFilter === 'PRIVATE' && z.private_zone);
      return matchSearch && matchType;
    });
  }, [zones, search, typeFilter]);

  // Pagination math
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedZones = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Reset to page 1 when filters change
  const handleSearchChange = (v: string) => { setSearch(v); setPage(1); };
  const handleTypeChange = (v: typeof typeFilter) => { setTypeFilter(v); setPage(1); };

  // Mutations
  const createMut = useMutation({
    mutationFn: (input: HostedZoneCreateInput) => api.createHostedZone(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostedZones'] });
      setCreateOpen(false);
      setNewName(''); setNewComment(''); setNewPrivate(false);
      notify('success', 'Hosted zone created successfully.');
    },
    onError: (e) => notify('error', (e as ApiError).detail || 'Failed to create hosted zone.'),
  });

  const editMut = useMutation({
    mutationFn: ({ id, comment, private_zone }: { id: number; comment: string; private_zone: boolean }) =>
      api.updateHostedZone(id, { comment, private_zone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostedZones'] });
      setEditZone(null);
      notify('success', 'Hosted zone updated successfully.');
    },
    onError: (e) => notify('error', (e as ApiError).detail || 'Failed to update hosted zone.'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.deleteHostedZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostedZones'] });
      setDeleteZone(null);
      notify('success', 'Hosted zone deleted. All associated records were removed.');
    },
    onError: (e) => notify('error', (e as ApiError).detail || 'Failed to delete hosted zone.'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    let name = newName.trim().toLowerCase();
    if (!name.endsWith('.')) name += '.';
    createMut.mutate({ name, comment: newComment.trim() || undefined, private_zone: newPrivate });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editZone) return;
    editMut.mutate({ id: editZone.id, comment: editComment.trim(), private_zone: editPrivate });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-gray-300 pb-4">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Hosted zones</h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            A hosted zone is a container for records that define how to route traffic for a domain.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 bg-[#ec7211] hover:bg-[#dd6200] text-white text-[12px] font-semibold px-3 py-1.5 rounded shadow-sm transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Create hosted zone
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
        {/* Search */}
        <div className="flex items-center h-[30px] border border-gray-300 rounded px-2 gap-1.5 bg-white focus-within:border-[#0073bb] w-[260px]">
          <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by domain name"
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

        {/* Type filter */}
        <div className="flex items-center gap-1.5 text-[12px]">
          <span className="text-gray-500 font-medium">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value as typeof typeFilter)}
            className="h-[30px] border border-gray-300 rounded px-1.5 bg-white text-[12px] outline-none focus:border-[#0073bb]"
          >
            <option value="ALL">All</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
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

      {/* Table */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm overflow-hidden">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-[#eaeded] text-[11px] text-gray-500 uppercase tracking-wider">
              <th className="px-4 py-2.5 text-left font-semibold">Domain name</th>
              <th className="px-4 py-2.5 text-left font-semibold">Hosted zone ID</th>
              <th className="px-4 py-2.5 text-left font-semibold">Type</th>
              <th className="px-4 py-2.5 text-left font-semibold">Record count</th>
              <th className="px-4 py-2.5 text-left font-semibold">Description</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#ec7211]" />
                    <span>Loading hosted zones…</span>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                  <p className="text-red-600 text-[12px] font-medium">
                    Could not reach the backend API. Make sure the FastAPI server is running.
                  </p>
                </td>
              </tr>
            ) : paginatedZones.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-[12px]">
                  {filtered.length === 0 && zones.length > 0
                    ? 'No zones match your search criteria.'
                    : 'No hosted zones yet. Click "Create hosted zone" to get started.'}
                </td>
              </tr>
            ) : (
              paginatedZones.map((zone) => (
                <tr
                  key={zone.id}
                  className="border-b border-[#eaeded] last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-4 py-2.5 font-semibold text-[#0073bb] hover:text-[#005a91]">
                    <Link href={`/zones/${zone.id}`} className="font-mono hover:underline">
                      {zone.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 font-mono select-all">Z{zone.id.toString().padStart(8, '0')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      zone.private_zone
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {zone.private_zone ? 'Private' : 'Public'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">
                    <RecordCount zoneId={zone.id} />
                  </td>
                  <td className="px-4 py-2.5 text-gray-500 max-w-[200px] truncate">{zone.comment || '—'}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="Edit"
                        onClick={() => { setEditZone(zone); setEditComment(zone.comment || ''); setEditPrivate(zone.private_zone); }}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => setDeleteZone(zone)}
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
        <Modal title="Create hosted zone" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Domain name" hint="A trailing dot will be added automatically (e.g. example.com.)">
              <input
                required
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. example.com"
                className={inputCls}
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                placeholder="Optional note about this zone"
                className={`${inputCls} resize-none h-auto py-2`}
              />
            </Field>
            <CheckboxField
              id="new-private"
              label="Private hosted zone"
              checked={newPrivate}
              onChange={setNewPrivate}
              hint="Routes traffic within an Amazon VPC"
            />
            <ModalFooter
              onCancel={() => setCreateOpen(false)}
              submitLabel={createMut.isPending ? 'Creating…' : 'Create hosted zone'}
              disabled={createMut.isPending}
            />
          </form>
        </Modal>
      )}

      {/* ── Edit Modal ── */}
      {editZone && (
        <Modal title={`Edit: ${editZone.name}`} onClose={() => setEditZone(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <Field label="Description">
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={2}
                placeholder="Optional note about this zone"
                className={`${inputCls} resize-none h-auto py-2`}
              />
            </Field>
            <CheckboxField
              id="edit-private"
              label="Private hosted zone"
              checked={editPrivate}
              onChange={setEditPrivate}
              hint="Routes traffic within an Amazon VPC"
            />
            <ModalFooter
              onCancel={() => setEditZone(null)}
              submitLabel={editMut.isPending ? 'Saving…' : 'Save changes'}
              disabled={editMut.isPending}
            />
          </form>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteZone && (
        <Modal title="Delete hosted zone" onClose={() => setDeleteZone(null)}>
          <div className="space-y-3 text-[12px]">
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded p-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-bold text-red-800">This action cannot be undone</p>
                <p className="text-red-700 mt-0.5">
                  Deleting <span className="font-mono font-bold">{deleteZone.name}</span> will permanently remove all DNS records in this zone.
                </p>
              </div>
            </div>
            <ModalFooter
              onCancel={() => setDeleteZone(null)}
              submitLabel={deleteMut.isPending ? 'Deleting…' : 'Delete'}
              disabled={deleteMut.isPending}
              danger
              onSubmit={() => deleteMut.mutate(deleteZone.id)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Reusable modal primitives ────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded border border-gray-300 shadow-xl w-full max-w-[460px] overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center justify-between">
          <h3 className="font-bold text-[13px] text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors">
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
        <p className="flex items-center gap-1 text-[10px] text-gray-400">
          <Info className="w-3 h-3 shrink-0" /> {hint}
        </p>
      )}
    </div>
  );
}

function CheckboxField({ id, label, checked, onChange, hint }: {
  id: string; label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-200 rounded p-3">
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5" />
      <div>
        <label htmlFor={id} className="text-[12px] font-semibold text-gray-700 cursor-pointer">{label}</label>
        {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
      </div>
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

const inputCls = 'w-full h-[30px] border border-gray-300 rounded px-2.5 text-[12px] bg-white outline-none focus:border-[#0073bb] focus:ring-1 focus:ring-[#0073bb] transition-all';
