import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Package, Tag, Loader2, X, Check, TrendingUp, ShoppingBag } from 'lucide-react'
import { productApi, categoryApi, inventoryApi, orderApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  category: string
  categoryId?: number
  sellerEmail?: string
}

interface Category {
  id: number
  name: string
}

interface SaleRecord {
  orderId: number
  orderDate: string
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
  orderStatus: string
}

interface SellerSalesResponse {
  totalRevenue: number
  totalOrders: number
  sales: SaleRecord[]
}

const emptyForm = { name: '', description: '', price: '', stock: '', categoryId: '' }

export default function SellerDashboard() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [sales, setSales] = useState<SellerSalesResponse | null>(null)
  const [tab, setTab] = useState<'products' | 'sales' | 'categories'>('products')
  const [loading, setLoading] = useState(true)
  const [salesLoading, setSalesLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [catForm, setCatForm] = useState('')
  const [editingCatId, setEditingCatId] = useState<number | null>(null)
  const [savingCat, setSavingCat] = useState(false)

  const refresh = async () => {
    try {
      const [pRes, cRes] = await Promise.all([productApi.mine(), categoryApi.list()])
      setProducts(pRes.data)
      setCategories(cRes.data)
    } catch {}
  }

  const loadSales = async () => {
    try {
      setSalesLoading(true)
      const res = await orderApi.mySales()
      setSales(res.data as SellerSalesResponse)
    } catch {
      toast.error('Failed to load sales data')
    } finally {
      setSalesLoading(false)
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (tab === 'sales' && !sales) loadSales()
  }, [tab])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      categoryId: String(categories.find(c => c.name === p.category)?.id ?? ''),
    })
    setShowForm(true)
  }

  const handleSaveProduct = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return }
    try {
      setSaving(true)
      const data = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      }
      if (editingId) {
        await productApi.update(editingId, data)
        toast.success('Product updated!')
      } else {
        await productApi.create(data)
        toast.success('Product created!')
      }
      setShowForm(false)
      await refresh()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try {
      await productApi.delete(id)
      toast.success('Product deleted')
      await refresh()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleSetInventory = async (productId: number, qty: number) => {
    try {
      await inventoryApi.set(productId, qty)
      toast.success('Inventory updated!')
      await refresh()
    } catch {
      toast.error('Failed to update inventory')
    }
  }

  const handleSaveCategory = async () => {
    if (!catForm.trim()) return
    try {
      setSavingCat(true)
      if (editingCatId) {
        await categoryApi.update(editingCatId, { name: catForm })
        toast.success('Category updated!')
      } else {
        await categoryApi.create({ name: catForm })
        toast.success('Category created!')
      }
      setCatForm('')
      setEditingCatId(null)
      await refresh()
    } catch {
      toast.error('Failed to save category')
    } finally {
      setSavingCat(false)
    }
  }

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return
    try {
      await categoryApi.delete(id)
      toast.success('Category deleted')
      await refresh()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  if (!user || user.role !== 'SELLER') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <p className="text-stone-500">Access denied — Sellers only.</p>
      </div>
    )
  }

  const statusColor = (s: string) => {
    if (s === 'PAID') return 'bg-emerald-100 text-emerald-700'
    if (s === 'PENDING') return 'bg-amber-100 text-amber-700'
    if (s === 'CONFIRMED') return 'bg-blue-100 text-blue-700'
    return 'bg-stone-100 text-stone-600'
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-stone-900">Seller Dashboard</h1>
            <p className="text-stone-500 text-sm mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-sm font-semibold">
            <Package size={14} />
            SELLER
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'My Products', value: products.length, color: 'bg-orange-500' },
            { label: 'In Stock', value: products.filter(p => p.stock > 0).length, color: 'bg-emerald-500' },
            { label: 'Out of Stock', value: products.filter(p => p.stock === 0).length, color: 'bg-red-500' },
            { label: 'Total Revenue', value: sales ? `৳${sales.totalRevenue.toLocaleString()}` : '—', color: 'bg-blue-500' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
              <div className={`w-2 h-2 rounded-full ${color} mb-3`} />
              <p className="text-2xl font-extrabold text-stone-900">{value}</p>
              <p className="text-stone-500 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit mb-6">
          {([
            { key: 'products', label: 'Products', icon: Package },
            { key: 'sales', label: 'My Sales', icon: TrendingUp },
            { key: 'categories', label: 'Categories', icon: Tag },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                tab === key ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Icon size={14} className="inline mr-1.5" />{label}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-stone-800">My Products ({products.length})</h2>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>

            {showForm && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-stone-900 text-lg">
                      {editingId ? 'Edit Product' : 'New Product'}
                    </h3>
                    <button onClick={() => setShowForm(false)} className="p-1 hover:bg-stone-100 rounded-lg">
                      <X size={18} className="text-stone-500" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Product Name *</label>
                      <input
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g. Basmati Rice 5kg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">Price (৳) *</label>
                        <input
                          type="number"
                          value={form.price}
                          onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-600 mb-1">Stock</label>
                        <input
                          type="number"
                          value={form.stock}
                          onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">Category</label>
                      <select
                        value={form.categoryId}
                        onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">— Select Category —</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50">
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProduct}
                      disabled={saving}
                      className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      {editingId ? 'Save Changes' : 'Create Product'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100">
                    <div className="skeleton h-5 w-1/2 mb-2" />
                    <div className="skeleton h-4 w-1/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
                <Package size={40} className="mx-auto text-stone-300 mb-3" />
                <p className="text-stone-500">You haven't listed any products yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Product</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Category</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Price</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Stock</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-stone-900">{p.name}</p>
                          <p className="text-stone-400 text-xs mt-0.5 truncate max-w-xs">{p.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                            {p.category ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-stone-900">৳{p.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            defaultValue={p.stock}
                            onBlur={e => {
                              const v = parseInt(e.target.value)
                              if (!isNaN(v) && v !== p.stock) handleSetInventory(p.id, v)
                            }}
                            className="w-20 text-right px-2 py-1 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors">
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
        )}

        {/* Sales Tab */}
        {tab === 'sales' && (
          <div>
            {salesLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
              </div>
            ) : !sales ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-100">
                <TrendingUp size={40} className="mx-auto text-stone-300 mb-3" />
                <button onClick={loadSales} className="text-orange-600 font-semibold text-sm hover:underline">Load sales data</button>
              </div>
            ) : (
              <>
                {/* Revenue stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={16} className="text-emerald-600" />
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Total Revenue</span>
                    </div>
                    <p className="text-3xl font-extrabold text-stone-900">৳{sales.totalRevenue.toLocaleString()}</p>
                    <p className="text-stone-400 text-xs mt-1">from your product sales</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBag size={16} className="text-orange-600" />
                      <span className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Orders</span>
                    </div>
                    <p className="text-3xl font-extrabold text-stone-900">{sales.totalOrders}</p>
                    <p className="text-stone-400 text-xs mt-1">orders containing your products</p>
                  </div>
                </div>

                {/* Sales table */}
                {sales.sales.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl border border-stone-100">
                    <ShoppingBag size={36} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-stone-500 text-sm">No sales yet — share your products!</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-stone-100">
                      <h2 className="font-bold text-stone-900">Sales History ({sales.sales.length} items)</h2>
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-stone-100 bg-stone-50">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Order #</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Product ID</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Qty</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Unit Price</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Earned</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sales.sales.map((s, i) => (
                          <tr key={i} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                            <td className="px-4 py-3 font-mono text-stone-600 text-xs">#{s.orderId}</td>
                            <td className="px-4 py-3 text-stone-500 text-xs">Product #{s.productId}</td>
                            <td className="px-4 py-3 text-right text-stone-700">{s.quantity}</td>
                            <td className="px-4 py-3 text-right text-stone-700">৳{s.unitPrice.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right font-bold text-stone-900">৳{s.lineTotal.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColor(s.orderStatus)}`}>
                                {s.orderStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-stone-400 text-xs">
                              {s.orderDate ? String(s.orderDate).substring(0, 10) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {tab === 'categories' && (
          <div>
            <h2 className="font-bold text-stone-800 mb-4">Categories</h2>
            <div className="bg-white rounded-2xl border border-stone-100 p-4 mb-4 flex gap-3">
              <input
                value={catForm}
                onChange={e => setCatForm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveCategory()}
                placeholder={editingCatId ? 'Edit category name...' : 'New category name...'}
                className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {editingCatId && (
                <button onClick={() => { setCatForm(''); setEditingCatId(null) }} className="px-3 py-2 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50">
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveCategory}
                disabled={!catForm.trim() || savingCat}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {savingCat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {editingCatId ? 'Save' : 'Add'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between hover:border-orange-100 transition-colors">
                  <span className="font-semibold text-stone-800 text-sm">{cat.name}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingCatId(cat.id); setCatForm(cat.name) }}
                      className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
