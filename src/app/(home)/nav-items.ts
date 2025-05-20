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
  } from "@phosphor-icons/react/dist/ssr";

export const navItems = [
    {
      label: "Home",
      href: "/home",
      icon: GridFourIcon, 
    },
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
      label: "Finder",
      href: "/finder",
      icon: MagnifyingGlassIcon,
    },
    {
      label: "Admin Management",
      href: "/admin-management",
      icon: UserGearIcon,
    },
  ];