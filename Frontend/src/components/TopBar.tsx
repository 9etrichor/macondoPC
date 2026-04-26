import { useState } from "react"
import { NavLink, useNavigate } from "react-router"
import Logo from "../assets/Logo.png"
import ShoppingCartIcon from "../assets/shoppingCart.svg"
import CrossIcon from "../assets/cross.svg"

import { useCart } from "../context/useCart"
import { useAuth } from "../context/AuthContext"
import { sanitizeUsername, sanitizeProductName } from "../utils/sanitize"
import { secureFetch } from "../utils/secureFetch"

const TopBar = () => {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const { cartItems, updateItemQuantity, removeItem } = useCart()
  const { user, logout, token } = useAuth()
  const navigate = useNavigate()

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is logged in
    if (!user) {
      navigate('/login')
      setIsCartOpen(false)
      return
    }

    // Check if cart is empty
    if (cartItems.length === 0) {
      setCheckoutError('Your cart is empty')
      return
    }

    // Check minimum order amount (HKD 4.00)
    const minimumAmount = 4.00
    if (cartTotal < minimumAmount) {
      setCheckoutError(`Minimum order amount is HKD ${minimumAmount}. Current total: HKD ${cartTotal}`)
      return
    }

    setIsProcessingCheckout(true)
    setCheckoutError(null)

    try {
      // Prepare order data - only pid and quantity as per plan
      const orderData = cartItems.map(item => ({
        pid: item.pid,
        quantity: item.quantity
      }))

      // Send to backend for validation and digest generation
      const response = await secureFetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderData
        })
      })

      const result = await response.json() as {
        orderId?: number
        digest?: string
        totalAmount?: number
        currency?: string
        stripeCheckoutUrl?: string
        error?: string
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order')
      }

      // Redirect to Stripe Checkout
      if (result.stripeCheckoutUrl) {
        window.location.href = result.stripeCheckoutUrl
      } else {
        // Fallback if Stripe fails
        console.log('Order created:', result.orderId, result.digest)
        alert('Order created! Order ID: ' + result.orderId)
        setIsCartOpen(false)
      }
      
    } catch (error) {
      console.error('Checkout error:', error)
      setCheckoutError(error instanceof Error ? error.message : 'Checkout failed')
    } finally {
      setIsProcessingCheckout(false)
    }
  }

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

          <div className="flex items-center gap-6">
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
            
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Welcome, {sanitizeUsername(user?.username || '')}
                </span>
                <NavLink
                  to="/member"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  My Orders
                </NavLink>
                {user.role === "ADMIN" && (
                  <NavLink
                    to="/admin"
                    className="text-sm font-medium text-black hover:text-gray-700"
                  >
                    Admin
                  </NavLink>
                )}
                <NavLink
                  to="/reset"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Reset Password
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <NavLink to="/login" className="text-sm font-medium text-black hover:text-gray-700">
                  Login
                </NavLink>
                <NavLink to="/register" className="text-sm font-medium text-black hover:text-gray-700">
                  Register
                </NavLink>
              </div>
            )}
          </div>
          
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

            <form onSubmit={handleCheckout} className="flex flex-col h-full">
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
                          <p className="font-medium text-gray-900 truncate">{sanitizeProductName(item.name)}</p>
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
                {checkoutError && (
                  <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                    {checkoutError}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Total</span>
                  <span className="">${cartTotal}</span>
                </div>
                
                <button
                  type="submit"
                  disabled={isProcessingCheckout || cartItems.length === 0}
                  className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-md bg-gray-600 text-white text-sm font-medium shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isProcessingCheckout ? 'Processing...' : 'Checkout'}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </header>
  )
}

export default TopBar