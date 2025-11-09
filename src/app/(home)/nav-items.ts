import {
    UserCircle as UserCircleIcon,
    ShoppingBag as ShoppingBagIcon,
    GridFour as GridFourIcon,
    NotePencil as NotePencilIcon,
    Envelope as EnvelopeIcon,
    Scroll as ScrollIcon,
    UserGear as UserGearIcon,
    MagnifyingGlass as MagnifyingGlassIcon,
    User as UserIcon,
    Bell as BellIcon,
  } from "@phosphor-icons/react";

export type NavItem = {
  label: string;
  href: string;
  icon: any;
  roles?: string[];  // Deprecated: kept for backward compatibility
  requiredPermissions?: string[];  // New: permission-based access (format: "module:action")
};

export const navItems: NavItem[] = [
    {
      label: "home",
      href: "/home",
      icon: GridFourIcon, 
      roles: ["Employee", "Manager", "Admin"], // Backward compatibility
      requiredPermissions: [], // Home accessible to all approved users
    },
    {
      label: "operations-and-services",
      href: "/ops",
      icon: EnvelopeIcon,
      roles: ["Employee", "Manager", "Admin"], // Backward compatibility
      requiredPermissions: [], // Operations page accessible to all, subpages have their own checks
    },
    {
      label: "admin",
      href: "/admin",
      icon: UserGearIcon,
      roles: ["Admin"], // Backward compatibility
      requiredPermissions: ["teams:can_write", "admin_config:can_write"], // Admins have team write access
    },
  ];