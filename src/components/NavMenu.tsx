import { Link } from "react-router"

const NavMenu = () => {
  return (
    <nav className="fixed top-[14vh] left-0 right-0 w-full border-b border-black/10 bg-[#f5f5f5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-xs sm:text-sm text-gray-600">
        <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
          <li>
            <Link to="/" className="hover:underline">
              Home
            </Link>
          </li>
          <li className="text-gray-400">&gt;</li>
          <li>
            <Link to="/products?category=GPU" className="hover:underline">
              GPU
            </Link>
          </li>
          <li className="text-gray-400">&gt;</li>
          <li>
            <Link to="/product/3" className="hover:underline">
              NVIDIA GeForce RTX 5090
            </Link>
          </li>
        </ol>
      </div>
    </nav>
  )
}

export default NavMenu