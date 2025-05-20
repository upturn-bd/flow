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
      label: "HRIS",
      href: "/hris",
      icon: UserCircleIcon,
    },
    {
      label: "Operations and Services",
      href: "/operations-and-services",
      icon: EnvelopeIcon,
    },
    {
      label: "Admin Management",
      href: "/admin-management",
      icon: UserGearIcon,
    },
  ];