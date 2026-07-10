// Server Component — passes null stripe initially (SSR)
import {CheckoutPageClient} from './_components/CheckoutPageClient';
export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
