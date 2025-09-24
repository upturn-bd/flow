/**
 * Common animation variants for use with Framer Motion
 */

// Basic fade animations
export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4 }
  }
};

export const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4 }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4 }
  }
};

export const fadeOut = {
  visible: { opacity: 1 },
  hidden: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

// Scale animations
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 }
  }
};

export const scaleOut = {
  visible: { opacity: 1, scale: 1 },
  hidden: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 }
  }
};

export const bounceIn = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 17
    }
  }
};

// Slide animations
export const slideInLeft = {
  hidden: { x: "-100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

export const slideInRight = {
  hidden: { x: "100%" },
  visible: {
    x: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

export const slideInUp = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

export const slideInDown = {
  hidden: { y: "-100%" },
  visible: {
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  }
};

// Container animations
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerContainerFast = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

export const staggerContainerSlow = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

// Modal/Dialog animations
export const modalBackdrop = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

export const modalContent = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 20 
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 }
  }
};

// Button animations
export const buttonTap = {
  whileTap: { scale: 0.95 }
};

export const buttonHover = {
  whileHover: { scale: 1.05 }
};

export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 }
};

// Loading animations
export const loadingSpinner = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

export const loadingPulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Card animations
export const cardHover = {
  whileHover: {
    y: -5,
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 }
  }
};

export const cardTap = {
  whileTap: { scale: 0.98 }
};

// List item animations
export const listItem = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  }
};

// Form field animations
export const formFieldFocus = {
  whileFocus: {
    scale: 1.02,
    transition: { duration: 0.2 }
  }
};

// Notification animations
export const notificationSlideIn = {
  hidden: { x: "100%", opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 30 }
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

// Page transition animations
export const pageTransition = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3 }
  }
}; 