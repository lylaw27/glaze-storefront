"use client"

import { isManual, isStripe } from "@lib/constants"
import { placeOrder, updateCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js"
// ...other imports
import { useEffect } from "react"
import { useParams, usePathname, useRouter } from "next/navigation"
import React, { useState } from "react"

import { addAddressToCart, addShippingMethod } from "app/[countryCode]/(checkout)/fetch"
import { CartAddress } from "app/[countryCode]/(checkout)/checkout/page"
import { ConfirmationToken, StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js"

const ExpressCheckoutButton = ({
//   address,
  cart,
//   email,
  notReady,
  refreshCart,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
//   address: CartAddress,
//   email: string,
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

  const onPaymentCompleted = async (confirmationToken: ConfirmationToken) => {
    //Free Shipping self set option_id
    const cartWithShipping = addShippingMethod(cart,"so_01K4MAHEVKN4K0YGE7SRDJVCCH")

    const email = confirmationToken.payment_method_preview.billing_details.email || ""

    const address = {
        first_name: confirmationToken.payment_method_preview.billing_details.name || "No Name",
        city: confirmationToken.payment_method_preview.billing_details.address?.city || "",
        // country_code: confirmationToken.payment_method_preview.billing_details.address?.country || "",
        country_code: "hk",
        address_1: confirmationToken.payment_method_preview.billing_details.address?.line1 || "",
        address_2: confirmationToken.payment_method_preview.billing_details.address?.line2 || "",
        province: confirmationToken.payment_method_preview.billing_details.address?.state || "",
        postal_code: confirmationToken.payment_method_preview.billing_details.address?.postal_code || "",
    } as CartAddress

    const updatedCart = addAddressToCart(cart, address, email)
    const finalCart = await Promise.all([cartWithShipping, updatedCart])
    refreshCart()
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

const expressOptions = {
    emailRequired: true,
    // shippingAddressRequired: true,
    // allowedShippingCountries: ['HK'],
//   shippingRates: [
//   {
//     id: 'free-shipping',
//     displayName: 'Free shipping',
//     amount: 0,
//     deliveryEstimate: {
//       maximum: {unit: 'day', value: 7},
//       minimum: {unit: 'day', value: 5}
//     }
//   },
// ]
}

  const onConfirm = async (event: StripeExpressCheckoutElementConfirmEvent) => {
    if (!stripe || !elements || !cart) {
      return
    }
  
        const {error: submitError} = await elements.submit();
        if (submitError) {
            setErrorMessage(submitError.message || null);
            return;
        }

        const clientSecret = paymentSession?.data?.client_secret as string

  
      // Create the PaymentIntent and obtain clientSecret
      // const res = await fetch('/create-intent', {
      //   method: 'POST',
      // });
      // const {client_secret: clientSecret} = await res.json();
  
      // Confirm the PaymentIntent using the details collected by the Express Checkout Element

        //   Create a ConfirmationToken using the details collected by the Express Checkout Element
        const {error, confirmationToken} = await stripe.createConfirmationToken({
        elements,
        params: {
            payment_method_data: {
            billing_details: {
                name: 'Google Pay User',
            },
            },
            return_url: `${
            window.location.origin
          }/api/capture-payment/${cart.id}?country_code=${countryCode}`,
        
        }
        });
    // const confirmationToken = null
      const {error:confirmError, paymentIntent} = await stripe.confirmPayment({
        // `elements` instance used to create the Express Checkout Element
        // elements,
        // `clientSecret` from the created PaymentIntent
        clientSecret,
        confirmParams: {
            confirmation_token: confirmationToken?.id,
            return_url: `${
            window.location.origin
          }/api/capture-payment/${cart.id}?country_code=${countryCode}`,
        },
        redirect: "if_required",
      });
  
      if (confirmError) {
          const pi = confirmError.payment_intent
          if (
            confirmationToken &&
            ((pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded"))
          ) {
            onPaymentCompleted(confirmationToken)
            return
          }

          setErrorMessage(confirmError.message || null)
          setSubmitting(false)
          return
        }

        if (
            confirmationToken &&    
            (paymentIntent.status === "requires_capture" ||
            paymentIntent.status === "succeeded")
        ) {
          onPaymentCompleted(confirmationToken)
        }
    };

//   useEffect(() => {
//   if (cart.payment_collection?.status === "authorized") {
//       onPaymentCompleted(confirmationToken)
//     }
//   }, [cart.payment_collection?.status])

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
        <ExpressCheckoutElement onConfirm={onConfirm} options={expressOptions}/>
    </>
  )
}

export default ExpressCheckoutButton
