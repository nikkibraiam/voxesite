<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { CountdownProps, CountdownLabels } from '@cms/contracts'

const props = withDefaults(defineProps<CountdownProps>(), {
  targetDate: '',
  style: 'boxes',
  expiredMessage: '¡El tiempo ha terminado!'
})

const parsedLabels = computed<CountdownLabels>(() => {
  const defaults: CountdownLabels = { days: 'Días', hours: 'Horas', minutes: 'Min', seconds: 'Seg' }
  if (!props.labels) return defaults
  if (typeof props.labels === 'object') return { ...defaults, ...props.labels }
  try { return { ...defaults, ...JSON.parse(props.labels as string) } } catch { return defaults }
})

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function calc(): TimeLeft | null {
  if (!props.targetDate) return null
  const diff = new Date(props.targetDate).getTime() - Date.now()
  if (diff <= 0) return null
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000)
  }
}

const timeLeft = ref<TimeLeft | null>(calc())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => { timeLeft.value = calc() }, 1000)
})

onUnmounted(() => {
  if (timer !== null) clearInterval(timer)
})

function pad(n: number) { return String(n).padStart(2, '0') }
</script>

<template>
  <div class="countdown" :class="`countdown--${props.style ?? 'boxes'}`">
    <div v-if="timeLeft" class="countdown__units">
      <div class="countdown__unit">
        <span class="countdown__value">{{ pad(timeLeft.days) }}</span>
        <span class="countdown__label">{{ parsedLabels.days }}</span>
      </div>
      <span class="countdown__sep" aria-hidden="true">:</span>
      <div class="countdown__unit">
        <span class="countdown__value">{{ pad(timeLeft.hours) }}</span>
        <span class="countdown__label">{{ parsedLabels.hours }}</span>
      </div>
      <span class="countdown__sep" aria-hidden="true">:</span>
      <div class="countdown__unit">
        <span class="countdown__value">{{ pad(timeLeft.minutes) }}</span>
        <span class="countdown__label">{{ parsedLabels.minutes }}</span>
      </div>
      <span class="countdown__sep" aria-hidden="true">:</span>
      <div class="countdown__unit">
        <span class="countdown__value">{{ pad(timeLeft.seconds) }}</span>
        <span class="countdown__label">{{ parsedLabels.seconds }}</span>
      </div>
    </div>
    <p v-else class="countdown__expired">{{ expiredMessage }}</p>
  </div>
</template>

<style scoped>
.countdown {
  display: flex;
  justify-content: center;
  padding: 2rem 1.5rem;
}

.countdown__units {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.countdown__sep {
  font-size: 2rem;
  font-weight: 300;
  opacity: 0.4;
  margin-bottom: 1.25rem;
}

.countdown__unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-width: 72px;
}

/* Boxes style */
.countdown--boxes .countdown__unit {
  background: #1a1a2e;
  color: #fff;
  border-radius: 8px;
  padding: 1rem 0.5rem;
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
}

.countdown__value {
  font-size: 2.5rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.countdown--minimal .countdown__value {
  font-size: 2rem;
  color: #5858c8;
}

.countdown__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

.countdown--boxes .countdown__label {
  color: rgba(255,255,255,0.7);
}

.countdown__expired {
  font-size: 1.25rem;
  font-weight: 600;
  opacity: 0.7;
}

@media (max-width: 480px) {
  .countdown__unit {
    min-width: 56px;
  }
  .countdown__value {
    font-size: 1.75rem;
  }
}
</style>
