import { useState } from 'react'
import {
  CheckCircle, XCircle, MapPin, Car, User, Calendar,
  FileText, AlertTriangle, UploadCloud, Loader2, AlertCircle,
  Download, ExternalLink, Shield, Clock, ChevronDown, ChevronUp
} from 'lucide-react'
import Modal from './Modal'
import { api } from '../api'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface DriverDetailModalProps {
  driver: any | null
  onClose: () => void
  onVerify?: (id: string) => void
  onDecline?: (id: string, note: string) => void
}

const statusConfig = {
  VERIFIED: {
    label: 'Verified', icon: CheckCircle,
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700',
    dot: 'bg-emerald-400'
  },
  PENDING: {
    label: 'Pending Review', icon: Clock,
    gradient: 'from-amber-400 to-orange-500',
    bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700',
    dot: 'bg-amber-400'
  },
  DECLINED: {
    label: 'Declined', icon: XCircle,
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-red-50 border-red-200', text: 'text-red-700',
    dot: 'bg-red-400'
  },
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="font-semibold text-slate-800 text-sm truncate">{value || '—'}</p>
      </div>
    </div>
  )
}

async function downloadViaProxy(fileUrl: string, docName: string) {
  if (!fileUrl) throw new Error('No valid URL provided for download.')
  const ext = fileUrl.split('.').pop()?.split('?')[0] || 'bin'
  const safeName = `${docName.replace(/[^a-zA-Z0-9 \-_]/g, '')}.${ext}`
  const proxyUrl = `${API}/upload/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(safeName)}`

  const res = await fetch(proxyUrl, {
    credentials: 'include'
  })
  if (!res.ok) throw new Error('Download failed')

  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = safeName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function DriverDetailModal({ driver, onClose, onVerify, onDecline }: DriverDetailModalProps) {
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineNote, setDeclineNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [localDocUrl, setLocalDocUrl] = useState<string | null>(null)
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null)

  if (driver && localDocUrl && driver.document_url !== localDocUrl && !uploading) {
    setLocalDocUrl(null)
  }

  function handleDecline() {
    if (onDecline && driver) {
      onDecline(driver.id, declineNote)
      setShowDeclineForm(false)
      setDeclineNote('')
    }
  }

  async function handleDownload(url: string, name: string) {
    setDownloading(url)
    try {
      await downloadViaProxy(url, name)
    } catch (e: any) {
      alert(`Download failed: ${e.message}`)
    } finally {
      setDownloading(null)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0 || !driver) return
    const file = e.target.files[0]
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${driver.id}-${Date.now()}.${ext}`

      const presignedData = await api.post('/upload/document/presigned', { filename: fileName })
      if (!presignedData.signedUrl) throw new Error('Failed to get upload URL')

      const uploadRes = await fetch(presignedData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })
      if (!uploadRes.ok) throw new Error('Failed to upload file')

      const docUrl = presignedData.publicUrl
      await api.patch(`/drivers/${driver.id}/admin-document`, { document_url: docUrl })

      setLocalDocUrl(docUrl)
      alert('Document uploaded!')
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  if (!driver) return null

  const status = driver.status || 'PENDING'
  const sc = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
  const StatusIcon = sc.icon
  const allDocs: any[] = driver.documents?.length > 0
    ? driver.documents
    : localDocUrl || driver.document_url
      ? [{ url: localDocUrl || driver.document_url, type_id: 'Document' }]
      : []

  return (
    <Modal
      isOpen={!!driver}
      onClose={() => { setShowDeclineForm(false); setDeclineNote(''); onClose() }}
      title=""
    >
      <div className="space-y-4 -mt-2">

        {/* ── HEADER HERO ── */}
        <div className={`relative rounded-2xl p-5 overflow-hidden bg-gradient-to-br ${sc.gradient}`}>
          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Driver Profile</p>
                <h2 className="text-white font-black text-2xl leading-tight">{driver.full_name}</h2>
                <p className="text-white/70 text-sm font-semibold mt-0.5">{driver.phone}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <StatusIcon className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-[9px] font-black uppercase tracking-widest opacity-80">{sc.label}</span>
              </div>
            </div>

            {status === 'DECLINED' && driver.admin_note && (
              <div className="mt-3 bg-white/15 rounded-xl p-3">
                <p className="text-white/80 text-xs font-semibold italic">"{driver.admin_note}"</p>
              </div>
            )}
          </div>
        </div>

        {/* ── APPEAL BANNER ── */}
        {driver.appealed && (
          <div className="flex gap-3 items-start p-4 rounded-xl bg-purple-50 border border-purple-200">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-purple-600 mb-1">Account Appeal Submitted</p>
              <p className="text-sm text-purple-900 leading-relaxed">"{driver.appeal_reason}"</p>
            </div>
          </div>
        )}

        {/* ── VEHICLE INFO ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Vehicle</p>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 text-lg leading-tight">{driver.license_plate}</p>
              <p className="text-slate-500 text-sm font-semibold mt-0.5 truncate">{driver.car_model || '—'}</p>
            </div>
            {driver.vehicle_category && (
              <span className={`shrink-0 text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                driver.vehicle_category === 'LATEST_OR_EV'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {driver.vehicle_category === 'LATEST_OR_EV' ? '⚡ Latest / EV' : 'Older Model'}
              </span>
            )}
          </div>
        </div>

        {/* ── DETAILS GRID ── */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Details</p>
          <div className="grid grid-cols-2 gap-2">
            <InfoRow icon={MapPin} label="Location" value={driver.location || 'Unknown'} />
            <InfoRow icon={Calendar} label="Registered" value={new Date(driver.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} />
            <InfoRow icon={User} label="Agent" value={driver.agent?.full_name || `@${driver.agent?.telegram_username}` || '—'} />
            <InfoRow icon={Shield} label="Status" value={sc.label} />
          </div>
        </div>

        {/* ── DOCUMENTS ── */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Documents ({allDocs.length})
            </p>
            <label className={`flex items-center gap-1.5 text-xs font-bold text-blue-600 cursor-pointer hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 hover:bg-blue-100 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : 'Add Doc'}
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          {allDocs.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-semibold">No documents attached</p>
              <p className="text-slate-300 text-xs mt-1">Use "Add Doc" above to upload</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allDocs.map((doc: any, i: number) => {
                const docUrl = typeof doc === 'string' ? doc : (doc?.url || doc?.document_url || doc?.file_url || doc?.fileUrl || '')
                const isImage = docUrl && /\.(jpe?g|png|gif|webp|heic)$/i.test(docUrl.split('?')[0])
                const isPDF = docUrl && /\.pdf$/i.test(docUrl.split('?')[0])
                const isExpanded = expandedDoc === i
                const isDown = downloading === docUrl
                const docName = (typeof doc === 'object' && doc?.type_id) ? doc.type_id : `Document ${i + 1}`

                return (
                  <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                    {/* Image preview */}
                    {isImage && isExpanded && (
                      <div className="relative bg-slate-100 border-b border-slate-100">
                        <img
                          src={docUrl}
                          alt={docName}
                          className="w-full max-h-64 object-contain block"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Doc row */}
                    <div className="flex items-center gap-3 p-3">
                      {/* Type icon */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        isImage ? 'bg-blue-50' : isPDF ? 'bg-red-50' : 'bg-slate-50'
                      }`}>
                        {isImage
                          ? <span className="text-lg">🖼️</span>
                          : isPDF
                          ? <span className="text-lg">📄</span>
                          : <FileText className="w-5 h-5 text-slate-400" />
                        }
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">{docName}</p>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">
                          {isImage ? 'Image' : isPDF ? 'PDF' : 'File'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Expand/collapse for images */}
                        {isImage && (
                          <button
                            onClick={() => setExpandedDoc(isExpanded ? null : i)}
                            className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            title={isExpanded ? 'Collapse' : 'Preview'}
                          >
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-slate-500" />
                              : <ChevronDown className="w-4 h-4 text-slate-500" />
                            }
                          </button>
                        )}

                        {/* Open in tab */}
                        <a
                          href={docUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                          title="Open in new tab"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </a>

                        {/* Download via proxy */}
                        <button
                          onClick={() => handleDownload(docUrl, docName)}
                          disabled={isDown || !docUrl}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60"
                          title="Download file"
                        >
                          {isDown
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />
                          }
                          {isDown ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── VERIFICATION ACTIONS ── */}
        {status !== 'VERIFIED' && !showDeclineForm && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Actions</p>
            <button
              onClick={() => onVerify?.(driver.id)}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] active:scale-[0.98]"
            >
              <CheckCircle className="w-4 h-4" />
              Verify Driver
            </button>
            {status !== 'DECLINED' && (
              <button
                onClick={() => setShowDeclineForm(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 active:scale-[0.98]"
              >
                <XCircle className="w-4 h-4" />
                Decline — Not Found
              </button>
            )}
          </div>
        )}

        {status === 'VERIFIED' && !showDeclineForm && (
          <button
            onClick={() => setShowDeclineForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-red-500 hover:bg-red-50 border border-red-200 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" /> Revoke Verification
          </button>
        )}

        {/* ── DECLINE FORM ── */}
        {showDeclineForm && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              {status === 'VERIFIED' ? 'Revoke Reason' : 'Decline Reason'}
            </p>
            <textarea
              value={declineNote}
              onChange={e => setDeclineNote(e.target.value)}
              placeholder="e.g. Driver not found in Peace Ride platform…"
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-red-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleDecline}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors text-sm"
              >
                Confirm
              </button>
              <button
                onClick={() => { setShowDeclineForm(false); setDeclineNote('') }}
                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
