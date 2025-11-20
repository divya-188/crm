/**
 * Framer Motion Animation Variants
 * Reusable animation configurations for consistent motion design
 */

import { Variants } from 'framer-motion';

/**
 * Fade animations
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Scale animations
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

export const scaleInCenter: Variants = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
};

/**
 * Slide animations
 */
export const slideInFromBottom: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
};

export const slideInFromTop: Variants = {
  initial: { y: '-100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '-100%', opacity: 0 },
};

export const slideInFromLeft: Variants = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
};

export const slideInFromRight: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
};

/**
 * Stagger children animations
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Modal/Dialog animations
 */
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Notification/Toast animations
 */
export const toastVariants: Variants = {
  initial: { opacity: 0, y: -50, scale: 0.3 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.5,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * List item animations
 */
export const listItem: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * Card animations
 */
export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.02,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
  tap: { scale: 0.98 },
};

/**
 * Button animations
 */
export const buttonTap = {
  scale: 0.95,
};

/**
 * Page animations
 */
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Card animations with hover
 */
export const cardVariants: Variants = {
  rest: { 
    scale: 1,
    boxShadow: '0 2px 15px -3px rgba(0, 98, 255, 0.1)',
  },
  hover: { 
    scale: 1.02,
    boxShadow: '0 8px 30px -3px rgba(0, 98, 255, 0.2)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

/**
 * Transition presets
 */
export const transitions = {
  default: {
    duration: 0.3,
    ease: 'easeInOut',
  },
  fast: {
    duration: 0.15,
    ease: 'easeInOut',
  },
  slow: {
    duration: 0.5,
    ease: 'easeInOut',
  },
  spring: {
    type: 'spring' as const,
    damping: 25,
    stiffness: 300,
  },
  springFast: {
    type: 'spring' as const,
    damping: 20,
    stiffness: 400,
  },
};
