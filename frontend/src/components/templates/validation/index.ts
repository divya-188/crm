/**
 * Template Validation Components
 * 
 * This module exports components related to template validation,
 * quality assessment, and user feedback.
 */

export { ValidationPanel } from './ValidationPanel';
export { QualityScoreIndicator } from './QualityScoreIndicator';

// Re-export types from store for convenience
export type {
  ValidationError,
  ValidationWarning,
} from '@/stores/template-editor.store';
