import { ref } from 'vue'
import type { ComputedRef, Ref } from 'vue'
import type { FormField } from '@cms/contracts'

const CEDULA_RE = /^\d{6,10}$/
const NIT_RE    = /^\d{9}-\d{1}$/
const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Client-side form validation.
 *
 * Only validates fields that are currently visible.
 * Field-level validation is also re-run server-side before proxying — this is UX only.
 */
export function useFormValidation(
  fields: FormField[],
  values: Ref<Record<string, unknown>>,
  visibleFieldIds: ComputedRef<Set<string>>,
  requiredFieldIds: ComputedRef<Set<string>>
): {
  errors: Ref<Record<string, string>>
  validate: () => boolean
  clearErrors: () => void
} {
  const errors = ref<Record<string, string>>({})

  function validateField(field: FormField, value: unknown, isRequired: boolean): string | null {
    const strVal = value == null ? '' : String(value).trim()

    if (isRequired && strVal === '') {
      return field.validation?.message ?? `"${field.label}" es requerido`
    }

    // Skip further checks for empty optional fields
    if (strVal === '') return null

    if (field.type === 'cedula') {
      if (!CEDULA_RE.test(strVal)) {
        return field.validation?.message ?? `"${field.label}" debe tener entre 6 y 10 dígitos`
      }
    }

    if (field.type === 'nit') {
      if (!NIT_RE.test(strVal)) {
        return field.validation?.message ?? `"${field.label}" debe tener el formato 000000000-0`
      }
    }

    if (field.type === 'email') {
      if (!EMAIL_RE.test(strVal)) {
        return field.validation?.message ?? `"${field.label}" debe ser un correo electrónico válido`
      }
    }

    if (field.validation?.pattern) {
      try {
        if (!new RegExp(field.validation.pattern).test(strVal)) {
          return field.validation.message ?? `"${field.label}" tiene un formato inválido`
        }
      } catch {
        // Malformed regex — skip
      }
    }

    if (field.type === 'number') {
      const num = Number(strVal)
      if (Number.isNaN(num)) {
        return field.validation?.message ?? `"${field.label}" debe ser un número`
      }
      if (field.validation?.min != null && num < field.validation.min) {
        return field.validation.message ?? `"${field.label}" debe ser al menos ${field.validation.min}`
      }
      if (field.validation?.max != null && num > field.validation.max) {
        return field.validation.message ?? `"${field.label}" debe ser máximo ${field.validation.max}`
      }
    }

    return null
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    const visible  = visibleFieldIds.value
    const required = requiredFieldIds.value
    const formValues = values.value

    for (const field of fields) {
      if (!visible.has(field.id)) continue
      const err = validateField(field, formValues[field.id], required.has(field.id))
      if (err) newErrors[field.id] = err
    }

    errors.value = newErrors
    return Object.keys(newErrors).length === 0
  }

  function clearErrors() {
    errors.value = {}
  }

  return { errors, validate, clearErrors }
}
