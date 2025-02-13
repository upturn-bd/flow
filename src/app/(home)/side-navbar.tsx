import Link from "next/link";
import React from "react";
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

const navItems = [
  {
    label: "Profile",
    href: "/",
    icon: UserCircleIcon,
  },
  {
    label: "entry",
    href: "/entry",
    icon: ShoppingBagIcon,
  },
  {
    label: "Panel",
    href: "/table",
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

export default function Sidebar() {
  return (
    <div
      className="w-full relative h-dvh md:flex flex-col items-center justify-center hidden"
      style={{
        background: "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
      }}
    >
      <div className="absolute top-10 right-0 translate-x-1/2 p-10 rounded-full bg-[#001731] flex items-center justify-center">
        <ArrowFatRightIcon
          size={80}
          className="-rotate-45 text-yellow-500"
          weight="fill"
        />
      </div>
      <nav className="w-full flex flex-col gap-6 items-center justify-center text-white">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link href={item.href} key={item.label}>
              <Icon size={45} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
