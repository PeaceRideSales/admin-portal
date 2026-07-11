import { useState } from 'react'
import { CheckCircle, XCircle, Phone, MapPin, Car, User, Calendar, FileText, AlertTriangle, UploadCloud, Loader2, AlertCircle } from 'lucide-react'
import Modal from './Modal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface DriverDetailModalProps {
  driver: any | null
  onClose: () => void
  onVerify?: (id: string) => void
  onDecline?: (id: string, note: string) => void
}

const statusConfig = {
  VERIFIED: { label: 'Verified',  bg: 'bg-emerald-100 text-emerald-800' },
  PENDING:  { label: 'Pending',   bg: 'bg-amber-100  text-amber-800' },
  DECLINED: { label: 'Declined',  bg: 'bg-red-100    text-red-800' },
}

export default function DriverDetailModal({ driver, onClose, onVerify, onDecline }: DriverDetailModalProps) {
  const [showDeclineForm, setShowDeclineForm] = useState(false)
  const [declineNote, setDeclineNote] = useState('')
  const [uploading, setUploading] = useState(false)
  const [localDocUrl, setLocalDocUrl] = useState<string | null>(null)

  // Reset local state when driver changes
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

  function handleVerify() {
    if (onVerify && driver) onVerify(driver.id)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0 || !driver) return
    const file = e.target.files[0]
    setUploading(true)

    try {
      const token = localStorage.getItem('admin_token')
      const ext = file.name.split('.').pop()
      const fileName = `${driver.id}-${Date.now()}.${ext}`

      // 1. Get presigned URL
      const res = await fetch(`${API}/upload/document/presigned`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: fileName })
      })
      const presignedData = await res.json()
      if (!res.ok) throw new Error(presignedData.message || 'Failed to get upload URL')

      // 2. Upload file directly to Supabase storage
      const uploadRes = await fetch(presignedData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })
      if (!uploadRes.ok) throw new Error('Failed to upload file to storage')

      // 3. Update driver record in backend
      const docUrl = presignedData.publicUrl
      const updateRes = await fetch(`${API}/drivers/${driver.id}/admin-document`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ document_url: docUrl })
      })
      if (!updateRes.ok) throw new Error('Failed to update driver record')
      
      setLocalDocUrl(docUrl)
      alert('Document uploaded successfully!')
    } catch (error: any) {
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const status = driver?.status || 'PENDING'
  const sc = statusConfig[status as keyof typeof statusConfig]
  const currentDocUrl = localDocUrl || driver?.document_url

  return (
    <Modal isOpen={!!driver} onClose={() => { setShowDeclineForm(false); setDeclineNote(''); onClose() }} title={driver?.full_name || 'Driver Details'}>
      {driver && (
        <div className="space-y-5">

          {/* Status banner */}
          <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg ${sc.bg}`}>
            <span className="text-xs font-bold uppercase tracking-wider">{sc.label}</span>
            {status === 'DECLINED' && driver.admin_note && (
              <span className="text-xs italic ml-2 truncate max-w-[180px]">"{driver.admin_note}"</span>
            )}
          </div>

          {driver.appealed && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex flex-col gap-1">
              <div className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Agent Appealed
              </div>
              <p className="text-sm text-purple-900 mt-1 italic">"{driver.appeal_reason}"</p>
            </div>
          )}

          {/* Contact & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-slate-400 flex items-center mb-1"><Phone className="w-3 h-3 mr-1" />Phone</div>
              <div className="font-semibold text-slate-900 text-sm">{driver.phone}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="text-xs text-slate-400 flex items-center mb-1"><MapPin className="w-3 h-3 mr-1" />Location</div>
              <div className="font-semibold text-slate-900 text-sm">{driver.location || 'Unknown'}</div>
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />{driver.license_plate}
              </div>
              <div className="text-sm text-slate-500 mt-1">{driver.car_model}</div>
            </div>
            {driver.vehicle_category && (
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                driver.vehicle_category === 'LATEST_OR_EV' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {driver.vehicle_category === 'LATEST_OR_EV' ? 'Latest / EV' : 'Older Model'}
              </span>
            )}
          </div>

          {/* Meta */}
          <ul className="space-y-2.5">
            <li className="flex items-center text-sm">
              <User className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <span className="text-slate-500 mr-2">Agent:</span>
              <span className="font-semibold text-slate-900">{driver.agent?.full_name || `@${driver.agent?.telegram_username}` || '—'}</span>
            </li>
            <li className="flex items-center text-sm">
              <Calendar className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
              <span className="text-slate-500 mr-2">Registered:</span>
              <span className="font-semibold text-slate-900">{new Date(driver.created_at).toLocaleDateString()}</span>
            </li>
            
            <li className="pt-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Driver Documents</p>
              {driver.documents && driver.documents.length > 0 ? (
                <div className="space-y-3">
                  {driver.documents.map((doc: any, i: number) => {
                    const isImage = doc.url && /\.(jpe?g|png|gif|webp|heic)$/i.test(doc.url)
                    return (
                      <div key={i} className="bg-blue-50 rounded-xl border border-blue-100 overflow-hidden">
                        {isImage && (
                          <a href={doc.url} target="_blank" rel="noreferrer">
                            <img
                              src={doc.url}
                              alt={doc.type_id || 'Document'}
                              className="w-full max-h-48 object-cover block"
                            />
                          </a>
                        )}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 text-blue-500 mr-2 shrink-0" />
                            <span className="font-semibold text-sm text-slate-700 truncate max-w-[140px]">
                              {doc.type_id || 'Document'}
                            </span>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors shrink-0"
                          >
                            ⬇ Download
                          </a>
                        </div>
                      </div>
                    )
                  })}
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 border-dashed">
                    <span className="text-sm text-slate-500 italic">Add additional document</span>
                    <label className="text-xs font-bold text-blue-600 cursor-pointer hover:underline flex items-center bg-blue-50 px-3 py-1.5 rounded-md">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-1" />}
                      {uploading ? 'Uploading...' : 'Upload File'}
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
              ) : currentDocUrl ? (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 text-blue-500 mr-2" />
                    <a href={currentDocUrl} target="_blank" rel="noreferrer" className="font-semibold text-sm text-blue-700 hover:underline">
                      View Download
                    </a>
                  </div>
                  <label className="text-xs font-bold text-blue-600 cursor-pointer hover:underline flex items-center">
                    {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <UploadCloud className="w-3 h-3 mr-1" />}
                    {uploading ? 'Uploading...' : 'Replace'}
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 border-dashed">
                  <span className="text-sm text-slate-500 italic">No document attached</span>
                  <label className="text-xs font-bold text-blue-600 cursor-pointer hover:underline flex items-center bg-blue-50 px-3 py-1.5 rounded-md">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4 mr-1" />}
                    {uploading ? 'Uploading...' : 'Upload File'}
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
              )}
            </li>
          </ul>

          {/* Verification Actions */}
          {status !== 'VERIFIED' && !showDeclineForm && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verification</p>
              <button onClick={handleVerify}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                <CheckCircle className="w-4 h-4" /> Confirm in Real Database
              </button>
              {status !== 'DECLINED' && (
                <button onClick={() => setShowDeclineForm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors">
                  <XCircle className="w-4 h-4" /> Not Found — Decline
                </button>
              )}
            </div>
          )}

          {status === 'VERIFIED' && (
            <div className="pt-3 border-t border-slate-100">
              <button onClick={() => setShowDeclineForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-red-500 hover:bg-red-50 border border-red-200 rounded-lg transition-colors font-medium">
                <AlertTriangle className="w-4 h-4" /> Revoke Verification
              </button>
            </div>
          )}

          {/* Decline form */}
          {showDeclineForm && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Decline Reason (optional)</p>
              <textarea
                value={declineNote}
                onChange={e => setDeclineNote(e.target.value)}
                placeholder="e.g. Driver not found in Peace Ride platform..."
                rows={3}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-2">
                <button onClick={handleDecline}
                  className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm">
                  Confirm Decline
                </button>
                <button onClick={() => { setShowDeclineForm(false); setDeclineNote('') }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
