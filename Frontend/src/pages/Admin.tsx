import type { FormEvent } from "react"
import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router"
import { useAuth } from "../context/AuthContext"
import { sanitizeError, sanitizeMessage, sanitizeCategoryName, sanitizeProductName } from "../utils/sanitize"
import { secureFetch, initializeCsrfProtection } from "../utils/secureFetch"

interface Category {
  catid: number
  name: string
}

interface ProductItem {
  pid: number
  name: string
  price: number
  description: string
  catid: number
  imagePath?: string | null
  category?: Category
}

interface Order {
  oid: number
  uid: number
  status: string
  currency: string
  merchantEmail: string
  totalAmount: number
  digest: string
  salt: string
  stripePaymentIntentId?: string
  createdAt: string
  updatedAt: string
  orderItems: OrderItem[]
  user: {
    uid: number
    username: string
    email: string
  }
}

interface OrderItem {
  oiid: number
  oid: number
  pid: number
  quantity: number
  price: number
  productName: string
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000" 

const Admin = () => {
  const { user, isLoading, token } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<ProductItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      setLoadingOrders(true)
      const res = await secureFetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) {
        throw new Error("Failed to load orders")
      }
      const data = await res.json() as Order[]
      setOrders(data)
    } catch (err) {
      console.error(err)
      setError("Unable to load orders")
    } finally {
      setLoadingOrders(false)
    }
  }, [token])

  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true)
      const res = await secureFetch('/api/categories')
      if (!res.ok) {
        throw new Error("Failed to load categories")
      }
      const data = await res.json() as Category[]
      setCategories(data)
    } catch (err) {
      console.error(err)
      setError("Unable to load categories")
    } finally {
      setLoadingCategories(false)
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true)
      const res = await secureFetch('/api/products')
      if (!res.ok) {
        throw new Error("Failed to load products")
      }
      const data = await res.json() as ProductItem[]
      setProducts(data)
    } catch (err) {
      console.error(err)
      setError("Unable to load products")
    } finally {
      setLoadingProducts(false)
    }
  }, [])

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!isLoading) { // Only check after auth state is loaded
      if (!user || user.role !== "ADMIN") {
        navigate("/products")
        return
      }
    }
  }, [user, navigate, isLoading, loadOrders])

  // Load data only if user is admin and auth is loaded
  useEffect(() => {
    if (!isLoading && user && user.role === "ADMIN") {
      // Initialize CSRF protection first
      initializeCsrfProtection().catch(console.error)
      loadCategories()
      loadProducts()
      loadOrders()
    }
  }, [user, isLoading, loadCategories, loadProducts, loadOrders])

  // Show loading while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  // Don't render admin content if not admin
  if (!user || user.role !== "ADMIN") {
    return null
  }

  const handleRenameCategory = async (category: Category) => {
    const newName = window.prompt("New category name", category.name)
    if (!newName || !newName.trim()) return

    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`${API_BASE}/api/categories/${category.catid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName.trim() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to rename category")
      }

      const updated = await res.json()
      setCategories((prev) => prev.map((c) => (c.catid === updated.catid ? updated : c)))
      setSuccessMessage("Category renamed successfully")
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Failed to rename category"
      setError(message)
    }
  }

  const handleDeleteCategory = async (catid: number) => {
    if (!window.confirm("Delete this category? It must have no products.")) return

    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch(`${API_BASE}/api/categories/${catid}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to delete category")
      }

      setCategories((prev) => prev.filter((c) => c.catid !== catid))
      setSuccessMessage("Category deleted successfully")
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Failed to delete category"
      setError(message)
    }
  }

  const handleProductSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    const pidValue = formData.get("pid") as string | null
    if (pidValue) {
      // don't send pid as body field
      formData.delete("pid")
    }

    // Validate product data
    const catid = formData.get("catid") as string
    const name = formData.get("name") as string
    const price = formData.get("price") as string
    const description = formData.get("description") as string

    if (!catid) {
      setError('Category is required')
      return
    }

    if (!name || !name.trim()) {
      setError('Product name is required')
      return
    }

    if (name.trim().length < 2) {
      setError('Product name must be at least 2 characters long')
      return
    }

    if (name.trim().length > 100) {
      setError('Product name must be less than 100 characters long')
      return
    }

    if (!price) {
      setError('Price is required')
      return
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Price must be a positive number')
      return
    }

    if (priceNum > 99999.99) {
      setError('Price must be less than $100,000')
      return
    }

    if (!description || !description.trim()) {
      setError('Description is required')
      return
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long')
      return
    }

    if (description.trim().length > 1000) {
      setError('Description must be less than 1000 characters long')
      return
    }

    // Check for potentially dangerous characters
    const dangerousChars = /[<>"'&]/
    if (dangerousChars.test(name) || dangerousChars.test(description)) {
      setError('Product name or description contains invalid characters')
      return
    }

    // Sanitize inputs
    formData.set('name', name.trim())
    formData.set('description', description.trim())

    try {
      const endpoint = pidValue ? `/api/products/${pidValue}` : '/api/products'
      const method = pidValue ? "PUT" : "POST"

      // Don't set Content-Type for FormData - let browser set it with boundary
      const res = await secureFetch(endpoint, {
        method,
        body: formData,
        headers: {}, // Remove Content-Type to allow FormData boundary
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error || 'Failed to save product')
      }

      setSuccessMessage(pidValue ? "Product updated successfully" : "Product created successfully")

      if (!pidValue) {
        form.reset()
      }

      setEditingProduct(null)
      loadProducts()
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Failed to create product"
      setError(message)
    }
  }

  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)

    // Use the controlled state value instead of FormData
    const categoryName = newCategoryName

    // Validate category name
    if (!categoryName || !categoryName.trim()) {
      setError('Category name is required')
      return
    }

    if (categoryName.trim().length < 2) {
      setError('Category name must be at least 2 characters long')
      return
    }

    if (categoryName.trim().length > 50) {
      setError('Category name must be less than 50 characters long')
      return
    }

    // Check for potentially dangerous characters
    const dangerousChars = /[<>"'&]/
    if (dangerousChars.test(categoryName)) {
      setError('Category name contains invalid characters')
      return
    }

    try {
      const res = await secureFetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName.trim() }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error || 'Failed to create category')
      }

      setSuccessMessage('Category created successfully')
      setNewCategoryName('')
      loadCategories()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to create category')
    }
  }

  const handleDeleteProduct = async (pid: number) => {
    if (!window.confirm("Delete this product?")) return

    try {
      const res = await fetch(`${API_BASE}/api/products/${pid}`, {
        method: "DELETE",
      })

      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Failed to delete product")
      }

      setProducts((prev) => prev.filter((p) => p.pid !== pid))
    } catch (err: unknown) {
      console.error(err)
      const message = err instanceof Error ? err.message : "Failed to delete product"
      setError(message)
    }
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-labelledby="admin-heading">
      <h1 id="admin-heading" className="text-2xl sm:text-3xl font-bold mb-6">
        Admin Panel
      </h1>

      <p className="text-sm text-gray-600 mb-4">
        Manage categories and products stored in the backend database.
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{sanitizeError(error)}</p>}
      {successMessage && <p className="mb-4 text-sm text-green-600">{sanitizeMessage(successMessage)}</p>}

      {/* Category management */}
      <section className="mb-8 border border-black bg-white rounded-2xl p-4" aria-labelledby="category-heading">
        <h2 id="category-heading" className="text-lg font-semibold mb-3">
          Manage Categories
        </h2>

        <form onSubmit={handleCategorySubmit} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end mb-4">
          <div className="flex-1 w-full">
            <label htmlFor="new-category" className="block text-sm font-medium text-gray-700 mb-1">
              New Category Name
            </label>
            <input
              id="new-category"
              type="text"
              value={newCategoryName}
              onChange={(e) => {
                // Remove potentially dangerous characters
                const sanitized = e.target.value.replace(/[<>"'&]/g, '')
                setNewCategoryName(sanitized)
              }}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. SSD"
              maxLength={50}
              minLength={2}
              required
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-600 text-white text-sm font-medium shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
          >
            Add Category
          </button>
        </form>

        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">Existing categories:</p>
          {categories.length === 0 ? (
            <p className="italic">No categories found.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <li
                  key={cat.catid}
                  className="px-2 py-1 rounded-full border border-gray-300 bg-gray-50 text-gray-700 flex items-center gap-2"
                >
                  <span>
                    {sanitizeCategoryName(cat.name)} <span className="text-[10px] text-gray-400">(id: {cat.catid})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRenameCategory(cat)}
                    className="text-[10px] text-blue-600 hover:text-blue-800"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.catid)}
                    className="text-[10px] text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Product creation */}
      <section className="border border-black bg-white rounded-2xl p-4 mb-8" aria-labelledby="product-form-heading">
        <h2 id="product-form-heading" className="text-lg font-semibold mb-3">
          {editingProduct ? `Edit Product #${editingProduct.pid}` : "Create Product"}
        </h2>

        <form
          key={editingProduct ? editingProduct.pid : "new"}
          onSubmit={handleProductSubmit}
          className="space-y-4"
        >
        {editingProduct && (
          <input type="hidden" name="pid" value={editingProduct.pid} />
        )}
        <div>
          <label htmlFor="catid" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="catid"
            name="catid"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loadingCategories || categories.length === 0}
            defaultValue={editingProduct ? editingProduct.catid : ""}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.catid} value={cat.catid}>
                {sanitizeCategoryName(cat.name)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={editingProduct?.name}
            maxLength={100}
            minLength={2}
            placeholder="Enter product name"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            max="99999.99"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={editingProduct ? String(editingProduct.price) : ""}
            placeholder="0.00"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue={editingProduct?.description}
            maxLength={1000}
            minLength={10}
            placeholder="Enter product description (min 10 characters)"
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Product Image {editingProduct && <span className="text-xs text-gray-500">(leave empty to keep existing)</span>}
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/*"
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-gray-600 text-white text-sm font-medium shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
          >
            {editingProduct ? "Update Product" : "Create Product"}
          </button>
        </div>
        </form>
      </section>

      {/* Product list / admin view */}
      <section aria-labelledby="product-list-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="product-list-heading" className="text-lg font-semibold">
            Existing Products
          </h2>
          <button
            type="button"
            onClick={loadProducts}
            className="text-xs px-3 py-1 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
        {loadingProducts ? (
          <p className="text-sm text-gray-600">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-600 italic">No products found.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">ID</th>
                  <th className="px-3 py-2 text-left font-medium">Name</th>
                  <th className="px-3 py-2 text-left font-medium">Category</th>
                  <th className="px-3 py-2 text-left font-medium">Price</th>
                  <th className="px-3 py-2 text-left font-medium">Image</th>
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.pid} className="border-t border-gray-200">
                    <td className="px-3 py-2 align-middle text-gray-600">{product.pid}</td>
                    <td className="px-3 py-2 align-middle font-medium text-gray-900">{sanitizeProductName(product.name)}</td>
                    <td className="px-3 py-2 align-middle text-gray-700">{sanitizeCategoryName(product.category?.name ?? "-")}</td>
                    <td className="px-3 py-2 align-middle text-gray-700">${product.price}</td>
                    <td className="px-3 py-2 align-middle">
                      {product.imagePath ? (
                        <img
                          src={`${API_BASE}${product.imagePath}`}
                          alt={sanitizeProductName(product.name)}
                          className="h-10 w-10 max-h-full max-w-full object-contain border border-gray-200 rounded"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">No image</span>
                      )}
                    </td>
                    <td className="px-3 py-2 align-middle space-x-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.pid)}
                        className="text-xs text-red-600 hover:text-red-800 cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Orders management */}
      <section className="mt-8" aria-labelledby="orders-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="orders-heading" className="text-lg font-semibold">
            Orders Management
          </h2>
          <button
            type="button"
            onClick={loadOrders}
            className="text-xs px-3 py-1 rounded-md border border-gray-300 bg-gray-50 hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
        {loadingOrders ? (
          <p className="text-sm text-gray-600">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-gray-600 italic">No orders found.</p>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Order ID</th>
                  <th className="px-3 py-2 text-left font-medium">Customer</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="px-3 py-2 text-left font-medium">Total</th>
                  <th className="px-3 py-2 text-left font-medium">Items</th>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Payment ID</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.oid} className="border-t border-gray-200">
                    <td className="px-3 py-2 align-middle font-medium text-gray-900">#{order.oid}</td>
                    <td className="px-3 py-2 align-middle text-gray-700">
                      <div>
                        <div className="font-medium">{order.user.username}</div>
                        <div className="text-xs text-gray-500">{order.user.email}</div>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'PAID' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-middle font-medium text-gray-900">
                      ${order.totalAmount} {order.currency}
                    </td>
                    <td className="px-3 py-2 align-middle text-gray-700">
                      <div className="text-xs">
                        {order.orderItems.map((item) => (
                          <div key={item.oiid}>
                            {item.productName} × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-middle text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2 align-middle text-gray-600 text-xs">
                      {order.stripePaymentIntentId ? (
                        <span className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                          {order.stripePaymentIntentId.slice(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}

export default Admin
