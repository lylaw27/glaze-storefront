'use client'

import { useContext, useState } from "react"
import { Button } from "@lib/components/ui/button"
import { addToCart } from "../../fetch"
import { useCart } from "app/cartProvider"

export default function AddToCartButton({productIds, text,quantity}:{productIds: string[] | undefined, text: string ,quantity: number}){
    const handleAddToCart = async () => {

        console.log(productIds)

        // Add to cart logic here
        const cartId = localStorage.getItem("cart_id");
        if(!cartId || !productIds){
          return;
        }
        const {cart} = await addToCart(cartId,productIds,quantity);
        if(cart.items){
          setCart((prev) => ({...prev, items: cart.items}));
        }
        setCartOpen(true);
        console.log(cart.items)
        // You could integrate with a cart context or state management here
      }
    const {setCartOpen,setCart} = useCart();
    return(
      <Button
          onClick={() =>{
            handleAddToCart()
          }} 
          variant="outline"
          disabled={text != "加入購物車"}
          size="lg"
          className="w-full text-white h-12 font-medium bg-[#5A31F4] hover:bg-[#4C28D4] hover:text-white"
        >
          {text}
      </Button>
    )
}