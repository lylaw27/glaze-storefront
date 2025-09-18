'use client'
 
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from 'react'
import { createCart, getCart, getRegionId } from './[countryCode]/(main)/fetch';
import { StoreCart, StoreCartLineItem } from '@medusajs/types';
 
export interface CartContextType {
    cartOpen: boolean;
    setCartOpen: Dispatch<SetStateAction<boolean>>;
    cart: StoreCart;
    setCart: Dispatch<SetStateAction<StoreCart>>;
    refreshCart: () => void;
}

const contextValue: CartContextType ={
    cartOpen: false,
    setCartOpen: () => {},
    cart: {items: []} as StoreCart,
    setCart: () => {},
    refreshCart: () => {},
}

export const CartContext = createContext<CartContextType>(contextValue)

export default function CartProvider({children}: {children: React.ReactNode}) {
const [cartOpen, setCartOpen] = useState(false);

const [cart,setCart] = useState<StoreCart>({items: []} as StoreCart);

  // const [cartItems, setCartItems] = useState<StoreCartLineItem[]>([]);
  let cartId:string;
  if (typeof window !== 'undefined') {
    cartId = localStorage.getItem("cart_id") || "";
  }
  useEffect(() => {
    const regionId = localStorage.getItem("region_id")

    if (!regionId || !cartId) {
      getRegionId(0)
        .then((id)=>{
          localStorage.setItem("region_id",id)
          return createCart(id)
        })
        .then((cart)=>{
          localStorage.setItem("cart_id",cart.id);
        });
    }
    
    // create a cart and store it in the localStorage
    if(cartId){
      getCart(cartId)
        .then(({cart})=>{
            // if(cart.items){
            //     setCartItems(cart.items)
            // }
            setCart(cart)
          console.log(cartId)
        })
    }
  }, [])

    const refreshCart = () => {
      localStorage.removeItem("cart_id")
      setCart({} as StoreCart)
    }

    const contextValue: CartContextType ={
        cartOpen,
        setCartOpen,
        cart,
        setCart,
        refreshCart
    }

    return <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }

  return context
}