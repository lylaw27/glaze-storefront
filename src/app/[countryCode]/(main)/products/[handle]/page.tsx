import { StoreProduct } from "@medusajs/types";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import ProductDetail from "../../components/product-detail";
import { getProductDetail } from "../../fetch";

export interface StoreProductAddon extends StoreProduct{
  addon?: StoreProduct[]
  metadata?:{
    addon?: string
  }
}

export default async function ProductPage ({
    params
  }:{
    params: Promise<{ handle: string }>
  }) {
  
  const {handle} = await params
  const product: StoreProductAddon = await getProductDetail(handle)
  product.addon = [];
  if(product.metadata?.addon){
    //Split extra add-ons with ','
    const addonIds:string[] = product.metadata.addon.split(",");
    const addonPromise = addonIds.map((productHandle)=>{
      return getProductDetail(productHandle)
    })

    let addonProducts = await Promise.all(addonPromise)

    product.addon = addonProducts.map((res)=>res);
  }
  console.log(product)

  return (
      <div>
        <Navbar navFix={true}/>
        <ProductDetail product={product}/>
        <Footer/>
      </div>
  );
}
