<template>
  <BookingPagesList v-if="!activeName" ref="listRef" @open="open" />
  <BookingPageEditor v-else :key="activeName" :name="activeName" @back="back" />
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import BookingPagesList from './BookingPagesList.vue'
import BookingPageEditor from './BookingPageEditor.vue'
import { pageToOpen } from './bookingPages'

// opened from the calendar's sidebar: go straight to that page
const activeName = ref<string | null>(pageToOpen.value)
pageToOpen.value = null
const listRef = ref<InstanceType<typeof BookingPagesList> | null>(null)

function open(name: string) {
  activeName.value = name
}

async function back() {
  activeName.value = null
  await nextTick()
  listRef.value?.reload()
}
</script>
