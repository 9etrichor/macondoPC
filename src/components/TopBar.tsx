import { useState } from "react"
import { NavLink } from "react-router"
import Logo from "../assets/Logo.png"
import ShoppingCartIcon from "../assets/shoppingCart.svg"
import { useCart } from "../context/useCart"

const TopBar = () => {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { cartItems, updateItemQuantity, removeItem } = useCart()

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur shadow-sm">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16" aria-label="Main navigation">
          <div className="flex items-center gap-2">
            <NavLink to="/" className="flex items-center gap-2">
              <img
                src={Logo}
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
              <span className="text-lg font-semibold hidden sm:inline">Macondo Store</span>
            </NavLink>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
            <NavLink
              to="/"
              className={(props) =>
                `px-2 py-1 border-b-2 transition-colors ${
                  props.isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-700 hover:text-blue-600"
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/products"
              className={(props) =>
                `px-2 py-1 border-b-2 transition-colors ${
                  props.isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-700 hover:text-blue-600"
                }`
              }
            >
              Products
            </NavLink>
            <NavLink
              to="/about"
              className={(props) =>
                `px-2 py-1 border-b-2 transition-colors ${
                  props.isActive ? "border-blue-600 text-blue-600" : "border-transparent text-gray-700 hover:text-blue-600"
                }`
              }
            >
              About Us
            </NavLink>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex items-center justify-center rounded-full p-1 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <img
                src={ShoppingCartIcon}
                alt="Shopping cart"
                className="h-6 w-6 object-contain"
              />
            </button>
          </div>
        </nav>
      </div>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex h-screen">
          {/* Backdrop */}
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="flex-1 bg-black/40 backdrop-blur-sm"
          />

          {/* Cart panel */}
          <aside className="w-full max-w-md h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Shopping Cart</h2>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {cartItems.length === 0 ? (
                <p className="text-sm text-gray-500">Your cart is empty.</p>
              ) : (
                <ul className="space-y-3">
                  {cartItems.map((item, index) => (
                    <li
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm gap-3"
                    >
                      <div className="flex-1 mr-2">
                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Qty:</span>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(index, Number(e.target.value) || 1)
                            }
                            className="w-16 rounded-md border border-gray-300 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-sm font-semibold text-blue-600">
                          ${item.price * item.quantity}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="border-t border-gray-200 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Total</span>
                <span className="text-blue-600">${cartTotal}</span>
              </div>
              <button
                type="button"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Checkout
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  )
}

export default TopBar