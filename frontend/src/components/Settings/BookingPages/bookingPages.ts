import { copyToClipboard } from '@/utils'
import { ref } from 'vue'

export const ROUTE_PREFIX = '/crm-book/'

export function slugify(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function pageUrl(route: string): string {
  return `${window.location.origin}${ROUTE_PREFIX}${route}`
}

export function copyPageLink(route: string) {
  copyToClipboard(pageUrl(route))
}

// a page to open straight in the editor the next time Booking Pages settings opens
export const pageToOpen = ref<string | null>(null)
