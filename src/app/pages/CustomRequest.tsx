import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Upload, Check } from 'lucide-react';
import { SITE_CONFIG, createWhatsAppLink } from '../../utils/siteConfig';
import { apiRequest } from '../../utils/api';
import { ThemeToggle } from '../components/ThemeToggle';

export function CustomRequest() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    website: '',
    productLink: '',
    description: '',
    size: '',
    color: '',
    quantity: '1',
    customerName: '',
    email: '',
    phone: '',
    city: '',
    notes: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState('');
  const [submitError, setSubmitError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const whatsappLink = useMemo(() => {
    const lines = [
      `Hello ${SITE_CONFIG.storeName}, I sent a custom request.`,
      submittedRequestId ? `Request ID: ${submittedRequestId}` : '',
      `Name: ${formData.customerName}`,
      `Phone: ${formData.phone}`,
      `Website: ${formData.website}`,
      `Description: ${formData.description}`,
      formData.size ? `Size: ${formData.size}` : '',
      formData.color ? `Color: ${formData.color}` : '',
      `Quantity: ${formData.quantity}`,
    ].filter(Boolean);

    return createWhatsAppLink(lines.join('\n'));
  }, [formData, submittedRequestId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 6) {
      setSubmitError('Please enter a valid phone number so the store can contact you.');
      return;
    }

    const payload = {
      type: 'custom-request',
      product: {
        website: formData.website,
        productLink: formData.productLink,
        description: formData.description,
        size: formData.size,
        color: formData.color,
        quantity: Number(formData.quantity || '1'),
        uploadedFileNames: selectedFiles.map((file) => file.name),
      },
      customer: {
        name: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        notes: formData.notes,
      },
    };

    try {
      const formDataObj = new FormData();
      formDataObj.append('payload', JSON.stringify(payload));
      selectedFiles.forEach((file) => {
        formDataObj.append('images', file);
      });

      const response = await apiRequest('/api/custom-request', {
        method: 'POST',
        body: formDataObj,
      });

      const body = await response.json().catch(() => null);
      setSubmittedRequestId(String(body?.requestId || Date.now()));

      setIsSubmitted(true);
    } catch (error) {
      console.error(error);
      setSubmitError('Could not send the request right now. Please try again.');
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl p-8 max-w-md w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="mb-2" style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)' }}>
            Request Received!
          </h2>
          <p className="text-muted-foreground">
            Thank you for your custom request. We will contact you soon with price and availability details.
          </p>
          <div className="mt-4 rounded-xl bg-muted/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Request ID</p>
            <p className="mt-1 text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
              {submittedRequestId}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep this ID so the store can find your custom request quickly.
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
              Send Request on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-muted text-foreground py-3 rounded-full hover:bg-muted/70 transition-all"
            >
              Back to Store
            </button>
            <button
              type="button"
              onClick={() => navigate('/track?type=request')}
              className="bg-muted text-foreground py-3 rounded-full hover:bg-muted/70 transition-all"
            >
              Track This Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Store</span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1
            className="mb-4"
            style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700 }}
          >
            Custom Request
          </h1>
          <p className="text-muted-foreground" style={{ fontSize: '1.125rem' }}>
            Can't find what you're looking for? Tell us what you need and we'll source it for you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 border border-border space-y-6">
          <div>
            <h3 className="mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
              Product Information
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="website" className="block mb-2 text-sm text-foreground">
                  Website/Platform (e.g., Shein, Amazon, Etsy) *
                </label>
                <input
                  id="website"
                  type="text"
                  required
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="Shein"
                />
              </div>

              <div>
                <label htmlFor="productLink" className="block mb-2 text-sm text-foreground">
                  Product Link (optional)
                </label>
                <input
                  id="productLink"
                  type="url"
                  value={formData.productLink}
                  onChange={(e) => setFormData({ ...formData, productLink: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label htmlFor="photos" className="block mb-2 text-sm text-foreground">
                  Product Photos (optional)
                </label>
                <div className="relative">
                  <input
                    id="photos"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="photos"
                    className="w-full px-4 py-3 bg-input-background rounded-lg border border-border hover:border-primary cursor-pointer transition-all flex items-center gap-3"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                        : 'Upload photos'}
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block mb-2 text-sm text-foreground">
                  Product Description *
                </label>
                <textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all min-h-[120px] resize-none"
                  placeholder="Describe the product you're looking for..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="size" className="block mb-2 text-sm text-foreground">
                    Size (if applicable)
                  </label>
                  <input
                    id="size"
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="M"
                  />
                </div>

                <div>
                  <label htmlFor="color" className="block mb-2 text-sm text-foreground">
                    Color (if applicable)
                  </label>
                  <input
                    id="color"
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="Blue"
                  />
                </div>

                <div>
                  <label htmlFor="quantity" className="block mb-2 text-sm text-foreground">
                    Quantity *
                  </label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem' }}>
              Contact Information
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="customerName" className="block mb-2 text-sm text-foreground">
                  Your Name *
                </label>
                <input
                  id="customerName"
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block mb-2 text-sm text-foreground">
                  Email Address *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block mb-2 text-sm text-foreground">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                  placeholder="+218 ..."
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
                  placeholder="Tripoli"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block mb-2 text-sm text-foreground">
                  Extra notes
                </label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary transition-all min-h-[100px] resize-none"
                  placeholder="Share any extra details, deadline, or delivery notes."
                />
              </div>
            </div>
          </div>

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-4 rounded-full hover:bg-accent hover:text-accent-foreground transition-all duration-200 mt-8"
            style={{ fontSize: '1.125rem' }}
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}
