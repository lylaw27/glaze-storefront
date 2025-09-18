"use client"

import { isManual, isStripe } from "@lib/constants"
import { placeOrder, updateCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useElements, useStripe } from "@stripe/react-stripe-js"
// ...other imports
import { useEffect } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import { Button } from "@lib/components/ui/button"
import { add } from "lodash"
import { addAddressToCart, addShippingMethod } from "app/[countryCode]/(checkout)/fetch"
import { CartAddress } from "app/[countryCode]/(checkout)/checkout/page"

const PaymentButton = ({
  address,
  cart,
  email,
  notReady,
  refreshCart,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  address: CartAddress,
  email: string,
  notReady: boolean,
  refreshCart: () => void,
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { countryCode } = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    // TODO change the provider_id if using a different ID in medusa-config.ts
    (session) => session.provider_id === "pp_stripe_stripe"
  )

  const onPaymentCompleted = async () => {
    //Free Shipping self set option_id
    const cartWithShipping = addShippingMethod(cart,"so_01K4MAHEVKN4K0YGE7SRDJVCCH")
    const updatedCart = addAddressToCart(cart, address, email)
    const finalCart = await Promise.all([cartWithShipping, updatedCart])
    await placeOrder(finalCart[0].cart.id)
      .catch((err) => {
        setErrorMessage(err.message)
      })
      .finally(() => {
        setSubmitting(false)
      })
      refreshCart()
  }

  const stripe = useStripe()
  const elements = useElements()

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    if (!stripe || !elements || !cart) {
      return
    }
    setSubmitting(true)

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(submitError.message || null)
      setSubmitting(false)
      return
    }

    const clientSecret = paymentSession?.data?.client_secret as string

      await stripe
      .confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${
            window.location.origin
          }/api/capture-payment/${cart.id}?country_code=${countryCode}`,
          payment_method_data: {
            billing_details: {
              name: "Larry Law",
              address: {
                city: address.city,
                country: address.country_code,
                line1: address.address_1,
                line2: address.address_2,
                postal_code: "000",
                state: address.province,
              },
              email: email,
              phone: "12345678",
            },
          },
          shipping: {
            name: address.first_name + " " + (address.last_name || ""),
            address: {
              city: address.city,
              country: address.country_code,
              line1: address.address_1,
              line2: address.address_2,
              postal_code: "00000",
              state: address.province,
            }, 
          }
        },
        redirect: "if_required",
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent
          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
            return
          }

          setErrorMessage(error.message || null)
          setSubmitting(false)
          return
        }

        if (
          paymentIntent.status === "requires_capture" ||
          paymentIntent.status === "succeeded"
        ) {
          onPaymentCompleted()
        }
      })
  }

  useEffect(() => {
  if (cart.payment_collection?.status === "authorized") {
      onPaymentCompleted()
    }
  }, [cart.payment_collection?.status])

  useEffect(() => {
    elements?.getElement("payment")?.on("change", (e) => {
      if (!e.complete) {
        // redirect to payment step if not complete
        router.push(pathname + "?step=payment", {
          scroll: false,
        })
      }
    })
  }, [elements])

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        // size="large"
        // isLoading={submitting}
        data-testid={dataTestId}
        className="w-full bg-black text-white py-4 text-base font-medium hover:bg-black/90"
      >
        Place order
      </Button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </>
  )
}

export default PaymentButton
