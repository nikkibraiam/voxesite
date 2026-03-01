<script setup lang="ts">
import { computed } from 'vue'
import type { PricingTableProps, PricingPlan } from '@cms/contracts'

const props = withDefaults(defineProps<PricingTableProps>(), {
  heading: 'Nuestros planes',
  subheading: ''
})

const parsedPlans = computed<PricingPlan[]>(() => {
  if (!props.plans) return []
  if (Array.isArray(props.plans)) return props.plans
  try { return JSON.parse(props.plans as string) } catch { return [] }
})
</script>

<template>
  <section class="pricing-table">
    <div v-if="heading || subheading" class="pricing-table__header">
      <h2 v-if="heading" class="pricing-table__heading">{{ heading }}</h2>
      <p v-if="subheading" class="pricing-table__subheading">{{ subheading }}</p>
    </div>

    <div class="pricing-table__grid">
      <article
        v-for="(plan, i) in parsedPlans"
        :key="i"
        class="pricing-table__plan"
        :class="{ 'pricing-table__plan--highlighted': plan.highlighted }"
      >
        <div v-if="plan.highlighted" class="pricing-table__badge">Más popular</div>
        <h3 class="pricing-table__plan-name">{{ plan.name }}</h3>
        <div class="pricing-table__price-row">
          <span class="pricing-table__price">{{ plan.price }}</span>
          <span v-if="plan.period" class="pricing-table__period">{{ plan.period }}</span>
        </div>

        <ul v-if="plan.features?.length" class="pricing-table__features">
          <li
            v-for="(feat, fi) in plan.features"
            :key="fi"
            class="pricing-table__feature"
          >
            <span class="pricing-table__check" aria-hidden="true">✓</span>
            {{ feat }}
          </li>
        </ul>

        <a
          v-if="plan.ctaLabel && plan.ctaUrl"
          :href="plan.ctaUrl"
          class="pricing-table__cta"
          :class="{ 'pricing-table__cta--highlighted': plan.highlighted }"
        >
          {{ plan.ctaLabel }}
        </a>
      </article>
    </div>
  </section>
</template>

<style scoped>
.pricing-table {
  padding: 3rem 1.5rem;
}

.pricing-table__header {
  text-align: center;
  margin-bottom: 2.5rem;
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
}

.pricing-table__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.75rem;
}

.pricing-table__subheading {
  font-size: 1.0625rem;
  opacity: 0.7;
  margin: 0;
}

.pricing-table__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  max-width: 1100px;
  margin: 0 auto;
  align-items: stretch;
}

.pricing-table__plan {
  flex: 1;
  min-width: 240px;
  max-width: 360px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #fff;
  position: relative;
}

.pricing-table__plan--highlighted {
  border-color: #1a1a2e;
  box-shadow: 0 4px 24px rgba(26, 26, 46, 0.15);
}

.pricing-table__badge {
  position: absolute;
  top: -0.75rem;
  left: 50%;
  transform: translateX(-50%);
  background: #1a1a2e;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  white-space: nowrap;
}

.pricing-table__plan-name {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  text-align: center;
}

.pricing-table__price-row {
  text-align: center;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}

.pricing-table__price {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
}

.pricing-table__period {
  font-size: 1rem;
  opacity: 0.6;
}

.pricing-table__features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  flex: 1;
}

.pricing-table__feature {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.9375rem;
}

.pricing-table__check {
  color: #16a34a;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}

.pricing-table__cta {
  display: block;
  text-align: center;
  padding: 0.875rem 1rem;
  min-height: 44px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.9375rem;
  font-weight: 600;
  border: 1px solid #1a1a2e;
  color: #1a1a2e;
  transition: background 0.15s, color 0.15s;
}

.pricing-table__cta:hover {
  background: #1a1a2e;
  color: #fff;
}

.pricing-table__cta--highlighted {
  background: #1a1a2e;
  color: #fff;
}

.pricing-table__cta--highlighted:hover {
  background: #5858c8;
  border-color: #5858c8;
}

@media (max-width: 600px) {
  .pricing-table__grid {
    flex-direction: column;
    align-items: stretch;
  }

  .pricing-table__plan {
    max-width: 100%;
  }
}
</style>
