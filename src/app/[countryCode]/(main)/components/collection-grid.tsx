"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SlidersHorizontal } from "lucide-react"
import { getProductCategories } from "../fetch"
import { StoreProduct, StoreProductCategory } from "@medusajs/types"
import { useRouter, useSearchParams } from "next/navigation"

interface CategoryType{
    [key: string]: StoreProductCategory[];
}

export default function CollectionGrid(
  {
    categoriesList,
    allProducts, 
    pageCount,
    page,
    pathname}:
  {
    categoriesList:CategoryType,
    allProducts: StoreProduct[],
    pageCount: number, 
    page: number
    pathname:string
  }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedCats, setSelectedCats] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000])
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc">("featured")
  const queries = useSearchParams();
  const router = useRouter();
  const didMount = useRef(false);

  const toggleCat = (id: string) => {
    setSelectedCats((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))
    let queryString = "";
    selectedCats.forEach((cat)=>{
      queryString += "category=" + cat;
    })
    console.log(selectedCats)
  }
  const [products,setProducts] = useState<StoreProduct[]>(allProducts);

  const applyFilter = () => {
      let queryString = "?"

      //Category query
      selectedCats.forEach((cat,i)=>{
        queryString += "category=" + cat + "&";
      })
      
      //Sort query
      if(sort != "featured"){
        queryString += "sort=" + sort + "&";
      }

      // Price Range Query
      if(!(priceRange[0] === 0 && priceRange[1] === 2000)){
        queryString += "lowPrice=" + priceRange[0] + "&" + "highPrice=" + priceRange[1]  + "&";
      }

      router.push(pathname + queryString,{ scroll: false })
  }

  useEffect(() => {
      setProducts(allProducts)
  }, [queries])

  useEffect(()=>{
    if(didMount.current){
      applyFilter()
    }
    else{
      didMount.current = true;
    }
  },[sort])

  const currency = (n: number) =>
    new Intl.NumberFormat("zh-HK", { style: "currency", currency: "HKD", minimumFractionDigits: 2 }).format(n)

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-10">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">主頁</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>最新款式</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2 bg-transparent">
              <SlidersHorizontal className="h-4 w-4" />
              篩選條件
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[92vw] sm:w-[420px]">
            <SheetHeader>
              <SheetTitle>篩選條件</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-8">
              {/* Categories */}
              { categoriesList && Object.entries(categoriesList).map(([title,categories])=>(
              <div key={title}>
                <div className="mb-3 text-sm font-medium">{title}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map(({name,id}) => (
                    <label
                      key={id}
                      className="flex items-center gap-3 rounded-md border p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox checked={selectedCats.includes(id)} onCheckedChange={() => toggleCat(id)} />
                      <span className="text-sm">{name}</span>
                    </label>
                  ))}
                </div>
              </div>
              ))}
              {/* Price */}
              <div>
                <div className="mb-3 text-sm font-medium">價格範圍</div>
                <div className="px-1">
                  <Slider
                    value={priceRange}
                    onValueChange={(v) => setPriceRange([v[0] as number, v[1] as number])}
                    min={0}
                    max={2000}
                    step={50}
                    minStepsBetweenThumbs={1}
                  />
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-700">
                    <span>{currency(priceRange[0])}</span>
                    <span>{currency(priceRange[1])}</span>
                  </div>
                </div>
              </div>
            </div>

            <SheetFooter className="mt-8 gap-3">
              <Button variant="ghost" onClick={() => (setSelectedCats([]), setPriceRange([0, 2000]),setSort("featured") , router.push(pathname,{ scroll: false }))}>
                重設
              </Button>
              <SheetClose asChild>
                <Button className="ml-auto" onClick={applyFilter}>套用</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Sort */}
        <div className="ml-auto">
          <Label htmlFor="sort" className="sr-only">
            排序
          </Label>
          <Select
            value={sort}
            onValueChange={(v) => {
              setSort(v as typeof sort)
            }}
          >
            <SelectTrigger id="sort" className="w-[140px]">
              <SelectValue placeholder="精選" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="featured">精選</SelectItem>
              <SelectItem value="price-asc">價格：低到高</SelectItem>
              <SelectItem value="price-desc">價格：高到低</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((p) => (
          <Link
            key={p.id}
            href={"/products/"+ p.id}
            className="group rounded-lg overflow-hidden bg-white ring-1 ring-gray-200 hover:ring-gray-300 transition"
          >
            <div className="relative aspect-square bg-gray-50">
              <Image
                src={p.images[0].url || "/placeholder.svg?height=600&width=600&query=product%20image"}
                alt={p.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            </div>
            <div className="p-3 sm:p-4">
              <h3 className="text-sm sm:text-[0.95rem] font-medium text-gray-900 line-clamp-2">{p.title}</h3>
              <div className="mt-2 text-xs sm:text-sm text-gray-700">{currency(p.variants[0].calculated_price?.calculated_amount)} 起</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-10 flex items-center justify-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          // onClick={() => setPage((p) => Math.max(1, p - 1))}
          aria-label="上一頁"
          asChild
          className={page === 1 ? "hidden" : ""}
        >
          <Link href={{pathname: pathname, query:{page: page-1}}} scroll={false}>
            上一頁
          </Link>
        </Button>
        {Array.from({ length: pageCount }).map((_, i) => {
          const n = i + 1
          const active = page === n
          // collapse long ranges with simple strategy for small screens
          if (pageCount > 6) {
            if (n !== 1 && n !== pageCount && Math.abs(n - page) > 1) {
              if (n === 2 || n === pageCount - 1) {
                return (
                  <span key={n} className="px-2 text-gray-400">
                    ...
                  </span>
                )
              }
              return null
            }
          }
          return (
            <Button
              key={n}
              variant={active ? "default" : "outline"}
              size="sm"
              aria-current={active ? "page" : undefined}
              className="min-w-9"
              asChild
            >
              <Link href={{pathname: pathname, query:{page: n}}} scroll={false}>
                {n}
              </Link>
            </Button>
          )
        })}
        <Button
          variant="outline"
          size="sm"
          className={page === pageCount ? "hidden" : ""}
          aria-label="下一頁"
          asChild
        >
          <Link href={{pathname: pathname, query:{page: page+1}}} scroll={false}>
          下一頁
          </Link>
        </Button>
      </div>

    </section>
  )
}
