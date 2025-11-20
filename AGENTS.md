# agents.md – MiProveedor

## Contexto del proyecto

Este proyecto es un **micro-SaaS B2B** llamado (nombre de trabajo) **MiProveedor**.

La idea central:
- Proveedores (mayoristas / distribuidores) quieren **recibir pedidos organizados** de sus clientes (tiendas, dietéticas, almacenes, etc.).
- Cada cliente del proveedor tiene un **link único** donde puede armar y enviar su pedido.
- El proveedor recibe el pedido en un **panel web**, puede gestionarlo (cambiar estados) y queda todo **registrado en un solo lugar**.

El foco es:
- Simpleza (nada de e-commerce complejo).
- Multi-tenant (un SaaS para muchos proveedores).
- 100% usable en **mobile** (muy importante).

---

## Roles principales

1. **SaaS Owner / Admin (yo)**
   - Administra la plataforma general.
   - Crea y gestiona cuentas de **proveedores**.
   - Puede ver métricas básicas de uso.

2. **Proveedor (cliente de MiProveedor)**
   - Es el usuario principal del sistema.
   - Tiene un panel donde:
     - Ve pedidos de sus clientes.
     - Crea o invita clientes (tiendas).
     - Gestiona su catálogo de productos.
   - Recibe notificaciones cuando entra un nuevo pedido (mínimo: por email).

3. **Cliente del proveedor (tienda / negocio)**
   - Hace pedidos al proveedor usando un **link único**.
   - No necesita panel complejo: solo:
     - Ver productos,
     - Armar el pedido,
     - Enviar.

---

## Flujos principales

### 1. Onboarding de Proveedores

Queremos soportar **dos maneras** (ambas deben ser posibles):

1. **Alta manual por parte del Admin**
   - El admin crea un proveedor desde un panel interno o consola.
   - Define:
     - Nombre del proveedor.
     - Datos básicos.
     - Correo de login.
   - El proveedor recibe un mail para setear su contraseña.

2. **Alta auto-servicio (futuro cercano)**
   - Página pública tipo “Empieza con MiProveedor”.
   - Formulario de registro del proveedor.
   - Se crea la cuenta de proveedor y su primer usuario owner.
   - Puede quedar en backlog, pero el código debería ser compatible con este escenario.

### 2. Onboarding de Clientes (tiendas que le compran al proveedor)

También **dos maneras**:

1. **Creación manual por el proveedor**
   - El proveedor entra a su panel.
   - Crea una nueva tienda:
     - Nombre del negocio.
     - Datos básicos (dirección, contacto).
   - El sistema genera un **slug** y un **link único**:
     - Ejemplo: `miproveedor.app/tufud/nova-caballito`
   - El proveedor copia ese link y se lo manda a la tienda por WhatsApp / mail.

2. **Invitación por link (auto-registro de tienda)**
   - El proveedor genera un **link de invitación** genérico:
     - Ej: `miproveedor.app/invite/tufud/XYZ123`
   - La tienda abre ese link, llena un formulario con:
     - Nombre de la tienda.
     - Persona de contacto.
     - Datos básicos (teléfono, dirección).
   - El sistema crea la tienda y genera su **link de pedidos permanente**.
   - Desde ahí en adelante, esa tienda usa siempre *ese link* para hacer sus pedidos.

Es importante que la lógica soporte ambos modelos.

### 3. Flujo del pedido (desde la tienda)

1. La tienda abre su link único:
   - Ej: `miproveedor.app/tufud/nova-caballito`
2. Ve:
   - Logo y nombre del proveedor.
   - Catálogo de productos (nombre, precio, presentación).
3. Agrega productos a un "carrito" usando controles tipo **stepper** (+/- cantidad).
4. Completa formulario de envío:
   - Nombre de contacto.
   - WhatsApp / email.
   - Opcional: método de entrega (retiro / envío).
   - Nota del pedido (texto libre).
5. Envía el pedido.

El sistema debe:
- Crear un registro de `order` vinculado a:
  - proveedor,
  - tienda (cliente),
  - items del pedido.
- Dejar el estado inicial en `nuevo`.

### 4. Flujo del pedido (desde el proveedor)

1. El proveedor recibe una **notificación mínima por email**:
   - Asunto: “Nuevo pedido de [Nombre de tienda]”.
   - Link directo al pedido en el panel.

2. En el **panel del proveedor**:
   - Vista “Pedidos” muestra una lista con:
     - Nombre de la tienda.
     - Fecha de pedido.
     - Estado (nuevo, preparando, enviado, entregado, cancelado).
   - Al hacer click, abre el detalle:
     - Datos de contacto.
     - Nota.
     - Lista de productos y cantidades.

3. El proveedor puede cambiar el estado:
   - `nuevo` → `preparando`.
   - `preparando` → `enviado` o `entregado`.
   - `nuevo` / `preparando` → `cancelado`.

Más adelante se pueden agregar:
- Filtros por fecha, estado, tienda.
- Exportación a CSV/Excel, etc.

---

## Requisitos de diseño e interfaz

- **Mobile-first** obligatorio:
  - Todo debe funcionar perfecto en pantallas chicas (320px en adelante).
  - Evitar tablas muy anchas sin scroll adecuado.
  - Usar layouts de **stack vertical** en mobile y grid en desktop.

- Estética:
  - Usar **shadcn/ui** + **Tailwind**.
  - Iconos con **lucide-react**.
  - Animaciones pequeñas y suaves con **framer-motion** donde tenga sentido (por ejemplo aparición de toasts, apertura de paneles).

- Componentes clave (shadcn):
  - `button`, `badge`, `input`, `label`, `textarea`, `checkbox`, `select`, `tabs`, `card`, `table`, `dialog`, `popover`, `dropdown-menu`, `sheet`, `sidebar`, `alert`, `alert-dialog`, `toast/sonner`, `avatar`, `skeleton`, `pagination`, `form`, `calendar` (si se usan fechas visibles), etc.

- Temas:
  - El proyecto tiene **next-themes** instalado.
  - Mantener compatibilidad con **modo claro/oscuro**.
  - No romper el soporte de tema al agregar componentes nuevos.

- Accesibilidad:
  - Usar `aria-*` cuando corresponda.
  - Asegurar focus states visibles.
  - Formularios con `label` bien asociados a `input`.

---

## Stack técnico

### Base

- **Framework**: Next.js (última versión, app router).
- **Lenguaje**: TypeScript.
- **Estilos**: Tailwind CSS + plugins:
  - `@tailwindcss/typography`
  - `@tailwindcss/forms`
- **UI**: shadcn/ui.
- **Íconos**: lucide-react.
- **Animaciones**: framer-motion.
- **Charts**: recharts (para futuras métricas).

### Backend / Datos

- **Supabase**:
  - Base de datos Postgres gestionada por Supabase.
  - Se usan:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - (Opcional server-side) `SUPABASE_SERVICE_ROLE`
  - También se usan connection strings:
    - `DATABASE_URL` (pooler, pgbouncer, `sslmode=require`).
    - `DIRECT_URL` (conexión directa a db para Prisma).

- **Supabase Client**:
  - `@supabase/supabase-js`
  - `@supabase/ssr`
  - Tipos generados opcionales con:
    - `npx supabase gen types typescript --project-id <project-ref> --schema public > src/types/supabase.ts`

- **Prisma / pg**:
  - `pg` instalado.
  - Prisma se usa para schema y migraciones.
  - Comandos tipo:
    - `npx supabase migration new <name>`
    - luego `npx supabase db push` para aplicar.

### Código y calidad

- Formato: `prettier` + `prettier-plugin-tailwindcss`.
- Lint: `eslint-config-prettier`.
- Hooks de git:
  - `husky` + `lint-staged`.
- Testing (opcional pero deseable, especialmente para lógica crítica):
  - `vitest`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `jsdom`

### SEO & Sitemaps

- `next-seo` para manejar metadatos.
- `next-sitemap` para generar sitemaps (aunque sea mínimo).

### Despliegue

- Repositorio en **GitHub**.
- Deploy en **Vercel**:
  - Repo conectado.
  - Deploy automático a `main`.
  - También se puede usar `npx vercel --prod` desde CLI y linkear al proyecto existente.

---

## Estructura de datos (modelo inicial)

Tablas mínimas (puede implementarse con Prisma o SQL directo):

### `users`
- `id` (uuid)
- `name`
- `email` (único)
- `password_hash` (si se maneja auth propia, o referencia a auth de Supabase)
- `role` (`admin`, `provider`)
- `provider_id` (nullable, para usuarios admin globales)
- timestamps

### `providers`
- `id` (uuid)
- `name`
- `slug` (para urls internas si se usa)
- `logo_url` (nullable)
- `contact_email`
- `contact_phone`
- `is_active` (boolean)
- timestamps

### `clients` (tiendas que compran al proveedor)
- `id` (uuid)
- `provider_id` (fk → providers.id)
- `name`
- `slug` (para el link único de pedidos, ej: `nova-caballito`)
- `contact_name`
- `contact_phone`
- `contact_email` (nullable)
- `address` (nullable)
- `is_active` (boolean)
- timestamps

> El link público de pedidos se arma combinando:
> `/{providerSlug}/{clientSlug}` o similar.

### `products`
- `id` (uuid)
- `provider_id` (fk → providers.id)
- `name`
- `description` (nullable)
- `price` (numeric/decimal)
- `unit` (texto simple, opcional, ej: “kg”, “unidad”, “caja x12”)
- `is_active` (boolean)
- `image_url` (nullable)
- `category` (texto, opcional)
- timestamps

### `orders`
- `id` (uuid)
- `provider_id` (fk → providers.id)
- `client_id` (fk → clients.id)
- `status` (`nuevo`, `preparando`, `enviado`, `entregado`, `cancelado`)
- `contact_name` (texto)
- `contact_phone` (texto)
- `delivery_method` (`retiro`, `envio`, nullable)
- `note` (texto, nullable)
- timestamps (`created_at` muy importante)

### `order_items`
- `id` (uuid)
- `order_id` (fk → orders.id)
- `product_id` (fk → products.id)
- `quantity` (integer)
- `unit_price` (numeric/decimal) – precio en el momento del pedido.

---

## Rutas y vistas recomendadas

Ejemplo con app router de Next:

- Público:
  - `/` – landing simple de MiProveedor (explica el producto).
  - `/[providerSlug]/[clientSlug]` – página de pedidos de la tienda.
  - `/invite/[providerSlug]/[inviteToken]` – flujo de auto-registro de tienda (si está activo).

- Autenticado (provider):
  - `/app` – dashboard del proveedor.
  - `/app/orders` – lista de pedidos.
  - `/app/orders/[orderId]` – detalle del pedido.
  - `/app/products` – listado y edición de productos.
  - `/app/clients` – listado de tiendas clientes e invitaciones.
  - `/app/settings` – ajustes del proveedor.

- Admin (opcional / futuro):
  - `/admin/providers`
  - `/admin/providers/[id]`
  - `/admin/users`

---

## Estilo de código y ayudas para Codex

- Usar siempre **TypeScript** tanto en frontend como en server components / API.
- Preferir server components cuando tengan sentido, y usar client components donde haya:
  - estado local,
  - interacciones,
  - hooks del navegador.

- Para UI:
  - Reutilizar componentes de shadcn/ui.
  - Crear componentes wrappers propios si una UI se repite mucho (`OrderCard`, `ClientSelector`, etc.).

- Para mobile:
  - Empezar diseñando el layout para pantallas chicas.
  - Luego ampliar a desktop con responsive (`md:`, `lg:` etc).

- Al escribir migraciones:
  - Respetar nombres de tablas y columnas definidos aquí.
  - Mantener consistencia camelCase ⇄ snake_case dependiendo de la convención elegida (ideal: snake_case en DB, camelCase en código TS).

- Es importante:
  - No romper el soporte de modo oscuro/claro de `next-themes`.
  - Cuidar accesibilidad básica (labels, focus states).
  - Mantener el código formateado con `prettier` + `prettier-plugin-tailwindcss`.

---

Utiliza animaciones a menudo, que la pagina tenga objetos que se muevan y manten estilos elegantes, y minimalistas. 