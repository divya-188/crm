export interface TemplateWizardData {
  name: string;
  displayName?: string;
  category: string;
  language: string;
  description?: string;
  header: {
    type: 'none' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    text?: string;
    mediaUrl?: string;
    mediaHandle?: string;
  };
  body: string;
  footer?: string;
  buttons: TemplateButton[];
  variables: Record<string, string>; // { "1": "John", "2": "Order #123" }
}

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface StepProps {
  data: TemplateWizardData;
  updateData: (data: Partial<TemplateWizardData>) => void;
  onNext: () => void;
}
