import { computed } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { FormField, FieldCondition } from '@cms/contracts'

/**
 * Evaluates conditional field visibility and requirement rules.
 *
 * Logic:
 * - Fields with NO `conditions` array are always visible.
 * - Fields WITH a `conditions` array start hidden; a matching `show` condition makes them visible.
 * - All conditions in a field's array use AND logic — all must pass.
 * - `hide` action overrides `show` when it matches.
 * - `require` adds to requiredFieldIds (visibility is determined separately).
 */
export function useFormConditions(
  fields: FormField[],
  values: Ref<Record<string, unknown>>
): {
  visibleFieldIds: ComputedRef<Set<string>>
  requiredFieldIds: ComputedRef<Set<string>>
} {
  function evaluateCondition(condition: FieldCondition, formValues: Record<string, unknown>): boolean {
    const watched = String(formValues[condition.fieldId] ?? '').trim()

    switch (condition.operator) {
      case 'equals':
        return watched === (condition.value ?? '')
      case 'not_equals':
        return watched !== (condition.value ?? '')
      case 'contains':
        return watched.includes(condition.value ?? '')
      case 'not_empty':
        return watched !== ''
      default:
        return false
    }
  }

  const visibleFieldIds = computed<Set<string>>(() => {
    const visible = new Set<string>()
    const formValues = values.value

    for (const field of fields) {
      // No conditions — always visible
      if (!field.conditions || field.conditions.length === 0) {
        visible.add(field.id)
        continue
      }

      // Collect show/hide actions — evaluate each independently
      const showConditions  = field.conditions.filter(c => c.action === 'show')
      const hideConditions  = field.conditions.filter(c => c.action === 'hide')

      const shouldShow = showConditions.length > 0 &&
        showConditions.every(c => evaluateCondition(c, formValues))
      const shouldHide = hideConditions.length > 0 &&
        hideConditions.every(c => evaluateCondition(c, formValues))

      if (shouldHide) continue
      if (shouldShow) visible.add(field.id)
    }

    return visible
  })

  const requiredFieldIds = computed<Set<string>>(() => {
    const required = new Set<string>()
    const formValues = values.value

    for (const field of fields) {
      // Statically required
      if (field.required) {
        required.add(field.id)
        continue
      }

      // Conditionally required via `require` action
      const requireConditions = field.conditions?.filter(c => c.action === 'require') ?? []
      if (
        requireConditions.length > 0 &&
        requireConditions.every(c => evaluateCondition(c, formValues))
      ) {
        required.add(field.id)
      }
    }

    return required
  })

  return { visibleFieldIds, requiredFieldIds }
}
