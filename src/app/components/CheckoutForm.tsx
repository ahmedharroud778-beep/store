import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { X, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SITE_CONFIG, createWhatsAppLink } from '../../utils/siteConfig';
import { apiRequest } from '../../utils/api';

interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  size?: string;
  color?: string;
  quantity?: number;
}

interface CheckoutFormProps {
  cart: CartItem[];
  onClose: () => void;
  onClearCart: () => void;
}

export function CheckoutForm({ cart, onClose, onClearCart }: CheckoutFormProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    notes: '',
    paymentMethod: 'cash',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState('');
  const [submitError, setSubmitError] = useState('');

  const itemCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const total = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);

  const whatsappLink = useMemo(() => {
    const lines = [
      `Hello ${SITE_CONFIG.storeName}, I placed an order request.`,
      submittedOrderId ? `Order ID: ${submittedOrderId}` : '',
      `Name: ${formData.name}`,
      `Phone: ${formData.phone}`,
      `City: ${formData.city}`,
      'Items:',
      ...cart.map(
        (item) =>
          `- ${item.name} x${item.quantity || 1}${item.size ? `, Size: ${item.size}` : ''}${item.color ? `, Color: ${item.color}` : ''}`,
      ),
      `Total: $${total.toFixed(2)}`,
    ];
    return createWhatsAppLink(lines.join('\n'));
  }, [cart, formData.city, formData.name, formData.phone, submittedOrderId, total]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 6) {
      setSubmitError('Please enter a valid phone number so we can contact you.');
      return;
    }

    const order = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      customer: formData,
      items: cart,
      total,
      paymentMethod: formData.paymentMethod,
    };

    const persistOrder = async () => {
      let finalOrderId = order.id;

      try {
        const response = await apiRequest('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });
        const body = await response.json().catch(() => null);
        if (body?.orderId) {
          finalOrderId = String(body.orderId);
        }
      } catch {
        // Local fallback keeps checkout working if the backend is unavailable.
      }

      const savedOrders = localStorage.getItem('baraa-orders');
      const orders = savedOrders ? JSON.parse(savedOrders) : [];
      orders.push({ ...order, id: finalOrderId });
      localStorage.setItem('baraa-orders', JSON.stringify(orders));

      setSubmittedOrderId(finalOrderId);
      setIsSubmitted(true);
      onClearCart();
    };

    void persistOrder();
  };

  if (isSubmitted) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div className="min-h-full w-full flex items-start justify-center p-4 py-8">
          <div
            className="bg-card rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="mb-2" style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)' }}>
            {t('checkout.success')}
          </h2>
          <p className="text-muted-foreground">{t('checkout.thanks')}</p>
          <div className="mt-4 rounded-xl bg-muted/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order ID</p>
            <p className="mt-1 text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
              {submittedOrderId}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep this ID so the store can find your order quickly.
            </p>
          </div>
          <p className="text-sm text-muted-foreground mt-3">{SITE_CONFIG.checkoutMessage}</p>
          <div className="mt-6 flex flex-col gap-3">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="bg-primary text-primary-foreground py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all"
            >
              Send Order on WhatsApp
            </a>
            <Link
              to="/track"
              className="bg-muted text-foreground py-3 rounded-full hover:bg-muted/70 transition-all"
            >
              Track This Order
            </Link>
            <button
              type="button"
              onClick={() => {
                onClose();
                setIsSubmitted(false);
                setSubmittedOrderId('');
              }}
              className="bg-muted text-foreground py-3 rounded-full hover:bg-muted/70 transition-all"
            >
              Close
            </button>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="min-h-full w-full flex items-start justify-center p-4 py-8">
        <div
          className="bg-card rounded-2xl p-8 max-w-2xl w-full animate-in fade-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between mb-6">
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)' }}>{t('checkout.title')}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 border-b border-border pb-6">
          <h3 className="mb-4" style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>
            {t('checkout.items')} ({itemCount})
          </h3>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {cart.map((item) => (
              <div key={`${item.id}-${item.size || ''}-${item.color || ''}`} className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                <div className="flex-1">
                  <p className="line-clamp-1">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                  {(item.size || item.color || item.quantity) && (
                    <p className="text-xs text-muted-foreground">
                      {item.size ? `Size: ${item.size} ` : ''}
                      {item.color ? `Color: ${item.color} ` : ''}
                      Qty: {item.quantity || 1}
                    </p>
                  )}
                </div>
                <p className="text-primary" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.125rem' }}>
                  ${(item.price * (item.quantity || 1)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span style={{ fontSize: '1.25rem', fontFamily: 'var(--font-heading)' }}>{t('checkout.total')}</span>
            <span className="text-primary" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 600 }}>
              ${total.toFixed(2)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm text-foreground">
              {t('custom.name')}
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="email" className="block mb-2 text-sm text-foreground">
              {t('checkout.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block mb-2 text-sm text-foreground">
              {t('checkout.phone')}
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="city" className="block mb-2 text-sm text-foreground">
              City / Area *
            </label>
            <input
              id="city"
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label htmlFor="address" className="block mb-2 text-sm text-foreground">
              {t('checkout.address')}
            </label>
            <textarea
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all min-h-[100px] resize-none"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block mb-2 text-sm text-foreground">
              Notes for your order
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all min-h-[80px] resize-none"
              placeholder="Preferred delivery time, extra color details, or anything we should know."
            />
          </div>

          <div>
            <label className="block mb-3 text-sm text-foreground">{t('checkout.payment')}</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === 'cash'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="peer sr-only"
                />
                <div className="px-4 py-3 bg-input-background rounded-lg border border-border cursor-pointer hover:border-primary transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-2 peer-checked:ring-primary/20">
                  <span className="block text-center">{t('checkout.cash')}</span>
                </div>
              </label>
              <label className="relative">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="bank"
                  checked={formData.paymentMethod === 'bank'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="peer sr-only"
                />
                <div className="px-4 py-3 bg-input-background rounded-lg border border-border cursor-pointer hover:border-primary transition-all peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:ring-2 peer-checked:ring-primary/20">
                  <span className="block text-center">{t('checkout.bank')}</span>
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">What happens after you confirm?</p>
            <p>{SITE_CONFIG.checkoutMessage}</p>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-muted text-foreground py-4 rounded-full hover:bg-muted/70 transition-all duration-200"
              style={{ fontSize: '1.125rem' }}
            >
              {t('checkout.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground py-4 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200"
              style={{ fontSize: '1.125rem' }}
            >
              {t('checkout.place')}
            </button>
          </div>
        </form>
      </div>
    </div>
    </div>
  );
}
