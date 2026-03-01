import { useEffect, useState } from "react"
import { useParams } from "react-router"
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

const API_BASE = "http://localhost:4000"

const Product = () => {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState<number>(1)
  const [showAdded, setShowAdded] = useState(false)
  const [product, setProduct] = useState<ProductItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { pid } = useParams<{ pid: string }>()

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_BASE}/api/products`)
        if (!res.ok) {
          throw new Error("Failed to load products")
        }
        const data: ProductItem[] = await res.json()

        const id = pid ? parseInt(pid, 10) : NaN
        const found = data.find((p) => p.pid === id) || null

        if (!found) {
          setError("Product not found")
        }
        setProduct(found)
      } catch (err) {
        console.error(err)
        setError("Unable to load product")
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [pid])

  if (loading) {
    return (
      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-gray-600">Loading product...</p>
      </article>
    )
  }

  if (error || !product) {
    return (
      <article className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-sm text-red-600">{error || "Product not found"}</p>
      </article>
    )
  }

  return (
    <article
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-black border bg-white rounded-2xl"
      aria-labelledby="product-title"
    >
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Image section */}
        <figure className="border border-black w-full md:w-1/2 flex items-center justify-center bg-gray-50  p-6">
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
        </figure>

        {/* Details section */}
        <div className="w-full md:w-1/2 flex flex-col">
          <h1
            id="product-title"
            className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
          >
            {product.name}
          </h1>

          <div className="text-xl font-semibold mb-4">
            ${product.price}
          </div>

          <p className="text-sm sm:text-base text-gray-700 mb-6 leading-relaxed">
            {product.description}
          </p>

          <div className="mb-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700" htmlFor="quantity">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-gray-600 text-white text-sm font-medium shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
            onClick={() => {
              const finalQty = quantity < 1 ? 1 : quantity
              addItem({ pid: product.pid, name: product.name, price: product.price, quantity: finalQty })
              setShowAdded(true)
              setTimeout(() => setShowAdded(false), 2000)
            }}
          >
            Add to Cart
          </button>
          {showAdded && (
            <p className="mt-2 text-sm text-green-600">Added to cart successfully.</p>
          )}
        </div>
      </div>
    </article>
  )
}

export default Product