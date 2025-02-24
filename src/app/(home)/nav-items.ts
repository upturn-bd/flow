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
      label: "Profile",
      href: "/profile",
      icon: UserCircleIcon,
    },
    {
      label: "entry",
      href: "/entry",
      icon: ShoppingBagIcon,
    },
    {
      label: "table",
      href: "/table",
      icon: GridFourIcon,
    },
    {
      label: "adminmgt",
      href: "/adminmgt",
      icon: NotePencilIcon,
    },
    {
      label: "Messages",
      href: "/request&issues",
      icon: EnvelopeIcon,
    },
    {
      label: "reports",
      href: "/reports",
      icon: ScrollIcon,
    },
    {
      label: "admin-settings",
      href: "/admin-settings",
      icon: UserGearIcon,
    },
  ];