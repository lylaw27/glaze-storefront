
import { sdk } from "@lib/config";
import { StoreCart, StoreProduct, StoreProductListResponse } from "@medusajs/types";
import { CartAddress } from "./checkout/page";

//Get region
export const getRegionId = async (index: number) => {
    const res = await sdk.store.region.list();
    const regions = res.regions;
    if (!regions || regions.length === 0) {
        console.log("No regions found");
    }
    return regions[index].id;
}

//Create Payment session
export const createPaymentSession = async (cart: StoreCart) => {
    console.log("Creating payment session for cart:", cart.id)
    const {payment_collection} =  await sdk.store.payment.initiatePaymentSession(cart, 
        {
            provider_id: "pp_stripe_stripe",
        }
    )
    return payment_collection;
}

//Add shipping method to cart
export const addShippingMethod = async (cart: StoreCart, option_id: string) => {
    console.log("Adding shipping method to cart:", cart.id)
    const updatedCart = await sdk.store.cart.addShippingMethod(cart.id, {
        option_id: option_id,
    });
    return updatedCart;
}

//Add address to cart
export const addAddressToCart = async (cart: StoreCart, address: CartAddress,email:string) => {
    console.log("Adding address to cart:", cart.id)
    const updatedCart = await sdk.store.cart.update(cart.id, {
        email: email,
        shipping_address: address,
        billing_address: address,
    });
    return updatedCart;
}