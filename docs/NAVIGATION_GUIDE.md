/**
 * Navigation Configuration Guide
 * 
 * This file explains how to work with the navigation system in Flow HRIS.
 */

// ============================================================================
// HOW TO ADD A NEW NAVIGATION ITEM
// ============================================================================

/**
 * Step 1: Add the navigation item to nav-items.ts
 * 
 * Location: src/app/(home)/nav-items.ts
 */

import { SomeIcon } from "@phosphor-icons/react";

export const navItems: NavItem[] = [
  // ... existing items
  {
    label: "my-feature",                    // Unique key identifier
    href: "/my-feature",                    // Route path
    icon: SomeIcon,                         // Phosphor icon component
    displayName: "My Feature",              // Human-readable name
    description: "Access my awesome feature", // Tooltip description
    roles: ["Employee", "Manager"],         // Legacy role-based access
    requiredPermissions: ["my_feature:can_read"], // Permission-based access
  },
];

/**
 * Step 2: (Optional) Add to navigation utilities
 * 
 * Location: src/lib/utils/navigation.ts
 * 
 * Only needed if you want special handling or custom short names
 */

export const NAV_LABEL_MAP: Record<string, { display: string; short?: string; description?: string }> = {
  // ... existing mappings
  "my-feature": {
    display: "My Awesome Feature",
    short: "Feature",                      // Short name for mobile
    description: "Access and manage my awesome feature"
  }
};

// ============================================================================
// UTILITY FUNCTIONS USAGE
// ============================================================================

/**
 * getNavDisplayLabel(label, variant)
 * 
 * Gets the display label for a navigation item
 */

import { getNavDisplayLabel } from "@/lib/utils/navigation";

// Full display name
const fullName = getNavDisplayLabel("operations-and-services"); 
// Returns: "Operations & Services"

// Short name (for mobile)
const shortName = getNavDisplayLabel("operations-and-services", "short");
// Returns: "Operations"

/**
 * getNavDescription(label)
 * 
 * Gets the description/tooltip for a navigation item
 */

import { getNavDescription } from "@/lib/utils/navigation";

const description = getNavDescription("home");
// Returns: "View your dashboard and overview"

/**
 * isNavItemActive(itemHref, currentPath, exact)
 * 
 * Determines if a navigation item is active
 */

import { isNavItemActive } from "@/lib/utils/navigation";

// Prefix match (default)
const isActive = isNavItemActive("/admin", "/admin/settings");
// Returns: true

// Exact match
const isExactMatch = isNavItemActive("/home", "/home", true);
// Returns: true

const notExact = isNavItemActive("/home", "/home/settings", true);
// Returns: false

/**
 * getInitials(name)
 * 
 * Generates initials from a user's name for avatar display
 */

import { getInitials } from "@/lib/utils/navigation";

const initials1 = getInitials("John Doe");
// Returns: "JD"

const initials2 = getInitials("Alice");
// Returns: "A"

const initials3 = getInitials(null);
// Returns: "U" (default for undefined/null)

/**
 * truncateText(text, maxLength)
 * 
 * Truncates text with ellipsis
 */

import { truncateText } from "@/lib/utils/navigation";

const truncated = truncateText("This is a very long text", 10);
// Returns: "This is..."

// ============================================================================
// PERMISSION-BASED NAVIGATION
// ============================================================================

/**
 * How permissions work with navigation:
 * 
 * 1. NavItem has `requiredPermissions` array
 * 2. Format: "module:action" (e.g., "teams:can_write")
 * 3. AuthContext filters nav items based on user permissions
 * 4. Backward compatible with role-based access
 */

// Example: Admin-only navigation
{
  label: "admin",
  href: "/admin",
  icon: UserGearIcon,
  displayName: "Admin Management",
  requiredPermissions: ["teams:can_write", "admin_config:can_write"],
  // User needs at least ONE of these permissions
}

// Example: Universal access
{
  label: "home",
  href: "/home",
  icon: GridFourIcon,
  displayName: "Dashboard",
  requiredPermissions: [], // Empty array = accessible to all approved users
}

// ============================================================================
// STYLING AND ANIMATIONS
// ============================================================================

/**
 * Consistent animation patterns used throughout navigation:
 */

// Spring animation (recommended for smooth physics-based motion)
const springVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20
    }
  }
};

// Layout animation (for morphing elements like active indicators)
<motion.div
  layoutId="uniqueId"
  transition={{ type: "spring", stiffness: 380, damping: 30 }}
/>

// Hover/Tap animations
<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
/>

/**
 * Consistent color classes:
 */

// Active state
className="bg-yellow-400 text-black font-medium shadow-md"

// Inactive/default state
className="text-gray-300 hover:text-white hover:bg-[#001c4f]"

// Gradient backgrounds
className="bg-gradient-to-b from-[#001731] to-[#002363]"

// ============================================================================
// RESPONSIVE DESIGN PATTERNS
// ============================================================================

/**
 * Breakpoint standards:
 */

// Mobile-only (hidden on desktop)
className="block md:hidden"

// Desktop-only (hidden on mobile)
className="hidden md:block"

// Mobile bottom padding (for bottom nav)
className="pb-20 md:pb-0"

/**
 * Component visibility based on screen size:
 */

// Sidebar: Always visible on desktop, drawer on mobile
// TopBar: Always visible when approved
// MobileBottomNav: Only on mobile (md:hidden)

// ============================================================================
// BEST PRACTICES
// ============================================================================

/**
 * DO:
 * ✅ Use utility functions for label formatting
 * ✅ Keep navigation items to 5 or fewer for mobile
 * ✅ Provide both displayName and description
 * ✅ Use permission-based access over roles
 * ✅ Test on mobile devices
 * ✅ Use consistent animation patterns
 * ✅ Follow the color scheme
 * 
 * DON'T:
 * ❌ Hardcode label formatting logic
 * ❌ Add more than 5 items to mobile nav
 * ❌ Skip accessibility attributes (title, aria-label)
 * ❌ Use inconsistent animation timings
 * ❌ Override colors without reason
 * ❌ Break the responsive design
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Issue: Nav item not showing
 * Solution: Check user permissions and approval status
 */

// 1. Verify user has required permissions
const { hasPermission } = useAuth();
const canAccess = hasPermission("module", "can_read");

// 2. Check if user is approved
const { isApproved } = useAuth();

/**
 * Issue: Tooltip not appearing
 * Solution: Check hover state and tooltip positioning
 */

// Ensure hoveredItem state is being set
onMouseEnter={() => setHoveredItem(item.label)}
onMouseLeave={() => setHoveredItem(null)}

/**
 * Issue: Active state not working
 * Solution: Verify pathname comparison logic
 */

// Use the utility function
const isActive = isNavItemActive(item.href, pathname);

// Not manual comparison which might fail
const isActive = pathname === item.href; // ❌ Too strict
const isActive = pathname.includes(item.href); // ❌ Too loose

/**
 * Issue: Mobile nav overlapping content
 * Solution: Ensure proper padding on main content
 */

// Layout should have bottom padding on mobile
<main className="pb-20 md:pb-0">
  {children}
</main>

// ============================================================================
// EXAMPLES
// ============================================================================

/**
 * Example 1: Creating a custom navigation component
 */

import { useAuth } from "@/lib/auth/auth-context";
import { getNavDisplayLabel, isNavItemActive } from "@/lib/utils/navigation";
import { usePathname } from "next/navigation";

export function CustomNav() {
  const { getAuthorizedNavItems } = useAuth();
  const pathname = usePathname();
  const navItems = getAuthorizedNavItems();
  
  return (
    <nav>
      {navItems.map(item => {
        const label = getNavDisplayLabel(item.label);
        const isActive = isNavItemActive(item.href, pathname);
        
        return (
          <a 
            key={item.label}
            href={item.href}
            className={isActive ? "active" : ""}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}

/**
 * Example 2: Using initials for user avatar
 */

import { getInitials } from "@/lib/utils/navigation";

export function UserAvatar({ name }: { name: string }) {
  const initials = getInitials(name);
  
  return (
    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
      <span className="text-white font-bold">{initials}</span>
    </div>
  );
}

/**
 * Example 3: Dynamic breadcrumbs
 */

import { getNavDisplayLabel } from "@/lib/utils/navigation";

export function Breadcrumbs({ paths }: { paths: string[] }) {
  return (
    <nav>
      {paths.map((path, index) => (
        <span key={path}>
          {index > 0 && " / "}
          {getNavDisplayLabel(path)}
        </span>
      ))}
    </nav>
  );
}

export default null; // Prevent import
