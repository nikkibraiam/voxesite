<script setup lang="ts">
import { ref, computed } from 'vue'
import type { HeaderProps, HeaderNavLink } from '@cms/contracts'

const props = withDefaults(defineProps<HeaderProps>(), {
  logoText: 'Mi Sitio',
  logoAlt: 'Logo',
  navLinks: () => [],
  backgroundColor: '#ffffff',
  sticky: false
})

const menuOpen = ref(false)

const parsedNavLinks = computed<HeaderNavLink[]>(() => {
  if (!props.navLinks) return []
  if (Array.isArray(props.navLinks)) return props.navLinks
  // Handle JSON string case (e.g. when coming from a textarea in the editor)
  try {
    return JSON.parse(props.navLinks as unknown as string)
  } catch {
    return []
  }
})

const headerStyle = computed(() => ({
  backgroundColor: props.backgroundColor ?? '#ffffff'
}))
</script>

<template>
  <header
    class="layout-header"
    :class="{ 'layout-header--sticky': sticky }"
    :style="headerStyle"
  >
    <div class="layout-header__inner">
      <!-- Logo -->
      <a class="layout-header__logo" href="/">
        <img
          v-if="logoImageUrl"
          :src="logoImageUrl"
          :alt="logoAlt"
          class="layout-header__logo-img"
        />
        <span v-else class="layout-header__logo-text">
          {{ logoText }}
        </span>
      </a>

      <!-- Desktop navigation -->
      <nav class="layout-header__nav layout-header__nav--desktop" aria-label="Navegación principal">
        <a
          v-for="link in parsedNavLinks"
          :key="link.href"
          :href="link.href"
          class="layout-header__nav-link"
        >
          {{ link.label }}
        </a>
      </nav>

      <!-- Hamburger button (mobile) -->
      <button
        class="layout-header__hamburger"
        :aria-expanded="menuOpen"
        aria-label="Abrir menú"
        @click="menuOpen = !menuOpen"
      >
        <span class="layout-header__hamburger-bar" />
        <span class="layout-header__hamburger-bar" />
        <span class="layout-header__hamburger-bar" />
      </button>
    </div>

    <!-- Mobile navigation -->
    <nav
      v-show="menuOpen"
      class="layout-header__nav layout-header__nav--mobile"
      aria-label="Navegación móvil"
    >
      <a
        v-for="link in parsedNavLinks"
        :key="link.href"
        :href="link.href"
        class="layout-header__nav-link"
        @click="menuOpen = false"
      >
        {{ link.label }}
      </a>
    </nav>
  </header>
</template>

<style scoped>
.layout-header {
  width: 100%;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 100;
}

.layout-header--sticky {
  position: sticky;
  top: 0;
}

.layout-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.875rem 1.5rem;
  gap: 1rem;
}

/* Logo */
.layout-header__logo {
  text-decoration: none;
  color: inherit;
  flex-shrink: 0;
}

.layout-header__logo-img {
  height: 2rem;
  display: block;
  object-fit: contain;
}

.layout-header__logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* Desktop nav */
.layout-header__nav--desktop {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.layout-header__nav-link {
  text-decoration: none;
  color: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  opacity: 0.85;
  transition: opacity 0.15s;
}

.layout-header__nav-link:hover {
  opacity: 1;
}

/* Hamburger button */
.layout-header__hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  padding: 0.25rem;
  cursor: pointer;
}

.layout-header__hamburger-bar {
  display: block;
  width: 24px;
  height: 2px;
  background: currentColor;
  border-radius: 2px;
  transition: opacity 0.15s;
}

/* Mobile nav */
.layout-header__nav--mobile {
  flex-direction: column;
  padding: 0.75rem 1.5rem 1rem;
  gap: 0;
}

.layout-header__nav--mobile .layout-header__nav-link {
  display: block;
  padding: 0.625rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .layout-header__nav--desktop {
    display: none;
  }

  .layout-header__hamburger {
    display: flex;
  }

  .layout-header__nav--mobile {
    display: flex;
  }
}
</style>
