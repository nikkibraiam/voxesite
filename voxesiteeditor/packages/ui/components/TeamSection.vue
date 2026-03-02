<script setup lang="ts">
import { computed } from 'vue'
import type { TeamSectionProps, TeamMember } from '@cms/contracts'

const props = withDefaults(defineProps<TeamSectionProps>(), {
  heading: '',
  columns: 3
})

const parsedMembers = computed<TeamMember[]>(() => {
  if (!props.members) return []
  if (Array.isArray(props.members)) return props.members
  try { return JSON.parse(props.members as string) } catch { return [] }
})

const gridStyle = computed(() => ({ '--team-columns': String(props.columns ?? 3) }))
</script>

<template>
  <section class="team-section">
    <div v-if="heading" class="team-section__heading-wrap">
      <h2 class="team-section__heading">{{ heading }}</h2>
    </div>

    <div class="team-section__grid" :style="gridStyle">
      <article
        v-for="(member, i) in parsedMembers"
        :key="i"
        class="team-section__card"
      >
        <img
          v-if="member.avatarUrl"
          :src="member.avatarUrl"
          :alt="member.name"
          class="team-section__avatar"
          loading="lazy"
        />
        <div v-else class="team-section__avatar-placeholder" aria-hidden="true">
          {{ member.name.charAt(0).toUpperCase() }}
        </div>

        <h3 class="team-section__name">{{ member.name }}</h3>
        <p v-if="member.role" class="team-section__role">{{ member.role }}</p>
        <p v-if="member.bio" class="team-section__bio">{{ member.bio }}</p>

        <div v-if="member.socialLinks?.length" class="team-section__social">
          <a
            v-for="(link, li) in member.socialLinks"
            :key="li"
            :href="link.url"
            class="team-section__social-link"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="link.platform"
          >
            {{ link.platform }}
          </a>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.team-section {
  padding: 3rem 1.5rem;
}

.team-section__heading-wrap {
  text-align: center;
  margin-bottom: 2.5rem;
}

.team-section__heading {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.team-section__grid {
  display: grid;
  grid-template-columns: repeat(var(--team-columns, 3), 1fr);
  gap: 2rem;
  max-width: 1100px;
  margin: 0 auto;
}

.team-section__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.5rem;
}

.team-section__avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 0.5rem;
}

.team-section__avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #1a1a2e;
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.team-section__name {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.team-section__role {
  font-size: 0.875rem;
  color: #5858c8;
  font-weight: 500;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.team-section__bio {
  font-size: 0.9375rem;
  opacity: 0.7;
  margin: 0;
  line-height: 1.6;
}

.team-section__social {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 0.5rem;
}

.team-section__social-link {
  font-size: 0.8125rem;
  color: #5858c8;
  text-decoration: none;
  padding: 0.375rem 0.625rem;
  min-height: 44px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(88, 88, 200, 0.3);
  border-radius: 4px;
  transition: background 0.15s;
}

.team-section__social-link:hover {
  background: rgba(88, 88, 200, 0.08);
}

@media (max-width: 768px) {
  .team-section__grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 500px) {
  .team-section__grid { grid-template-columns: 1fr; }
}
</style>
