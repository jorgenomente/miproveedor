import React, { useState } from 'react';
import { SearchBar } from './SearchBar';
import { DSSelectField } from './DSInputField';
import { OrderCard, Order } from './OrderCard';
import { PackageSearch, Package } from 'lucide-react';

const mockOrders: Order[] = [
  // Pedidos Pendientes
  {
    id: '1',
    orderNumber: '823749878',
    date: '30/11/2024',
    dateTime: '30 nov 2024, 9:15 a. m.',
    estimatedDelivery: 'mié, 4 dic',
    deliveryZone: 'Zona Palermo',
    status: 'pendiente',
    total: 106200,
    deliveryMethod: 'Envío a domicilio',
    paymentMethod: 'Mercado Pago',
    collectionMethod: 'Prepago',
    items: [
      {
        id: '1-1',
        productName: 'Cuadro Gatitos',
        unit: 'Unidad',
        quantity: 2,
        unitPrice: 16200,
        subtotal: 32400
      },
      {
        id: '1-2',
        productName: 'Cuadro Perro',
        unit: 'Unidad',
        quantity: 1,
        unitPrice: 90000,
        subtotal: 90000
      }
    ]
  },
  // Pedidos Completados
  {
    id: '2',
    orderNumber: '823749876',
    date: '29/11/2024',
    dateTime: '29 nov 2024, 1:37 a. m.',
    estimatedDelivery: 'lun, 1 dic',
    deliveryZone: 'Zona Avellaneda',
    status: 'completado',
    total: 180000,
    deliveryMethod: 'Envío a domicilio',
    paymentMethod: 'Efectivo',
    collectionMethod: 'A pagar en la entrega',
    ordersCount: 1,
    items: [
      {
        id: '2-1',
        productName: 'Cuadro Perro',
        unit: 'Unidad',
        quantity: 2,
        unitPrice: 90000,
        subtotal: 180000
      }
    ]
  },
  {
    id: '3',
    orderNumber: '823749875',
    date: '25/11/2024',
    dateTime: '25 nov 2024, 3:22 p. m.',
    estimatedDelivery: 'jue, 28 nov',
    deliveryZone: 'Zona Centro',
    status: 'completado',
    total: 48600,
    deliveryMethod: 'Retiro en tienda',
    paymentMethod: 'Mercado Pago',
    collectionMethod: 'Prepago',
    items: [
      {
        id: '3-1',
        productName: 'Cuadro Gatitos',
        unit: 'Unidad',
        quantity: 3,
        unitPrice: 16200,
        subtotal: 48600
      }
    ]
  },
  {
    id: '4',
    orderNumber: '823749874',
    date: '20/11/2024',
    dateTime: '20 nov 2024, 10:45 a. m.',
    estimatedDelivery: 'sáb, 23 nov',
    deliveryZone: 'Zona Belgrano',
    status: 'completado',
    total: 98626,
    deliveryMethod: 'Envío a domicilio',
    paymentMethod: 'Efectivo',
    collectionMethod: 'A pagar en la entrega',
    ordersCount: 2,
    items: [
      {
        id: '4-1',
        productName: 'Samira',
        unit: 'Unidad',
        quantity: 10,
        unitPrice: 8626,
        subtotal: 86260
      },
      {
        id: '4-2',
        productName: 'Cuadro Gatitos',
        unit: 'Unidad',
        quantity: 1,
        unitPrice: 16200,
        subtotal: 16200
      }
    ]
  }
];

interface OrderHistoryProps {
  orders?: Order[];
  onDownloadReceipt?: (orderId: string) => void;
}

export function OrderHistory({ orders = mockOrders, onDownloadReceipt }: OrderHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  const statusOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  const sortOptions = [
    { value: '', label: 'Ordenar por...' },
    { value: 'date-desc', label: 'Fecha: Más reciente' },
    { value: 'date-asc', label: 'Fecha: Más antigua' },
    { value: 'amount-desc', label: 'Monto: Mayor a menor' },
    { value: 'amount-asc', label: 'Monto: Menor a mayor' }
  ];

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.includes(searchQuery) ||
      order.date.includes(searchQuery);
    const matchesStatus = statusFilter === '' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Separate orders into pending and completed
  const pendingOrders = filteredOrders.filter(order => order.status === 'pendiente');
  const completedOrders = filteredOrders.filter(order => order.status === 'completado');

  const handleDownloadReceipt = (orderId: string) => {
    console.log('Descargando remito del pedido:', orderId);
    onDownloadReceipt?.(orderId);
  };

  return (
    <div className="min-h-screen bg-[var(--surface-50)]">
      {/* Header Section */}
      <div className="bg-white border-b border-[var(--surface-200)] shadow-[var(--shadow-sm)]">
        <div className="max-w-[1180px] mx-auto px-4 md:px-5 lg:px-6 py-6 md:py-8">
          {/* Title */}
          <div className="mb-8">
            <h2 className="text-[var(--text-primary)] m-0">Historial de pedidos</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl">
              <SearchBar
                placeholder="Buscar pedidos por número o fecha..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {/* Filter Selects - Desktop right-aligned */}
            <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
              <div className="w-full sm:w-[200px]">
                <DSSelectField
                  label=""
                  options={statusOptions}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  placeholder="Filtrar estado"
                />
              </div>

              <div className="w-full sm:w-[200px]">
                <DSSelectField
                  label=""
                  options={sortOptions}
                  value={sortOrder}
                  onChange={setSortOrder}
                  placeholder="Ordenar por"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1180px] mx-auto px-4 md:px-5 lg:px-6 py-8 md:py-10">
        {filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl p-12 border border-[var(--surface-200)] shadow-[var(--shadow-sm)] text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-100)] flex items-center justify-center">
                <PackageSearch className="w-8 h-8 text-[var(--text-tertiary)]" strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-[var(--text-primary)] m-0 mb-2">No se encontraron pedidos</h3>
            <p className="text-[var(--text-secondary)] m-0">
              {searchQuery || statusFilter 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Aún no has realizado ningún pedido'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* PENDIENTES Block */}
            {pendingOrders.length > 0 && (
              <div>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-5">
                  <Package className="w-5 h-5 text-[var(--brand-aqua-600)]" strokeWidth={1.5} />
                  <h3 className="text-[var(--text-primary)] m-0">Pendientes</h3>
                  <span className="text-[var(--text-tertiary)] text-sm">
                    ({pendingOrders.length})
                  </span>
                </div>

                {/* Orders Container */}
                <div className="bg-white rounded-2xl p-6 border border-[var(--surface-200)] shadow-[var(--shadow-sm)]">
                  <div className="space-y-5">
                    {pendingOrders.map((order, index) => (
                      <div key={order.id}>
                        <OrderCard order={order} onDownloadReceipt={handleDownloadReceipt} />
                        {index < pendingOrders.length - 1 && (
                          <div className="h-px bg-[var(--surface-200)] my-5"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* COMPLETADOS Block */}
            {completedOrders.length > 0 && (
              <div>
                {/* Section Header */}
                <div className="flex items-center gap-3 mb-5">
                  <Package className="w-5 h-5 text-[var(--brand-teal-600)]" strokeWidth={1.5} />
                  <h3 className="text-[var(--text-primary)] m-0">Completados</h3>
                  <span className="text-[var(--text-tertiary)] text-sm">
                    ({completedOrders.length})
                  </span>
                </div>

                {/* Orders Container */}
                <div className="bg-white rounded-2xl p-6 border border-[var(--surface-200)] shadow-[var(--shadow-sm)]">
                  <div className="space-y-5">
                    {completedOrders.map((order, index) => (
                      <div key={order.id}>
                        <OrderCard order={order} onDownloadReceipt={handleDownloadReceipt} />
                        {index < completedOrders.length - 1 && (
                          <div className="h-px bg-[var(--surface-200)] my-5"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty Pending State */}
            {pendingOrders.length === 0 && statusFilter === '' && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <Package className="w-5 h-5 text-[var(--brand-aqua-600)]" strokeWidth={1.5} />
                  <h3 className="text-[var(--text-primary)] m-0">Pendientes</h3>
                </div>
                <div className="bg-white rounded-2xl p-8 border border-[var(--surface-200)] shadow-[var(--shadow-sm)] text-center">
                  <p className="text-[var(--text-secondary)] m-0">Sin pedidos pendientes</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Spacer */}
        <div className="h-24" aria-hidden="true"></div>
      </div>
    </div>
  );
}
