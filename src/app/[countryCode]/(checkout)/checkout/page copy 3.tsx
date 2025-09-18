"use client"

import type React from "react"

import { useState } from "react"
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

const validateExpiry = (expiry: string) => {
  if (!expiry) return { isValid: false, error: "輸入有效的到期日期" }

  const cleaned = expiry.replace(/\D/g, "")
  if (cleaned.length !== 4) {
    return { isValid: false, error: "輸入有效的到期日期" }
  }

  const month = Number.parseInt(cleaned.substring(0, 2))
  const year = Number.parseInt(cleaned.substring(2, 4)) + 2000

  if (month < 1 || month > 12) {
    return { isValid: false, error: "輸入有效的到期日期" }
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { isValid: false, error: "輸入有效的到期日期" }
  }

  return { isValid: true, error: "" }
}

const validateCVV = (cvv: string, cardType: string) => {
  if (!cvv) return { isValid: false, error: "輸入卡片上的 CVV 或安全碼" }

  const cleaned = cvv.replace(/\D/g, "")
  const expectedLength = cardType === "amex" ? 4 : 3

  if (cleaned.length !== expectedLength) {
    return { isValid: false, error: "輸入卡片上的 CVV 或安全碼" }
  }

  return { isValid: true, error: "" }
}

const validateCardholderName = (name: string) => {
  if (!name.trim()) {
    return { isValid: false, error: "輸入您的姓名 (必須與印在卡片上的姓名一字不差)" }
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: "輸入您的姓名 (必須與印在卡片上的姓名一字不差)" }
  }

  return { isValid: true, error: "" }
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

export default function CheckoutPage() {
  const [contactMethod, setContactMethod] = useState("email")
  const [shippingMethod, setShippingMethod] = useState("delivery")
  const [paymentMethod, setPaymentMethod] = useState("credit-card")
  const [sameAsBilling, setSameAsBilling] = useState(true)
  const [promoCode, setPromoCode] = useState("")
  const [newsletter, setNewsletter] = useState(false)

  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
    email: "",
    firstName: "",
    lastName: "",
    country: "hk",
  })

  const [errors, setErrors] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    cardholderName: "",
    email: "",
    firstName: "",
    lastName: "",
  })

  const [cardType, setCardType] = useState("")

  const subtotal = CART_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0)
  const shipping = 0 // Free shipping
  const total = subtotal + shipping

  const currency = (n: number) =>
    new Intl.NumberFormat("zh-HK", { style: "currency", currency: "HKD", minimumFractionDigits: 2 }).format(n)

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, cardNumber: value }))

    const validation = validateCreditCard(value)
    setErrors((prev) => ({ ...prev, cardNumber: validation.error }))
    setCardType(validation.cardType || "")
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "")
    if (value.length >= 2) {
      value = value.substring(0, 2) + "/" + value.substring(2, 4)
    }
    setFormData((prev) => ({ ...prev, expiry: value }))

    const validation = validateExpiry(value)
    setErrors((prev) => ({ ...prev, expiry: validation.error }))
  }

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 4)
    setFormData((prev) => ({ ...prev, cvv: value }))

    const validation = validateCVV(value, cardType)
    setErrors((prev) => ({ ...prev, cvv: validation.error }))
  }

  const handleCardholderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData((prev) => ({ ...prev, cardholderName: value }))

    const validation = validateCardholderName(value)
    setErrors((prev) => ({ ...prev, cardholderName: validation.error }))
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <Navbar navFix={true}/>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Forms */}
          <div className="space-y-8">
            {/* Express Checkout */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-center mb-4">
                <h2 className="text-lg font-medium mb-4">快速結帳</h2>
                <button className="w-full bg-[#5A31F4] text-white py-3 rounded-md font-medium hover:bg-[#4C28D4] flex items-center justify-center gap-2">
                  <span className="bg-white text-[#5A31F4] px-2 py-1 rounded text-xs font-bold">Shop</span>
                  <span>Pay</span>
                </button>
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
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
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
                <div className="flex items-center space-x-2 p-3 border rounded-md">
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
                </div>
              </RadioGroup>

              {/* Country/Region */}
              <div className="mb-4">
                <Label htmlFor="country" className="text-sm font-medium">
                  國家/地區
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇國家/地區" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    名字 (台灣顧客須填寫收件人正...
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="名字"
                    value={formData.firstName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
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
                    value={formData.lastName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Company */}
              <div className="mb-4">
                <Label htmlFor="company" className="text-sm font-medium">
                  公司 (選填)
                </Label>
                <Input id="company" placeholder="公司" />
              </div>

              {/* Address */}
              <div className="mb-4">
                <Label htmlFor="address" className="text-sm font-medium">
                  地址
                </Label>
                <Input id="address" placeholder="地址" />
              </div>

              {/* Apartment */}
              <div className="mb-4">
                <Label htmlFor="apartment" className="text-sm font-medium">
                  台灣顧客必填身份證字號 (只供運關用途)
                </Label>
                <Input id="apartment" placeholder="公寓、套房等" />
              </div>

              {/* City and Region */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="city" className="text-sm font-medium">
                    市
                  </Label>
                  <Input id="city" placeholder="市" />
                </div>
                <div>
                  <Label htmlFor="region" className="text-sm font-medium">
                    區域
                  </Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="區域" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hk-island">香港島</SelectItem>
                      <SelectItem value="kowloon">九龍</SelectItem>
                      <SelectItem value="nt">新界</SelectItem>
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
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-4">付款</h3>
              <p className="text-sm text-gray-600 mb-4">所有交易都受安全加密保護。</p>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                {/* Credit Card */}
                <div className="border rounded-md">
                  <div className="flex items-center space-x-2 p-4">
                    <RadioGroupItem value="credit-card" id="credit-card" />
                    <Label htmlFor="credit-card" className="flex-1 font-medium">
                      信用卡
                    </Label>
                    <div className="flex gap-2">
                      <Image src="/visa-logo.png" alt="Visa" width={32} height={20} className="h-5 w-auto" />
                      <Image
                        src="/mastercard-logo.png"
                        alt="Mastercard"
                        width={32}
                        height={20}
                        className="h-5 w-auto"
                      />
                      <Image
                        src="/amex-logo.png"
                        alt="American Express"
                        width={32}
                        height={20}
                        className="h-5 w-auto"
                      />
                      <Image src="/unionpay-logo.png" alt="UnionPay" width={32} height={20} className="h-5 w-auto" />
                    </div>
                  </div>

                  {paymentMethod === "credit-card" && (
                    <div className="px-4 pb-4 space-y-4 border-t">
                      <div>
                        <Input
                          placeholder="信用卡號碼"
                          value={formData.cardNumber}
                          onChange={handleCardNumberChange}
                          className={errors.cardNumber ? "border-red-500" : ""}
                        />
                        {errors.cardNumber && <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Input
                            placeholder="到期日 (MM / YY)"
                            value={formData.expiry}
                            onChange={handleExpiryChange}
                            maxLength={5}
                            className={errors.expiry ? "border-red-500" : ""}
                          />
                          {errors.expiry && <p className="text-red-500 text-sm mt-1">{errors.expiry}</p>}
                        </div>
                        <div>
                          <Input
                            placeholder="安全碼"
                            value={formData.cvv}
                            onChange={handleCVVChange}
                            className={errors.cvv ? "border-red-500" : ""}
                          />
                          {errors.cvv && <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>}
                        </div>
                      </div>
                      <div>
                        <Input
                          placeholder="卡片上登記的姓名"
                          value={formData.cardholderName}
                          onChange={handleCardholderNameChange}
                          className={errors.cardholderName ? "border-red-500" : ""}
                        />
                        {errors.cardholderName && <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="same-billing"
                          checked={sameAsBilling}
                          onCheckedChange={(checked) => setSameAsBilling(checked as boolean)}
                        />
                        <Label htmlFor="same-billing" className="text-sm">
                          使用運送地址做為帳單地址
                        </Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* QFPay */}
                <div className="flex items-center space-x-2 p-4 border rounded-md">
                  <RadioGroupItem value="qfpay" id="qfpay" />
                  <Label htmlFor="qfpay" className="flex-1">
                    QFPay Secure Checkout 2.0
                  </Label>
                  <div className="flex gap-1">
                    <div className="w-6 h-4 bg-green-500 rounded-sm"></div>
                    <div className="w-6 h-4 bg-blue-500 rounded-sm"></div>
                    <div className="w-6 h-4 bg-blue-400 rounded-sm"></div>
                    <div className="w-6 h-4 bg-red-500 rounded-sm"></div>
                    <span className="text-xs text-gray-500">+2</span>
                  </div>
                </div>

                {/* Bank Transfer */}
                <div className="flex items-center space-x-2 p-4 border rounded-md">
                  <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                  <Label htmlFor="bank-transfer" className="flex-1">
                    香港銀行轉帳 / ATM入數
                  </Label>
                </div>
              </RadioGroup>

              {/* Remember Info */}
              <div className="mt-6">
                <h4 className="font-medium mb-2">記住我的帳號</h4>
                <Input placeholder="儲存我的資訊，加快結帳速度" />
              </div>
            </div>

            {/* Complete Order Button */}
            <Button className="w-full bg-black text-white py-4 text-base font-medium hover:bg-black/90">
              立即付款
            </Button>

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
