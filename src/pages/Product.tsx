import { useState } from "react"
import { useParams } from "react-router"
import Logo from "../assets/Logo.png"
import { useCart } from "../context/useCart"

const Product = () => {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState<number>(1)
  const [showAdded, setShowAdded] = useState(false)

  const products = [
  // CPU
  {
    name: "Intel Core Ultra 9 285K",
    description: "Flagship 24-core Arrow Lake processor with integrated graphics, unlocked for overclocking, designed for high-end gaming and content creation.",
    price: 475,
  },
  {
    name: "Intel Core Ultra 7 265K",
    description: "20-core hybrid CPU offering excellent multi-threaded performance and efficiency, suitable for gaming and professional workloads.",
    price: 425,
  },
  {
    name: "AMD Ryzen 7 9850X3D",
    description: "8-core Zen 5 processor with second-generation 3D V-Cache technology, delivering class-leading gaming performance at high clock speeds.",
    price: 395,
  },

  // GPU
  {
    name: "NVIDIA GeForce RTX 5090",
    description: "Next-generation flagship GPU based on Blackwell architecture, featuring massive VRAM, advanced ray tracing, and DLSS 4 for ultra-high-resolution gaming.",
    price: 1999,
  },
  {
    name: "NVIDIA GeForce RTX 5080",
    description: "High-end 16 GB GDDR7 graphics card optimized for 4K gaming, AI workloads, and professional rendering with strong ray-tracing capabilities.",
    price: 1499,
  },
  {
    name: "AMD Radeon RX 9070 XT",
    description: "Mid-to-high-end RDNA 4 GPU with 16 GB GDDR6 memory, excellent rasterization performance, and improved ray tracing for 1440p and 4K gaming.",
    price: 699,
  },

  // Memory
  {
    name: "G.Skill Trident Z5 RGB DDR5-6400 32GB",
    description: "High-performance 32 GB (2×16 GB) DDR5 kit with tight timings, RGB lighting, and stable operation at 6400 MT/s for modern platforms.",
    price: 139,
  },
  {
    name: "Corsair Vengeance RGB DDR5-6000 32GB",
    description: "Reliable 32 GB (2×16 GB) DDR5 memory module featuring customizable RGB lighting and excellent compatibility with Intel and AMD systems.",
    price: 129,
  },
  {
    name: "Kingston Fury Beast DDR5-6000 64GB",
    description: "High-capacity 64 GB (2×32 GB) DDR5 kit running at 6000 MT/s, ideal for heavy multitasking, video editing, and memory-intensive applications.",
    price: 269,
  },

  // SSD
  {
    name: "WD Black SN7100 2TB",
    description: "PCIe Gen5 NVMe SSD delivering sequential read/write speeds over 14,000 MB/s, optimized for gaming and fast content loading.",
    price: 499,
  },
  {
    name: "Samsung 990 Pro 2TB",
    description: "Proven PCIe Gen4 NVMe drive with outstanding random performance, reliability, and included heatsink option for sustained high-speed operation.",
    price: 449,
  },
  {
    name: "Crucial T700 4TB",
    description: "High-capacity PCIe Gen5 SSD achieving extreme sequential speeds, perfect for large game libraries, 8K video editing, and data-heavy workflows.",
    price: 899,
  },

  // Motherboard
  {
    name: "ASUS ROG Crosshair X870E Hero",
    description: "Premium AMD X870E chipset motherboard with robust VRM, extensive connectivity, Wi-Fi 7, and advanced overclocking features for Ryzen 9000 series.",
    price: 699,
  },
  {
    name: "MSI MEG Z890 GODLIKE",
    description: "Extreme Intel Z890 flagship board featuring massive power delivery, 10 GbE LAN, multiple M.2 slots, and premium build quality for enthusiasts.",
    price: 799,
  },
  {
    name: "Gigabyte Z890 Aorus Master",
    description: "High-end Intel Z890 motherboard with strong thermal design, PCIe 5.0 support, Wi-Fi 7, and comprehensive storage and expansion options.",
    price: 599,
  },

  // Power Supply
  {
    name: "Corsair HX1500i Shift",
    description: "1600 W 80+ Platinum fully modular PSU with ATX 3.1 compliance, side-mounted connectors, and exceptional efficiency for high-power builds.",
    price: 399,
  },
  {
    name: "MSI MPG Ai1600TS PCIe5",
    description: "1600 W 80+ Titanium power supply featuring AI power monitoring, PCIe 5.1 support, and high build quality for next-gen GPU systems.",
    price: 499,
  },
  {
    name: "Seasonic Prime TX-1300",
    description: "1300 W 80+ Titanium fully modular unit renowned for ultra-low ripple, long-term reliability, and quiet operation under heavy loads.",
    price: 299,
  },

  // CPU Cooler
  {
    name: "Noctua NH-D15 G2",
    description: "Second-generation flagship dual-tower air cooler with eight heatpipes and NF-A14x25r G2 fans, offering top-tier cooling and near-silent performance.",
    price: 99,
  },
  {
    name: "Arctic Liquid Freezer III 360 A-RGB",
    description: "360 mm all-in-one liquid cooler with thick radiator, high-static-pressure fans, integrated VRM fan, and vibrant A-RGB lighting.",
    price: 139,
  },
  {
    name: "NZXT Kraken Elite 360 RGB",
    description: "Premium 360 mm AIO featuring a customizable LCD display on the pump block, high-performance pump, and synchronized RGB lighting.",
    price: 199,
  },
];

  const { index } = useParams<{ index: string }>()
  const idx = index ? parseInt(index, 10) : 0
  const product = Number.isNaN(idx) || idx < 0 || idx >= products.length ? products[0] : products[idx]

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Image section */}
        <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-6">
          <img
            src={Logo}
            alt={product.name}
            className="max-h-64 w-auto object-contain"
          />
        </div>

        {/* Details section */}
        <div className="w-full md:w-1/2 flex flex-col">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>
          <div className="text-xl font-semibold text-blue-600 mb-4">
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
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
            onClick={() => {
              const finalQty = quantity < 1 ? 1 : quantity
              addItem({ name: product.name, price: product.price, quantity: finalQty })
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
    </div>
  )
}

export default Product