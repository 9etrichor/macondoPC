import { createContext, useState, type ReactNode } from "react"

export type CartItem = {
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

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  const addItem = (item: CartItem) => {
    setCartItems((prev) => {
      const ifExist:boolean = prev.find((i) => i.name === item.name) ? true : false;
      //if the item exisits, add the quantity
      if(ifExist) {
        return prev.map((i) => {
          if(i.name === item.name) {
            return {...i, quantity: i.quantity + item.quantity}
          }
          return i
        })
      }

      //if the item doesn't exist
      return [...prev, item]})
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
