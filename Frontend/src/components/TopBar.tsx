import { useState } from "react"
import { NavLink } from "react-router"
import Logo from "../assets/Logo.png"
import ShoppingCartIcon from "../assets/shoppingCart.svg"
import CrossIcon from "../assets/cross.svg"

import { useCart } from "../context/useCart"

const TopBar = () => {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { cartItems, updateItemQuantity, removeItem } = useCart()

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[14vh] flex items-center bg-[#f5f5f5] border-y">
      <div className="w-full  sm:px-6 lg:px-8">
        <nav className="flex px-8 items-center gap-8 justify-between" aria-label="Main navigation">
          <div className="flex items-center gap-6">
            <NavLink to="/" className="">
              <img
                src={Logo}
                alt="Logo"
                className="h-8 w-auto object-contain"
              />
            </NavLink>

            <div className="flex items-center gap-4 text-base font-medium">
              <NavLink
                to="/"
                className={(props) =>
                  `px-2 py-1 border-b-2 transition-colors ${
                    props.isActive ? "border-black" : "border-transparent text-gray-700 hover:border-black"
                  }`
                }
              >
                Home
              </NavLink>
              <NavLink
                to="/products"
                className={(props) =>
                  `px-2 py-1 border-b-2 transition-colors ${
                    props.isActive ? "border-black" : "border-transparent text-gray-700 hover:border-black"
                  }`
                }
              >
                Products
              </NavLink>
              <NavLink
                to="/about"
                className={(props) =>
                  `px-2 py-1 border-b-2 transition-colors min-w-fit ${
                    props.isActive ? "border-black" : "border-transparent text-gray-700 hover:border-black"
                  }`
                }
              >
                About Us
              </NavLink>
            </div>
          </div>

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
        </nav>
      </div>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex h-screen">
          {/* Backdrop */}
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="flex-1 bg-black/20 backdrop-blur-xs"
          />

          {/* Cart panel */}
          <aside className="w-full max-w-md h-full bg-[#f5f5f5] shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-[14vh] border-b border-gray-200">
              <h2 className="text-4xl font-semibold macondo">Cart</h2>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="inline-flex items-center justify-center p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 cursor-pointer"
              >
                <img
                  src={CrossIcon}
                  alt="Close cart"
                  className="size-12 object-contain"
                />
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
                        <div className="text-right text-sm font-semibold">
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
                <span className="">${cartTotal}</span>
              </div>
              <button
                type="button"
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-gray-600 text-white text-sm font-medium shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
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