export type DemoProvider = {
  id: string;
  name: string;
  slug: string;
  contact_email?: string;
  contact_phone?: string;
};

export type DemoClient = {
  id: string;
  provider_id: string;
  name: string;
  slug: string;
  contact_name?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  address?: string | null;
  is_active?: boolean | null;
};

export type DemoProduct = {
  id: string;
  provider_id: string;
  name: string;
  description?: string | null;
  price: number;
  unit?: string | null;
  is_active?: boolean | null;
  category?: string | null;
  tags?: string[] | null;
  image_url?: string | null;
  discount_percent?: number | null;
  is_new?: boolean | null;
  is_out_of_stock?: boolean | null;
};

type DemoOrderSeed = {
  id: string;
  clientSlug: string;
  status: "nuevo" | "preparando" | "enviado" | "entregado" | "cancelado";
  createdAgoMinutes: number;
  contactName: string;
  contactPhone: string;
  deliveryMethod?: string;
  note?: string;
  items: { productId: string; quantity: number }[];
};

export type DemoOrder = DemoOrderSeed & {
  createdAt: string;
  total: number;
  items: (DemoOrderSeed["items"][number] & {
    name: string;
    unitPrice: number;
    unit?: string | null;
  })[];
};

const provider: DemoProvider = {
  id: "00000000-0000-4000-8000-00000000d001",
  name: "Distribuidora Demo",
  slug: "demo",
  contact_email: "demo@miproveedor.app",
  contact_phone: "+54 9 11 2345-6789",
};

const clients: DemoClient[] = [
  {
    id: "00000000-0000-4000-8000-00000000c001",
    provider_id: provider.id,
    name: "Almacén Centro",
    slug: "almacen-centro",
    contact_name: "Rocío Torres",
    contact_phone: "+54 9 11 5555-2222",
    address: "Av. Principal 123",
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-00000000c002",
    provider_id: provider.id,
    name: "Dietética Norte",
    slug: "dietetica-norte",
    contact_name: "Luis Gómez",
    contact_phone: "+54 9 11 6666-1111",
    address: "Rivadavia 4500",
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-00000000c003",
    provider_id: provider.id,
    name: "Mercado Sur",
    slug: "mercado-sur",
    contact_name: "Camila Pérez",
    contact_phone: "+54 9 11 7777-3333",
    address: "Av. Belgrano 2200",
    is_active: true,
  },
];

const products: DemoProduct[] = [
  {
    id: "00000000-0000-4000-8000-00000000p001",
    provider_id: provider.id,
    name: "Granola Crunch",
    description: "Bolsa 500g con frutos secos y semillas.",
    price: 5500,
    unit: "bolsa 500g",
    is_active: true,
    category: "Snacks",
    tags: ["destacado", "sin tacc"],
    is_new: true,
  },
  {
    id: "00000000-0000-4000-8000-00000000p002",
    provider_id: provider.id,
    name: "Yerba Orgánica",
    description: "Blend suave sin agroquímicos.",
    price: 3800,
    unit: "paquete 1kg",
    is_active: true,
    category: "Infusiones",
    tags: ["yerba", "orgánico"],
    is_new: false,
  },
  {
    id: "00000000-0000-4000-8000-00000000p003",
    provider_id: provider.id,
    name: "Mix de Frutos",
    description: "Almendras, castañas y pasas premium.",
    price: 7200,
    unit: "bolsa 1kg",
    is_active: true,
    category: "Snacks",
    tags: ["mix", "premium"],
    is_out_of_stock: true,
  },
  {
    id: "00000000-0000-4000-8000-00000000p004",
    provider_id: provider.id,
    name: "Barras de Cereal",
    description: "Caja x12 unidades, sabor miel y nuez.",
    price: 9100,
    unit: "caja x12",
    is_active: true,
    category: "Snacks",
    tags: ["box", "impulsivos"],
  },
  {
    id: "00000000-0000-4000-8000-00000000p005",
    provider_id: provider.id,
    name: "Aceite de Coco",
    description: "Extra virgen, frasco de vidrio.",
    price: 6400,
    unit: "frasco 500ml",
    is_active: true,
    category: "Despensa",
    tags: ["vegano", "aceites"],
    is_new: true,
  },
];

const orderSeeds: DemoOrderSeed[] = [
  {
    id: "00000000-0000-4000-8000-00000000o001",
    clientSlug: "almacen-centro",
    status: "nuevo",
    createdAgoMinutes: 4,
    contactName: "Camila Duarte",
    contactPhone: "+54 9 11 7000-1000",
    deliveryMethod: "Envío",
    note: "Entregar antes de las 13hs si es posible.",
    items: [
      { productId: products[0].id, quantity: 2 },
      { productId: products[1].id, quantity: 3 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000o002",
    clientSlug: "dietetica-norte",
    status: "preparando",
    createdAgoMinutes: 18,
    contactName: "Luis Gómez",
    contactPhone: "+54 9 11 6666-1111",
    deliveryMethod: "Retiro",
    items: [
      { productId: products[2].id, quantity: 1 },
      { productId: products[4].id, quantity: 2 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000o003",
    clientSlug: "mercado-sur",
    status: "enviado",
    createdAgoMinutes: 45,
    contactName: "Diego Rivas",
    contactPhone: "+54 9 11 8888-0000",
    deliveryMethod: "Envío",
    items: [
      { productId: products[3].id, quantity: 2 },
      { productId: products[1].id, quantity: 4 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000o004",
    clientSlug: "almacen-centro",
    status: "entregado",
    createdAgoMinutes: 160,
    contactName: "Rocío Torres",
    contactPhone: "+54 9 11 5555-2222",
    deliveryMethod: "Retiro",
    items: [
      { productId: products[2].id, quantity: 1 },
      { productId: products[0].id, quantity: 1 },
    ],
  },
  {
    id: "00000000-0000-4000-8000-00000000o005",
    clientSlug: "dietetica-norte",
    status: "preparando",
    createdAgoMinutes: 210,
    contactName: "Ana Ruiz",
    contactPhone: "+54 9 11 9999-1111",
    deliveryMethod: "Envío",
    items: [
      { productId: products[4].id, quantity: 1 },
      { productId: products[3].id, quantity: 1 },
    ],
  },
];

export function getDemoData() {
  const now = Date.now();
  const productMap = new Map(products.map((item) => [item.id, item]));
  const resolvedOrders: DemoOrder[] = orderSeeds.map((seed) => {
    const baseClient = clients.find((client) => client.slug === seed.clientSlug);
    const createdAt = new Date(now - seed.createdAgoMinutes * 60 * 1000).toISOString();
    const items = seed.items.map((item) => {
      const product = productMap.get(item.productId);
      const unitPrice = product?.price ?? 0;
      return {
        ...item,
        name: product?.name ?? "Producto demo",
        unitPrice,
        unit: product?.unit,
      };
    });
    const total = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

    return {
      ...seed,
      clientSlug: baseClient?.slug ?? seed.clientSlug,
      createdAt,
      items,
      total,
    };
  });

  return {
    provider,
    clients,
    products,
    orders: resolvedOrders,
  };
}
