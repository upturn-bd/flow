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
  ArrowFatRight,
} from "@phosphor-icons/react/dist/ssr";

export default function Sidebar() {
  return (
    <div
      className="w-full relative h-dvh flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135.32deg, #001731 24.86%, #002363 100%)",
      }}
    >
      <div className="absolute top-10 right-0 translate-x-1/2 p-10 rounded-full bg-[#001731] flex items-center justify-center">
        <ArrowFatRight
          size={80}
          className="-rotate-45 text-yellow-500"
          weight="fill"
        />
      </div>
      <nav className="w-full flex flex-col gap-6 items-center justify-center text-white">
        <Link href="/profile">
          <UserCircleIcon size={45} />
        </Link>
        <Link href="/profile">
          <ShoppingBagIcon size={45} />
        </Link>
        <Link href="/profile">
          <GridFourIcon size={45} />
        </Link>
        <Link href="/profile">
          <NotePencilIcon size={45} />
        </Link>
        <Link href="/profile">
          <EnvelopeIcon size={45} />
        </Link>
        <Link href="/profile">
          <ScrollIcon size={45} />
        </Link>
        <Link href="/profile">
          <UserGearIcon size={45} />
        </Link>
      </nav>
    </div>
  );
}
