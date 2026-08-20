export const navigationConfig = {
  public: [
    { label: 'Inicio', href: '/' },
    { label: 'Productos', href: '/productos' },
    { label: 'Contacto', href: '/contacto' },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
    { label: 'Productos', href: '/admin/productos', icon: 'Package' },
    { label: 'Categorías', href: '/admin/categorias', icon: 'LayoutList' },
    { label: 'Marcas', href: '/admin/marcas', icon: 'Tag' },
    { label: 'Colecciones', href: '/admin/colecciones', icon: 'Layers' },
    { label: 'Atributos', href: '/admin/atributos', icon: 'Tags' },
    { label: 'Importar/Exportar', href: '/admin/imports', icon: 'FileUp' },
    { label: 'Inventario', href: '/admin/inventario', icon: 'Warehouse' },
    { label: 'Pedidos', href: '/admin/pedidos', icon: 'ShoppingCart' },
    { label: 'Clientes', href: '/admin/clientes', icon: 'Users' },
    { label: 'Finanzas', href: '/admin/finanzas', icon: 'Wallet' },
    { label: 'Configuración', href: '/admin/configuracion', icon: 'Settings' },
  ],
  vendor: [
    { label: 'Dashboard', href: '/vendedor', icon: 'LayoutDashboard' },
    { label: 'Productos', href: '/vendedor/productos', icon: 'Package' },
    { label: 'Pedidos', href: '/vendedor/pedidos', icon: 'ShoppingCart' },
    { label: 'Comisiones', href: '/vendedor/comisiones', icon: 'Wallet' },
  ],
} as const;
