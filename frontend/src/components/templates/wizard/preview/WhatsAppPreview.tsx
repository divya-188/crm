import { motion } from 'framer-motion';
import { TemplateWizardData } from '../types';

interface WhatsAppPreviewProps {
  data: TemplateWizardData;
}

export function WhatsAppPreview({ data }: WhatsAppPreviewProps) {
  const replaceVariables = (text: string): string => {
    return text.replace(/\{\{(\d+)\}\}/g, (match, num) => {
      return data.variables[num] || match;
    });
  };

  const bodyText = replaceVariables(data.body);
  const headerText = data.header.type === 'TEXT' && data.header.text 
    ? replaceVariables(data.header.text) 
    : '';

  return (
    <div className="w-full max-w-lg">
      {/* Preview Title */}
      <div className="mb-4">
        <h4 className="text-base font-bold text-neutral-800">Live Preview</h4>
        <p className="text-sm text-neutral-500 mt-1">See how your template will look</p>
      </div>

      {/* Message Bubble - Direct white card without background */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-200"
      >
        {/* Header */}
        {data.header.type !== 'none' && (
          <div>
            {data.header.type === 'TEXT' && headerText && (
              <div className="px-5 pt-5 pb-3">
                <div className="font-bold text-neutral-900 text-base leading-snug">
                  {headerText}
                </div>
              </div>
            )}
            {data.header.type === 'IMAGE' && data.header.mediaUrl && (
              <img
                src={data.header.mediaUrl}
                alt="Header"
                className="w-full h-56 object-cover rounded-t-2xl"
              />
            )}
            {data.header.type === 'VIDEO' && data.header.mediaUrl && (
              <div className="relative w-full h-56 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center rounded-t-2xl">
                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
            )}
            {data.header.type === 'DOCUMENT' && (
              <div className="px-5 pt-5 pb-3 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-7 h-7 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-neutral-900 truncate">Document.pdf</div>
                  <div className="text-xs text-neutral-500 mt-0.5">PDF • 1 page</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`px-5 ${data.header.type === 'none' ? 'pt-5' : 'pt-2'} pb-3`}>
          {bodyText ? (
            <div className="text-neutral-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
              {bodyText}
            </div>
          ) : (
            <div className="text-neutral-400 italic text-sm py-8 text-center">
              Your message will appear here...
            </div>
          )}
        </div>

        {/* Footer */}
        {data.footer && (
          <div className="px-5 pb-3">
            <div className="text-sm text-neutral-500 leading-snug">
              {data.footer}
            </div>
          </div>
        )}

        {/* Buttons */}
        {data.buttons.length > 0 && (
          <div className="px-4 pb-4 pt-2 space-y-3">
            {data.buttons.map((button, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="w-full px-5 py-3 flex items-center justify-center space-x-2 bg-white border-2 border-primary-500 text-primary-600 font-medium text-sm rounded-xl hover:bg-primary-50 transition-colors"
              >
                {button.type === 'URL' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                )}
                {button.type === 'PHONE_NUMBER' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                )}
                {button.type === 'QUICK_REPLY' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                )}
                <span>{button.text || 'Button'}</span>
              </motion.button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="px-5 pb-3 flex items-center justify-end space-x-1.5 text-xs text-neutral-400">
          <span>9:15</span>
          <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
          <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}
