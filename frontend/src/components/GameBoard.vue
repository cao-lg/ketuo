<template>
  <div class="min-h-screen flex flex-col">
    <div class="flex items-center justify-between p-3 border-b border-white/10 bg-black/20">
      <button @click="$emit('back')" class="flex items-center gap-2 text-gray-300 hover:text-white transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
        <span>返回</span>
      </button>
      <div class="text-center">
        <div class="text-lg font-bold">{{ playerName }}</div>
        <div class="text-xs text-gray-400">{{ getTeamLabel(mySeat) }} · {{ mySeat }}号位</div>
      </div>
      <div class="flex gap-2 text-sm">
        <span class="text-green-400">队1: {{ scores.team0 }}</span>
        <span class="text-red-400">队2: {{ scores.team1 }}</span>
      </div>
    </div>
    
    <div class="flex-1 flex flex-col p-2">
      <div class="flex justify-center mb-2">
        <PlayerSlot 
          :name="getPlayerName(2)" 
          :seat="2" 
          :rest="hands[2]?.length || 0"
          :is-current="currentSeat === 2"
          :played-cards="playedCards[2]"
          :is-me="mySeat === 2"
        />
      </div>
      
      <div class="flex justify-between items-center flex-1">
        <PlayerSlot 
          :name="getPlayerName(1)" 
          :seat="1" 
          :rest="hands[1]?.length || 0"
          :is-current="currentSeat === 1"
          :played-cards="playedCards[1]"
          :is-me="mySeat === 1"
          vertical
        />
        
        <div class="flex flex-col items-center justify-center min-w-[200px]">
          <div v-if="lastAction && lastAction.type !== 'PASS'" class="text-center mb-4">
            <div class="text-sm text-gray-400 mb-2">当前出牌</div>
            <div class="flex gap-1 justify-center flex-wrap">
              <div 
                v-for="(card, idx) in lastAction.cards" 
                :key="idx"
                class="card card-small"
                :class="getCardClass(card)"
              >
                <span class="text-xs">{{ getCardDisplay(card) }}</span>
              </div>
            </div>
            <div class="text-sm text-yellow-400 mt-1">{{ lastAction.type }}</div>
          </div>
          
          <div v-else class="text-center text-gray-500">
            <div class="text-3xl mb-2">🃏</div>
            <div class="text-xs">等待出牌</div>
          </div>
        </div>
        
        <PlayerSlot 
          :name="getPlayerName(3)" 
          :seat="3" 
          :rest="hands[3]?.length || 0"
          :is-current="currentSeat === 3"
          :played-cards="playedCards[3]"
          :is-me="mySeat === 3"
          vertical
        />
      </div>
      
      <div class="flex justify-center mt-2">
        <PlayerSlot 
          :name="getPlayerName(0)" 
          :seat="0" 
          :rest="hands[0]?.length || 0"
          :is-current="currentSeat === 0"
          :played-cards="playedCards[0]"
          :is-me="mySeat === 0"
        />
      </div>
    </div>
    
    <div class="border-t border-white/10 p-3 bg-black/30">
      <div class="flex items-center justify-between mb-3">
        <div class="text-sm">
          <span class="text-gray-400">我的牌: </span>
          <span class="text-yellow-400 font-bold">{{ myHand.length }}</span>
          <span class="text-gray-400">张</span>
        </div>
        <div class="text-sm text-green-400">{{ message }}</div>
      </div>
      
      <div class="flex gap-1 overflow-x-auto scrollbar-hide pb-2">
        <div
          v-for="(card, idx) in myHand"
          :key="idx"
          class="card shrink-0"
          :class="[getCardClass(card), { 'card-selected': selectedCards.includes(card) }]"
          @click="handleCardClick(card)"
        >
          <span class="text-xs">{{ getCardDisplay(card) }}</span>
          <span v-if="getSuitSymbol(card)" class="text-lg">{{ getSuitSymbol(card) }}</span>
        </div>
      </div>
      
      <div class="flex gap-2 mt-3">
        <button 
          @click="$emit('pass')" 
          class="flex-1 btn-danger"
          :disabled="currentSeat !== mySeat || (lastAction && lastAction.type === 'PASS')"
        >
          过牌
        </button>
        <button 
          @click="$emit('play-cards')" 
          class="flex-1 btn-primary"
          :disabled="currentSeat !== mySeat || selectedCards.length === 0"
        >
          出牌
        </button>
      </div>
    </div>
    
    <div v-if="stage === 'gameover'" class="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div class="game-container p-6 w-full max-w-sm text-center">
        <div class="text-4xl mb-4">🏆</div>
        <h2 class="text-2xl font-bold mb-2">{{ gameResult }}</h2>
        <p class="text-gray-300 mb-2">本局得分</p>
        <div class="flex justify-center gap-8 mb-6">
          <div class="text-green-400">队1: {{ scores.team0 }}</div>
          <div class="text-red-400">队2: {{ scores.team1 }}</div>
        </div>
        <div class="flex gap-3">
          <button @click="restartGame" class="flex-1 btn-primary">再来一局</button>
          <button @click="$emit('back')" class="flex-1 btn-secondary">返回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PlayerSlot from './PlayerSlot.vue'
import { getCardClass, getCardDisplay, getSuitSymbol, sortCards } from '../utils/cardUtils'

const props = defineProps({
  playerName: String,
  mySeat: Number,
  hands: Array,
  currentSeat: Number,
  playedCards: Array,
  roundStartSeat: Number,
  lastAction: Object,
  stage: String,
  scores: Object,
  selectedCards: Array,
  message: String
})

const emit = defineEmits(['select-card', 'play-cards', 'pass', 'back'])

const myHand = computed(() => sortCards(props.hands[props.mySeat] || []))

const gameResult = computed(() => {
  return props.message.includes('你获胜') ? '🎉 恭喜获胜！' : '😢 遗憾失败'
})

const aiNames = ['小明', '小红', '小强']

function getPlayerName(seat) {
  if (seat === props.mySeat) return props.playerName || '我'
  return aiNames[seat % 3]
}

function getTeamLabel(seat) {
  return seat % 2 === 0 ? '红队' : '蓝队'
}

function handleCardClick(card) {
  if (props.currentSeat === props.mySeat) {
    emit('select-card', card)
  }
}

function restartGame() {
  window.location.reload()
}
</script>
