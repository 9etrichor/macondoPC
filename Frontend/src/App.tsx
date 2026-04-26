import { Routes, Route } from "react-router"
import Home from "./pages/Home"
import About from "./pages/About"
import Products from "./pages/Products"
import Product from "./pages/Product"
import Admin from "./pages/Admin"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Reset from "./pages/Reset"
import OrderSuccess from "./pages/OrderSuccess"
import CheckoutCancel from "./pages/CheckoutCancel"
import MemberPortal from "./pages/MemberPortal"
import { CartProvider } from "./context/CartContext"
import { AuthProvider } from "./context/AuthContext"
import NavMenu from "./components/NavMenu"
import TopBar from "./components/TopBar"

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen max-w-screen bg-[#f5f5f5] flex flex-col anonymous-pro">
          <TopBar />
          <NavMenu />
          <main className="flex-1 pt-16 mt-[14vh]">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:pid" element={<Product />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset" element={<Reset />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              <Route path="/checkout/cancel" element={<CheckoutCancel />} />
              <Route path="/member" element={<MemberPortal />} />
            </Routes>
          </main>
        </div>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
