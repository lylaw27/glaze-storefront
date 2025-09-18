"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, Lock, Smartphone, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Navbar from "app/[countryCode]/(main)/components/navbar"
import StripePayment from "app/[countryCode]/(main)/components/stripePayment"
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from "@stripe/react-stripe-js"
import Payment from "@modules/checkout/components/payment"
import { useCart } from "app/cartProvider"
import { createPaymentSession } from "../fetch"
import { getCart } from "app/[countryCode]/(main)/fetch"
import { loadStripe, StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js"
import PaymentButton from "@modules/checkout/components/payment-button"
import { set } from "lodash"
import ExpressCheckoutButton from "./expressCheckout"

type CartItem = {
  id: number
  name: string
  price: number
  image: string
  qty: number
  info?: string
}

const COUNTRIES = [
  { value: "hk", label: "香港特別行政區" },
]

export interface CartAddress {
  first_name: string,
  last_name?: string,
  company?: string,
  address_1: string,
  address_2: string,
  city: string,
  postal_code?: string,
  country_code: string,
  province: string,
  phone?: string
}

const defaultAddress: CartAddress = {
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "香港特別行政區",
  country_code: "hk",
  province: "九龍",
}

const validateCreditCard = (cardNumber: string) => {
  // Remove spaces and non-digits
  const cleaned = cardNumber.replace(/\D/g, "")

  // Check if empty
  if (!cleaned) return { isValid: false, error: "輸入卡號" }

  // Check length
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { isValid: false, error: "輸入有效的信用卡號碼" }
  }

  // Luhn algorithm
  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = Number.parseInt(cleaned[i])

    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isEven = !isEven
  }

  const isValid = sum % 10 === 0
  return {
    isValid,
    error: isValid ? "" : "輸入有效的信用卡號碼",
    cardType: getCardType(cleaned),
  }
}

const getCardType = (cardNumber: string) => {
  const patterns = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    unionpay: /^62/,
  }

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cardNumber)) {
      return type
    }
  }
  return "unknown"
}

const CART_ITEMS: CartItem[] = [
  {
    id: 1,
    name: "加購｜120g碎白水晶｜淨化消磁",
    price: 30,
    image: "/images/product11-1.jpeg",
    qty: 1,
    info: "購買手鏈x2，需要購買x2，如此類推",
  },
  {
    id: 2,
    name: "葡萄石黃水晶白幽靈14K包金水晶手鏈",
    price: 798,
    image: "/images/product14-1.jpeg",
    qty: 1,
    info: "13cm",
  },
]

export function Checkout() {

  const [shippingMethod, setShippingMethod] = useState("delivery")

  const [activeSession, setActiveSession] = useState<boolean>(false)


  const [newsletter, setNewsletter] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const [address, setAddress] = useState<CartAddress>(defaultAddress)
  const [email, setEmail] = useState<string>("")

  // const [formData, setFormData] = useState({
  //   cardNumber: "",
  //   expiry: "",
  //   cvv: "",
  //   cardholderName: "",
  //   email: "",
  //   firstName: "",
  //   lastName: "",
  //   country: "hk",
  // })

  const [errors, setErrors] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
    email: "",
    firstName: "",
    lastName: "",
  })

  const { cart ,refreshCart } = useCart()


  return (
          <div className="space-y-8">
            {/* Express Checkout */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-center mb-4">
                <h2 className="text-lg font-medium mb-4">快速結帳</h2>
                {/* <button className="w-full bg-[#5A31F4] text-white py-3 rounded-md font-medium hover:bg-[#4C28D4] flex items-center justify-center gap-2">
                  <span className="bg-white text-[#5A31F4] px-2 py-1 rounded text-xs font-bold">Shop</span>
                  <span>Pay</span>
                </button> */}
                <ExpressCheckoutButton 
                  notReady={false} 
                  cart={cart} 
                  refreshCart={refreshCart}
                  data-testid="submit-payment-button"
                />
                <div className="flex items-center gap-4 my-4">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-500">OR</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>
              </div>
            </div>
            {/* <Button className="w-full bg-black text-white py-4 text-base font-medium hover:bg-black/90">立即付款</Button> */}

            {/* Contact Method */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">聯絡方式</h3>
                <Link href="/login" className="text-sm text-blue-600 hover:underline">
                  登入
                </Link>
              </div>
              <div className="mb-4">
                <Input
                  type="email"
                  placeholder="電子郵件"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={newsletter}
                  onCheckedChange={(checked) => setNewsletter(checked as boolean)}
                />
                <Label htmlFor="newsletter" className="text-sm">
                  以電子郵件傳送最新消息和優惠活動給我
                </Label>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-4">配送</h3>

              {/* Shipping Options */}
              <RadioGroup value={shippingMethod} onValueChange={setShippingMethod} className="mb-6">
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex-1">
                    運送
                  </Label>
                  <Smartphone className="h-4 w-4 text-gray-400" />
                </div>
                {/* <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex-1">
                    取貨
                  </Label>
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-md">
                  <RadioGroupItem value="smart-locker" id="smart-locker" />
                  <Label htmlFor="smart-locker" className="flex-1">
                    寄往智能櫃、便利店或其它物流公司服務點
                  </Label>
                </div> */}
              </RadioGroup>

              {/* Country/Region */}
              <div className="mb-4">
                <Label htmlFor="country" className="text-sm font-medium">
                  國家/地區
                </Label>
                <Select
                  value={address.city}
                  onValueChange={(value) => setAddress((prev) => ({ ...prev, city: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇國家/地區" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="香港特別行政區">
                      香港特別行政區
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    名字
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="名字"
                    value={address.first_name}
                    onChange={(e) => setAddress((prev) => ({ ...prev, first_name: e.target.value }))}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    姓氏
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="姓氏"
                    value={address.last_name}
                    onChange={(e) => setAddress((prev) => ({ ...prev, last_name: e.target.value }))}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Address */}
              <div className="mb-4">
                <Label htmlFor="address" className="text-sm font-medium">
                  地址
                </Label>
                <Input 
                  id="address"
                  placeholder="大廈名稱 / 房號"
                  value={address.address_1}
                  onChange={(e) => setAddress((prev) => ({ ...prev, address_1: e.target.value }))}
                />
              </div>

              <div className="mb-4">
                <Input 
                  id="address2"
                  placeholder="街道名稱 (選填)"
                  value={address.address_2}
                  onChange={(e) => setAddress((prev) => ({ ...prev, address_2: e.target.value }))}
                />
              </div>

              {/* City and Region */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="region" className="text-sm font-medium">
                    區域
                  </Label>
                  <Select
                    value={address.province}
                    onValueChange={(value) => setAddress((prev) => ({ ...prev, province: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="區域"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="香港島">香港島</SelectItem>
                      <SelectItem value="九龍">九龍</SelectItem>
                      <SelectItem value="新界">新界</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Phone */}
              <div className="mb-4">
                <Label htmlFor="phone" className="text-sm font-medium">
                  電話
                </Label>
                <Input id="phone" placeholder="電話" />
              </div>

              {/* WhatsApp Notifications */}
              <div className="flex items-center space-x-2">
                <Checkbox id="whatsapp" />
                <Label htmlFor="whatsapp" className="text-sm">
                  訂閱 ShipAny 免費即時 WhatsApp 運送狀態更新通知。
                </Label>
              </div>
            </div>

            {/* Payment */}

            <PaymentElement
              options={{
                layout: "accordion",
                }}
            />

            {/* Complete Order Button */}
            {/* <Button className="w-full bg-black text-white py-4 text-base font-medium hover:bg-black/90">
              立即付款
            </Button> */}
            <PaymentButton 
              notReady={false} 
              cart={cart} 
              email={email} 
              address={address}
              refreshCart={refreshCart}
              data-testid="submit-payment-button"
            />

            {/* Footer Links */}
            <div className="flex justify-center gap-4 text-sm text-gray-600">
              <Link href="/refund-policy" className="hover:underline">
                退款政策
              </Link>
              <Link href="/shipping" className="hover:underline">
                運送
              </Link>
              <Link href="/privacy" className="hover:underline">
                隱私政策
              </Link>
              <Link href="/terms" className="hover:underline">
                服務條款
              </Link>
              <Link href="/contact" className="hover:underline">
                聯絡
              </Link>
            </div>
          </div>
  )
}


export default function CheckoutPage() {

  const stripe = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_KEY || "temp"
  )

  const [activeSession, setActiveSession] = useState<boolean>(false)
  const [promoCode, setPromoCode] = useState("")
  const [clientSecret, setClientSecret] = useState<string | undefined>(undefined)

  const { cart,setCart,refreshCart } = useCart()

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = 0 // Free shipping
  const total = subtotal + shipping

  const currency = (n: number) =>
    new Intl.NumberFormat("zh-HK", { style: "currency", currency: "HKD", minimumFractionDigits: 2 }).format(n)

  useEffect(() => {
    if(!cart.id || activeSession) return
      createPaymentSession(cart)
        .then((payment_collection) => {
          console.log(payment_collection)
        })
        .then((payment_collection) => 
          getCart(cart.id)
        )
        .then((res) => {
          const updatedCart = res.cart
          console.log(updatedCart)
          if(updatedCart){
            setCart(updatedCart)
            setClientSecret(updatedCart?.payment_collection?.payment_sessions?.[0].data.client_secret as string)
            setActiveSession(true)
          }
    })

  }, [cart])

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar navFix={true}/>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}

          {
            activeSession && (
            <Elements stripe={stripe} options={{
              clientSecret,
            }}>
              <Checkout />
          </Elements>
          )}

          {/* Right Column - Order Summary */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-4">訂單摘要</h3>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {CART_ITEMS.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 text-white text-xs rounded-full flex items-center justify-center">
                        {item.qty}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 leading-tight">{item.name}</h4>
                      {item.info && <p className="text-xs text-gray-600 mt-1">{item.info}</p>}
                    </div>
                    <div className="text-sm font-medium">{currency(item.price * item.qty)}</div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="優惠碼"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="outline">套用</Button>
                </div>
              </div>

              {/* Order Totals */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span>小計 · 2 個品項</span>
                  <span>{currency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>折扣</span>
                  <span>於下一步套用</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>運費</span>
                  <span>請輸入運送地址</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>稅金</span>
                  <span>於下一步計算</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>總計</span>
                  <span>HKD {currency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
