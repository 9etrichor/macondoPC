import { useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"

import Logo from "../assets/Logo.png"

const Products = () => {

  const products = [
    // CPU
    { name: "Intel Core Ultra 9 285K", category: "CPU", price: 475 },
    { name: "Intel Core Ultra 7 265K", category: "CPU", price: 290 },
    { name: "AMD Ryzen 7 9850X3D", category: "CPU", price: 520 },

    // GPU
    { name: "NVIDIA GeForce RTX 5090", category: "GPU", price: 1999 },
    { name: "NVIDIA GeForce RTX 5080", category: "GPU", price: 1200 },
    { name: "AMD Radeon RX 9070 XT", category: "GPU", price: 700 },

    // Memory
    { name: "G.Skill Trident Z5 RGB DDR5-6400 32GB", category: "Memory", price: 150 },
    { name: "Corsair Vengeance RGB DDR5-6000 32GB", category: "Memory", price: 140 },
    { name: "Kingston Fury Beast DDR5-6000 64GB", category: "Memory", price: 220 },

    // SSD
    { name: "WD Black SN7100 2TB", category: "SSD", price: 180 },
    { name: "Samsung 990 Pro 2TB", category: "SSD", price: 170 },
    { name: "Crucial T700 4TB", category: "SSD", price: 350 },

    // Motherboard
    { name: "ASUS ROG Crosshair X870E Hero", category: "Motherboard", price: 700 },
    { name: "MSI MEG Z890 GODLIKE", category: "Motherboard", price: 900 },
    { name: "Gigabyte Z890 Aorus Master", category: "Motherboard", price: 500 },

    // Power Supply
    { name: "Corsair HX1500i Shift", category: "Power Supply", price: 445 },
    { name: "MSI MPG Ai1600TS PCIe5", category: "Power Supply", price: 350 },
    { name: "Seasonic Prime TX-1300", category: "Power Supply", price: 300 },

    // CPU Cooler
    { name: "Noctua NH-D15 G2", category: "CPU Cooler", price: 150 },
    { name: "Arctic Liquid Freezer III 360 A-RGB", category: "CPU Cooler", price: 130 },
    { name: "NZXT Kraken Elite 360 RGB", category: "CPU Cooler", price: 250 },
  ]

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  )

  const [searchParams] = useSearchParams()

  const initialCategory = searchParams.get("category") || "All"

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)

  const filteredProducts = useMemo(
    () =>
      selectedCategory === "All"
        ? products
        : products.filter((p) => p.category === selectedCategory),
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
            {filteredProducts.map((product) => {
              const index = products.indexOf(product)
              return (
                <Link
                  key={product.name}
                  to={`/product/${index}`}
                  className="w-full md:w-[320px] mx-auto flex flex-col rounded-2xl border border-black bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow p-1"
                >
                  <div className="h-64 bg-gray-50 flex items-center justify-center border border-black rounded-t-2xl">
                    <img
                      src={Logo}
                      alt={product.name}
                      className="h-16 w-auto object-contain"
                    />
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 text-center">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 mb-2 text-center">
                        {product.category}
                      </p>
                    </div>
                    <div className="mt-2 text-sm font-bold text-center">
                      ${product.price}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Products