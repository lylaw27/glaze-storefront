"use client"

import { useContext, useEffect, useState } from "react";
import Link from "next/link"
import Image from "next/image"
import { createCart, getCart, getRegionId, removeCartItem, updateCartItem } from "../fetch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Textarea } from "@lib/components/ui/textarea"
import { X, Minus, Plus } from "lucide-react"
import { StoreCartLineItem } from "@medusajs/types";
import { useCart } from "app/cartProvider";

/* Cart drawer sliding from the right */

export default function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const info = "備註：如需禮盒包裝請在此處說明。";
    const [note,setNote] = useState<string>();
    const {cart,setCart} = useCart();
    let cartId:string;
    if (typeof window !== 'undefined') {
        cartId = localStorage.getItem("cart_id") || "";
    }

    const fmt = (n: number) =>
        new Intl.NumberFormat("zh-HK", { style: "currency", currency: "HKD", minimumFractionDigits: 2 }).format(n)

    const updateQty = async (itemId: string, quantity: number) => {
        setCart((prev) => ({...prev, items: prev.items.map((it) => (it.id === itemId ? { ...it, quantity: Math.max(1, quantity) } : it))}))
        // const {cart} = 
        await updateCartItem(cartId, itemId, quantity);
        // if(cart?.items){
        //     setcart.items(cart?.items)
        // }
    }

    const updateNote = (note: string) => {
        setNote(note);
    }
    const removeItem = async(itemId: string) => {
        setCart((prev) => ({...prev, items: prev.items.filter((it) => it.id !== itemId)}))
        const {parent: cart} = await removeCartItem(cartId, itemId);
        // if(cart?.items){
        //     setcart.items(cart?.items)
        // }
    }

    const subtotal = cart.items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[92vw] sm:max-w-[520px] p-0">
            <div className="flex h-full flex-col">
            {/* Header */}
            <div className="px-6 py-5 border-b flex items-center justify-between">
                <SheetTitle className="text-2xl font-semibold">您的購物車</SheetTitle>
                <SheetClose asChild>
                <button aria-label="Close cart" className="p-2 rounded-md hover:bg-gray-100">
                    <X className="h-5 w-5" />
                </button>
                </SheetClose>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                {!cart.items || cart.items.length === 0 ? (
                <div className="text-center text-gray-600">你的購物車是空的</div>
                ) : (
                cart.items.map((it) => (
                    <div key={it.id} className="border-b pb-8">
                    {/* Item top row */}
                    <div className="grid grid-cols-[96px_1fr_auto] gap-4 items-start">
                        <div className="relative h-24 w-24 overflow-hidden rounded-md ring-1 ring-black/10">
                        <Image src={it.thumbnail || "/placeholder.svg"} alt={it.title} fill className="object-cover" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="text-sm font-medium text-gray-900">{it.title}</div>
                            <div>
                                {it.variant?.options && it.variant?.options.map((option=>
                                    option.value != "Default option value" ?
                                    <div key={option.id} className="text-xs font-medium text-gray-700">{option.option?.title + ": " +option.value}</div>:
                                    <div key={option.id}/>
                                ))
                                }
                            </div>

                        {/* Quantity stepper */}
                        <div>
                            <div className="inline-flex items-center rounded-md border border-gray-300">
                                <button
                                onClick={() => updateQty(it.id, it.quantity-1)}
                                className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                                aria-label="減少數量"
                                disabled={it.quantity <= 1}
                                >
                                <Minus className="h-4 w-4" />
                                </button>
                                <div className="px-4 py-2 text-sm tabular-nums">{it.quantity}</div>
                                <button
                                onClick={() => updateQty(it.id, it.quantity+1)}
                                className="px-3 py-2 hover:bg-gray-50"
                                aria-label="增加數量"
                                >
                                <Plus className="h-4 w-4" />
                                </button>
                                
                            </div>
                            {/* Price + remove */}
                            <div className="text-right">
                            <div className="text-base font-medium">{fmt(it.unit_price * it.quantity)}</div>
                            <button
                                onClick={() => removeItem(it.id)}
                                className="mt-2 text-xs text-gray-500 hover:text-gray-800 underline underline-offset-4"
                            >
                                移除
                            </button>
                            </div>
                            </div>
                        </div>
                    </div>
                    </div>
                ))
                )}
                {/* Info line */}
                                {/* Notes textarea */}
                {info && cart.items.length>0 && 
                
                <div>
                    <p className="text-gray-700 text-sm leading-6 mb-2">{info}</p>
                    <Textarea
                        value={note}
                        onChange={(e) => updateNote(e.target.value)}
                        placeholder="可在此處填寫尺寸、備註或其它要求..."
                        className="min-h-[120px] resize-vertical"
                    />
                    </div>
                    }
            </div>

            {/* Summary */}
            <div className="px-6 py-5 border-t space-y-4">
                <div className="flex items-center justify-between">
                <span className="text-lg">小計</span>
                <span className="text-lg font-medium">{fmt(subtotal)}</span>
                </div>
                <p className="text-sm text-gray-500">結賬時計算運費、稅金和折扣代碼。</p>
                <button className="w-full rounded-md bg-black text-white py-3 text-sm font-medium hover:bg-black/90">
                前往結帳
                </button>
            </div>
            </div>
        </SheetContent>
        </Sheet>
    )
}