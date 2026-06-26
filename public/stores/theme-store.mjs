import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', () => {
    console.log('Setting up Theme Store...')
    const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null
    // Safe check for window and matchMedia in Deno/SSR environments, though it's client-only here
    const systemPrefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = ref(savedTheme || (systemPrefersDark ? 'dark' : 'light'))

    const isDark = computed(() => theme.value === 'dark')

    const updateDOM = (newTheme) => {
        if (typeof document !== 'undefined') {
            if (newTheme === 'dark') {
                document.body.classList.add('dark')
            } else {
                document.body.classList.remove('dark')
            }
        }
        localStorage.setItem('theme', newTheme)
    }

    // Initialize DOM
    updateDOM(theme.value)

    watch(theme, (newTheme) => {
        updateDOM(newTheme)
    })

    const toggleTheme = () => {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
    }

    return {
        theme,
        isDark,
        toggleTheme
    }
})
