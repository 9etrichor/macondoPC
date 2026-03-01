import { createContext, useEffect, useState, type ReactNode } from "react"

export type CartItem = {
  pid: number
  name: string
  price: number
  quantity: number
}

type CartContextValue = {
  cartItems: CartItem[]
  addItem: (item: CartItem) => void
  updateItemQuantity: (index: number, quantity: number) => void
  removeItem: (index: number) => void
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

const API_BASE = "http://localhost:4000"

// Structure persisted in localStorage (minimal): pid + quantity
type StoredCartItem = {
  pid: number
  quantity: number
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // On first mount, restore cart from localStorage by pid and fetch names/prices from backend
  useEffect(() => {
    const restoreCart = async () => {
      try {
        const raw = window.localStorage.getItem("cart")
        if (!raw) return

        const parsed = JSON.parse(raw) as StoredCartItem[] | unknown
        if (!Array.isArray(parsed)) return

        // Fetch all products once and join by pid
        const res = await fetch(`${API_BASE}/api/products`)
        if (!res.ok) return
        const products: { pid: number; name: string; price: number }[] = await res.json()

        const items: CartItem[] = []
        for (const entry of parsed as StoredCartItem[]) {
          const id = typeof entry.pid === "number" ? entry.pid : NaN
          const qty = typeof entry.quantity === "number" && entry.quantity > 0 ? entry.quantity : 1
          if (Number.isNaN(id)) continue

          const found = products.find((p) => p.pid === id)
          if (!found) continue

          items.push({ pid: found.pid, name: found.name, price: found.price, quantity: qty })
        }

        if (items.length > 0) {
          setCartItems(items)
        }
      } catch {
        // ignore parse/network errors for cart restore
      }
    }

    void restoreCart()
  }, [])

  // Persist pid + quantity to localStorage whenever cart changes
  useEffect(() => {
    const toStore: StoredCartItem[] = cartItems.map((item) => ({ pid: item.pid, quantity: item.quantity }))
    window.localStorage.setItem("cart", JSON.stringify(toStore))
  }, [cartItems])

  const addItem = (item: CartItem) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.pid === item.pid)
      if (existing) {
        return prev.map((i) => (i.pid === item.pid ? { ...i, quantity: i.quantity + item.quantity } : i))
      }

      return [...prev, item]
    })
  }

  const updateItemQuantity = (index: number, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: quantity < 1 ? 1 : quantity } : item))
    )
  }

  const removeItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <CartContext.Provider value={{ cartItems, addItem, updateItemQuantity, removeItem }}>
      {children}
    </CartContext.Provider>
  )
}
export { CartContext }
