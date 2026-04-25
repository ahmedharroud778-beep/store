import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'header.store': 'Noor Store',
    'header.cart': 'Cart',
    'header.search': 'Search products...',

    // Menu
    'menu.title': 'Menu',
    'menu.home': 'Home',
    'menu.curated': 'Curated Collection',
    'menu.handmade': 'Handmade Collection',
    'menu.custom': 'Custom Request',
    'menu.track': 'Track Order',
    'menu.trackRequest': 'Track Request',
    'menu.about': 'About Us',
    'menu.contact': 'Contact Us',
    'menu.admin': 'Admin',
    'menu.viewAll': 'View All →',
    'menu.sections': 'sections inside',

    // Categories
    'category.clothes': 'Clothes',
    'category.dresses': 'Dresses',
    'category.suits': 'Suits & Sets',
    'category.coats': 'Coats & Jackets',
    'category.casual': 'Casual Wear',
    'category.shoes': 'Shoes',
    'category.heels': 'Heels',
    'category.flats': 'Flats',
    'category.boots': 'Boots',
    'category.accessories': 'Accessories',
    'category.bags': 'Bags',
    'category.jewelry': 'Jewelry',
    'category.scarves': 'Scarves',
    'category.ceramics': 'Ceramics',
    'category.bowls': 'Bowls',
    'category.vases': 'Vases',
    'category.plates': 'Plates',
    'category.pottery': 'Pottery',
    'category.cups': 'Cups & Mugs',
    'category.decorative': 'Decorative',
    'category.homeDecor': 'Home Decor',
    'category.wallArt': 'Wall Art',
    'category.candles': 'Candle Holders',

    // Home
    'home.hero.title': 'Curated Style, Handcrafted Soul',
    'home.hero.subtitle': 'Discover fashion essentials from top brands and unique handmade treasures, all in one place.',
    'home.browseCollection': 'Browse this collection',
    'home.curated.title': 'Curated Collection',
    'home.curated.subtitle': 'Trending items from Shein & Amazon',
    'home.handmade.title': 'Handmade Collection',
    'home.handmade.subtitle': 'Unique pieces crafted with love',
    'home.about.title': 'About Noor Store',
    'home.about.text': 'At Noor Store, we bring together the best of both worlds: carefully selected fashion items from trusted brands like Shein and Amazon, alongside unique handmade pieces crafted by local artisans. Every item in our collection is chosen with care to ensure quality and style.',
    'home.contact.title': 'Contact Us',
    'home.contact.text': 'Have questions? Want to inquire about a product? We\'d love to hear from you!',
    'home.contact.email': 'Email',
    'home.contact.phone': 'Phone',
    'home.contact.hours': 'We typically respond within 24 hours during business days.',

    // Product
    'product.add': 'Add',
    'product.addToCart': 'Add to Cart',
    'product.soldOut': 'Sold Out',
    'product.inStock': 'In Stock',
    'product.onlyLeft': 'Only {n} Left',
    'product.description': 'Description',
    'product.details': 'Details',
    'product.material': 'Material:',
    'product.size': 'Size:',
    'product.color': 'Color:',
    'product.care': 'Care:',
    'product.origin': 'Origin:',
    'product.selectSize': 'Select Size *',
    'product.selectColor': 'Select Color *',
    'product.quantity': 'Quantity',
    'product.required': 'Please select all required options',
    'product.howToOrder': 'How to Order',
    'product.step1': '1. Add items to your cart',
    'product.step2': '2. Click on the cart to proceed to checkout',
    'product.step3': '3. Fill in your contact and delivery details',
    'product.step4': '4. Choose your payment method (Cash or Bank Transfer)',
    'product.step5': '5. We\'ll contact you shortly to confirm your order',
    'product.products': 'products',
    'product.product': 'product',

    // Checkout
    'checkout.title': 'Checkout',
    'checkout.items': 'Your Items',
    'checkout.total': 'Total',
    'checkout.email': 'Email Address *',
    'checkout.phone': 'Phone Number *',
    'checkout.address': 'Delivery Address *',
    'checkout.payment': 'Payment Method *',
    'checkout.cash': 'Cash on Delivery',
    'checkout.bank': 'Bank Transfer',
    'checkout.cancel': 'Cancel',
    'checkout.place': 'Place Order',
    'checkout.success': 'Order Received!',
    'checkout.thanks': 'Thank you for your order. We\'ll contact you shortly to confirm your purchase.',
    'track.title': 'Track Your Order',
    'track.subtitle': 'Enter your order ID to check its latest status and order details.',
    'track.placeholder': 'Enter your order ID',
    'track.search': 'Check Order',
    'track.searching': 'Checking...',
    'track.status': 'Status',
    'track.total': 'Total',
    'track.orderDetails': 'Order Details',
    'track.placedOn': 'Placed on',
    'track.payment': 'Payment method',
    'track.notes': 'Notes',
    'track.delivery': 'Delivery Details',
    'track.items': 'Items',
    'trackRequest.title': 'Track Your Custom Request',
    'trackRequest.subtitle': 'Enter your custom request ID to check its latest status and details.',
    'trackRequest.placeholder': 'Enter your custom request ID',
    'trackRequest.requestDetails': 'Request Details',
    'trackRequest.createdOn': 'Created on',
    'trackRequest.productInfo': 'Product Information',

    // Custom Request
    'custom.title': 'Custom Request',
    'custom.subtitle': 'Can\'t find what you\'re looking for? Tell us what you need and we\'ll source it for you.',
    'custom.productInfo': 'Product Information',
    'custom.website': 'Website/Platform (e.g., Shein, Amazon, Etsy) *',
    'custom.link': 'Product Link (optional)',
    'custom.photos': 'Product Photos (optional)',
    'custom.upload': 'Upload photos',
    'custom.filesSelected': 'file(s) selected',
    'custom.description': 'Product Description *',
    'custom.descPlaceholder': 'Describe the product you\'re looking for...',
    'custom.size': 'Size (if applicable)',
    'custom.color': 'Color (if applicable)',
    'custom.quantity': 'Quantity *',
    'custom.contactInfo': 'Contact Information',
    'custom.name': 'Your Name *',
    'custom.submit': 'Submit Request',
    'custom.success': 'Request Received!',
    'custom.successMsg': 'Thank you for your custom request. We\'ll review it and contact you shortly with pricing and availability.',

    // Common
    'common.back': 'Back to Store',
    'common.home': 'Home',
    'common.notFound': 'Not Found',
    'common.backHome': 'Back to Home',
    'common.noResults': 'No products found',
    'common.for': 'for',
    'common.copyright': '© 2026 Noor Store. All rights reserved.',
    'common.tagline': 'Where style meets craftsmanship',
    'common.addedToCart': 'Added to Cart!',


    // Language
    'lang.select': 'Select Language',
    'lang.choose': 'Choose your preferred language',
    'lang.english': 'English',
    'lang.arabic': 'العربية',

    // Admin
    'admin.login': 'Admin Login',
    'admin.username': 'Username',
    'admin.password': 'Password',
    'admin.loginBtn': 'Login',
    'admin.signingIn': 'Signing in...',
    'admin.loginHelp': 'Enter your admin credentials to continue.',
    'admin.dashboard': 'Admin Dashboard',
    'admin.products': 'Products',
    'admin.orders': 'Orders',
    'admin.logout': 'Logout',
    'admin.addProduct': 'Add Product',
    'admin.editProduct': 'Edit Product',
    'admin.deleteProduct': 'Delete',
    'admin.edit': 'Edit',
    'admin.noOrders': 'No orders yet',
    'admin.orderDetails': 'Order Details',
    'admin.customer': 'Customer',
    'admin.items': 'Items',
    'admin.save': 'Save',
    'admin.cancel': 'Cancel',
    'admin.customRequests': 'Custom Requests',
  },
  ar: {
    // Header
    'header.store': 'متجر نور',
    'header.cart': 'السلة',
    'header.search': 'البحث عن المنتجات...',

    // Menu
    'menu.title': 'القائمة',
    'menu.home': 'الرئيسية',
    'menu.curated': 'المجموعة المنسقة',
    'menu.handmade': 'المجموعة اليدوية',
    'menu.custom': 'طلب خاص',
    'menu.track': 'تتبع الطلب',
    'menu.trackRequest': 'تتبع الطلب الخاص',
    'menu.about': 'من نحن',
    'menu.contact': 'اتصل بنا',
    'menu.admin': 'لوحة التحكم',
    'menu.viewAll': '← عرض الكل',
    'menu.sections': 'قسم بداخله',

    // Categories
    'category.clothes': 'الملابس',
    'category.dresses': 'الفساتين',
    'category.suits': 'البدلات والطقم',
    'category.coats': 'المعاطف والسترات',
    'category.casual': 'ملابس كاجوال',
    'category.shoes': 'الأحذية',
    'category.heels': 'الكعب العالي',
    'category.flats': 'الأحذية المسطحة',
    'category.boots': 'الأحذية الطويلة',
    'category.accessories': 'الإكسسوارات',
    'category.bags': 'الحقائب',
    'category.jewelry': 'المجوهرات',
    'category.scarves': 'الأوشحة',
    'category.ceramics': 'السيراميك',
    'category.bowls': 'الأوعية',
    'category.vases': 'المزهريات',
    'category.plates': 'الأطباق',
    'category.pottery': 'الفخار',
    'category.cups': 'الأكواب والفناجين',
    'category.decorative': 'ديكور',
    'category.homeDecor': 'ديكور المنزل',
    'category.wallArt': 'فن الجدران',
    'category.candles': 'حاملات الشموع',

    // Home
    'home.hero.title': 'أناقة منسقة، روح مصنوعة يدوياً',
    'home.hero.subtitle': 'اكتشف أساسيات الموضة من أفضل العلامات التجارية والكنوز اليدوية الفريدة، كل ذلك في مكان واحد.',
    'home.browseCollection': 'تصفح هذه المجموعة',
    'home.curated.title': 'المجموعة المنسقة',
    'home.curated.subtitle': 'أحدث القطع من شي إن وأمازون',
    'home.handmade.title': 'المجموعة اليدوية',
    'home.handmade.subtitle': 'قطع فريدة مصنوعة بحب',
    'home.about.title': 'عن متجر نور',
    'home.about.text': 'في متجر نور، نجمع بين الأفضل من كلا العالمين: قطع الموضة المختارة بعناية من العلامات التجارية الموثوقة مثل شي إن وأمازون، إلى جانب القطع اليدوية الفريدة التي صنعها الحرفيون المحليون. يتم اختيار كل قطعة في مجموعتنا بعناية لضمان الجودة والأناقة.',
    'home.contact.title': 'اتصل بنا',
    'home.contact.text': 'هل لديك أسئلة؟ تريد الاستفسار عن منتج؟ نحن نحب أن نسمع منك!',
    'home.contact.email': 'البريد الإلكتروني',
    'home.contact.phone': 'الهاتف',
    'home.contact.hours': 'عادة ما نرد خلال 24 ساعة خلال أيام العمل.',

    // Product
    'product.add': 'إضافة',
    'product.addToCart': 'أضف إلى السلة',
    'product.soldOut': 'نفذت الكمية',
    'product.inStock': 'متوفر',
    'product.onlyLeft': 'متبقي {n} فقط',
    'product.description': 'الوصف',
    'product.details': 'التفاصيل',
    'product.material': 'المادة:',
    'product.size': 'المقاس:',
    'product.color': 'اللون:',
    'product.care': 'العناية:',
    'product.origin': 'المنشأ:',
    'product.selectSize': 'اختر المقاس *',
    'product.selectColor': 'اختر اللون *',
    'product.quantity': 'الكمية',
    'product.required': 'الرجاء تحديد جميع الخيارات المطلوبة',
    'product.howToOrder': 'كيفية الطلب',
    'product.step1': '1. أضف العناصر إلى سلتك',
    'product.step2': '2. انقر على السلة للمتابعة إلى الدفع',
    'product.step3': '3. املأ معلومات الاتصال والتوصيل',
    'product.step4': '4. اختر طريقة الدفع (نقداً أو تحويل بنكي)',
    'product.step5': '5. سنتصل بك قريباً لتأكيد طلبك',
    'product.products': 'منتج',
    'product.product': 'منتجات',

    // Checkout
    'checkout.title': 'الدفع',
    'checkout.items': 'عناصرك',
    'checkout.total': 'المجموع',
    'checkout.email': 'البريد الإلكتروني *',
    'checkout.phone': 'رقم الهاتف *',
    'checkout.address': 'عنوان التوصيل *',
    'checkout.payment': 'طريقة الدفع *',
    'checkout.cash': 'الدفع عند الاستلام',
    'checkout.bank': 'تحويل بنكي',
    'checkout.cancel': 'إلغاء',
    'checkout.place': 'تأكيد الطلب',
    'checkout.success': 'تم استلام الطلب!',
    'checkout.thanks': 'شكراً لطلبك. سنتصل بك قريباً لتأكيد الشراء.',
    'track.title': 'تتبع طلبك',
    'track.subtitle': 'أدخل رقم الطلب لمعرفة آخر حالة له وتفاصيله.',
    'track.placeholder': 'أدخل رقم الطلب',
    'track.search': 'البحث عن الطلب',
    'track.searching': 'جاري البحث...',
    'track.status': 'الحالة',
    'track.total': 'المجموع',
    'track.orderDetails': 'تفاصيل الطلب',
    'track.placedOn': 'تم الطلب في',
    'track.payment': 'طريقة الدفع',
    'track.notes': 'ملاحظات',
    'track.delivery': 'تفاصيل التوصيل',
    'track.items': 'العناصر',
    'trackRequest.title': 'تتبع طلبك الخاص',
    'trackRequest.subtitle': 'أدخل رقم الطلب الخاص لمعرفة آخر حالة له وتفاصيله.',
    'trackRequest.placeholder': 'أدخل رقم الطلب الخاص',
    'trackRequest.requestDetails': 'تفاصيل الطلب الخاص',
    'trackRequest.createdOn': 'تم الإنشاء في',
    'trackRequest.productInfo': 'معلومات المنتج',

    // Custom Request
    'custom.title': 'طلب خاص',
    'custom.subtitle': 'لا تجد ما تبحث عنه؟ أخبرنا بما تحتاجه وسنوفره لك.',
    'custom.productInfo': 'معلومات المنتج',
    'custom.website': 'الموقع/المنصة (مثل: شي إن، أمازون، إيتسي) *',
    'custom.link': 'رابط المنتج (اختياري)',
    'custom.photos': 'صور المنتج (اختياري)',
    'custom.upload': 'رفع الصور',
    'custom.filesSelected': 'ملف محدد',
    'custom.description': 'وصف المنتج *',
    'custom.descPlaceholder': 'صف المنتج الذي تبحث عنه...',
    'custom.size': 'المقاس (إن وجد)',
    'custom.color': 'اللون (إن وجد)',
    'custom.quantity': 'الكمية *',
    'custom.contactInfo': 'معلومات الاتصال',
    'custom.name': 'اسمك *',
    'custom.submit': 'إرسال الطلب',
    'custom.success': 'تم استلام الطلب!',
    'custom.successMsg': 'شكراً لطلبك الخاص. سنراجعه ونتواصل معك قريباً بالسعر والتوفر.',

    // Common
    'common.back': 'العودة للمتجر',
    'common.home': 'الرئيسية',
    'common.notFound': 'غير موجود',
    'common.backHome': 'العودة للرئيسية',
    'common.noResults': 'لم يتم العثور على منتجات',
    'common.for': 'لـ',
    'common.copyright': '© 2026 متجر نور. جميع الحقوق محفوظة.',
    'common.tagline': 'حيث تلتقي الأناقة بالحرفية',
    'common.addedToCart': 'تمت الإضافة للسلة!',


    // Language
    'lang.select': 'اختر اللغة',
    'lang.choose': 'اختر لغتك المفضلة',
    'lang.english': 'English',
    'lang.arabic': 'العربية',

    // Admin
    'admin.login': 'تسجيل دخول المسؤول',
    'admin.username': 'اسم المستخدم',
    'admin.password': 'كلمة المرور',
    'admin.loginBtn': 'تسجيل الدخول',
    'admin.signingIn': 'جاري تسجيل الدخول...',
    'admin.loginHelp': 'أدخل بيانات المسؤول للمتابعة.',
    'admin.dashboard': 'لوحة التحكم',
    'admin.products': 'المنتجات',
    'admin.orders': 'الطلبات',
    'admin.logout': 'تسجيل الخروج',
    'admin.addProduct': 'إضافة منتج',
    'admin.editProduct': 'تعديل المنتج',
    'admin.deleteProduct': 'حذف',
    'admin.edit': 'تعديل',
    'admin.noOrders': 'لا توجد طلبات بعد',
    'admin.orderDetails': 'تفاصيل الطلب',
    'admin.customer': 'العميل',
    'admin.items': 'العناصر',
    'admin.save': 'حفظ',
    'admin.cancel': 'إلغاء',
    'admin.customRequests': 'الطلبات المخصصة',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('baraa-language') as Language;
    if (savedLang) {
      setLanguageState(savedLang);
      document.documentElement.lang = savedLang;
      document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    } else {
      setShowSelector(true);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('baraa-language', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    setShowSelector(false);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {showSelector && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full animate-in fade-in zoom-in duration-300">
            <h2 className="text-center mb-2" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
              Select Language / اختر اللغة
            </h2>
            <p className="text-center text-muted-foreground mb-8">
              Choose your preferred language
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setLanguage('en')}
                className="py-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/10 transition-all"
              >
                <div className="text-4xl mb-2">🇬🇧</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>English</div>
              </button>
              <button
                onClick={() => setLanguage('ar')}
                className="py-6 rounded-lg border-2 border-border hover:border-primary hover:bg-primary/10 transition-all"
              >
                <div className="text-4xl mb-2">🇸🇦</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem' }}>العربية</div>
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
