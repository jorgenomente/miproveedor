import React, { useState } from 'react';
import { DSBadge } from './DSBadge';
import { DSButton } from './DSButton';
import { DSInputField, DSTextAreaField, DSSelectField } from './DSInputField';
import { Store, MapPin, CreditCard, PackageSearch } from 'lucide-react';
import { ItemSummaryRow } from './ItemSummaryRow';

interface CartItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl: string;
}

interface SummaryCardProps {
  itemCount?: number;
  storeName?: string;
  storeCode?: string;
  storeContact?: string;
  cartItems?: CartItem[];
  shippingCost?: number;
  shippingZone?: string;
  onSubmit?: () => void;
  onRemoveItem?: (itemId: string) => void;
}

export function SummaryCard({ 
  itemCount = 0, 
  storeName = 'AURO',
  storeCode = 'auro2323',
  storeContact = '+54 9 11 1234 5678',
  cartItems = [],
  shippingCost = 10000,
  shippingZone = 'Avellaneda',
  onSubmit,
  onRemoveItem
}: SummaryCardProps) {
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [shippingZoneSelected, setShippingZoneSelected] = useState(shippingZone);
  const [notes, setNotes] = useState('');

  const deliveryOptions = [
    { value: 'envio', label: 'Envío a domicilio' },
    { value: 'retiro', label: 'Retiro en tienda' },
    { value: 'express', label: 'Envío express' }
  ];

  const paymentOptions = [
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'tarjeta', label: 'Tarjeta' }
  ];

  const shippingOptions = [
    { value: 'avellaneda', label: 'Avellaneda - $10.000' },
    { value: 'centro', label: 'Centro - $15.000' },
    { value: 'norte', label: 'Zona Norte - $20.000' }
  ];

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const total = subtotal + shippingCost;

  return (
    <div className="w-full min-w-0">
      {/* Contenido scrolleable */}
      <div className="space-y-6">
        {/* 1. Datos de la tienda - DSCard */}
        <div className="bg-[var(--surface-100)] rounded-2xl p-6 border border-[var(--surface-200)] min-w-0">
          <div className="flex items-center gap-2.5 mb-5">
            <Store className="w-5 h-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
            <h4 className="text-[var(--text-primary)] text-sm uppercase tracking-wide m-0">
              Datos de la tienda
            </h4>
          </div>
          <div className="space-y-3 min-w-0">
            <div className="min-w-0">
              <p className="text-[var(--text-secondary)] text-sm m-0 mb-1">Nombre</p>
              <p className="text-[var(--text-primary)] m-0 truncate">{storeName}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[var(--text-secondary)] text-sm m-0 mb-1">Código / ID</p>
              <p className="text-[var(--text-primary)] m-0 truncate">{storeCode}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[var(--text-secondary)] text-sm m-0 mb-1">Contacto</p>
              <p className="text-[var(--text-primary)] m-0 truncate">{storeContact}</p>
            </div>
          </div>
        </div>

        {/* 2. Productos seleccionados - DSCard */}
        <div className="bg-[var(--surface-100)] rounded-2xl p-6 border border-[var(--surface-200)] min-w-0">
          <h4 className="text-[var(--text-primary)] text-sm uppercase tracking-wide m-0 mb-5">
            Productos seleccionados
          </h4>
          
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-100)] flex items-center justify-center">
                  <PackageSearch className="w-6 h-6 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[var(--text-tertiary)] text-sm m-0">
                Agrega productos para ver el resumen
              </p>
            </div>
          ) : (
            <div className="space-y-3 min-w-0">
              {cartItems.map((item) => (
                <div key={item.id} className="min-w-0">
                  <ItemSummaryRow
                    productName={item.productName}
                    quantity={item.quantity}
                    price={item.price}
                    imageUrl={item.imageUrl}
                    onRemove={() => onRemoveItem?.(item.id)}
                  />
                </div>
              ))}
              
              {/* Subtotal */}
              <div className="pt-4 border-t border-[var(--surface-200)] flex items-center justify-between min-w-0">
                <span className="text-[var(--text-secondary)] text-sm">Subtotal productos</span>
                <span className="text-[var(--text-primary)]">
                  ${subtotal.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Envío - DSCard */}
        <div className="bg-[var(--surface-100)] rounded-2xl p-6 border border-[var(--surface-200)] min-w-0">
          <div className="flex items-center gap-2.5 mb-5">
            <MapPin className="w-5 h-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
            <h4 className="text-[var(--text-primary)] text-sm uppercase tracking-wide m-0 truncate">
              Envío
            </h4>
          </div>
          
          <div className="min-w-0">
            <DSSelectField
              label=""
              options={shippingOptions}
              value={shippingZoneSelected}
              onChange={setShippingZoneSelected}
              placeholder="Seleccionar zona"
            />
          </div>
          
          <div className="mt-4 p-4 bg-white rounded-xl border border-[var(--surface-200)] min-w-0">
            <div className="flex items-center justify-between mb-2 min-w-0">
              <span className="text-[var(--text-primary)] truncate">{shippingZone}</span>
              <span className="text-[var(--brand-teal-600)]">
                ${shippingCost.toLocaleString('es-CL')}
              </span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm m-0">
              Zona de envío estándar
            </p>
          </div>
        </div>

        {/* 4. Formulario de datos del cliente */}
        <div className="bg-[var(--surface-100)] rounded-2xl p-6 border border-[var(--surface-200)] space-y-4 min-w-0">
          <DSInputField
            label="Nombre de contacto"
            type="text"
            placeholder="Ingresa el nombre"
            value={contactName}
            onChange={setContactName}
            required
          />

          <DSInputField
            label="WhatsApp / Teléfono"
            type="tel"
            placeholder="+54 9 11 1234 5678"
            value={phone}
            onChange={setPhone}
            required
          />

          <DSSelectField
            label="Método de entrega"
            options={deliveryOptions}
            value={deliveryMethod}
            onChange={setDeliveryMethod}
            placeholder="Seleccionar método"
            required
          />
        </div>

        {/* 5. Método de Pago - DSCard */}
        <div className="bg-[var(--surface-100)] rounded-2xl p-6 border border-[var(--surface-200)] min-w-0">
          <div className="flex items-center gap-2.5 mb-5">
            <CreditCard className="w-5 h-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
            <h4 className="text-[var(--text-primary)] text-sm uppercase tracking-wide m-0 truncate">
              Método de pago
            </h4>
          </div>
          
          <div className="min-w-0">
            <DSSelectField
              label=""
              options={paymentOptions}
              value={paymentMethod}
              onChange={setPaymentMethod}
              placeholder="Seleccionar método"
              required
            />
          </div>
          
          <p className="text-[var(--text-tertiary)] text-sm m-0 mt-3">
            Se marcará como <strong>A pagar en la entrega</strong>
          </p>
        </div>

        {/* 6. Nota del pedido */}
        <div className="bg-[var(--surface-100)] rounded-2xl p-6 border border-[var(--surface-200)] min-w-0">
          <DSTextAreaField
            label="Nota del pedido"
            placeholder="Agrega comentarios o instrucciones especiales..."
            value={notes}
            onChange={setNotes}
            rows={4}
          />
        </div>

        {/* 7. Total estimado - DSCard destacado */}
        <div className="bg-[var(--surface-100)] rounded-2xl p-6 border-2 border-[var(--brand-teal-600)] shadow-[var(--shadow-md)] min-w-0">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] text-sm">Productos</span>
              <span className="text-[var(--text-primary)]">
                ${subtotal.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--surface-200)]">
              <span className="text-[var(--text-secondary)] text-sm">Envío</span>
              <span className="text-[var(--text-primary)]">
                ${shippingCost.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--text-secondary)] uppercase tracking-wide">
                Total estimado
              </span>
              <span className="text-[var(--brand-teal-600)] text-3xl">
                ${total.toLocaleString('es-CL')}
              </span>
            </div>
            {cartItems.length === 0 && (
              <p className="text-[var(--text-tertiary)] text-sm m-0 pt-2">
                Agrega productos para calcular el total
              </p>
            )}
          </div>
        </div>

        {/* 8. Botón Enviar pedido */}
        <div>
          <DSButton 
            variant="primary" 
            size="lg" 
            onClick={onSubmit}
            className="w-full h-12"
          >
            Enviar pedido
          </DSButton>
        </div>
      </div>
    </div>
  );
}