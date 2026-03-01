import { ref } from 'vue'

const BUILD_SERVER_URL = 'http://localhost:2999'

export interface FormEndpointRow {
  key: string
  site_id: string
  method: string
  headers: Record<string, string>
  rate_config: object | null
  allowed_origins: string[] | null
  created_at: string
  updated_at: string
}

export interface CreateEndpointInput {
  key: string
  url: string
  method?: string
  headers?: Record<string, string>
  authValue?: string
  rateConfig?: object
  allowedOrigins?: string[]
}

/**
 * Manages CRUD for form_endpoints via the build server API.
 * Used in the Form Endpoints settings panel.
 */
export function useFormEndpoints(siteId: string) {
  const endpoints = ref<FormEndpointRow[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      const result = await $fetch<{ ok: boolean; endpoints: FormEndpointRow[] }>(
        `${BUILD_SERVER_URL}/api/${siteId}/form-endpoints`
      )
      endpoints.value = result.endpoints ?? []
    } catch (err: any) {
      error.value = err.message ?? 'Failed to load endpoints'
    } finally {
      isLoading.value = false
    }
  }

  async function create(data: CreateEndpointInput) {
    isLoading.value = true
    error.value = null
    try {
      await $fetch(`${BUILD_SERVER_URL}/api/${siteId}/form-endpoints`, {
        method: 'POST',
        body: data
      })
      await load()
    } catch (err: any) {
      error.value = err.message ?? 'Failed to create endpoint'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(key: string) {
    isLoading.value = true
    error.value = null
    try {
      await $fetch(`${BUILD_SERVER_URL}/api/${siteId}/form-endpoints/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })
      endpoints.value = endpoints.value.filter(e => e.key !== key)
    } catch (err: any) {
      error.value = err.message ?? 'Failed to delete endpoint'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return { endpoints, isLoading, error, load, create, remove }
}
