import { Routes, Route } from "react-router"
import TopBar from "./components/TopBar"
import Home from "./pages/Home"
import About from "./pages/About"
import Products from "./pages/Products"
import Product from "./pages/Product"
import { CartProvider } from "./context/CartContext"

function App() {
  return (
    <CartProvider>
      <div className="min-h-screen max-w-screen flex flex-col">
        <TopBar />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:index" element={<Product />} />
          </Routes>
        </main>
      </div>
    </CartProvider>
  )
}

export default App
