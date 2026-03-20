import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Refund Policy' }

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>{title}</h2>
    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{children}</div>
  </section>
)

export default function RefundPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0', paddingTop: 80 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', textDecoration: 'none', fontSize: 14, marginBottom: 28 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div style={{ background: 'white', borderRadius: 20, padding: '40px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>↩️</div>
          <h1 style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 700, color: '#14532d', marginBottom: 8 }}>Refund & Return Policy</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>Last updated: January 1, 2026 · We stand behind every order.</p>

          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '16px 20px', marginBottom: 28 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#14532d', margin: 0 }}>🌿 Our Quality Guarantee</p>
            <p style={{ fontSize: 13, color: '#166534', margin: '6px 0 0' }}>If you're not 100% satisfied with the quality of your produce, we'll make it right — no questions asked.</p>
          </div>

          <Section title="Eligible Refund Scenarios">
            <ul style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 6 }}>Damaged or spoiled produce received</li>
              <li style={{ marginBottom: 6 }}>Wrong items delivered</li>
              <li style={{ marginBottom: 6 }}>Missing items from your order</li>
              <li style={{ marginBottom: 6 }}>Significantly underweight items (more than 10% variance)</li>
              <li>Order never delivered</li>
            </ul>
          </Section>

          <Section title="How to Request a Refund">
            <ol style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 8 }}>Contact us within <strong>24 hours</strong> of delivery</li>
              <li style={{ marginBottom: 8 }}>Send a clear photo of the issue to <a href="mailto:support@vegfru.in" style={{ color: '#16a34a' }}>support@vegfru.in</a> or WhatsApp <a href="https://wa.me/919800000001" style={{ color: '#16a34a' }}>+91 98000 00001</a></li>
              <li style={{ marginBottom: 8 }}>Include your order number (found in your confirmation email or order history)</li>
              <li>We'll process within <strong>24-48 hours</strong></li>
            </ol>
          </Section>

          <Section title="Refund Methods & Timeline">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[
                ['UPI / Card Payment', '3–5 business days', '#16a34a'],
                ['COD Order',          'VegFru wallet credit (instant)', '#3b82f6'],
                ['Cancelled Order',    '3–5 business days', '#16a34a'],
                ['Partial Refund',     '3–5 business days', '#16a34a'],
              ].map(([type, time, color]) => (
                <div key={type} style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{type}</div>
                  <div style={{ fontSize: 11, color: color as string, marginTop: 4 }}>{time}</div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Non-Refundable Items">
            <ul style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>Items reported after 24 hours of delivery</li>
              <li style={{ marginBottom: 4 }}>Produce that was not stored properly after delivery</li>
              <li>Delivery charges (unless order was never delivered)</li>
            </ul>
          </Section>

          <Section title="Order Cancellation">
            <p>You can cancel an order <strong>before it is marked "Confirmed"</strong> by contacting us immediately. Once our team begins preparing your order, cancellation may not be possible.</p>
          </Section>

          <Section title="Contact for Refunds">
            <p>📧 <a href="mailto:support@vegfru.in" style={{ color: '#16a34a' }}>support@vegfru.in</a></p>
            <p>📱 WhatsApp: <a href="https://wa.me/919800000001" style={{ color: '#16a34a' }}>+91 98000 00001</a> (9 AM – 8 PM)</p>
            <p>📞 Phone: <a href="tel:+919800000001" style={{ color: '#16a34a' }}>+91 98000 00001</a></p>
          </Section>
        </div>
      </div>
    </div>
  )
}
