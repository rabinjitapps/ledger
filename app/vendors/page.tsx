'use client'
import { useState, useEffect } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import PageHeader from '@/components/ui/PageHeader'
import { LoadingPage } from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { Vendor } from '@/types'
import { Plus, Trash2, Edit, Users, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [editVendor, setEditVendor] = useState<Vendor | null | 'new'>('new' as any)
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/vendors')
    if (res.ok) setVendors(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this vendor?')) return
    const res = await fetch('/api/vendors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    if (res.ok) { toast.success('Vendor deleted'); load() }
    else toast.error('Failed to delete')
  }

  const filtered = vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.contact || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppLayout>
      <PageHeader
        title="Vendors"
        subtitle="Manage your vendor/party master"
        actions={
          <button onClick={() => { setEditVendor(null); setShowModal(true) }} className="btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Vendor
          </button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="card py-3">
          <input className="input max-w-xs" placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? <LoadingPage /> : filtered.length === 0 ? (
            <EmptyState icon={<Users size={48} />} title="No vendors" description="Add your first vendor" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['ID','Name','Contact','Address','GST No','PAN','Email','Added'].map(h => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                    <th className="table-th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => (
                    <tr key={v.id} className={`table-row ${i % 2 === 0 ? 'bg-row-odd' : 'bg-row-even'}`}>
                      <td className="table-td text-subtext">{v.id}</td>
                      <td className="table-td font-medium text-text">{v.name}</td>
                      <td className="table-td text-subtext">{v.contact || '—'}</td>
                      <td className="table-td text-subtext max-w-xs truncate">{v.address || '—'}</td>
                      <td className="table-td font-mono text-subtext">{v.gst || '—'}</td>
                      <td className="table-td font-mono text-subtext">{v.pan || '—'}</td>
                      <td className="table-td text-subtext">{v.email || '—'}</td>
                      <td className="table-td text-subtext whitespace-nowrap">{new Date(v.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="table-td text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => { setEditVendor(v); setShowModal(true) }} className="text-subtext hover:text-info transition-colors">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(v.id)} className="text-subtext hover:text-danger transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <VendorModal
          vendor={editVendor as Vendor | null}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </AppLayout>
  )
}

function VendorModal({ vendor, onClose, onSaved }: { vendor: Vendor | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name:    vendor?.name    ?? '',
    contact: vendor?.contact ?? '',
    address: vendor?.address ?? '',
    gst:     vendor?.gst     ?? '',
    email:   vendor?.email   ?? '',
    pan:     vendor?.pan     ?? '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Name required'); return }
    setLoading(true)
    const method = vendor ? 'PUT' : 'POST'
    const body = vendor ? { id: vendor.id, ...form } : form
    const res = await fetch('/api/vendors', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setLoading(false)
    if (res.ok) { toast.success(vendor ? 'Vendor updated' : 'Vendor added'); onSaved() }
    else { const d = await res.json(); toast.error(d.error || 'Failed') }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
          <button onClick={onClose}><X size={20} className="text-subtext" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
          <div><label className="label">Contact</label><input className="input" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} /></div>
          <div><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          <div><label className="label">GST Number</label><input className="input font-mono" value={form.gst} onChange={e => setForm(f => ({ ...f, gst: e.target.value }))} /></div>
          <div><label className="label">PAN</label><input className="input font-mono uppercase" placeholder="ABCDE1234F" value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))} /></div>
          <div><label className="label">Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? 'Saving…' : vendor ? 'Update Vendor' : 'Add Vendor'}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
