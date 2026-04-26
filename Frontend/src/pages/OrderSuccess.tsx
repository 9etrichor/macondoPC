import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { secureApi } from '../utils/secureFetch'

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
  orderItems: {
    oiid: number
    oid: number
    pid: number
    quantity: number
    price: number
    productName: string
  }[]
}

const OrderSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { token, user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID not found')
        setLoading(false)
        return
      }

      // Wait for auth to load before checking
      if (authLoading) {
        return
      }

      // Debug: Log authentication state
      console.log('Auth Debug:', { 
        hasToken: !!token, 
        hasUser: !!user, 
        userId: user?.uid,
        tokenLength: token?.length,
        authLoading
      })

      if (!token || !user) {
        setError('Authentication required. Please log in.')
        setLoading(false)
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login')
        }, 2000)
        return
      }

      try {
        const response = await secureApi.get(`/api/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        let data: Order
        try {
          data = await response.json() as Order
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          throw new Error('Invalid response format')
        }

        if (response.ok) {
          setOrder(data)
        } else {
          console.error('Order fetch error:', data)
          // Handle null or undefined data safely
          const errorData = data || {}
          const errorMessage = (errorData as any)?.error || `Failed to fetch order details (${response.status})`
          setError(errorMessage)
        }
      } catch (err) {
        console.error('Network error details:', err)
        setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, token, user, navigate, authLoading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              to="/"
              className="inline-block px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className={`text-6xl mb-4 ${
              order?.status === 'PAID' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {order?.status === 'PAID' ? '✓' : '⏳'}
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${
              order?.status === 'PAID' ? 'text-green-900' : 'text-yellow-900'
            }`}>
              {order?.status === 'PAID' ? 'Payment Successful!' : 'Payment Processing...'}
            </h1>
            <p className="text-gray-600">
              {order?.status === 'PAID' 
                ? 'Thank you for your purchase' 
                : 'Your payment is being processed. Please wait a moment.'}
            </p>
          </div>

          {/* Order Details */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium">#{order?.oid}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    order?.status === 'PAID' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order?.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-medium">${order?.totalAmount} {order?.currency}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            <div className="space-y-3">
              {order?.orderItems?.map((item, itemIndex) => (
                <div key={`order-item-${item.oiid}-${itemIndex}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity} × ${item.price}</p>
                  </div>
                  <p className="font-medium text-gray-900">${item.price * item.quantity}</p>
                </div>
              )) || []}
            </div>
          </div>

          {/* Order Actions */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Print Receipt
            </button>
            <Link
              to="/products"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
