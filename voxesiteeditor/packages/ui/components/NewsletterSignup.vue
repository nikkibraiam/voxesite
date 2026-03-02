<script setup lang="ts">
import { ref, inject } from 'vue'
import type { NewsletterSignupProps } from '@cms/contracts'

const props = withDefaults(defineProps<NewsletterSignupProps>(), {
  title: '¡Suscríbete a nuestro boletín!',
  description: 'Recibe las últimas noticias y novedades directamente en tu correo.',
  placeholder: 'tu@email.com',
  buttonLabel: 'Suscribirse',
  successMessage: '¡Gracias por suscribirte!',
})

const siteId = inject<string>('siteId', 'demosite')

const email = ref('')
const isSubmitting = ref(false)
const isSuccess = ref(false)
const errorMsg = ref('')

async function submit() {
  if (!email.value || isSubmitting.value) return
  isSubmitting.value = true
  errorMsg.value = ''
  try {
    const res = await fetch(`/api/form-submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        endpointKey: props.endpointKey,
        data: { email: email.value },
      }),
    })
    if (res.ok) {
      isSuccess.value = true
      email.value = ''
    } else {
      errorMsg.value = 'Error al suscribirse. Intente de nuevo.'
    }
  } catch {
    errorMsg.value = 'Error de conexión.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <section class="newsletter">
    <div class="newsletter__inner">
      <h2 v-if="title" class="newsletter__title">{{ title }}</h2>
      <p v-if="description" class="newsletter__desc">{{ description }}</p>

      <div v-if="isSuccess" class="newsletter__success" role="status">
        {{ successMessage }}
      </div>

      <form v-else class="newsletter__form" @submit.prevent="submit">
        <label class="newsletter__label" for="nl-email">Correo electrónico</label>
        <div class="newsletter__row">
          <input
            id="nl-email"
            v-model="email"
            class="newsletter__input"
            type="email"
            :placeholder="placeholder"
            required
            autocomplete="email"
          />
          <button
            class="newsletter__btn"
            type="submit"
            :disabled="isSubmitting"
          >{{ isSubmitting ? '...' : buttonLabel }}</button>
        </div>
        <p v-if="errorMsg" class="newsletter__error" role="alert">{{ errorMsg }}</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.newsletter {
  padding: 3rem 1.5rem;
  text-align: center;
}

.newsletter__inner {
  max-width: 560px;
  margin: 0 auto;
}

.newsletter__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.newsletter__desc {
  font-size: 1rem;
  opacity: 0.7;
  margin: 0 0 1.5rem;
  line-height: 1.6;
}

.newsletter__success {
  padding: 1rem;
  background: #f0fff4;
  border: 1px solid #68d391;
  border-radius: 6px;
  color: #276749;
  font-weight: 500;
}

.newsletter__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0,0,0,0);
  white-space: nowrap;
}

.newsletter__form {
  position: relative;
}

.newsletter__row {
  display: flex;
  gap: 0.5rem;
}

.newsletter__input {
  flex: 1;
  padding: 0.625rem 1rem;
  min-height: 44px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 6px;
  font-size: 1rem;
  background: #fff;
  transition: border-color 0.15s;
}

.newsletter__input:focus {
  outline: none;
  border-color: #5858c8;
  box-shadow: 0 0 0 3px rgba(88, 88, 200, 0.15);
}

.newsletter__btn {
  padding: 0.625rem 1.5rem;
  min-height: 44px;
  background: #5858c8;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}

.newsletter__btn:hover:not(:disabled) {
  background: #4646aa;
}

.newsletter__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.newsletter__error {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: #e53e3e;
  text-align: left;
}

@media (max-width: 480px) {
  .newsletter__row { flex-direction: column; }
}
</style>
