import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types for template editor state
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface TemplateComponent {
  header?: {
    type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
    text?: string;
    mediaUrl?: string;
    mediaHandle?: string;
  };
  body: {
    text: string;
    placeholders: Array<{
      index: number;
      example: string;
    }>;
  };
  footer?: {
    text: string;
  };
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phoneNumber?: string;
  }>;
}

export interface TemplateEditorState {
  // Template data
  templateId?: string;
  name: string;
  displayName: string;
  category: string;
  language: string;
  description: string;
  components: TemplateComponent;
  sampleValues: Record<string, string>;
  
  // Validation state
  validationErrors: ValidationError[];
  validationWarnings: ValidationWarning[];
  isValidating: boolean;
  
  // Preview state
  previewData: string;
  isPreviewLoading: boolean;
  
  // UI state
  activeComponent: 'basic' | 'header' | 'body' | 'footer' | 'buttons' | 'placeholders';
  showPreview: boolean;
  showBestPractices: boolean;
  isDirty: boolean;
  isSaving: boolean;
  
  // Quality score
  qualityScore?: number;
}

export interface TemplateEditorActions {
  // Basic info actions
  setBasicInfo: (info: {
    name?: string;
    displayName?: string;
    category?: string;
    language?: string;
    description?: string;
  }) => void;
  
  // Component actions
  updateHeader: (header: TemplateComponent['header']) => void;
  updateBody: (body: TemplateComponent['body']) => void;
  updateFooter: (footer: TemplateComponent['footer']) => void;
  updateButtons: (buttons: TemplateComponent['buttons']) => void;
  
  // Placeholder actions
  addPlaceholder: () => void;
  removePlaceholder: (index: number) => void;
  updateSampleValue: (index: number, value: string) => void;
  
  // Button actions
  addButton: (button: TemplateComponent['buttons'][0]) => void;
  removeButton: (index: number) => void;
  updateButton: (index: number, button: TemplateComponent['buttons'][0]) => void;
  
  // Validation actions
  setValidationErrors: (errors: ValidationError[]) => void;
  setValidationWarnings: (warnings: ValidationWarning[]) => void;
  setIsValidating: (isValidating: boolean) => void;
  
  // Preview actions
  setPreviewData: (data: string) => void;
  setIsPreviewLoading: (isLoading: boolean) => void;
  
  // UI actions
  setActiveComponent: (component: TemplateEditorState['activeComponent']) => void;
  setShowPreview: (show: boolean) => void;
  setShowBestPractices: (show: boolean) => void;
  setIsDirty: (isDirty: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;
  
  // Quality score
  setQualityScore: (score: number) => void;
  
  // Reset actions
  resetEditor: () => void;
  loadTemplate: (template: any) => void;
}

type TemplateEditorStore = TemplateEditorState & TemplateEditorActions;

const initialState: TemplateEditorState = {
  name: '',
  displayName: '',
  category: 'TRANSACTIONAL',
  language: 'en_US',
  description: '',
  components: {
    body: {
      text: '',
      placeholders: [],
    },
  },
  sampleValues: {},
  validationErrors: [],
  validationWarnings: [],
  isValidating: false,
  previewData: '',
  isPreviewLoading: false,
  activeComponent: 'basic',
  showPreview: true,
  showBestPractices: true,
  isDirty: false,
  isSaving: false,
};

export const useTemplateEditorStore = create<TemplateEditorStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic info actions
      setBasicInfo: (info) => {
        set((state) => ({
          ...info,
          isDirty: true,
        }));
      },

      // Component actions
      updateHeader: (header) => {
        set((state) => ({
          components: {
            ...state.components,
            header,
          },
          isDirty: true,
        }));
      },

      updateBody: (body) => {
        set((state) => ({
          components: {
            ...state.components,
            body,
          },
          isDirty: true,
        }));
      },

      updateFooter: (footer) => {
        set((state) => ({
          components: {
            ...state.components,
            footer,
          },
          isDirty: true,
        }));
      },

      updateButtons: (buttons) => {
        set((state) => ({
          components: {
            ...state.components,
            buttons,
          },
          isDirty: true,
        }));
      },

      // Placeholder actions
      addPlaceholder: () => {
        set((state) => {
          const currentPlaceholders = state.components.body.placeholders || [];
          const nextIndex = currentPlaceholders.length + 1;
          
          return {
            components: {
              ...state.components,
              body: {
                ...state.components.body,
                placeholders: [
                  ...currentPlaceholders,
                  { index: nextIndex, example: '' },
                ],
              },
            },
            isDirty: true,
          };
        });
      },

      removePlaceholder: (index) => {
        set((state) => {
          const placeholders = state.components.body.placeholders.filter(
            (p) => p.index !== index
          );
          
          // Renumber remaining placeholders
          const renumberedPlaceholders = placeholders.map((p, idx) => ({
            ...p,
            index: idx + 1,
          }));

          // Update sample values
          const newSampleValues = { ...state.sampleValues };
          delete newSampleValues[index.toString()];

          return {
            components: {
              ...state.components,
              body: {
                ...state.components.body,
                placeholders: renumberedPlaceholders,
              },
            },
            sampleValues: newSampleValues,
            isDirty: true,
          };
        });
      },

      updateSampleValue: (index, value) => {
        set((state) => ({
          sampleValues: {
            ...state.sampleValues,
            [index.toString()]: value,
          },
          isDirty: true,
        }));
      },

      // Button actions
      addButton: (button) => {
        set((state) => ({
          components: {
            ...state.components,
            buttons: [...(state.components.buttons || []), button],
          },
          isDirty: true,
        }));
      },

      removeButton: (index) => {
        set((state) => ({
          components: {
            ...state.components,
            buttons: state.components.buttons?.filter((_, i) => i !== index),
          },
          isDirty: true,
        }));
      },

      updateButton: (index, button) => {
        set((state) => ({
          components: {
            ...state.components,
            buttons: state.components.buttons?.map((b, i) => (i === index ? button : b)),
          },
          isDirty: true,
        }));
      },

      // Validation actions
      setValidationErrors: (errors) => set({ validationErrors: errors }),
      setValidationWarnings: (warnings) => set({ validationWarnings: warnings }),
      setIsValidating: (isValidating) => set({ isValidating }),

      // Preview actions
      setPreviewData: (data) => set({ previewData: data }),
      setIsPreviewLoading: (isLoading) => set({ isPreviewLoading: isLoading }),

      // UI actions
      setActiveComponent: (component) => set({ activeComponent: component }),
      setShowPreview: (show) => set({ showPreview: show }),
      setShowBestPractices: (show) => set({ showBestPractices: show }),
      setIsDirty: (isDirty) => set({ isDirty }),
      setIsSaving: (isSaving) => set({ isSaving }),

      // Quality score
      setQualityScore: (score) => set({ qualityScore: score }),

      // Reset actions
      resetEditor: () => set(initialState),

      loadTemplate: (template) => {
        set({
          templateId: template.id,
          name: template.name || '',
          displayName: template.displayName || '',
          category: template.category || 'TRANSACTIONAL',
          language: template.language || 'en_US',
          description: template.description || '',
          components: template.components || initialState.components,
          sampleValues: template.sampleValues || {},
          qualityScore: template.qualityScore,
          isDirty: false,
        });
      },
    }),
    { name: 'TemplateEditor' }
  )
);
