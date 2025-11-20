/**
 * Branding Utility
 * Handles dynamic application of branding settings to the DOM
 */

export interface BrandingConfig {
  logo?: string;
  favicon?: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  customCSS?: string;
  companyName: string;
  tagline?: string;
}

/**
 * Apply branding configuration to the DOM
 */
export function applyBrandingToDOM(branding: BrandingConfig): void {
  const root = document.documentElement;

  // Apply color CSS variables
  root.style.setProperty('--color-primary', branding.colors.primary);
  root.style.setProperty('--color-secondary', branding.colors.secondary);
  root.style.setProperty('--color-accent', branding.colors.accent);
  root.style.setProperty('--color-background', branding.colors.background);
  root.style.setProperty('--color-text', branding.colors.text);

  // Apply font CSS variables
  root.style.setProperty('--font-heading', `${branding.fonts.heading}, sans-serif`);
  root.style.setProperty('--font-body', `${branding.fonts.body}, sans-serif`);

  // Update favicon
  if (branding.favicon) {
    updateFavicon(branding.favicon);
  }

  // Update page title
  if (branding.companyName) {
    updatePageTitle(branding.companyName);
  }

  // Inject custom CSS
  if (branding.customCSS) {
    injectCustomCSS(branding.customCSS);
  }

  // Store branding in localStorage for persistence
  try {
    localStorage.setItem('branding', JSON.stringify(branding));
  } catch (error) {
    console.error('Failed to store branding in localStorage:', error);
  }
}

/**
 * Update the favicon
 */
export function updateFavicon(faviconUrl: string): void {
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  
  favicon.href = faviconUrl;
}

/**
 * Update the page title
 */
export function updatePageTitle(companyName: string): void {
  const currentTitle = document.title;
  const separator = ' | ';
  
  // If title already has a separator, replace the company name part
  if (currentTitle.includes(separator)) {
    const parts = currentTitle.split(separator);
    document.title = `${parts[0]}${separator}${companyName}`;
  } else {
    document.title = companyName;
  }
}

/**
 * Inject custom CSS into the document
 */
export function injectCustomCSS(css: string): void {
  let styleEl = document.getElementById('custom-branding-css');
  
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-branding-css';
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = css;
}

/**
 * Remove custom CSS from the document
 */
export function removeCustomCSS(): void {
  const styleEl = document.getElementById('custom-branding-css');
  if (styleEl) {
    styleEl.remove();
  }
}

/**
 * Load branding from localStorage
 */
export function loadBrandingFromStorage(): BrandingConfig | null {
  try {
    const stored = localStorage.getItem('branding');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load branding from localStorage:', error);
  }
  return null;
}

/**
 * Get default branding configuration
 */
export function getDefaultBranding(): BrandingConfig {
  return {
    colors: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      background: '#FFFFFF',
      text: '#1F2937',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    companyName: 'WhatsCRM',
    tagline: 'WhatsApp CRM Platform',
  };
}

/**
 * Reset branding to defaults
 */
export function resetBranding(): void {
  const defaultBranding = getDefaultBranding();
  applyBrandingToDOM(defaultBranding);
  removeCustomCSS();
  
  try {
    localStorage.removeItem('branding');
  } catch (error) {
    console.error('Failed to remove branding from localStorage:', error);
  }
}

/**
 * Generate CSS string from branding config
 */
export function generateBrandingCSS(branding: BrandingConfig): string {
  return `
    :root {
      --color-primary: ${branding.colors.primary};
      --color-secondary: ${branding.colors.secondary};
      --color-accent: ${branding.colors.accent};
      --color-background: ${branding.colors.background};
      --color-text: ${branding.colors.text};
      --font-heading: ${branding.fonts.heading}, sans-serif;
      --font-body: ${branding.fonts.body}, sans-serif;
    }

    ${branding.customCSS || ''}
  `.trim();
}
