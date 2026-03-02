import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"

import Logo from "../assets/Logo.png"
import { useCart } from "../context/useCart"

interface Category {
  catid: number
  name: string
}

interface ProductItem {
  pid: number
  name: string
  price: number
  description: string
  imagePath?: string | null
  category?: Category
}

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:4000" 

const Products = () => {
  const { addItem } = useCart()
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const res = await fetch(`${API_BASE}/api/products`)
        if (!res.ok) {
          throw new Error("Failed to load products")
        }
        const data = await res.json()
        setProducts(data)
      } catch (err) {
        console.error(err)
        setError("Unable to load products")
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          products
            .map((p) => p.category?.name)
            .filter((name): name is string => Boolean(name))
        )
      ),
    ],
    [products]
  )

  const [searchParams] = useSearchParams()

  const initialCategory = searchParams.get("category") || "All"

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)

  const filteredProducts = useMemo(
    () =>
      selectedCategory === "All"
        ? products
        : products.filter((p) => p.category?.name === selectedCategory),
    [products, selectedCategory]
  )

  return (
    <section
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      aria-labelledby="products-heading"
    >
      <h1
        id="products-heading"
        className="text-2xl sm:text-3xl font-bold mb-6"
      >
        Products
      </h1>

      {/* Mobile category dropdown */}
      <div className="mb-4 md:hidden">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-600 mb-4">Loading products...</p>}
      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex flex-col md:flex-row md:items-start gap-6">
        {/* Sidebar categories (desktop/tablet) */}
        <aside className="hidden md:block md:w-48 lg:w-56 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Categories</h2>
          <ul className="space-y-1 text-sm">
            {categories.map((cat) => {
              const active = selectedCategory === cat
              return (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      active
                        ? "bg-black text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>

        {/* Product cards */}
        <section className="">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.pid}
                className="w-full md:w-[320px] mx-auto flex flex-col rounded-2xl border border-black bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow p-1"
              >
                <Link
                  to={`/product/${product.pid}`}
                  state={{ productName: product.name, productImagePath: product.imagePath }}
                  className="block"
                >
                  <div className="h-64 bg-gray-50 flex items-center justify-center border border-black rounded-t-2xl">
                    {product.imagePath ? (
                      <img
                        src={`${API_BASE}${product.imagePath}`}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <img
                        src={Logo}
                        alt={product.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 text-center">
                        {product.category?.name ?? ""}
                      </p>
                    </div>
                    <div className="mt-2 text-sm font-bold text-center">
                      ${product.price}
                    </div>
                  </div>
                </Link>
                <div className="px-4 pb-3">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-gray-600 text-white text-xs font-medium shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
                    onClick={() =>
                      addItem({ pid: product.pid, name: product.name, price: product.price, quantity: 1 })
                    }
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Products
