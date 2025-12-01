import React, { useState, useEffect } from 'react';
import { ProductCard, Product } from './components/ProductCard';
import { ViewToggle } from './components/ViewToggle';
import { SearchBar } from './components/SearchBar';
import { TableView } from './components/TableView';
import { SummaryCard } from './components/SummaryCard';
import { FloatingCart } from './components/FloatingCart';
import { OrderHistory } from './components/OrderHistory';
import { DSButton } from './components/DSButton';
import { ThemeToggle } from './components/ThemeToggle';
import { ShoppingBag, History, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Cuadro Gatitos',
    brand: 'iarte',
    status: 'nuevo',
    description: 'se puede personalizar',
    hashtags: ['#deco', '#hola', '#como', '#regalos'],
    originalPrice: 18000,
    discount: 10,
    currentPrice: 16200,
    unit: 'Unidad',
    imageUrl: 'https://images.unsplash.com/photo-1570824104967-27599c232b4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwa2l0dGVucyUyMHBhaW50aW5nfGVufDF8fHx8MTc2NDU0MDQ1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: '2',
    title: 'Cuadro Perro',
    brand: 'iarteMAX',
    status: 'disponible',
    description: 'manda la foto',
    hashtags: ['#deco', '#regalito'],
    originalPrice: 120000,
    discount: 25,
    currentPrice: 90000,
    unit: 'Unidad',
    imageUrl: 'https://images.unsplash.com/photo-1717210347936-917702ddf24e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBwb3J0cmFpdCUyMGFydHxlbnwxfHx8fDE3NjQ1NDA0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  },
  {
    id: '3',
    title: 'Samira',
    brand: 'mestiza',
    status: 'nuevo',
    description: 'Sin descripción',
    hashtags: ['#Perros', '#perros'],
    originalPrice: 12323,
    discount: 30,
    currentPrice: 8626,
    unit: 'Unidad',
    imageUrl: 'https://images.unsplash.com/photo-1724367269355-3fcfa12e99c1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXhlZCUyMGJyZWVkJTIwZG9nfGVufDF8fHx8MTc2NDQyODkzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
  }
];

const mockProductsWithCategories = [
  { ...mockProducts[0], category: 'deco' },
  { ...mockProducts[1], category: 'deco' },
  { ...mockProducts[2], category: 'Perros' }
];

export default function App() {
  const [activePage, setActivePage] = useState<'catalogo' | 'historial'>('catalogo');
  const [activeView, setActiveView] = useState<'tarjetas' | 'tabla'>('tarjetas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [cartItems, setCartItems] = useState<Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }>>([
    // Mock cart items for demo - puedes cambiar esto a [] para ver el estado vacío
    {
      id: '1',
      productName: 'Cuadro Gatitos',
      quantity: 2,
      price: 16200,
      imageUrl: 'https://images.unsplash.com/photo-1570824104967-27599c232b4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwa2l0dGVucyUyMHBhaW50aW5nfGVufDF8fHx8MTc2NDU0MDQ1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: '2',
      productName: 'Cuadro Perro',
      quantity: 1,
      price: 90000,
      imageUrl: 'https://images.unsplash.com/photo-1717210347936-917702ddf24e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBwb3J0cmFpdCUyMGFydHxlbnwxfHx8fDE3NjQ1NDA0NTF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    }
  ]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('miproveedor-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Apply theme class to document and save to localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('miproveedor-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    console.log(`Producto ${productId} - Cantidad: ${quantity}`);
    // Aquí podrías actualizar el carrito cuando se cambie la cantidad
  };

  const handleSubmitOrder = () => {
    console.log('Pedido enviado');
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const handleViewSummary = () => {
    // Abrir el panel si no está abierto
    setIsCartOpen(true);
  };

  const handleSearchProducts = () => {
    // Enfocar la barra de búsqueda
    const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement;
    searchInput?.focus();
  };

  const handleViewOrderDetail = (orderId: string) => {
    console.log('Ver detalle del pedido:', orderId);
    // Aquí podrías navegar a una vista de detalle
  };

  return (
    <div className="min-h-screen bg-[var(--surface-bg)]">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[var(--surface-border)]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActivePage('catalogo')}
                className={`
                  px-6 py-4 flex items-center gap-2 border-b-2 transition-all
                  ${activePage === 'catalogo' 
                    ? 'border-[var(--brand-teal-medium)] text-[var(--brand-teal-medium)]' 
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                `}
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                <span>Catálogo</span>
              </button>
              <button
                onClick={() => setActivePage('historial')}
                className={`
                  px-6 py-4 flex items-center gap-2 border-b-2 transition-all
                  ${activePage === 'historial' 
                    ? 'border-[var(--brand-teal-medium)] text-[var(--brand-teal-medium)]' 
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                `}
              >
                <History className="w-5 h-5" strokeWidth={1.5} />
                <span>Historial</span>
              </button>
            </div>
            
            {/* Theme Toggle - Right Side */}
            <div className="flex items-center">
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            </div>
          </div>
        </div>
      </div>

      {/* Render active page */}
      {activePage === 'catalogo' ? (
        <>
          {/* Header Section */}
          <div className="bg-white border-b border-[var(--surface-200)] shadow-[var(--shadow-sm)]">
            <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
              {/* Title and View Toggle */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                <h1 className="text-[var(--text-primary)] m-0">Catálogo</h1>
                <ViewToggle activeView={activeView} onChange={setActiveView} />
              </div>

              {/* Search Bar */}
              <div className="w-full max-w-2xl">
                <SearchBar
                  placeholder="Categorías, hashtags y marcas"
                  value={searchQuery}
                  onChange={setSearchQuery}
                />
              </div>
            </div>
          </div>

          {/* Main Content - Full Width Catalog */}
          <div className="max-w-[1280px] mx-auto px-4 md:px-5 lg:px-6 py-8 md:py-10">
            {/* Products Section - Full Width */}
            <div className="w-full min-w-0">
              {activeView === 'tarjetas' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-x-6 lg:gap-y-8 min-w-0">
                  {mockProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuantityChange={handleQuantityChange}
                    />
                  ))}
                </div>
              ) : (
                <TableView 
                  products={mockProductsWithCategories} 
                  onQuantityChange={handleQuantityChange}
                />
              )}
            </div>
            
            {/* Footer Spacer - Prevent floating button overlap */}
            <div className="h-24 lg:h-24" aria-hidden="true"></div>
          </div>

          {/* Summary Panel - Slide from Right */}
          <AnimatePresence>
            {isCartOpen && (
              <>
                {/* Backdrop overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="fixed inset-0 bg-black/20 z-40"
                  onClick={() => setIsCartOpen(false)}
                />
                
                {/* Summary Panel */}
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="fixed top-0 right-0 h-full w-full md:w-[420px] lg:w-[400px] z-50 overflow-hidden"
                  style={{ maxWidth: '100vw' }}
                >
                  <div 
                    className="h-full bg-white border-l border-[var(--surface-200)] overflow-hidden flex flex-col"
                    style={{
                      boxShadow: '-8px 0 24px rgba(0,0,0,0.12)'
                    }}
                  >
                    {/* Close button */}
                    <div className="flex items-center justify-between p-6 border-b border-[var(--surface-200)]">
                      <h3 className="text-[var(--text-primary)] m-0">Resumen</h3>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="p-2 rounded-lg hover:bg-[var(--surface-100)] transition-colors"
                        aria-label="Cerrar resumen"
                      >
                        <X className="w-5 h-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                      </button>
                    </div>

                    {/* Scrollable content */}
                    <div 
                      className="flex-1 overflow-y-auto"
                      style={{
                        maskImage: 'linear-gradient(to bottom, black calc(100% - 12px), transparent 100%)',
                        WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 12px), transparent 100%)'
                      }}
                    >
                      <div className="px-6 py-6">
                        <SummaryCard 
                          itemCount={cartItems.length}
                          storeName="AURO"
                          storeCode="auro2323"
                          storeContact="+54 9 11 1234 5678"
                          cartItems={cartItems}
                          shippingCost={10000}
                          shippingZone="Avellaneda"
                          onSubmit={handleSubmitOrder}
                          onRemoveItem={handleRemoveFromCart}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Floating Cart Button */}
          <FloatingCart
            items={cartItems}
            isCartOpen={isCartOpen}
            onToggleCart={() => setIsCartOpen(!isCartOpen)}
            onRemoveItem={handleRemoveFromCart}
          />
        </>
      ) : (
        <OrderHistory onViewDetail={handleViewOrderDetail} />
      )}
    </div>
  );
}