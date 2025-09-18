
import { sdk } from "@lib/config";
import { StoreProduct, StoreProductListResponse } from "@medusajs/types";

//Get region
export const getRegionId = async (index: number) => {
    const res = await sdk.store.region.list();
    const regions = res.regions;
    if (!regions || regions.length === 0) {
        console.log("No regions found");
    }
    return regions[index].id;
}

//Get product list according to collections
export const getProductCollection = async () => {
    const res = await sdk.store.collection.list({order: "created_at"});
    let collections = res.collections;
    if (!collections || collections.length === 0) {
        console.log("No collections found");
        return null;
    }
    return collections;
}

//Get all products
export const getProducts = async (params: {limit: number, collection_id?:string, category_id?: string | string[], offset?: number}) => {
    const res = await sdk.store.product.list({...params,
        fields: `*variants.calculated_prices.calculatedAmount, *categories`,
    });
    return res;
}

//Get all products
export const getGridProducts = async (params: {
    limit: number, 
    collection_id?:string, 
    category_id?: string | string[],
    sort?: string,
    lowPrice?: string,
    highPrice?: string
    offset?: number
    }) => {
    const res: StoreProductListResponse = await sdk.client.fetch('/store/custom',
        {
            query: params
        }
    )
    return res;
}

export const createCart = async (regionId: string) =>{
    const {cart} = await sdk.store.cart.create({
      region_id: regionId,
    })
    return cart;
}

export const addQuickToCart = async (cart_id: string, variant_id: string) =>{
    return await sdk.store.cart.createLineItem(cart_id, {
        variant_id,
        quantity: 1
    },{
        fields: `+items.variant.options.option.title,+items.variant.options.value`
    })
}

export const addToCart = async (cart_id: string, variant_id: string[],quantity: number) =>{
    const cartPromises = variant_id.map((v_id)=> sdk.store.cart.createLineItem(cart_id, {
        variant_id: v_id,
        quantity: quantity
    },{
        fields: `+items.variant.options.option.title,+items.variant.options.value`
    }))
    const carts = await Promise.all(cartPromises)
    return carts[carts.length-1]
}

export const getCart = async (cart_id: string) =>{
    return await sdk.store.cart.retrieve(cart_id,{
        fields: `+items.variant.options.option.title,+items.variant.options.value`
    });
}

export const updateCartItem = async (cart_id: string, item_Id: string , quantity: number) =>{
    return await sdk.store.cart.updateLineItem(cart_id, item_Id,{quantity: quantity});
}

export const removeCartItem = async (cart_id: string, item_Id: string) =>{
    console.log(cart_id)
    return await sdk.store.cart.deleteLineItem(cart_id, item_Id);
}

export const getProductCategories = async() =>{
    return await sdk.store.category.list();
}

// export const getProductDetail = async(productId: string) =>{
//     return await sdk.store.product.retrieve(productId,{
//         fields: `*variants.calculated_prices.calculatedAmount, +variants.inventory_quantity, +metadata`
//     });
// }

export const getProductDetail = async(productHandle: string) =>{
    const {products} = await sdk.store.product.list({handle: productHandle,
        fields: `*variants.calculated_prices.calculatedAmount, +variants.inventory_quantity, +metadata`
    });
    return products[0];
}