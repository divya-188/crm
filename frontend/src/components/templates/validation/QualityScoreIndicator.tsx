import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { useTemplateEditorStore } from '@/stores/template-editor.store';
import Tooltip from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

interface QualityScoreIndicatorProps {
  className?: string;
}

interface ScoreBreakdown {
  category: string;
  score: number;
  maxScore: number;
  description: string;
  status: 'good' | 'warning' | 'poor';
}

interface ScoreSuggestion {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
}

/**
 * QualityScoreIndicator Component
 * 
 * Displays template quality score with:
 * - Score visualization (0-100) with color coding
 * - Score breakdown tooltip showing component scores
 * - Score improvement suggestions
 * - Visual indicators for score ranges
 * 
 * Requirements: 18.6
 */
export const QualityScoreIndicator: React.FC<QualityScoreIndicatorProps> = ({ className }) => {
  const {
    qualityScore,
    components,
    description,
    validationErrors,
  } = useTemplateEditorStore();

  // Calculate score breakdown based on template components
  const scoreBreakdown = useMemo((): ScoreBreakdown[] => {
    const breakdown: ScoreBreakdown[] = [];
    const bodyText = components.body?.text || '';
    const bodyLength = bodyText.length;
    const placeholderCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;

    // Body length score (0-25 points)
    let bodyLengthScore = 25;
    let bodyLengthStatus: 'good' | 'warning' | 'poor' = 'good';
    if (bodyLength > 800) {
      bodyLengthScore = 15;
      bodyLengthStatus = 'warning';
    } else if (bodyLength < 50) {
      bodyLengthScore = 20;
      bodyLengthStatus = 'warning';
    }
    breakdown.push({
      category: 'Body Length',
      score: bodyLengthScore,
      maxScore: 25,
      description: `${bodyLength} characters (optimal: 50-800)`,
      status: bodyLengthStatus,
    });

    // Component completeness score (0-25 points)
    let completenessScore = 15; // Base score for required body
    let completenessStatus: 'good' | 'warning' | 'poor' = 'warning';
    if (components.footer) {
      completenessScore += 5;
    }
    if (description) {
      completenessScore += 5;
    }
    if (completenessScore === 25) {
      completenessStatus = 'good';
    }
    breakdown.push({
      category: 'Completeness',
      score: completenessScore,
      maxScore: 25,
      description: `Has ${components.footer ? 'footer' : 'no footer'}, ${description ? 'description' : 'no description'}`,
      status: completenessStatus,
    });

    // Placeholder usage score (0-25 points)
    let placeholderScore = 25;
    let placeholderStatus: 'good' | 'warning' | 'poor' = 'good';
    if (placeholderCount > 5) {
      placeholderScore = 15;
      placeholderStatus = 'poor';
    } else if (placeholderCount > 3) {
      placeholderScore = 20;
      placeholderStatus = 'warning';
    }
    breakdown.push({
      category: 'Placeholder Usage',
      score: placeholderScore,
      maxScore: 25,
      description: `${placeholderCount} placeholder${placeholderCount !== 1 ? 's' : ''} (optimal: ≤3)`,
      status: placeholderStatus,
    });

    // Policy compliance score (0-25 points)
    const spamWords = ['buy now', 'limited time', 'act fast', 'click here', 'urgent', 'hurry'];
    const hasSpam = spamWords.some(word => bodyText.toLowerCase().includes(word));
    const sensitivePatterns = [
      /credit card/i,
      /cvv/i,
      /social security/i,
      /password/i,
      /pin code/i,
    ];
    const hasSensitiveData = sensitivePatterns.some(pattern => pattern.test(bodyText));
    
    let policyScore = 25;
    let policyStatus: 'good' | 'warning' | 'poor' = 'good';
    if (hasSensitiveData) {
      policyScore = 0;
      policyStatus = 'poor';
    } else if (hasSpam) {
      policyScore = 10;
      policyStatus = 'warning';
    }
    breakdown.push({
      category: 'Policy Compliance',
      score: policyScore,
      maxScore: 25,
      description: hasSensitiveData 
        ? 'Contains sensitive data requests' 
        : hasSpam 
        ? 'Contains spam indicators' 
        : 'No policy violations detected',
      status: policyStatus,
    });

    return breakdown;
  }, [components, description]);

  // Generate improvement suggestions
  const suggestions = useMemo((): ScoreSuggestion[] => {
    const suggestions: ScoreSuggestion[] = [];
    const bodyText = components.body?.text || '';
    const bodyLength = bodyText.length;
    const placeholderCount = (bodyText.match(/\{\{\d+\}\}/g) || []).length;

    // Body length suggestions
    if (bodyLength > 800) {
      suggestions.push({
        title: 'Shorten body text',
        description: 'Body text is too long. Keep it concise (50-800 characters) for better engagement.',
        impact: 'high',
      });
    } else if (bodyLength < 50) {
      suggestions.push({
        title: 'Add more context',
        description: 'Body text is too short. Provide more context to make your message clear.',
        impact: 'medium',
      });
    }

    // Completeness suggestions
    if (!components.footer) {
      suggestions.push({
        title: 'Add a footer',
        description: 'Include a footer with opt-out instructions or additional context.',
        impact: 'medium',
      });
    }

    if (!description) {
      suggestions.push({
        title: 'Add template description',
        description: 'Provide a description to help your team understand when to use this template.',
        impact: 'low',
      });
    }

    // Placeholder suggestions
    if (placeholderCount > 5) {
      suggestions.push({
        title: 'Reduce placeholders',
        description: 'Too many placeholders can make templates hard to manage. Aim for 3 or fewer.',
        impact: 'high',
      });
    }

    // Policy suggestions
    const spamWords = ['buy now', 'limited time', 'act fast', 'click here', 'urgent', 'hurry'];
    const hasSpam = spamWords.some(word => bodyText.toLowerCase().includes(word));
    if (hasSpam) {
      suggestions.push({
        title: 'Remove spam language',
        description: 'Avoid urgency-creating phrases like "buy now" or "limited time" to improve approval chances.',
        impact: 'high',
      });
    }

    // Validation error suggestions
    if (validationErrors.length > 0) {
      suggestions.push({
        title: 'Fix validation errors',
        description: 'Resolve all validation errors before submission to ensure approval.',
        impact: 'high',
      });
    }

    return suggestions;
  }, [components, description, validationErrors]);

  // Get score color and label
  const getScoreInfo = (score: number) => {
    if (score >= 80) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        borderColor: 'border-green-200',
        label: 'Excellent',
        icon: CheckCircle,
      };
    } else if (score >= 60) {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        borderColor: 'border-blue-200',
        label: 'Good',
        icon: TrendingUp,
      };
    } else if (score >= 40) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        borderColor: 'border-yellow-200',
        label: 'Fair',
        icon: AlertCircle,
      };
    } else {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-200',
        label: 'Needs Improvement',
        icon: AlertCircle,
      };
    }
  };

  const score = qualityScore ?? 0;
  const scoreInfo = getScoreInfo(score);
  const ScoreIcon = scoreInfo.icon;

  // Tooltip content with score breakdown
  const tooltipContent = (
    <div className="w-72 text-left">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white mb-1">Quality Score Breakdown</h4>
        <p className="text-xs text-gray-300">
          Your template is evaluated across four key areas
        </p>
      </div>
      
      <div className="space-y-2">
        {scoreBreakdown.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white">{item.category}</span>
              <span className={cn(
                'text-xs font-semibold',
                item.status === 'good' ? 'text-green-400' :
                item.status === 'warning' ? 'text-yellow-400' :
                'text-red-400'
              )}>
                {item.score}/{item.maxScore}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <motion.div
                className={cn(
                  'h-1.5 rounded-full',
                  item.status === 'good' ? 'bg-green-400' :
                  item.status === 'warning' ? 'bg-yellow-400' :
                  'bg-red-400'
                )}
                initial={{ width: 0 }}
                animate={{ width: `${(item.score / item.maxScore) * 100}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            </div>
            <p className="text-xs text-gray-400">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      {/* Score Display */}
      <div className={cn(
        'rounded-lg border p-4',
        scoreInfo.borderColor,
        scoreInfo.bgColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-full',
              scoreInfo.bgColor
            )}>
              <ScoreIcon className={cn('h-6 w-6', scoreInfo.color)} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Quality Score
              </h3>
              <p className={cn('text-xs font-medium', scoreInfo.color)}>
                {scoreInfo.label}
              </p>
            </div>
          </div>

          {/* Score with Tooltip */}
          <Tooltip content={tooltipContent} position="left" className="w-auto max-w-none">
            <div className="flex items-center space-x-2 cursor-help">
              <div className="text-right">
                <div className={cn('text-3xl font-bold', scoreInfo.color)}>
                  {score}
                </div>
                <div className="text-xs text-gray-600">out of 100</div>
              </div>
              <Info className="h-4 w-4 text-gray-400" />
            </div>
          </Tooltip>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className={cn(
                'h-2 rounded-full',
                score >= 80 ? 'bg-green-500' :
                score >= 60 ? 'bg-blue-500' :
                score >= 40 ? 'bg-yellow-500' :
                'bg-red-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          
          {/* Score Range Labels */}
          <div className="mt-2 flex justify-between text-xs text-gray-600">
            <span>0</span>
            <span className="text-red-600">40</span>
            <span className="text-yellow-600">60</span>
            <span className="text-blue-600">80</span>
            <span className="text-green-600">100</span>
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Improvement Suggestions
              </h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start space-x-2"
                  >
                    <div className={cn(
                      'mt-0.5 h-1.5 w-1.5 rounded-full flex-shrink-0',
                      suggestion.impact === 'high' ? 'bg-red-500' :
                      suggestion.impact === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        {suggestion.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Perfect Score Message */}
      {score === 100 && suggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg border border-green-200 bg-green-50 p-4"
        >
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-semibold text-green-900">
                Perfect Score!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your template follows all best practices and is ready for submission.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QualityScoreIndicator;
