import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { secureApi } from '../utils/secureFetch'

interface OrderItem {
  oiid: number
  oid: number
  pid: number
  quantity: number
  price: number
  productName: string
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
}

const MemberPortal = () => {
  const { user, isLoading, token } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await secureApi.get('/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json() as Order[]

      if (response.ok) {
        setOrders(data)
      } else {
        const errorData = data as { error?: string }
        setError(errorData.error || 'Failed to load orders')
      }
    } catch (err) {
      console.error('Network error details:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!isLoading && user) {
      loadOrders()
    }
  }, [user, isLoading, loadOrders])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please log in to view your orders</p>
          <Link
            to="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
            <p className="text-gray-600">View your recent order history</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Orders List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
              <p className="text-gray-600 mb-6">You haven't placed any orders yet</p>
              <Link
                to="/products"
                className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order, orderIndex) => (
                <div key={`order-${order.oid}-${orderIndex}`} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* Order Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Order #{order.oid}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        order.status === 'PAID' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        ${order.totalAmount} {order.currency}
                      </p>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.orderItems.map((item) => (
                        <div key={item.oiid} className="flex justify-between items-center text-sm">
                          <div>
                            <span className="font-medium text-gray-900">{item.productName}</span>
                            <span className="text-gray-600 ml-2">× {item.quantity}</span>
                          </div>
                          <span className="font-medium text-gray-900">${item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      {order.stripePaymentIntentId && (
                        <span>Payment ID: {order.stripePaymentIntentId.slice(0, 8)}...</span>
                      )}
                    </div>
                    <Link
                      to={`/order-success/${order.oid}`}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}

              {/* View More */}
              {orders.length === 5 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-600 mb-4">Showing your 5 most recent orders</p>
                  <button
                    onClick={loadOrders}
                    className="text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Refresh Orders
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MemberPortal
