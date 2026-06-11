<template>
  <div class="player-info" :class="{ 'ring-2 ring-green-500': isCurrent }">
    <div class="flex items-center gap-2">
      <div 
        class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        :class="isMe ? 'bg-gradient-to-br from-green-500 to-emerald-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'"
      >
        {{ name.charAt(0) }}
      </div>
      <div>
        <div class="text-sm font-medium">{{ name }}</div>
        <div class="text-xs text-gray-400">{{ getTeamLabel(seat) }} · {{ seat }}号位</div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="text-center">
        <div class="text-xl font-bold text-yellow-400">{{ rest }}</div>
        <div class="text-xs text-gray-400">剩余</div>
      </div>
      <div v-if="isCurrent" class="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
    </div>
    
    <div v-if="playedCards && playedCards.length > 0" class="mt-2 flex gap-1 justify-center">
      <div 
        v-for="(card, idx) in playedCards" 
        :key="idx"
        class="card card-small"
        :class="getCardClass(card)"
      >
        <span class="text-xs">{{ getCardDisplay(card) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { getCardClass, getCardDisplay } from '../utils/cardUtils'

const props = defineProps({
  name: { type: String, required: true },
  seat: { type: Number, required: true },
  rest: { type: Number, default: 0 },
  isCurrent: { type: Boolean, default: false },
  playedCards: { type: Array, default: () => [] },
  isMe: { type: Boolean, default: false },
  vertical: { type: Boolean, default: false }
})

function getTeamLabel(seat) {
  return seat % 2 === 0 ? '红队' : '蓝队'
}
</script>

<style scoped>
.player-info {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 12px 16px;
  min-width: 160px;
  transition: all 0.2s;
}
</style>
