import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Privacy Policy' }

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 28 }}>
    <h2 style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #f3f4f6' }}>{title}</h2>
    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{children}</div>
  </section>
)

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FEFAE0', paddingTop: 80 }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280', textDecoration: 'none', fontSize: 14, marginBottom: 28 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div style={{ background: 'white', borderRadius: 20, padding: '40px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
          <h1 style={{ fontFamily: 'serif', fontSize: 32, fontWeight: 700, color: '#14532d', marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>Last updated: January 1, 2026 · Effective immediately</p>

          <Section title="1. Information We Collect">
            <p style={{ marginBottom: 8 }}>We collect the following information when you use VegFru:</p>
            <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
              <li style={{ marginBottom: 4 }}><strong>Account information:</strong> Name, email address, phone number, and password (hashed with bcrypt)</li>
              <li style={{ marginBottom: 4 }}><strong>Order information:</strong> Delivery address, items ordered, payment method, and order history</li>
              <li style={{ marginBottom: 4 }}><strong>Device information:</strong> Browser type, IP address, and approximate location</li>
              <li style={{ marginBottom: 4 }}><strong>Usage data:</strong> Pages visited, search queries, and time spent on our platform</li>
            </ul>
            <p>We do <strong>not</strong> store credit/debit card numbers. All payments are processed securely via Razorpay.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul style={{ paddingLeft: 20 }}>
              <li style={{ marginBottom: 4 }}>Process and deliver your orders</li>
              <li style={{ marginBottom: 4 }}>Send order confirmation and delivery updates via email</li>
              <li style={{ marginBottom: 4 }}>Improve our product catalog and recommendations</li>
              <li style={{ marginBottom: 4 }}>Respond to customer support requests</li>
              <li style={{ marginBottom: 4 }}>Prevent fraud and ensure platform security</li>
              <li>Send promotional offers (only if you opt-in to our newsletter)</li>
            </ul>
          </Section>

          <Section title="3. Data Storage & Security">
            <p>Your data is stored securely on Convex, a SOC 2 Type II certified database platform. We implement:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li style={{ marginBottom: 4 }}>bcrypt password hashing (10 rounds)</li>
              <li style={{ marginBottom: 4 }}>JWT tokens with 7-day expiry</li>
              <li style={{ marginBottom: 4 }}>HTTPS encryption for all data in transit</li>
              <li>Rate limiting on all authentication endpoints</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing">
            <p>We do <strong>not</strong> sell your personal data. We share limited data only with:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li style={{ marginBottom: 4 }}><strong>Delivery partners:</strong> Name, phone, and address for order delivery</li>
              <li style={{ marginBottom: 4 }}><strong>Razorpay:</strong> Order amount and basic info for payment processing</li>
              <li>Law enforcement if legally required</li>
            </ul>
          </Section>

          <Section title="5. Your Rights">
            <p>You have the right to:</p>
            <ul style={{ paddingLeft: 20, marginTop: 8 }}>
              <li style={{ marginBottom: 4 }}>Access all personal data we hold about you</li>
              <li style={{ marginBottom: 4 }}>Request correction of inaccurate data</li>
              <li style={{ marginBottom: 4 }}>Request deletion of your account and data</li>
              <li>Opt out of marketing communications at any time</li>
            </ul>
            <p style={{ marginTop: 8 }}>To exercise these rights, email <a href="mailto:privacy@vegfru.in" style={{ color: '#16a34a' }}>privacy@vegfru.in</a>.</p>
          </Section>

          <Section title="6. Cookies">
            <p>We use essential cookies only: authentication tokens (JWT) stored as HTTP-only cookies. We do not use tracking or advertising cookies.</p>
          </Section>

          <Section title="7. Contact Us">
            <p>For privacy concerns, contact our Data Protection Officer:</p>
            <p style={{ marginTop: 8 }}>📧 <a href="mailto:privacy@vegfru.in" style={{ color: '#16a34a' }}>privacy@vegfru.in</a></p>
            <p>📞 <a href="tel:+919800000001" style={{ color: '#16a34a' }}>+91 98000 00001</a></p>
            <p>📍 VegFru, Faridabad, Haryana, India - 121001</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
