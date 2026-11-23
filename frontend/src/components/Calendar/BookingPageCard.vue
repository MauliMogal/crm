<template>
  <div
    class="flex w-[400px] flex-col rounded-6 bg-surface-elevation-2 text-base text-ink-gray-7 shadow-2xl ring-1 ring-outline-gray-1"
  >
    <div class="flex justify-end gap-0.5 px-2.5 pt-2.5">
      <Button
        variant="ghost"
        icon="lucide-pencil"
        :aria-label="__('Edit page')"
        @click="emit('edit')"
      />
      <Button
        variant="ghost"
        icon="lucide-x"
        :aria-label="__('Close')"
        @click="emit('close')"
      />
    </div>

    <div class="flex gap-3.5 px-5 pb-3">
      <span
        class="mt-2 size-3 shrink-0 rounded-1"
        :class="page.enabled ? 'bg-surface-green-6' : 'bg-surface-gray-5'"
      />
      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xl-semibold text-ink-gray-8">{{ page.title }}</span>
          <Badge
            variant="outline"
            :theme="page.enabled ? 'green' : 'gray'"
            :label="page.enabled ? __('Live') : __('Off')"
          />
        </div>
        <span class="text-ink-gray-6">{{ headline }}</span>
      </div>
    </div>

    <div
      v-if="summary.loading && !summary.data"
      class="flex justify-center p-6"
    >
      <LoadingIndicator class="w-4" />
    </div>
    <div v-else-if="data" class="flex flex-col gap-3.5 px-5 pb-5 pt-1">
      <div v-if="place" class="flex items-start gap-3.5">
        <component
          :is="placeIcon"
          class="mt-0.5 size-4 shrink-0 text-ink-gray-5"
        />
        <a
          v-if="placeIsLink"
          :href="place"
          target="_blank"
          rel="noopener"
          class="min-w-0 truncate hover:underline"
        >
          {{ place.replace(/^https?:\/\//, '') }}
        </a>
        <span v-else>{{ place }}</span>
      </div>
      <div v-if="data.description" class="flex items-start gap-3.5">
        <DescriptionIcon class="mt-0.5 size-4 shrink-0 text-ink-gray-5" />
        <span class="whitespace-pre-line text-p-base">{{
          data.description
        }}</span>
      </div>
      <div v-if="data.form_fields?.length" class="flex items-start gap-3.5">
        <LucideClipboardList class="mt-0.5 size-4 shrink-0 text-ink-gray-5" />
        <div class="flex min-w-0 flex-col gap-0.5">
          <span>{{ __('Booking form') }}</span>
          <span class="text-p-sm text-ink-gray-5">
            {{ data.form_fields.join(' · ') }}
          </span>
        </div>
      </div>
      <div v-if="data.hosts?.length" class="flex items-start gap-3.5">
        <PeopleIcon class="mt-0.5 size-4 shrink-0 text-ink-gray-5" />
        <div class="flex min-w-0 flex-col gap-0.5">
          <span>{{ data.hosts.join(', ') }}</span>
          <span class="text-p-sm text-ink-gray-5">
            {{ __("Busy times on the host's calendar can't be booked") }}
          </span>
        </div>
      </div>
    </div>

    <div
      class="flex justify-end gap-2 rounded-b-6 border-t border-outline-gray-1 bg-surface-gray-1 px-4 py-3"
    >
      <Button
        :label="__('Preview')"
        icon-left="lucide-external-link"
        :href="pageUrl(page.route)"
      />
      <Button
        variant="solid"
        :label="__('Copy link')"
        icon-left="lucide-link"
        @click="emit('copy')"
      />
    </div>
  </div>
</template>

<script setup>
import DescriptionIcon from '@/components/Icons/DescriptionIcon.vue'
import PeopleIcon from '@/components/Icons/PeopleIcon.vue'
import MapIcon from '@/components/Icons/MapIcon.vue'
import LucideVideo from '~icons/lucide/video'
import LucidePhone from '~icons/lucide/phone'
import LucideClipboardList from '~icons/lucide/clipboard-list'
import { pageUrl } from '@/components/Settings/BookingPages/bookingPages'
import { Badge, Button, LoadingIndicator, createResource } from 'frappe-ui'
import { computed } from 'vue'

const props = defineProps({
  // a row of crm.api.booking.list_pages
  page: { type: Object, required: true },
})
const emit = defineEmits(['copy', 'edit', 'close'])

const summary = createResource({
  url: 'crm.api.booking.page_summary',
  params: { name: props.page.name },
  cache: ['crm-booking-page-summary', props.page.name],
  auto: true,
})
const data = computed(() => summary.data)

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const ALL_DAYS = [...WEEKDAYS, 'Saturday', 'Sunday']

// "Weekdays", "Every day" or "Mon, Wed"
function openDays(days = []) {
  const set = new Set(days)
  if (ALL_DAYS.every((d) => set.has(d))) return __('Every day')
  if (set.size === 5 && WEEKDAYS.every((d) => set.has(d))) return __('Weekdays')
  return ALL_DAYS.filter((d) => set.has(d))
    .map((d) => __(d).slice(0, 3))
    .join(', ')
}

const headline = computed(() => {
  const parts = [__('{0} min', [props.page.duration])]
  const days = openDays(data.value?.days)
  if (days) parts.push(days)
  parts.push(
    props.page.document_type === 'CRM Deal'
      ? __('Creates a Deal')
      : __('Creates a Lead'),
  )
  return parts.join(' · ')
})

// where the meeting happens: a fixed link or address, else the kind of meeting
const place = computed(() => {
  const d = data.value
  if (!d) return ''
  if (d.location && d.location_type !== 'Phone call') return d.location
  return d.location_type ? __(d.location_type) : ''
})
const placeIsLink = computed(() => /^https?:\/\//.test(place.value))
const placeIcon = computed(() => {
  const type = data.value?.location_type
  if (type === 'Phone call') return LucidePhone
  if (type === 'In person') return MapIcon
  return LucideVideo
})
</script>
