import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { ColorToken, SpacingToken, RadiusToken, ShadowToken, TypographyToken } from './components/TokenDisplay';
import { Button, IconButton } from './components/design-system/Button';
import { Input, Textarea, SearchInput } from './components/design-system/Input';
import { Select } from './components/design-system/Select';
import { Card, MetricCard } from './components/design-system/Card';
import { Badge } from './components/design-system/Badge';
import { Toggle, Checkbox, Radio } from './components/design-system/Toggle';
import { Table } from './components/design-system/Table';
import { Modal, ConfirmModal } from './components/design-system/Modal';
import { Tabs } from './components/design-system/Tabs';
import { Sidebar, Topbar, Breadcrumbs } from './components/design-system/Navigation';
import { EmptyState, SearchEmptyState } from './components/design-system/EmptyState';
import { 
  Sun, 
  Moon, 
  Home, 
  Package, 
  Users, 
  Settings, 
  Plus, 
  Download,
  Bell,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  User
} from 'lucide-react';

function DesignSystemContent() {
  const { theme, toggleTheme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--surface-200)]">
      {/* Header */}
      <div className="bg-[var(--surface-100)] border-b border-[var(--surface-400)] sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[var(--text-primary)] mb-1">MiProveedor Design System</h1>
              <p className="text-[var(--text-tertiary)]">
                Sistema de diseño premium con identidad de marca integrada
              </p>
            </div>
            <Button
              variant="ghost"
              icon={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              onClick={toggleTheme}
            >
              {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8 space-y-12">
        
        {/* TOKENS SECTION */}
        <section id="tokens">
          <div className="mb-6">
            <h2 className="text-[var(--text-primary)] mb-2">Design Tokens</h2>
            <p className="text-[var(--text-secondary)]">
              Tokens de diseño base del sistema MiProveedor
            </p>
          </div>

          {/* Brand Colors */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Colores de Marca</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <ColorToken name="Brand Teal Deep" value="#0F7A82" description="Primary dark" />
              <ColorToken name="Brand Teal Medium" value="#1F8A92" description="Primary default" />
              <ColorToken name="Brand Teal Light" value="#36AAB4" description="Primary light" />
              <ColorToken name="Brand Teal Aqua" value="#4FD4E4" description="Primary accent" />
              <ColorToken name="Brand Aqua Soft" value="#CDECE7" description="Soft accent bg" />
            </div>
          </div>

          {/* Surface Colors */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Colores de Superficie</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ColorToken name="Surface 100" value={theme === 'light' ? '#FFFFFF' : '#0C0F11'} description="Background" />
              <ColorToken name="Surface 200" value={theme === 'light' ? '#F7F7F7' : '#13181B'} description="Subtle" />
              <ColorToken name="Surface 300" value={theme === 'light' ? '#EFEFEF' : '#1A2125'} description="UI elements" />
              <ColorToken name="Surface 400" value={theme === 'light' ? '#E4E4E4' : '#243035'} description="Borders" />
            </div>
          </div>

          {/* Text Colors */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Colores de Texto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ColorToken name="Text Primary" value={theme === 'light' ? '#111111' : '#FFFFFF'} description="Headings, body" />
              <ColorToken name="Text Secondary" value={theme === 'light' ? '#3A3A3A' : '#D4D8D9'} description="Subtitles" />
              <ColorToken name="Text Tertiary" value={theme === 'light' ? '#6A6A6A' : '#A0A7A9'} description="Captions, hints" />
              <ColorToken name="Text Inverse" value={theme === 'light' ? '#FFFFFF' : '#000000'} description="On dark/light" />
            </div>
          </div>

          {/* State Colors */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Colores de Estado</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ColorToken name="Success" value="#12B272" description="Positive actions" />
              <ColorToken name="Warning" value="#E5A100" description="Caution states" />
              <ColorToken name="Error" value="#D64545" description="Errors, destructive" />
              <ColorToken name="Info" value="#2596D4" description="Informational" />
            </div>
          </div>

          {/* Spacing */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Espaciado</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <SpacingToken name="Space 4" value="4px" />
              <SpacingToken name="Space 8" value="8px" />
              <SpacingToken name="Space 12" value="12px" />
              <SpacingToken name="Space 16" value="16px" />
              <SpacingToken name="Space 20" value="20px" />
              <SpacingToken name="Space 24" value="24px" />
              <SpacingToken name="Space 32" value="32px" />
              <SpacingToken name="Space 40" value="40px" />
            </div>
          </div>

          {/* Border Radius */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Border Radius</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RadiusToken name="Radius SM" value="8px" />
              <RadiusToken name="Radius MD" value="12px" />
              <RadiusToken name="Radius LG" value="16px" />
            </div>
          </div>

          {/* Shadows */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Sombras</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ShadowToken name="Shadow XS" value="0px 1px 2px rgba(0, 0, 0, 0.10)" />
              <ShadowToken name="Shadow SM" value="0px 3px 8px rgba(0, 0, 0, 0.08)" />
              <ShadowToken name="Shadow MD" value="0px 6px 20px rgba(0, 0, 0, 0.10)" />
            </div>
          </div>

          {/* Typography */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Tipografía</h4>
            <div className="grid grid-cols-1 gap-4">
              <TypographyToken level="H1" example="Heading 1 - 48px Bold" />
              <TypographyToken level="H2" example="Heading 2 - 36px Bold" />
              <TypographyToken level="H3" example="Heading 3 - 28px Semibold" />
              <TypographyToken level="H4" example="Heading 4 - 20px Semibold" />
              <TypographyToken level="H5" example="Heading 5 - 16px Semibold" />
              <TypographyToken level="H6" example="Heading 6 - 14px Semibold" />
              <TypographyToken level="P" example="Body - 15px Regular" />
              <TypographyToken level="Small" example="Caption - 13px Regular" />
            </div>
          </div>
        </section>

        {/* COMPONENTS SECTION */}
        <section id="components">
          <div className="mb-6">
            <h2 className="text-[var(--text-primary)] mb-2">Componentes</h2>
            <p className="text-[var(--text-secondary)]">
              Librería completa de componentes UI con variantes
            </p>
          </div>

          {/* Buttons */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Botones</h4>
            <Card>
              <div className="space-y-6">
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Variantes</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="destructive">Destructive</Button>
                  </div>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Tamaños</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Con Iconos</p>
                  <div className="flex flex-wrap gap-3">
                    <Button icon={<Plus size={18} />}>Crear Nuevo</Button>
                    <Button variant="secondary" icon={<Download size={18} />}>Descargar</Button>
                    <IconButton icon={<Bell size={18} />} />
                    <IconButton icon={<Settings size={18} />} variant="secondary" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Inputs */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Inputs</h4>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nombre completo" placeholder="Ingresa tu nombre" />
                <Input label="Email" type="email" placeholder="correo@ejemplo.com" />
                <SearchInput label="Búsqueda" />
                <Input label="Con error" error="Este campo es requerido" placeholder="Campo inválido" />
                <div className="md:col-span-2">
                  <Textarea label="Descripción" placeholder="Escribe una descripción..." />
                </div>
              </div>
            </Card>
          </div>

          {/* Select */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Select / Dropdown</h4>
            <Card>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="País"
                  options={[
                    { value: 'mx', label: 'México' },
                    { value: 'us', label: 'Estados Unidos' },
                    { value: 'co', label: 'Colombia' }
                  ]}
                />
                <Select
                  label="Categoría"
                  icon={<Package size={18} />}
                  options={[
                    { value: 'tech', label: 'Tecnología' },
                    { value: 'food', label: 'Alimentos' },
                    { value: 'services', label: 'Servicios' }
                  ]}
                />
              </div>
            </Card>
          </div>

          {/* Cards */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Cards</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <h5 className="text-[var(--text-primary)] mb-2">Base Card</h5>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  Card básico sin elevación
                </p>
              </Card>
              <Card variant="elevated">
                <h5 className="text-[var(--text-primary)] mb-2">Elevated Card</h5>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  Card con sombra sutil
                </p>
              </Card>
              <Card variant="glass">
                <h5 className="text-[var(--text-primary)] mb-2">Glass-Lite Card</h5>
                <p className="text-[var(--text-secondary)] text-[14px]">
                  Card con efecto glass premium
                </p>
              </Card>
            </div>
            
            {/* Dashboard KPI Cards */}
            <div>
              <p className="text-[var(--text-secondary)] text-[13px] mb-3">Dashboard KPI Cards (Premium)</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  label="Total Ventas"
                  value="$124,500"
                  change="+12.5%"
                  trend="up"
                  icon={<DollarSign size={24} />}
                  variant="elevated"
                />
                <MetricCard
                  label="Nuevos Pedidos"
                  value="387"
                  change="+8.2%"
                  trend="up"
                  icon={<ShoppingCart size={24} />}
                  variant="glass"
                />
                <MetricCard
                  label="Crecimiento"
                  value="23.4%"
                  change="+2.1%"
                  trend="up"
                  icon={<TrendingUp size={24} />}
                  variant="glass"
                />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Badges</h4>
            <Card>
              <div className="space-y-4">
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Variantes Básicas</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Default</Badge>
                    <Badge variant="outline">Outline</Badge>
                    <Badge variant="active">Active (con micro-glow)</Badge>
                  </div>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Estados</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success">Activo</Badge>
                    <Badge variant="warning">Pendiente</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Información</Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Form Controls */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Controles de Formulario</h4>
            <Card>
              <div className="space-y-6">
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Toggle / Switch</p>
                  <div className="flex flex-wrap gap-6">
                    <Toggle label="Notificaciones" />
                    <Toggle label="Modo oscuro" checked={theme === 'dark'} onChange={toggleTheme} />
                  </div>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Checkbox</p>
                  <div className="flex flex-wrap gap-6">
                    <Checkbox label="Acepto términos y condiciones" />
                    <Checkbox label="Recordarme" checked />
                  </div>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Radio Buttons</p>
                  <div className="flex flex-wrap gap-6">
                    <Radio label="Opción 1" checked />
                    <Radio label="Opción 2" />
                    <Radio label="Opción 3" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Tabs</h4>
            <Card>
              <div className="space-y-6">
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Underline Tabs</p>
                  <Tabs
                    variant="underline"
                    tabs={[
                      { id: 'general', label: 'General', content: <p className="text-[var(--text-secondary)]">Contenido de General</p> },
                      { id: 'settings', label: 'Configuración', content: <p className="text-[var(--text-secondary)]">Contenido de Configuración</p> },
                      { id: 'billing', label: 'Facturación', content: <p className="text-[var(--text-secondary)]">Contenido de Facturación</p> }
                    ]}
                  />
                </div>
                <div>
                  <p className="text-[var(--text-secondary)] text-[13px] mb-3">Contained Tabs</p>
                  <Tabs
                    variant="contained"
                    tabs={[
                      { id: 'overview', label: 'Vista General', content: <p className="text-[var(--text-secondary)]">Contenido de Vista General</p> },
                      { id: 'analytics', label: 'Analíticas', content: <p className="text-[var(--text-secondary)]">Contenido de Analíticas</p> },
                      { id: 'reports', label: 'Reportes', content: <p className="text-[var(--text-secondary)]">Contenido de Reportes</p> }
                    ]}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Tabla</h4>
            <Table
              columns={[
                { key: 'id', header: 'ID', width: '80px' },
                { key: 'product', header: 'Producto' },
                { key: 'category', header: 'Categoría' },
                { key: 'price', header: 'Precio', width: '120px' },
                { key: 'status', header: 'Estado', width: '120px' }
              ]}
              data={[
                { id: '001', product: 'Laptop Pro', category: 'Tecnología', price: '$1,299', status: 'Activo' },
                { id: '002', product: 'Mouse Inalámbrico', category: 'Accesorios', price: '$29', status: 'Activo' },
                { id: '003', product: 'Teclado Mecánico', category: 'Accesorios', price: '$89', status: 'Agotado' },
                { id: '004', product: 'Monitor 4K', category: 'Tecnología', price: '$499', status: 'Activo' }
              ]}
            />
          </div>

          {/* Navigation */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Navegación</h4>
            <div className="space-y-6">
              <div>
                <p className="text-[var(--text-secondary)] text-[13px] mb-3">Breadcrumbs</p>
                <Card>
                  <Breadcrumbs
                    items={[
                      { label: 'Inicio', href: '#' },
                      { label: 'Productos', href: '#' },
                      { label: 'Categorías', href: '#' },
                      { label: 'Tecnología' }
                    ]}
                  />
                </Card>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-[13px] mb-3">Topbar</p>
                <div className="border border-[var(--surface-400)] rounded-[var(--radius-md)] overflow-hidden">
                  <Topbar
                    title="Dashboard"
                    actions={
                      <>
                        <IconButton icon={<Bell size={18} />} />
                        <IconButton icon={<User size={18} />} />
                      </>
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-[var(--text-secondary)] text-[13px] mb-3">Sidebar</p>
                <div className="h-[400px] border border-[var(--surface-400)] rounded-[var(--radius-md)] overflow-hidden">
                  <Sidebar
                    items={[
                      { icon: <Home size={20} />, label: 'Inicio', href: '#', active: true },
                      { icon: <Package size={20} />, label: 'Productos', href: '#' },
                      { icon: <ShoppingCart size={20} />, label: 'Órdenes', href: '#' },
                      { icon: <Users size={20} />, label: 'Clientes', href: '#' },
                      { icon: <Settings size={20} />, label: 'Configuración', href: '#' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modals */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Modals</h4>
            <Card>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setModalOpen(true)}>
                  Abrir Modal Base
                </Button>
                <Button variant="secondary" onClick={() => setConfirmModalOpen(true)}>
                  Abrir Modal de Confirmación
                </Button>
              </div>
            </Card>

            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Modal de Ejemplo"
              footer={
                <>
                  <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                  <Button onClick={() => setModalOpen(false)}>Guardar</Button>
                </>
              }
            >
              <p className="text-[var(--text-secondary)]">
                Este es un ejemplo de modal base con contenido personalizado.
              </p>
            </Modal>

            <ConfirmModal
              isOpen={confirmModalOpen}
              onClose={() => setConfirmModalOpen(false)}
              onConfirm={() => console.log('Confirmado')}
              title="Confirmar acción"
              message="¿Estás seguro de que deseas continuar con esta acción?"
              variant="destructive"
              confirmText="Eliminar"
            />
          </div>

          {/* Empty States */}
          <div className="mb-8">
            <h4 className="text-[var(--text-primary)] mb-4">Estados Vacíos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <EmptyState
                  title="No hay elementos"
                  description="Comienza creando tu primer elemento"
                  action={{ label: 'Crear elemento', onClick: () => {} }}
                />
              </Card>
              <Card>
                <SearchEmptyState />
              </Card>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-8 border-t border-[var(--surface-400)]">
          <p className="text-[var(--text-tertiary)] text-center text-[13px]">
            MiProveedor Design System © 2025 - Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DesignSystemContent />
    </ThemeProvider>
  );
}