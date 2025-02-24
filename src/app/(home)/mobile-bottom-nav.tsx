"use client";


import {
  UserCircle as UserCircleIcon,
  ShoppingBag as ShoppingBagIcon,
  GridFour as GridFourIcon,
  NotePencil as NotePencilIcon,
  Envelope as EnvelopeIcon,
  Scroll as ScrollIcon,
  UserGear as UserGearIcon,
  ArrowFatRight as ArrowFatRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

const navItems = [
  {
    label: "Profile",
    href: "/",
    icon: UserCircleIcon,
  },
  {
    label: "task",
    href: "/entry",
    icon: ShoppingBagIcon,
  },
  {
    label: "Panel",
    href: "/",
    icon: GridFourIcon,
  },
  {
    label: "Notes",
    href: "/",
    icon: NotePencilIcon,
  },
  {
    label: "Messages",
    href: "/",
    icon: EnvelopeIcon,
  },
  {
    label: "Scroll",
    href: "/",
    icon: ScrollIcon,
  },
  {
    label: "Settings",
    href: "/",
    icon: UserGearIcon,
  },
];

export default function MobileBottomNav() {
  return (
    <div
      className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 h-20 rounded-t-lg block md:hidden"
      style={{
        background: "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
      }}
    >
      <nav className="relative w-full h-full flex items-center text-white">
        <Link
          href="/"
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[60%] h-14 w-14 rounded-full bg-[#001731] flex items-center justify-center"
        >
          <ArrowFatRightIcon
            size={30}
            className="-rotate-45 text-yellow-500"
            weight="fill"
          />
        </Link>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.label}
              className="px-3 flex-1 flex items-center justify-center border-r last:border-r-0 border-zinc-600"
            >
              <Icon size={30} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
