import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark';

  // Modals
  activeModal: string | null;
  modalData: any;

  // Notifications
  notificationsOpen: boolean;
  unreadNotifications: number;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  toggleNotifications: () => void;
  setNotificationsOpen: (open: boolean) => void;
  setUnreadNotifications: (count: number) => void;
  incrementUnreadNotifications: () => void;
  resetUnreadNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'light',
      activeModal: null,
      modalData: null,
      notificationsOpen: false,
      unreadNotifications: 0,

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleSidebarCollapse: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) => set({ theme }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      openModal: (modalId, data) =>
        set({ activeModal: modalId, modalData: data }),

      closeModal: () => set({ activeModal: null, modalData: null }),

      toggleNotifications: () =>
        set((state) => ({ notificationsOpen: !state.notificationsOpen })),

      setNotificationsOpen: (open) => set({ notificationsOpen: open }),

      setUnreadNotifications: (count) => set({ unreadNotifications: count }),

      incrementUnreadNotifications: () =>
        set((state) => ({
          unreadNotifications: state.unreadNotifications + 1,
        })),

      resetUnreadNotifications: () => set({ unreadNotifications: 0 }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);
