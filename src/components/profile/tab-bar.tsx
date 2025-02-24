'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';


interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  {
    label: 'Basic Information',
    href: '/profile',

  },
  {
    label: 'Personal Information',
    href: '/profile/personal-info',
  },
  {
    label: 'Education & Experience',
    href: '/profile/experience',
  },
  {
    label: 'Key Performance Indicator',
    href: '/profile/kpi',
  },
  {
    label: 'Performance Evaluation',
    href: '/profile/evaluation',
  },
];

export default function TabView(
) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');

  return (
    <div className={clsx(
      "flex items-center mx-20 m-[45px] border border-gray-200 rounded-lg",
      {
        'shadow-md': pathname === '/profile',
      }
    )}>
      {navItems.map((link, index) => (
        <Link
          key={index}
          href={link.href + (uid?.length ?? 0 > 0 ? `?uid=${uid}` : '')}
          className={clsx(
            'w-70 px-5 text-2xl py-5 first:rounded-l-lg border-r last:border-r-0 border-black last:rounded-r-lg h-full flex items-center justify-center text-center transition-colors duration-300',
            {
              'bg-white shadow-md text-blue-900 font-semibold': pathname === link.href,
            },
          )}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
};