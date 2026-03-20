'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, ShoppingBag, Trash2, ArrowRight, Leaf, Plus, Minus } from 'lucide-react'
import { products } from '@/app/data'

interface CartItem { id: number; qty: number }

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onRemove: (id: number) => void
  onUpdateQty: (id: number, qty: number) => void
}

export default function CartSidebar({ isOpen, onClose, items, onRemove, onUpdateQty }: CartSidebarProps) {
  const router = useRouter()

  const cartProducts = items.map(item => ({
    ...item, product: products.find(p => p.id === item.id)!,
  })).filter(i => i.product)

  const subtotal  = cartProducts.reduce((s, i) => s + i.product.price * i.qty, 0)
  const savings   = cartProducts.reduce((s, i) => s + (i.product.originalPrice - i.product.price) * i.qty, 0)
  const delivery  = subtotal >= 299 ? 0 : 49
  const total     = subtotal + delivery

  // Persist cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('vegfru_cart', JSON.stringify(items))
  }, [items])

  const goToCheckout = () => {
    onClose()
    router.push('/checkout')
  }

  return (
    <>
      <div className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />

      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#FEFAE0] z-50 flex flex-col shadow-2xl transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-green-100 bg-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-5 h-5 text-forest-700" />
            <h2 className="font-display text-lg font-bold text-forest-800">Your Cart</h2>
            {items.length > 0 && (
              <span className="bg-green-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {items.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-green-50 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                <Leaf className="w-8 h-8 text-green-300" />
              </div>
              <div>
                <p className="font-display font-bold text-forest-800 text-lg">Cart is empty</p>
                <p className="text-gray-500 text-sm mt-1">Add some fresh produce!</p>
              </div>
              <button onClick={onClose} className="bg-forest-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-forest-800 transition-colors">
                Browse Products
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cartProducts.map(({ product, qty }) => (
                <div key={product.id} className="flex gap-3 bg-white rounded-2xl p-3 border border-green-50">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                    {product.image
                      ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">{product.emoji}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.unit}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-100">
                        <button onClick={() => qty <= 1 ? onRemove(product.id) : onUpdateQty(product.id, qty - 1)}
                          className="w-6 h-6 rounded-md bg-white flex items-center justify-center hover:bg-green-50 transition-colors border border-gray-100">
                          <Minus className="w-3 h-3 text-gray-600" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-forest-800">{qty}</span>
                        <button onClick={() => onUpdateQty(product.id, qty + 1)}
                          className="w-6 h-6 rounded-md bg-white flex items-center justify-center hover:bg-green-50 transition-colors border border-gray-100">
                          <Plus className="w-3 h-3 text-gray-600" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm text-forest-800">₹{product.price * qty}</p>
                        <p className="text-xs text-gray-400 line-through">₹{product.originalPrice * qty}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => onRemove(product.id)} className="p-1 hover:text-red-500 text-gray-400 transition-colors self-start">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartProducts.length > 0 && (
          <div className="px-6 py-5 bg-white border-t border-green-100">
            {/* Free delivery banner */}
            <div className={`text-xs rounded-xl px-4 py-2.5 mb-4 text-center font-medium ${delivery === 0 ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              {delivery === 0 ? '🎉 Free delivery unlocked!' : `Add ₹${299 - subtotal} more for free delivery`}
            </div>
            {/* Totals */}
            <div className="flex flex-col gap-2 mb-4 text-sm">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>₹{subtotal}</span></div>
              {savings > 0 && <div className="flex justify-between text-green-600"><span>Savings</span><span>-₹{savings}</span></div>}
              <div className="flex justify-between text-gray-500"><span>Delivery</span><span className={delivery === 0 ? 'text-green-600 font-medium' : ''}>{delivery === 0 ? 'FREE' : `₹${delivery}`}</span></div>
              <div className="flex justify-between font-bold text-forest-800 text-base pt-2 border-t border-green-100">
                <span>Total</span><span>₹{total}</span>
              </div>
            </div>
            <button onClick={goToCheckout}
              className="w-full bg-forest-700 hover:bg-forest-800 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.98]">
              Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </>
  )
}
