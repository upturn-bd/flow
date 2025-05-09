import {
    UserCircle as UserCircleIcon,
    ShoppingBag as ShoppingBagIcon,
    GridFour as GridFourIcon,
    NotePencil as NotePencilIcon,
    Envelope as EnvelopeIcon,
    Scroll as ScrollIcon,
    UserGear as UserGearIcon,
  } from "@phosphor-icons/react/dist/ssr";

export const navItems = [
    {
      label: "profile",
      href: "/profile",
      icon: UserCircleIcon,
    },
    {
      label: "operations-and-services",
      href: "/operations-and-services",
      icon: EnvelopeIcon,
    },
    {
      label: "admin-management",
      href: "/admin-management",
      icon: UserGearIcon,
    },
  ];