'use client'

import { useContext, useState } from "react"
import { Button } from "@lib/components/ui/button"
import { addQuickToCart } from "../../fetch"
import { ShoppingCart } from "lucide-react"
import { useCart } from "app/cartProvider"

export default function AddToCartButton({id}:{id: string}){
    const handleAddToCart = async (variantId: string | null) => {
        // Add to cart logic here
        const cartId = localStorage.getItem("cart_id");
        if(!cartId || !variantId){
          return;
        }
        const {cart} = await addQuickToCart(cartId,variantId);
        if(cart.items){
          setCart((prev) => ({...prev, items: cart.items}));
        }
        setCartOpen(true);
        console.log(`Added ${cart.items} to cart`)
        // You could integrate with a cart context or state management here
      }
    const {setCartOpen,setCart} = useCart();
    return(

      <Button
            onClick={() => handleAddToCart(id)}
            className="bg-white text-gray-900 hover:bg-gray-100 px-6 py-2 rounded-full font-medium transition-all duration-200 transform hover:scale-105"
            size="sm"
        > 
        <ShoppingCart className="w-4 h-4 mr-2" />
            加入購物車
        </Button>
    )
}