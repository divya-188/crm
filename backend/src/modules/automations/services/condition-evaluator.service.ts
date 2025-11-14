import { Injectable } from '@nestjs/common';

@Injectable()
export class ConditionEvaluatorService {
  evaluateConditions(
    conditions: Array<{ field: string; operator: string; value: any }>,
    data: Record<string, any>,
  ): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    return conditions.every((condition) =>
      this.evaluateCondition(condition, data),
    );
  }

  private evaluateCondition(
    condition: { field: string; operator: string; value: any },
    data: Record<string, any>,
  ): boolean {
    const fieldValue = this.getNestedValue(data, condition.field);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(condition.value);
      case 'not_contains':
        return !String(fieldValue).includes(condition.value);
      case 'starts_with':
        return String(fieldValue).startsWith(condition.value);
      case 'ends_with':
        return String(fieldValue).endsWith(condition.value);
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'greater_than_or_equal':
        return Number(fieldValue) >= Number(condition.value);
      case 'less_than_or_equal':
        return Number(fieldValue) <= Number(condition.value);
      case 'is_empty':
        return !fieldValue || fieldValue === '';
      case 'is_not_empty':
        return !!fieldValue && fieldValue !== '';
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
