import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Terms of Service' }

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>{title}</h2>
    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{children}</div>
  </section>
)

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0', paddingTop: 80 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', textDecoration: 'none', fontSize: 14, marginBottom: 28 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div style={{ background: 'white', borderRadius: 20, padding: '40px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <h1 style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 700, color: '#14532d', marginBottom: 8 }}>Terms of Service</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>Last updated: January 1, 2026 · By using VegFru you agree to these terms.</p>

          <Section title="1. Service Description">
            <p>VegFru is an online platform for ordering fresh vegetables and fruits, with delivery in Faridabad, Gurugram, and Delhi NCR. We connect customers with local farms and manage delivery through our partner network.</p>
          </Section>

          <Section title="2. Ordering & Pricing">
            <ul style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>All prices are in Indian Rupees (₹) and inclusive of GST where applicable</li>
              <li style={{ marginBottom: 4 }}>Prices may vary due to market conditions — the price shown at checkout is final</li>
              <li style={{ marginBottom: 4 }}>Free delivery on orders above ₹299; ₹49 delivery charge below that</li>
              <li style={{ marginBottom: 4 }}>Coupon codes cannot be combined and are subject to availability</li>
              <li>We reserve the right to refuse or cancel orders at our discretion</li>
            </ul>
          </Section>

          <Section title="3. Delivery Policy">
            <ul style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>Estimated delivery time: 4–6 hours after order confirmation</li>
              <li style={{ marginBottom: 4 }}>Delivery available in Faridabad, Gurugram, Delhi, Noida, and Ghaziabad</li>
              <li style={{ marginBottom: 4 }}>Customer must be available at the delivery address or designate a recipient</li>
              <li>VegFru is not liable for delays caused by weather, traffic, or force majeure</li>
            </ul>
          </Section>

          <Section title="4. Product Quality">
            <p>We guarantee farm-fresh quality. If you receive damaged, spoiled, or incorrect items, contact us within 24 hours with a photo for a full refund or replacement. See our <Link href="/refund" style={{ color: '#16a34a' }}>Refund Policy</Link>.</p>
          </Section>

          <Section title="5. User Accounts">
            <ul style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>You must provide accurate information when creating an account</li>
              <li style={{ marginBottom: 4 }}>You are responsible for maintaining the security of your account password</li>
              <li>We reserve the right to suspend accounts that violate these terms</li>
            </ul>
          </Section>

          <Section title="6. Payments">
            <p>We accept Cash on Delivery (COD), UPI, and card payments via Razorpay. For COD orders, payment is collected at the time of delivery. Failed online payments result in automatic order cancellation.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>VegFru's liability is limited to the value of the order placed. We are not responsible for indirect, incidental, or consequential damages. Our maximum liability shall not exceed ₹10,000 per incident.</p>
          </Section>

          <Section title="8. Contact">
            <p>📧 <a href="mailto:legal@vegfru.in" style={{ color: '#16a34a' }}>legal@vegfru.in</a> · 📞 <a href="tel:+919800000001" style={{ color: '#16a34a' }}>+91 98000 00001</a></p>
          </Section>
        </div>
      </div>
    </div>
  )
}
