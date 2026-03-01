export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'cedula'   // Colombian cédula de ciudadanía — 6–10 digits
  | 'nit'      // Colombian NIT — 9 digits + dash + 1 check digit

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required?: boolean
  validation?: {
    pattern?: string     // regex string
    min?: number
    max?: number
    message?: string     // custom error message override
  }
  options?: { value: string; label: string }[]   // for select / radio
  conditions?: FieldCondition[]
}

export interface FieldCondition {
  fieldId: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_empty'
  value?: string
  action: 'show' | 'hide' | 'require'
}

export interface FormProps {
  title?: string
  description?: string
  fields: FormField[]
  submitLabel?: string
  endpointKey?: string      // opaque key resolved server-side; never the real URL
  successMessage?: string
  errorMessage?: string
  redirectUrl?: string
}
