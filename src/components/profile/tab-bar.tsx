import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProfileTabs() {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-300 rounded-lg mb-12">
      <Link
        href="/profile"
        className={`w-full px-4 py-6 font-medium text-center border-r-2 border-gray-800 ${
          pathname === `/profile`
            ? "font-bold text-blue-700"
            : "text-gray-700 hover:text-blue-600"
        }`}
      >
        Basic Information
      </Link>
      <Link
        href="/profile/personal-info"
        className={`w-full px-4 py-6 font-medium text-center border-r-2 border-gray-800 ${
          pathname === `/profile/personal-info`
            ? "font-bold text-blue-700"
            : "text-gray-700 hover:text-blue-600"
        }`}
      >
        Personal Information
      </Link>
      <Link
        href="/profile/education-and-experience"
        className={`w-full px-4 py-6 font-medium text-center ${
          pathname === `/profile/education-and-experience`
            ? "font-bold text-blue-700"
            : "text-gray-700 hover:text-blue-600"
        }`}
      >
        Education & Experience
      </Link>
    </div>
  );
}