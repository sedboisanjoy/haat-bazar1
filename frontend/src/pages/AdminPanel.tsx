import { useState, useEffect } from 'react'
import { Shield, Download, Trash2, RefreshCw, Clock, CheckCircle, XCircle, Loader2, Database, HardDrive, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { backupApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface BackupRecord {
  id: number
  filename: string
  databases: string
  fileSizeBytes: number | null
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED'
  errorMessage: string | null
  createdAt: string
}

interface ReportData {
  generatedAt: string
  sinceDate: string | null
  // counts
  newCustomerCount: number
  newSellerCount: number
  newAdminCount: number
  newProductCount: number
  newOrderCount: number
  newRevenue: number
  newPaymentCount: number
  newPaymentAmount: number
  // detail lists
  newUsers: { name: string; email: string; role: string; joined_at: string | null }[]
  newProducts: { id: number; product_name: string; price: number; seller_name: string; seller_email: string; category: string; created_at: string | null }[]
  newOrders: { order_id: number; customer_name: string; customer_email: string; product_name: string; seller_name: string; quantity: number; price: number; line_total: number; status: string; created_at: string }[]
  newPayments: { id: number; order_id: number; customer_name: string; customer_email: string; amount: number; method: string; status: string; created_at: string }[]
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function fmtMoney(n: number) {
  return `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function buildPdf(data: ReportData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  type DocWithTable = jsPDF & { lastAutoTable: { finalY: number } }
  let y = 0

  const periodLabel = data.sinceDate
    ? `Period: ${data.sinceDate}  to  ${data.generatedAt}`
    : `Period: All time  to  ${data.generatedAt}`

  // ── Header bar
  doc.setFillColor(194, 65, 12)
  doc.rect(0, 0, pageW, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text('HaatBazar -- Activity Report', 14, 13)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(periodLabel, 14, 22)
  doc.text(`Generated: ${data.generatedAt}`, 14, 27)
  y = 38

  // ── Helpers
  const section = (title: string) => {
    if (y > 260) { doc.addPage(); y = 14 }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(28, 25, 23)
    doc.text(title, 14, y)
    doc.setDrawColor(234, 88, 12); doc.setLineWidth(0.5)
    doc.line(14, y + 1.5, pageW - 14, y + 1.5)
    y += 7; doc.setTextColor(28, 25, 23); doc.setFont('helvetica', 'normal')
  }
  const noData = (msg: string) => {
    doc.setFontSize(9); doc.setFont('helvetica', 'italic'); doc.setTextColor(120, 113, 108)
    doc.text(msg, 14, y); doc.setTextColor(28, 25, 23); doc.setFont('helvetica', 'normal'); y += 8
  }
  const tableEnd = () => { y = (doc as DocWithTable).lastAutoTable.finalY + 8 }
  const fmtDate = (d: string | null) => d ? String(d).substring(0, 16).replace('T', ' ') : '---'
  const HS = { fillColor: [194, 65, 12] as [number,number,number], textColor: 255 as number, fontStyle: 'bold' as const }
  const ALT = { fillColor: [254, 242, 232] as [number,number,number] }
  const SM = { left: 14, right: 14 }

  // ── Summary
  section('Summary')
  const summaryLeft = [
    ['New Customers', String(data.newCustomerCount)],
    ['New Sellers',   String(data.newSellerCount)],
    ['New Admins',    String(data.newAdminCount)],
  ]
  const summaryRight = [
    ['New Products', String(data.newProductCount)],
    ['New Orders',   String(data.newOrderCount)],
    ['Revenue',      fmtMoney(data.newRevenue)],
  ]
  doc.setFontSize(9)
  summaryLeft.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.text(k + ':', 14, y + i * 6)
    doc.setFont('helvetica', 'normal'); doc.text(v, 58, y + i * 6)
  })
  summaryRight.forEach(([k, v], i) => {
    doc.setFont('helvetica', 'bold'); doc.text(k + ':', pageW / 2 + 4, y + i * 6)
    doc.setFont('helvetica', 'normal'); doc.text(v, pageW / 2 + 36, y + i * 6)
  })
  y += summaryLeft.length * 6 + 4

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold'); doc.text('Successful Payments:', 14, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.newPaymentCount} transactions -- ${fmtMoney(data.newPaymentAmount)}`, 60, y)
  y += 10

  // ── Users Joined
  section('Users Joined')
  if (!data.newUsers?.length) {
    noData('No new users in this period.')
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Name', 'Email', 'Role', 'Joined']],
      body: data.newUsers.map(r => [r.name ?? '---', r.email, r.role, fmtDate(r.joined_at)]),
      styles: { fontSize: 9, cellPadding: 2.5 }, headStyles: HS, alternateRowStyles: ALT, margin: SM,
    })
    tableEnd()
  }

  // ── Products Added
  section('Products Added')
  if (!data.newProducts?.length) {
    noData('No new products in this period.')
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Product', 'Seller', 'Category', 'Price', 'Added']],
      body: data.newProducts.map(r => [
        r.product_name,
        r.seller_name ?? r.seller_email ?? 'Unassigned',
        r.category ?? '---',
        fmtMoney(r.price),
        fmtDate(r.created_at),
      ]),
      styles: { fontSize: 8, cellPadding: 2 }, headStyles: HS, alternateRowStyles: ALT, margin: SM,
    })
    tableEnd()
  }

  // ── Orders Placed
  section('Orders Placed')
  if (!data.newOrders?.length) {
    noData('No new orders in this period.')
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Order #', 'Customer', 'Product', 'Seller', 'Qty', 'Total', 'Status', 'Date']],
      body: data.newOrders.map(r => [
        String(r.order_id),
        r.customer_name ?? r.customer_email ?? '---',
        r.product_name ?? '---',
        r.seller_name ?? 'Unassigned',
        String(r.quantity),
        fmtMoney(r.line_total),
        r.status,
        fmtDate(r.created_at),
      ]),
      styles: { fontSize: 7.5, cellPadding: 1.8 }, headStyles: HS, alternateRowStyles: ALT, margin: SM,
    })
    tableEnd()
  }

  // ── Transactions
  section('Transactions')
  if (!data.newPayments?.length) {
    noData('No transactions in this period.')
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Pay #', 'Order #', 'Customer', 'Amount', 'Method', 'Status', 'Date']],
      body: data.newPayments.map(r => [
        String(r.id),
        String(r.order_id),
        r.customer_name ?? r.customer_email ?? '---',
        fmtMoney(r.amount),
        r.method,
        r.status,
        fmtDate(r.created_at),
      ]),
      styles: { fontSize: 8, cellPadding: 2 }, headStyles: HS, alternateRowStyles: ALT, margin: SM,
    })
  }

  // ── Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(120, 113, 108)
    doc.text(`HaatBazar Confidential  |  Page ${i} of ${pageCount}`, pageW / 2, 290, { align: 'center' })
  }

  doc.save(`haatbazar-report-${data.generatedAt.replace(/[: ]/g, '-')}.pdf`)
}

export default function AdminPanel() {
  const { user } = useAuth()
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [reporting, setReporting] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [downloadingId, setDownloadingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const fetchBackups = async () => {
    try {
      const res = await backupApi.list()
      setBackups(res.data)
    } catch {
      setBackups([])
    }
  }

  useEffect(() => {
    fetchBackups().finally(() => setLoading(false))
  }, [])

  const handleTrigger = async () => {
    try {
      setTriggering(true)
      const res = await backupApi.trigger()
      if (res.data.status === 'SUCCESS') {
        toast.success('Backup completed successfully!', { icon: '💾' })
      } else {
        toast.error(`Backup failed: ${res.data.errorMessage ?? 'unknown error'}`)
      }
      await fetchBackups()
    } catch {
      toast.error('Failed to trigger backup')
    } finally {
      setTriggering(false)
    }
  }

  const handleReport = async () => {
    try {
      setReporting(true)
      const res = await backupApi.report()
      buildPdf(res.data as ReportData)
      toast.success('Report downloaded!', { icon: '📄' })
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setReporting(false)
    }
  }

  const handleDownload = async (backup: BackupRecord) => {
    if (backup.status !== 'SUCCESS') {
      toast.error('Cannot download a failed backup')
      return
    }
    try {
      setDownloadingId(backup.id)
      const res = await backupApi.download(backup.id)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = backup.filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch {
      toast.error('Download failed')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (backup: BackupRecord) => {
    if (!confirm(`Delete backup "${backup.filename}"?`)) return
    try {
      setDeletingId(backup.id)
      await backupApi.delete(backup.id)
      toast.success('Backup deleted')
      await fetchBackups()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-stone-300 mb-4" />
          <p className="text-stone-500 font-medium">Admin access required</p>
        </div>
      </div>
    )
  }

  const successCount = backups.filter(b => b.status === 'SUCCESS').length
  const failedCount = backups.filter(b => b.status === 'FAILED').length
  const totalSize = backups.reduce((sum, b) => sum + (b.fileSizeBytes ?? 0), 0)

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-red-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-stone-900">Admin Panel</h1>
            </div>
            <p className="text-stone-500 text-sm">Database backup management & activity reports</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchBackups}
              className="p-2 hover:bg-stone-200 bg-stone-100 rounded-xl transition-colors"
              title="Refresh backup list"
            >
              <RefreshCw size={16} className="text-stone-600" />
            </button>
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              {triggering ? (
                <><Loader2 size={16} className="animate-spin" /> Running...</>
              ) : (
                <><Database size={16} /> Run Backup Now</>
              )}
            </button>
            <button
              onClick={handleReport}
              disabled={reporting}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-70 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              {reporting ? (
                <><Loader2 size={16} className="animate-spin" /> Generating...</>
              ) : (
                <><FileText size={16} /> Download Report</>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Backups', value: backups.length, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Successful', value: successCount, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Failed', value: failedCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Total Size', value: formatBytes(totalSize), icon: HardDrive, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-2xl font-extrabold text-stone-900">{value}</p>
              <p className="text-stone-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Info banners */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <Clock size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-900">Auto-scheduled backup</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Runs <strong>every hour</strong> automatically. Covers: auth_db, product_db, order_db, payment_db.
                Files saved as <code className="bg-blue-100 px-1 rounded">backup_yyyyMMdd_HHmmss.sql.gz</code>.
              </p>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-start gap-3">
            <FileText size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-900">Activity Report</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Click <strong>Download Report</strong> to get a PDF with orders placed, payments made,
                products added, user registrations and more — current snapshot.
              </p>
            </div>
          </div>
        </div>

        {/* Backup list */}
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-bold text-stone-900">Backup History</h2>
            <span className="text-sm text-stone-400">{backups.length} records</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-16">
              <Database size={40} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-500 text-sm">No backups yet — first one runs at the next hour mark.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {backups.map(backup => (
                <div key={backup.id} className="px-5 py-4 flex items-center gap-4 hover:bg-stone-50 transition-colors">
                  <div className="flex-shrink-0">
                    {backup.status === 'SUCCESS' && <CheckCircle size={20} className="text-emerald-500" />}
                    {backup.status === 'FAILED' && <XCircle size={20} className="text-red-500" />}
                    {backup.status === 'IN_PROGRESS' && <Loader2 size={20} className="text-amber-500 animate-spin" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 text-sm truncate">{backup.filename}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-stone-400 text-xs">
                        {new Date(backup.createdAt).toLocaleString('en-BD', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                      <span className="text-stone-300 text-xs">•</span>
                      <span className="text-stone-400 text-xs">{formatBytes(backup.fileSizeBytes)}</span>
                    </div>
                    {backup.errorMessage && (
                      <p className="text-red-500 text-xs mt-1 truncate">{backup.errorMessage}</p>
                    )}
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    backup.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                    backup.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {backup.status}
                  </span>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(backup)}
                      disabled={backup.status !== 'SUCCESS' || downloadingId === backup.id}
                      className="p-2 hover:bg-blue-50 text-blue-500 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Download SQL backup"
                    >
                      {downloadingId === backup.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(backup)}
                      disabled={deletingId === backup.id}
                      className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-colors disabled:opacity-50"
                      title="Delete backup"
                    >
                      {deletingId === backup.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
