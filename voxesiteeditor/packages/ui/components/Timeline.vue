<script setup lang="ts">
import { computed } from 'vue'
import type { TimelineProps, TimelineEvent } from '@cms/contracts'

const props = withDefaults(defineProps<TimelineProps>(), {
  heading: '',
  direction: 'vertical'
})

const parsedEvents = computed<TimelineEvent[]>(() => {
  if (!props.events) return []
  if (Array.isArray(props.events)) return props.events
  try { return JSON.parse(props.events as string) } catch { return [] }
})
</script>

<template>
  <section class="timeline" :class="`timeline--${direction ?? 'vertical'}`">
    <div v-if="heading" class="timeline__heading-wrap">
      <h2 class="timeline__heading">{{ heading }}</h2>
    </div>

    <ol class="timeline__list" role="list">
      <li
        v-for="(event, i) in parsedEvents"
        :key="i"
        class="timeline__item"
      >
        <div class="timeline__marker">
          <span class="timeline__icon" aria-hidden="true">{{ event.icon ?? '●' }}</span>
        </div>
        <div class="timeline__body">
          <time v-if="event.date" class="timeline__date">{{ event.date }}</time>
          <h3 class="timeline__title">{{ event.title }}</h3>
          <p v-if="event.description" class="timeline__desc">{{ event.description }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.timeline {
  padding: 3rem 1.5rem;
}

.timeline__heading-wrap {
  text-align: center;
  margin-bottom: 2.5rem;
}

.timeline__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

/* Vertical layout */
.timeline--vertical .timeline__list {
  list-style: none;
  margin: 0 auto;
  padding: 0;
  max-width: 700px;
  position: relative;
}

.timeline--vertical .timeline__list::before {
  content: '';
  position: absolute;
  left: 22px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(0, 0, 0, 0.1);
}

.timeline--vertical .timeline__item {
  display: flex;
  gap: 1.25rem;
  padding-bottom: 2rem;
  position: relative;
}

.timeline--vertical .timeline__marker {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #5858c8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #fff;
  z-index: 1;
}

/* Horizontal layout */
.timeline--horizontal .timeline__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  overflow-x: auto;
  gap: 0;
  padding-bottom: 1rem;
}

.timeline--horizontal .timeline__item {
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  padding: 0 1rem;
}

.timeline--horizontal .timeline__item::before {
  content: '';
  position: absolute;
  top: 22px;
  left: 50%;
  right: -50%;
  height: 2px;
  background: rgba(0, 0, 0, 0.1);
  z-index: 0;
}

.timeline--horizontal .timeline__item:last-child::before {
  display: none;
}

.timeline--horizontal .timeline__marker {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #5858c8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  color: #fff;
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 1;
}

.timeline__body {
  flex: 1;
  padding-top: 0.25rem;
}

.timeline__date {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #5858c8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  display: block;
  margin-bottom: 0.25rem;
}

.timeline__title {
  font-size: 1.0625rem;
  font-weight: 600;
  margin: 0 0 0.375rem;
}

.timeline__desc {
  font-size: 0.9375rem;
  opacity: 0.7;
  margin: 0;
  line-height: 1.6;
}
</style>
