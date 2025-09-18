import Navbar from "../components/navbar"; 
import Footer from "../components/footer";
import CollectionGrid from "../components/collection-grid";
import HeroImageSection from "../components/hero-image-section";
import { hero4 } from "../jsonFiles/heroContent";
import { getGridProducts, getProductCategories } from "../fetch";
import { StoreProductCategory } from "@medusajs/types";

interface CategoryType{
    [key: string]: StoreProductCategory[];
}

export default async function Home ({searchParams}:{searchParams: Promise<{ [key: string]: string}>}) {

    const resolvedSearchParams = await searchParams
    const pageNumber = parseInt(resolvedSearchParams.page) || 1
    const PER_PAGE = 12

    const resProductList = await getGridProducts({
        limit: PER_PAGE, 
        category_id: resolvedSearchParams.category,
        sort: resolvedSearchParams.sort,
        lowPrice: resolvedSearchParams.lowPrice,
        highPrice: resolvedSearchParams.highPrice,
        offset: PER_PAGE*(pageNumber-1)
    }) || []

    const {product_categories} = await getProductCategories();

    const categoriesList:CategoryType = {}
    product_categories.map((category)=>{
        if(!(category.description in categoriesList)){
            categoriesList[category.description] = [];
        }
        categoriesList[category.description].push(category);
    })

    const pageCount = Math.max(1, Math.ceil(resProductList.count / PER_PAGE))

    return (
        <div>
        <Navbar />
            <HeroImageSection slide={hero4} />
            <CollectionGrid 
                categoriesList={categoriesList}
                allProducts={resProductList.products} 
                pageCount={pageCount} 
                page={pageNumber}
                pathname="/collections"
            />
        <Footer/>
        </div>
    );
}
