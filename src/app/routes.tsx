import { createBrowserRouter } from 'react-router';
import { Home } from './pages/Home';
import { ProductDetail } from './pages/ProductDetail';
import { CategoryPage } from './pages/CategoryPage';
import { CustomRequest } from './pages/CustomRequest';
import { Track } from './pages/Track';
import { AdminLogin } from './pages/Admin/AdminLogin';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { ADMIN_DASHBOARD_PATH, ADMIN_PATH } from '../utils/adminConfig';

export const createRouter = (cart: any[], onAddToCart: any, onClearCart: any) =>
  createBrowserRouter([
    {
      path: '/',
      element: <Home cart={cart} onAddToCart={onAddToCart} onClearCart={onClearCart} />,
    },
    {
      path: '/product/:id',
      element: <ProductDetail onAddToCart={onAddToCart} />,
    },
    {
      path: '/category/:category',
      element: <CategoryPage onAddToCart={onAddToCart} />,
    },
    {
      path: '/category/:category/:subcategory',
      element: <CategoryPage onAddToCart={onAddToCart} />,
    },
    {
      path: '/custom-request',
      element: <CustomRequest />,
    },
    {
      path: '/track',
      element: <Track />,
    },
    {
      path: '/track-order',
      element: <Track />,
    },
    {
      path: '/track-request',
      element: <Track />,
    },
    {
      path: ADMIN_PATH,
      element: <AdminLogin />,
    },
    {
      path: ADMIN_DASHBOARD_PATH,
      element: <AdminDashboard />,
    },
    {
      path: '*',
      element: (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="mb-4" style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>
              Page Not Found
            </h2>
            <a
              href="/"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-full hover:bg-accent hover:text-accent-foreground transition-all inline-block"
            >
              Back to Home
            </a>
          </div>
        </div>
      ),
    },
  ]);
