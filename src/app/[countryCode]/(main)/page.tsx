import HeroSection from "./components/hero-carousel-section";
import HeroImageSection from "./components/hero-image-section";
import Navbar from "./components/navbar";
import ProductShowcase from "./components/product-showcase";
import ProductGrid from "./components/product-grid";
import { hero1, hero2, hero3, hero4 } from "./jsonFiles/heroContent";
import { categories } from "./jsonFiles/categories";
import { imageText1, imageText2 } from "./jsonFiles/imagetext";
import ImageTextSection from "./components/image-text-section";
import Footer from "./components/footer";
import { getProductCollection, getProducts } from "./fetch";
import { StoreProduct } from "@medusajs/types";

export default async function Home () {
  const collections = await getProductCollection();
  let productCollection:(StoreProduct[] | null)[] = [];
  console.log(collections);
  if(collections) {
    const res = await Promise.all(collections.map((collectionItem)=>getProducts({limit: 5, collection_id: collectionItem.id})))
    console.log(productCollection);
    productCollection = res.map((p)=>p.products) 
  }

  return (
    <div>
      <Navbar />
      <HeroSection slides={hero1}/>
      <ProductShowcase products={productCollection[0]}/>
      <HeroSection slides={hero2}/>
      <ProductShowcase products={productCollection[1]}/>
      <HeroImageSection slide={hero3} />
      <ProductShowcase products={productCollection[2]}/>
      <ProductGrid categories={categories}/>
      <ProductShowcase products={productCollection[3]}/>
      <HeroImageSection slide={hero4} />
      <ProductShowcase products={productCollection[4]}/>
      <ImageTextSection props={imageText1}/>
      <ImageTextSection props={imageText2}/>
      <Footer/>
    </div>
  );
}
