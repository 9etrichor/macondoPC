import { Link } from 'react-router'

const CheckoutCancel = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          {/* Cancel Header */}
          <div className="text-center mb-8">
            <div className="text-yellow-600 text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
            <p className="text-gray-600">Your payment was not completed</p>
          </div>

          {/* Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              You cancelled the payment process. Your order has not been completed and you have not been charged.
            </p>
          </div>

          {/* Next Steps */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">What would you like to do?</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="text-blue-600 mr-3">1.</div>
                <div>
                  <p className="font-medium text-gray-900">Try checkout again</p>
                  <p className="text-sm text-gray-600">Return to your cart and complete the purchase</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="text-blue-600 mr-3">2.</div>
                <div>
                  <p className="font-medium text-gray-900">Continue shopping</p>
                  <p className="text-sm text-gray-600">Browse more products</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="text-blue-600 mr-3">3.</div>
                <div>
                  <p className="font-medium text-gray-900">Contact support</p>
                  <p className="text-sm text-gray-600">If you experienced any issues</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Link
              to="/products"
              className="flex-1 text-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Continue Shopping
            </Link>
            <Link
              to="/"
              className="flex-1 text-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-medium"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutCancel
