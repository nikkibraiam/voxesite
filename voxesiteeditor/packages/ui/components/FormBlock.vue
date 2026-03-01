<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import type { FormProps, FormField } from '@cms/contracts'
import { useFormConditions } from '../composables/useFormConditions'
import { useFormValidation } from '../composables/useFormValidation'

const props = withDefaults(defineProps<FormProps>(), {
  title: '',
  description: '',
  submitLabel: 'Enviar',
  endpointKey: '',
  successMessage: '¡Gracias! Tu mensaje ha sido enviado.',
  errorMessage: 'Ocurrió un error. Por favor intenta de nuevo.',
  redirectUrl: ''
})

// siteId injected by the runtime via provide('siteId', siteId)
const siteId = inject<string>('siteId', 'demosite')

// Accept fields as Array or JSON string (consistent with navLinks pattern)
const parsedFields = computed<FormField[]>(() => {
  if (!props.fields) return []
  if (Array.isArray(props.fields)) return props.fields
  try {
    return JSON.parse(props.fields as unknown as string)
  } catch {
    return []
  }
})

// Form values keyed by field id
const values = ref<Record<string, unknown>>({})

const { visibleFieldIds, requiredFieldIds } = useFormConditions(parsedFields, values)
const { errors, validate, clearErrors } = useFormValidation(
  parsedFields as unknown as FormField[],
  values,
  visibleFieldIds,
  requiredFieldIds
)

// Reactively access parsedFields inside composables
// (composables receive the reactive ref so they recompute when parsedFields changes)

const isSubmitting = ref(false)
const submitResult = ref<'success' | 'error' | null>(null)

async function onSubmit() {
  // Re-compute validation against current parsedFields
  const fields = parsedFields.value
  if (!validate()) return

  if (!props.endpointKey) {
    submitResult.value = 'error'
    return
  }

  isSubmitting.value = true
  submitResult.value = null

  try {
    const response = await fetch(`/api/form-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpointKey: props.endpointKey,
        formData: values.value,
        fields   // send field definitions for server-side re-validation
      })
    })

    const data = await response.json()
    submitResult.value = data.success ? 'success' : 'error'

    if (data.success && props.redirectUrl) {
      setTimeout(() => { window.location.href = props.redirectUrl! }, 1500)
    }
  } catch {
    submitResult.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

function inputType(fieldType: FormField['type']): string {
  switch (fieldType) {
    case 'email':    return 'email'
    case 'phone':    return 'tel'
    case 'number':   return 'number'
    case 'date':     return 'date'
    case 'file':     return 'file'
    case 'cedula':
    case 'nit':
    case 'text':
    default:         return 'text'
  }
}
</script>

<template>
  <div class="form-block">
    <h2 v-if="title" class="form-block__title">{{ title }}</h2>
    <p v-if="description" class="form-block__description">{{ description }}</p>

    <!-- Success state -->
    <div v-if="submitResult === 'success'" class="form-block__success" role="alert">
      {{ successMessage }}
    </div>

    <!-- Error state -->
    <div v-if="submitResult === 'error'" class="form-block__error" role="alert">
      {{ errorMessage }}
    </div>

    <form
      v-if="submitResult !== 'success'"
      class="form-block__form"
      novalidate
      @submit.prevent="onSubmit"
    >
      <template v-for="field in parsedFields" :key="field.id">
        <div
          v-if="visibleFieldIds.has(field.id)"
          class="form-block__field"
          :class="{ 'form-block__field--error': errors[field.id] }"
        >
          <!-- Checkbox has label after input -->
          <template v-if="field.type === 'checkbox'">
            <div class="form-block__checkbox-row">
              <input
                :id="`field-${field.id}`"
                type="checkbox"
                class="form-block__input form-block__input--checkbox"
                :checked="!!values[field.id]"
                @change="(e) => { values[field.id] = (e.target as HTMLInputElement).checked }"
              />
              <label :for="`field-${field.id}`" class="form-block__label">
                {{ field.label }}
                <span v-if="requiredFieldIds.has(field.id)" class="form-block__required" aria-hidden="true">*</span>
              </label>
            </div>
          </template>

          <!-- Radio group -->
          <template v-else-if="field.type === 'radio'">
            <fieldset class="form-block__fieldset">
              <legend class="form-block__label">
                {{ field.label }}
                <span v-if="requiredFieldIds.has(field.id)" class="form-block__required" aria-hidden="true">*</span>
              </legend>
              <div
                v-for="opt in (field.options ?? [])"
                :key="opt.value"
                class="form-block__radio-row"
              >
                <input
                  :id="`field-${field.id}-${opt.value}`"
                  type="radio"
                  :name="field.id"
                  :value="opt.value"
                  class="form-block__input form-block__input--radio"
                  :checked="values[field.id] === opt.value"
                  @change="() => { values[field.id] = opt.value }"
                />
                <label :for="`field-${field.id}-${opt.value}`" class="form-block__radio-label">
                  {{ opt.label }}
                </label>
              </div>
            </fieldset>
          </template>

          <!-- Select -->
          <template v-else-if="field.type === 'select'">
            <label :for="`field-${field.id}`" class="form-block__label">
              {{ field.label }}
              <span v-if="requiredFieldIds.has(field.id)" class="form-block__required" aria-hidden="true">*</span>
            </label>
            <select
              :id="`field-${field.id}`"
              class="form-block__input form-block__input--select"
              :value="values[field.id]"
              @change="(e) => { values[field.id] = (e.target as HTMLSelectElement).value }"
            >
              <option value="" disabled selected>{{ field.placeholder ?? 'Selecciona una opción' }}</option>
              <option
                v-for="opt in (field.options ?? [])"
                :key="opt.value"
                :value="opt.value"
              >{{ opt.label }}</option>
            </select>
          </template>

          <!-- Textarea -->
          <template v-else-if="field.type === 'textarea'">
            <label :for="`field-${field.id}`" class="form-block__label">
              {{ field.label }}
              <span v-if="requiredFieldIds.has(field.id)" class="form-block__required" aria-hidden="true">*</span>
            </label>
            <textarea
              :id="`field-${field.id}`"
              class="form-block__input form-block__input--textarea"
              :placeholder="field.placeholder"
              :value="(values[field.id] as string) ?? ''"
              rows="4"
              @input="(e) => { values[field.id] = (e.target as HTMLTextAreaElement).value }"
            />
          </template>

          <!-- NIT — specific placeholder -->
          <template v-else-if="field.type === 'nit'">
            <label :for="`field-${field.id}`" class="form-block__label">
              {{ field.label }}
              <span v-if="requiredFieldIds.has(field.id)" class="form-block__required" aria-hidden="true">*</span>
            </label>
            <input
              :id="`field-${field.id}`"
              type="text"
              class="form-block__input"
              :placeholder="field.placeholder ?? '000000000-0'"
              :value="(values[field.id] as string) ?? ''"
              @input="(e) => { values[field.id] = (e.target as HTMLInputElement).value }"
            />
          </template>

          <!-- Cédula — numeric keyboard, max 10 chars -->
          <template v-else-if="field.type === 'cedula'">
            <label :for="`field-${field.id}`" class="form-block__label">
              {{ field.label }}
              <span v-if="requiredFieldIds.has(field.id)" class="form-block__required" aria-hidden="true">*</span>
            </label>
            <input
              :id="`field-${field.id}`"
              type="text"
              inputmode="numeric"
              maxlength="10"
              class="form-block__input"
              :placeholder="field.placeholder ?? '0000000000'"
              :value="(values[field.id] as string) ?? ''"
              @input="(e) => { values[field.id] = (e.target as HTMLInputElement).value }"
            />
          </template>

          <!-- Generic input (text, email, phone, number, date, file) -->
          <template v-else>
            <label :for="`field-${field.id}`" class="form-block__label">
              {{ field.label }}
              <span v-if="requiredFieldIds.has(field.id)" class="form-block__required" aria-hidden="true">*</span>
            </label>
            <input
              :id="`field-${field.id}`"
              :type="inputType(field.type)"
              class="form-block__input"
              :placeholder="field.placeholder"
              :value="(values[field.id] as string) ?? ''"
              @input="(e) => { values[field.id] = (e.target as HTMLInputElement).value }"
            />
          </template>

          <!-- Field error message -->
          <p v-if="errors[field.id]" class="form-block__field-error" role="alert">
            {{ errors[field.id] }}
          </p>
        </div>
      </template>

      <button
        type="submit"
        class="form-block__submit"
        :disabled="isSubmitting"
      >
        {{ isSubmitting ? '…' : (submitLabel || 'Enviar') }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.form-block {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: inherit;
}

.form-block__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.form-block__description {
  color: #555;
  margin: 0 0 1.5rem;
  line-height: 1.6;
}

.form-block__form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* Field wrapper */
.form-block__field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-block__label {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1a1a1a;
}

.form-block__required {
  color: #e53e3e;
  margin-left: 0.125rem;
}

/* Inputs */
.form-block__input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  font-size: 1rem;
  font-family: inherit;
  border: 1.5px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #1a1a1a;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.form-block__input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-block__field--error .form-block__input {
  border-color: #e53e3e;
}

.form-block__input--textarea {
  resize: vertical;
  min-height: 6rem;
}

.form-block__input--select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23555' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.25rem;
}

/* Checkbox row */
.form-block__checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.form-block__input--checkbox {
  width: 1.125rem;
  height: 1.125rem;
  flex-shrink: 0;
  padding: 0;
  cursor: pointer;
}

/* Radio group */
.form-block__fieldset {
  border: none;
  padding: 0;
  margin: 0;
}

.form-block__fieldset > .form-block__label {
  display: block;
  margin-bottom: 0.5rem;
}

.form-block__radio-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.form-block__input--radio {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  padding: 0;
  cursor: pointer;
}

.form-block__radio-label {
  font-size: 0.9375rem;
  cursor: pointer;
}

/* Field error */
.form-block__field-error {
  font-size: 0.8125rem;
  color: #e53e3e;
  margin: 0;
}

/* Submit button */
.form-block__submit {
  align-self: flex-start;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  min-height: 44px;
  min-width: 44px;
}

.form-block__submit:hover:not(:disabled) {
  background: #2563eb;
}

.form-block__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Success / Error banners */
.form-block__success,
.form-block__error {
  padding: 1rem 1.25rem;
  border-radius: 6px;
  font-size: 0.9375rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.form-block__success {
  background: #f0fdf4;
  border: 1.5px solid #86efac;
  color: #166534;
}

.form-block__error {
  background: #fef2f2;
  border: 1.5px solid #fca5a5;
  color: #991b1b;
}
</style>
