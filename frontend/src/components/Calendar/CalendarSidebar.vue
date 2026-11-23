<template>
  <aside
    class="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r px-3 py-4"
    :aria-label="__('Calendar sidebar')"
  >
    <!-- month: click a day to jump the calendar to it -->
    <section class="flex flex-col gap-2" :aria-label="__('Month')">
      <div class="flex items-center justify-between pl-1">
        <span class="text-base-medium text-ink-gray-8">
          {{ month.format('MMMM YYYY') }}
        </span>
        <div class="flex">
          <Button
            variant="ghost"
            icon="lucide-chevron-left"
            :aria-label="__('Previous month')"
            @click="month = month.subtract(1, 'month')"
          />
          <Button
            variant="ghost"
            icon="lucide-chevron-right"
            :aria-label="__('Next month')"
            @click="month = month.add(1, 'month')"
          />
        </div>
      </div>
      <div class="grid grid-cols-7 gap-y-0.5 text-center text-sm">
        <span
          v-for="(d, i) in weekdays"
          :key="'w' + i"
          class="py-1 text-ink-gray-5"
        >
          {{ d }}
        </span>
        <button
          v-for="day in days"
          :key="day.date"
          class="mx-auto flex size-7 items-center justify-center rounded-full"
          :class="day.class"
          :aria-label="day.label"
          @click="emit('goto', day.date)"
        >
          {{ day.n }}
        </button>
      </div>
    </section>

    <!-- your booking pages -->
    <section class="flex flex-col gap-1" aria-labelledby="booking-pages-head">
      <div class="flex items-center justify-between pb-1 pl-1">
        <h2 id="booking-pages-head" class="text-base-medium text-ink-gray-8">
          {{ __('Booking pages') }}
        </h2>
        <Button
          variant="ghost"
          icon="lucide-plus"
          :tooltip="__('New booking page')"
          :aria-label="__('New booking page')"
          @click="openBookingPages()"
        />
      </div>

      <div
        v-if="!myPages.length && pages.fetched"
        class="flex flex-col gap-2.5 rounded-4 border border-dashed border-outline-gray-2 p-3"
      >
        <p class="text-p-sm text-ink-gray-6">
          {{
            __('Share a link where people pick a free slot on your calendar.')
          }}
        </p>
        <Button
          class="w-fit"
          variant="solid"
          :label="__('Create booking page')"
          @click="openBookingPages()"
        />
      </div>

      <div
        v-for="page in myPages"
        :key="page.name"
        class="group flex h-9 items-center gap-1 rounded-4 pl-2 pr-1 hover:bg-surface-gray-2"
        :class="openPage === page.name && 'bg-surface-gray-2'"
      >
        <Popover
          side="right"
          align="start"
          :offset="12"
          bare
          @open="openPage = page.name"
          @close="openPage === page.name && (openPage = '')"
        >
          <template #trigger>
            <button
              class="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
              :class="page.enabled ? 'text-ink-gray-8' : 'text-ink-gray-5'"
            >
              <CalendarIcon class="size-4 shrink-0 text-ink-gray-6" />
              <span class="truncate">{{ page.title }}</span>
              <Badge
                v-if="!page.enabled"
                variant="outline"
                theme="gray"
                :label="__('Off')"
              />
            </button>
          </template>
          <template #default="{ close }">
            <BookingPageCard
              :page="page"
              @copy="copy(page)"
              @edit="(close(), editPage(page))"
              @close="close()"
            />
          </template>
        </Popover>
        <Button
          variant="ghost"
          :icon="copied === page.name ? 'lucide-check' : 'lucide-link'"
          :class="copied === page.name && '!text-ink-green-6'"
          :tooltip="__('Copy link')"
          :aria-label="__('Copy link')"
          @click="copy(page)"
        />
        <Dropdown align="end" :options="pageOptions(page)">
          <Button
            variant="ghost"
            icon="lucide-more-horizontal"
            :aria-label="__('More')"
          />
        </Dropdown>
      </div>

      <button
        class="rounded-3 px-2 py-1.5 text-left text-sm text-ink-gray-5 hover:text-ink-gray-7"
        @click="openBookingPages()"
      >
        {{ __('Manage all booking pages') }}
      </button>
    </section>
  </aside>
</template>

<script setup>
import CalendarIcon from '@/components/Icons/CalendarIcon.vue'
import BookingPageCard from '@/components/Calendar/BookingPageCard.vue'
import {
  copyPageLink,
  pageToOpen,
  pageUrl,
} from '@/components/Settings/BookingPages/bookingPages'
import { activeSettingsPage, showSettings } from '@/composables/settings'
import { sessionStore } from '@/stores/session'
import {
  Badge,
  Button,
  Dropdown,
  Popover,
  call,
  createResource,
  dayjs,
  toast,
} from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  // the days the calendar shows now, as YYYY-MM-DD
  range: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['goto'])

const { user } = sessionStore()

// month grid
const month = ref(dayjs().startOf('month'))
watch(
  () => props.range?.startDate,
  (start) => {
    if (!start) return
    const shown = dayjs(start).startOf('month')
    // follow the calendar unless the month already holds the shown days
    if (!dayjs(props.range.endDate).isSame(month.value, 'month')) {
      month.value = shown
    }
  },
)

const weekdays = computed(() =>
  [0, 1, 2, 3, 4, 5, 6].map((d) => dayjs().day(d).format('dd').charAt(0)),
)

const days = computed(() => {
  const first = month.value.startOf('week')
  const today = dayjs().format('YYYY-MM-DD')
  const { startDate, endDate } = props.range || {}
  return Array.from({ length: 42 }, (_, i) => {
    const d = first.add(i, 'day')
    const date = d.format('YYYY-MM-DD')
    const inMonth = d.isSame(month.value, 'month')
    const shown = startDate && endDate && date >= startDate && date <= endDate
    let cls = inMonth ? 'text-ink-gray-8' : 'text-ink-gray-4'
    if (date === today) cls = 'bg-surface-gray-10 text-ink-base font-semibold'
    else if (shown) cls += ' bg-surface-gray-2'
    else cls += ' hover:bg-surface-gray-2'
    return {
      date,
      n: d.date(),
      class: cls,
      label: d.format('dddd, D MMMM YYYY'),
    }
  })
})

// booking pages you host
const pages = createResource({
  url: 'crm.api.booking.list_pages',
  cache: 'crm-calendar-booking-pages',
  auto: true,
})
const myPages = computed(() =>
  (pages.data || []).filter((p) => p.hosts?.includes(user)),
)

const openPage = ref('')
const copied = ref('')
let copiedTimer = null

function copy(page) {
  copyPageLink(page.route)
  copied.value = page.name
  clearTimeout(copiedTimer)
  copiedTimer = setTimeout(() => (copied.value = ''), 2000)
}

function openBookingPages() {
  activeSettingsPage.value = __('Booking Pages')
  showSettings.value = true
}

function editPage(page) {
  pageToOpen.value = page.name
  openBookingPages()
}

async function setEnabled(page, enabled) {
  try {
    await call('frappe.client.set_value', {
      doctype: 'CRM Booking Page',
      name: page.name,
      fieldname: 'enabled',
      value: enabled ? 1 : 0,
    })
    pages.reload()
  } catch (e) {
    toast.error(e?.messages?.[0] || __('Could not change the page'))
  }
}

function pageOptions(page) {
  return [
    {
      label: __('Preview'),
      icon: 'lucide-external-link',
      onClick: () => window.open(pageUrl(page.route), '_blank'),
    },
    {
      label: __('Edit'),
      icon: 'lucide-edit-2',
      onClick: () => editPage(page),
    },
    {
      label: page.enabled ? __('Turn off') : __('Turn on'),
      icon: page.enabled ? 'lucide-eye-off' : 'lucide-eye',
      onClick: () => setEnabled(page, !page.enabled),
    },
  ]
}

// settings may have changed a page
watch(showSettings, (open) => !open && pages.reload())
</script>
