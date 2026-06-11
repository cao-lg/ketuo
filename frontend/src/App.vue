<template>
  <div class="game-wrapper">
    <!-- 首页 -->
    <div v-if="gamePhase === 'idle'" class="home-screen">
      <div class="hero-section">
        <div class="floating-cards left">
          <div class="float-card" style="animation-delay: 0s">♠</div>
          <div class="float-card" style="animation-delay: 0.2s">♥</div>
          <div class="float-card" style="animation-delay: 0.4s">♣</div>
        </div>
        <div class="floating-cards right">
          <div class="float-card" style="animation-delay: 0.1s">♦</div>
          <div class="float-card" style="animation-delay: 0.3s">★</div>
          <div class="float-card" style="animation-delay: 0.5s">☾</div>
        </div>

        <div class="hero-content">
          <div class="logo-badge">淮安掼蛋</div>
          <h1 class="hero-title">
            <span class="title-icon">🃏</span>
            <span class="title-text">掼蛋</span>
          </h1>
          <p class="hero-subtitle">经典四人扑克 · 单机版</p>
        </div>
      </div>

      <div class="form-section">
        <div class="input-group">
          <label class="input-label">你的昵称</label>
          <input
            v-model="playerName"
            type="text"
            placeholder="输入昵称..."
            class="styled-input"
            @keyup.enter="handleStartGame"
          />
        </div>

        <div class="difficulty-section">
          <label class="input-label">选择难度</label>
          <div class="difficulty-grid">
            <button
              v-for="(config, key) in difficultyOptions"
              :key="key"
              @click="selectedDifficulty = key; playSound('click')"
              class="difficulty-btn"
              :class="[key, { active: selectedDifficulty === key }]"
            >
              <span class="difficulty-icon">{{ config.icon }}</span>
              <span class="difficulty-name">{{ config.name }}</span>
            </button>
          </div>
        </div>

        <div class="seat-section">
          <label class="input-label">选择座位</label>
          <div class="seat-grid">
            <button
              v-for="seat in 4"
              :key="seat"
              @click="selectedSeat = seat - 1; playSound('click')"
              class="seat-btn"
              :class="{ active: selectedSeat === seat - 1 }"
            >
              <span class="seat-number">{{ seat - 1 }}</span>
              <span class="seat-label">{{ getSeatLabel(seat - 1) }}</span>
            </button>
          </div>
        </div>

        <button
          @click="handleStartGame"
          class="start-btn"
          :class="{ ready: playerName.trim() }"
          :disabled="!playerName.trim()"
        >
          <span class="btn-icon">🎮</span>
          <span class="btn-text">开始游戏</span>
          <div class="btn-shine"></div>
        </button>
      </div>

      <div class="rules-section">
        <h3 class="rules-title">游戏规则</h3>
        <div class="rules-grid">
          <div class="rule-item">
            <div class="rule-icon">👥</div>
            <div class="rule-text">4人对战，对家为队友</div>
          </div>
          <div class="rule-item">
            <div class="rule-icon">🃏</div>
            <div class="rule-text">108张牌，两副牌</div>
          </div>
          <div class="rule-item">
            <div class="rule-icon">💥</div>
            <div class="rule-text">炸弹可以压任意牌</div>
          </div>
          <div class="rule-item">
            <div class="rule-icon">🏆</div>
            <div class="rule-text">先出完者获胜</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏界面 -->
    <div v-else class="game-screen">
      <div class="game-header">
        <button @click="handleConfirmExit" class="back-btn">
          <span>✕</span>
        </button>
        <div class="header-center">
          <div class="game-title">掼蛋</div>
          <div class="round-info">第 {{ gameRound }} 局</div>
        </div>
        <div class="control-btns">
          <button @click="toggleVoice" class="control-btn" :class="{ off: !voiceEnabled }" title="语音播报">
            <span>{{ voiceEnabled ? '🔊' : '🔇' }}</span>
          </button>
          <button @click="toggleMusic" class="control-btn" :class="{ off: !musicEnabled }" title="背景音乐">
            <span>{{ musicEnabled ? '🎵' : '🎶' }}</span>
          </button>
          <button @click="toggleSound" class="control-btn" :class="{ off: !soundEnabled }" title="音效">
            <span>{{ soundEnabled ? '🔈' : '🔇' }}</span>
          </button>
        </div>
      </div>

      <div class="game-table">
        <div class="table-felt"></div>

        <!-- 上方玩家 -->
        <div class="player-position top">
          <div class="player-panel" :class="{ active: currentSeat === 2 && currentSeat }">
            <div class="player-avatar">
              <div class="avatar-circle" :class="getTeamClass(2)">
                {{ getPlayerName(2).charAt(0) }}
              </div>
              <div v-if="currentSeat === 2" class="active-indicator"></div>
            </div>
            <div class="player-info">
              <div class="player-name">{{ getPlayerName(2) }}</div>
              <div class="player-cards-count">{{ hands[2].length }} 张</div>
            </div>
            <div class="played-area">
              <div v-for="(card, idx) in playAreaCards(2)" :key="idx" class="table-card mini"
                   :class="isRedCard(card) ? 'red' : 'black'">
                <svg class="card-svg" viewBox="0 0 169.075 244.64">
                  <use :href="cardToSvgId(card)" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- 左右玩家 -->
        <div class="middle-section">
          <div class="player-position left">
            <div class="player-panel vertical" :class="{ active: currentSeat === 1 }">
              <div class="player-avatar">
                <div class="avatar-circle small" :class="getTeamClass(1)">
                  {{ getPlayerName(1).charAt(0) }}
                </div>
                <div v-if="currentSeat === 1" class="active-indicator"></div>
              </div>
              <div class="player-info">
                <div class="player-name">{{ getPlayerName(1) }}</div>
                <div class="player-cards-count">{{ hands[1].length }} 张</div>
              </div>
              <div class="played-area vertical">
                <div v-for="(card, idx) in playAreaCards(1)" :key="idx" class="table-card mini rotated"
                     :class="isRedCard(card) ? 'red' : 'black'">
                  <svg class="card-svg" viewBox="0 0 169.075 244.64">
                    <use :href="cardToSvgId(card)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div class="center-area">
            <div class="table-center">
              <div v-if="lastActionCards && lastActionCards.length > 0"
                   class="current-play">
                <div class="play-label">{{ lastActionType }}</div>
                <div class="played-cards">
                  <div v-for="(card, idx) in lastActionCards" :key="idx" class="table-card"
                       :class="isRedCard(card) ? 'red' : 'black'">
                    <svg class="card-svg" viewBox="0 0 169.075 244.64">
                      <use :href="cardToSvgId(card)" />
                    </svg>
                  </div>
                </div>
                <div class="play-source">{{ getPlayerName(lastActionSeat) }} 出牌</div>
              </div>
              <div v-else class="waiting-play">
                <div class="card-back">🃏</div>
                <div class="waiting-text">等待出牌</div>
              </div>
            </div>

            <div class="turn-indicator">
              <div class="turn-text" :class="{ myturn: isMyTurn }">
                {{ statusMessage }}
              </div>
            </div>
          </div>

          <div class="player-position right">
            <div class="player-panel vertical" :class="{ active: currentSeat === 3 }">
              <div class="player-avatar">
                <div class="avatar-circle small" :class="getTeamClass(3)">
                  {{ getPlayerName(3).charAt(0) }}
                </div>
                <div v-if="currentSeat === 3" class="active-indicator"></div>
              </div>
              <div class="player-info">
                <div class="player-name">{{ getPlayerName(3) }}</div>
                <div class="player-cards-count">{{ hands[3].length }} 张</div>
              </div>
              <div class="played-area vertical">
                <div v-for="(card, idx) in playAreaCards(3)" :key="idx" class="table-card mini rotated-rev"
                     :class="isRedCard(card) ? 'red' : 'black'">
                  <svg class="card-svg" viewBox="0 0 169.075 244.64">
                    <use :href="cardToSvgId(card)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 下方玩家(我) -->
        <div class="player-position bottom">
          <div class="player-panel me" :class="{ active: isMyTurn }">
            <div class="player-avatar">
              <div class="avatar-circle me">
                {{ playerName.charAt(0) }}
              </div>
              <div v-if="isMyTurn" class="active-indicator"></div>
            </div>
            <div class="player-info">
              <div class="player-name">{{ playerName }} <span class="me-tag">(我)</span></div>
              <div class="player-cards-count">{{ myHand.length }} 张</div>
            </div>
            <div class="played-area">
              <div v-for="(card, idx) in playAreaCards(mySeat)" :key="idx" class="table-card mini"
                   :class="isRedCard(card) ? 'red' : 'black'">
                <svg class="card-svg" viewBox="0 0 169.075 244.64">
                  <use :href="cardToSvgId(card)" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 手牌区域 -->
      <div class="hand-section">
        <div class="hand-cards" ref="handCardsRef">
          <div
            v-for="(card, idx) in myHand"
            :key="card + '-' + idx"
            @click="toggleCardSelection(card, idx)"
            class="hand-card"
            :class="[
              isRedCard(card) ? 'red' : 'black',
              selectedCardKeys.includes(card + '-' + idx) ? 'selected' : '',
              isMyTurn ? 'playable' : ''
            ]"
            :style="{ animationDelay: idx * 30 + 'ms' }"
          >
            <svg class="card-svg" viewBox="0 0 169.075 244.64">
              <use :href="cardToSvgId(card)" />
            </svg>
          </div>
        </div>

        <div class="action-bar">
          <button @click="handleClearSelection" class="action-btn secondary"
                  :disabled="!isMyTurn || selectedCards.length === 0">
            <span class="btn-icon">🗑️</span>
            <span>清除</span>
          </button>
          <button @click="handleSelectHint" class="action-btn secondary"
                  :disabled="!isMyTurn">
            <span class="btn-icon">💡</span>
            <span>提示</span>
          </button>
          <button @click="handlePass" class="action-btn danger"
                  :disabled="!canPass">
            <span class="btn-icon">⏭️</span>
            <span>不要</span>
          </button>
          <button @click="handlePlay" class="action-btn primary"
                  :disabled="!canPlay">
            <span class="btn-icon">🎯</span>
            <span>出牌</span>
            <span v-if="selectedCards.length > 0" class="card-count">{{ selectedCards.length }}</span>
          </button>
        </div>

        <div v-if="hintMessage" class="hint-toast" :class="hintType">
          {{ hintMessage }}
        </div>
      </div>
    </div>

    <!-- 游戏结束弹窗 -->
    <div v-if="gamePhase === 'gameover'" class="modal-overlay">
      <div class="result-modal">
        <div class="result-icon">{{ isWinner ? '🏆' : '😢' }}</div>
        <h2 class="result-title" :class="isWinner ? 'win' : 'lose'">
          {{ isWinner ? '恭喜获胜！' : '很遗憾失败' }}</h2>
        <p class="result-subtitle">{{ winTypeText }}</p>

        <div class="ranking-board">
          <div class="ranking-title">本局排名</div>
          <div class="ranking-list">
            <div v-for="(seat, idx) in finishOrder" :key="seat"
                 class="ranking-item" :class="'rank-' + (idx + 1)">
              <div class="rank-badge">{{ idx + 1 }}</div>
              <div class="rank-name">{{ getPlayerName(seat) }}</div>
              <div class="rank-tag">{{ seat === mySeat ? '我' : '' }}</div>
            </div>
          </div>
        </div>

        <div v-if="tributeText" class="tribute-info">
          <div class="tribute-title">🎴 下一局</div>
          <div class="tribute-text">{{ tributeText }}</div>
        </div>

        <div class="level-info">
          <span>当前级别：</span>
          <span class="level-num">{{ currentRankDisplay }}</span>
        </div>

        <div class="modal-actions">
          <button @click="handleGoHome" class="modal-btn secondary">
            返回首页
          </button>
          <button @click="handleStartGame" class="modal-btn primary">
            再来一局
          </button>
        </div>
      </div>
    </div>

    <!-- 退出确认 -->
    <div v-if="showExitConfirm" class="modal-overlay" @click.self="showExitConfirm = false">
      <div class="confirm-modal">
        <h3 class="confirm-title">确认退出？</h3>
        <p class="confirm-text">游戏进度将不会保存</p>
        <div class="confirm-actions">
          <button @click="showExitConfirm = false" class="modal-btn secondary">继续游戏</button>
          <button @click="handleForceExit" class="modal-btn danger">退出</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, nextTick } from 'vue';
import {
  GameState, identifyPattern, compareActions, getLegalActions, aiChooseAction, resetAI, initializeAI,
  getCardSuit as getSuit, getCardRank, PATTERN_NAMES, DIFFICULTY_CONFIG,
} from './utils/guandanEngine.js';

// SVG 扑克牌配置
const SVG_CARDS_PATH = '/cards/svg-cards/svg-cards.svg';
const SVG_CARD_VIEWBOX = '0 0 169.075 244.64';

// 花色映射（我们的格式 -> SVG格式）
const suitMap = { '♠': 'spade', '♥': 'heart', '♦': 'diamond', '♣': 'club' };
const rankMap = { 'A': '1', 'K': 'king', 'Q': 'queen', 'J': 'jack', 'T': '10' };

// 将我们的卡牌格式转换为 SVG ID (参考 clawguandan 的 SVG-cards 精灵图)
function cardToSvgId(card) {
  if (!card) return null;
  // 王牌
  if (card === 'HR') return '/cards/svg-cards/svg-cards.svg#joker_red';
  if (card === 'SB' || card === 'HB') return '/cards/svg-cards/svg-cards.svg#joker_black';
  // 普通牌: suit=S/H/C/D, rank=2..9,T,J,Q,K,A
  const suitLetter = getSuit(card);
  const rank = getCardRank(card);
  const suitLetterToName = { S: 'spade', H: 'heart', C: 'club', D: 'diamond' };
  const rankToSvg = { A: '1', T: '10', J: 'jack', Q: 'queen', K: 'king' };
  const svgSuit = suitLetterToName[suitLetter];
  const svgRank = rankToSvg[rank] || rank;
  if (svgSuit && svgRank) {
    return `/cards/svg-cards/svg-cards.svg#${svgSuit}_${svgRank}`;
  }
  return null;
}

// 获取卡牌显示内容
function getCardDisplay(card) {
  if (!card) return '';
  if (card === 'SB' || card === 'HB') return '🃏';
  if (card === 'HR') return '🃏';
  const rank = getCardRank(card);
  const displayMap = { 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A' };
  return displayMap[rank] || rank;
}

// 获取花色符号
function getSuitSymbol(card) {
  if (!card) return '';
  if (card === 'HR' || card === 'HB' || card === 'SB') return '';
  const suit = getSuit(card);
  const suitMap = { 'S': '♠', 'H': '♥', 'C': '♣', 'D': '♦' };
  return suitMap[suit] || '';
}

// 判断是否为红牌
function isRedCard(card) {
  if (!card) return false;
  if (card === 'HR') return true;
  const suit = getSuit(card);
  return suit === 'H' || suit === 'D';
}

const gameState = new GameState();
window.gameState = gameState; // 调试用
const gamePhase = ref('idle');
const playerName = ref('玩家');
const selectedSeat = ref(0);
const selectedDifficulty = ref('medium');
const mySeat = ref(0);
const selectedCards = ref([]);
const selectedCardKeys = ref([]);
const hintMessage = ref('');
const hintType = ref('info');
const isProcessingAI = ref(false);
const showExitConfirm = ref(false);
const handCardsRef = ref(null);
const soundEnabled = ref(true);
const musicEnabled = ref(true);
const voiceEnabled = ref(true);
const soundInitialized = ref(false);
let audioCtx = null;
let bgmOscillators = [];
let bgmGain = null;
let bgmInterval = null;

// 响应式镜像状态，让 Vue 能追踪 GameState 的变化
const uiState = reactive({
  hands: [[], [], [], []],
  currentSeat: 0,
  gameRound: 1,
  finishOrder: [],
  lastAction: null,
  lastActionSeat: -1,
  phase: 'idle',
  playArea: [null, null, null, null],
  messages: [],
  currentRank: '2',
  teamRanks: [2, 2, 2, 2]
});

function syncUIState() {
  uiState.hands = gameState.hands.map(h => [...h]);
  uiState.currentSeat = gameState.currentSeat;
  uiState.gameRound = gameState.gameRound;
  uiState.finishOrder = [...gameState.finishOrder];
  uiState.lastAction = gameState.lastAction;
  uiState.lastActionSeat = gameState.lastActionSeat;
  uiState.phase = gameState.phase;
  uiState.playArea = [...gameState.playArea];
  uiState.messages = [...(gameState.messages || [])];
  uiState.currentRank = gameState.currentRank;
  uiState.teamRanks = [...(gameState.teamRanks || [])];
}

// 暴露到window用于调试
function exposeForDebug() {
  window.gameState = gameState;
  window.gamePhase = gamePhase;
  window.mySeat = mySeat;
  window.currentSeat = computed(() => uiState.currentSeat);
  window.hands = computed(() => uiState.hands);
  window.finishOrder = computed(() => uiState.finishOrder);
  window.teamRanks = computed(() => gameState.teamRanks);
  window.currentRank = computed(() => gameState.currentRank);
}

// 初始化时暴露
exposeForDebug();

// 初始化 AI
initializeAI();

const playerNames = ['小明', '小红', '小强', '小刚'];

const difficultyOptions = {
  easy: { name: '简单', icon: '😊', ...DIFFICULTY_CONFIG.easy },
  medium: { name: '中等', icon: '😐', ...DIFFICULTY_CONFIG.medium },
  hard: { name: '困难', icon: '😠', ...DIFFICULTY_CONFIG.hard },
  expert: { name: '专家', icon: '👑', ...DIFFICULTY_CONFIG.expert },
};

function initAudio() {
  if (soundInitialized.value) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.resume) audioCtx.resume();
    soundInitialized.value = true;
  } catch (e) {
    soundInitialized.value = false;
  }
}

function playSound(type = 'click') {
  if (!soundEnabled.value) return;
  initAudio();
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    if (type === 'click') {
      playTone(800, 0.1, 0.08, 'sine', now);
    } else if (type === 'play') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'select') {
      playTone(523, 0.12, 0.1, 'triangle', now);
    } else if (type === 'pass') {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'win') {
      const notes = [523, 659, 784, 1047];
      notes.forEach((freq, idx) => playTone(freq, 0.2, 0.12, 'sine', now + idx * 0.12));
    } else if (type === 'lose') {
      const notes = [392, 330, 262];
      notes.forEach((freq, idx) => playTone(freq, 0.25, 0.1, 'sine', now + idx * 0.15));
    } else if (type === 'error') {
      playTone(200, 0.15, 0.08, 'square', now);
    } else if (type === 'bomb') {
      playTone(150, 0.3, 0.15, 'sawtooth', now);
      setTimeout(() => playTone(100, 0.2, 0.1, 'square', audioCtx.currentTime), 150);
    } else if (type === 'shuffle') {
      for (let i = 0; i < 8; i++) {
        playTone(200 + i * 100, 0.08, 0.06, 'sine', now + i * 0.05);
      }
    } else if (type === 'deal') {
      for (let i = 0; i < 5; i++) {
        playTone(440 + i * 50, 0.1, 0.06, 'triangle', now + i * 0.08);
      }
    } else if (type === 'round') {
      const notes = [440, 554, 659, 880];
      notes.forEach((freq, idx) => playTone(freq, 0.15, 0.1, 'sine', now + idx * 0.1));
    }
  } catch (e) { /* 忽略 */ }
}

function playTone(freq, duration, volume, type = 'sine', startTime = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

const bgmMelody = [
  // 经典欢乐斗地主风格 - 轻快节奏
  [523, 587, 659, 523, 659, 587, 523],
  [659, 698, 784, 659, 784, 698, 659],
  [784, 880, 988, 784, 988, 880, 784],
  [659, 698, 784, 659, 587, 523, 494],
  [523, 659, 784, 659, 523, 587, 659],
  [784, 880, 784, 659, 523, 494, 523]
];

function startBGM() {
  if (!musicEnabled.value || !soundEnabled.value) return;
  initAudio();
  if (!audioCtx) return;
  
  stopBGM();
  
  bgmGain = audioCtx.createGain();
  bgmGain.gain.setValueAtTime(0.03, audioCtx.currentTime);
  bgmGain.connect(audioCtx.destination);
  
  let noteIdx = 0;
  let barIdx = 0;
  
  bgmInterval = setInterval(() => {
    if (!musicEnabled.value || !audioCtx) return;
    
    const bar = bgmMelody[barIdx];
    const freq = bar[noteIdx];
    const osc = audioCtx.createOscillator();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(bgmGain);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.35);
    
    noteIdx++;
    if (noteIdx >= bar.length) {
      noteIdx = 0;
      barIdx = (barIdx + 1) % bgmMelody.length;
    }
  }, 350);
}

function stopBGM() {
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  bgmOscillators.forEach(osc => {
    try { osc.stop(); } catch (e) {}
  });
  bgmOscillators = [];
}

function toggleSound() {
  soundEnabled.value = !soundEnabled.value;
  if (soundEnabled.value) {
    initAudio();
    playSound('click');
    if (musicEnabled.value) startBGM();
  } else {
    stopBGM();
  }
}

function toggleMusic() {
  musicEnabled.value = !musicEnabled.value;
  if (musicEnabled.value && soundEnabled.value) {
    startBGM();
    playSound('click');
  } else {
    stopBGM();
  }
}

function toggleVoice() {
  voiceEnabled.value = !voiceEnabled.value;
  playSound('click');
}

function speak(text, rate = 0.9, emotion = 'normal') {
  if (!voiceEnabled.value || !soundEnabled.value) return;
  if (!('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  
  // 根据情感调整语音参数 - 更丰富的情感表达
  const emotionSettings = {
    normal: { pitch: 1.0, volume: 0.8, rate: 0.95 },
    happy: { pitch: 1.15, volume: 0.85, rate: 1.0 },       // 开心：轻快活泼
    excited: { pitch: 1.25, volume: 0.9, rate: 1.05 },     // 激动：高亢快速
    calm: { pitch: 0.92, volume: 0.7, rate: 0.88 },        // 平静：舒缓低沉
    serious: { pitch: 0.88, volume: 0.75, rate: 0.9 },     // 严肃：稳重有力
    surprised: { pitch: 1.35, volume: 0.85, rate: 1.1 },   // 惊讶：高音急促
    sad: { pitch: 0.85, volume: 0.65, rate: 0.82 },        // 失落：低沉缓慢
    confident: { pitch: 1.05, volume: 0.8, rate: 0.95 },   // 自信：稳重清晰
    playful: { pitch: 1.18, volume: 0.75, rate: 1.02 },    // 俏皮：轻快跳跃
  };
  
  const settings = emotionSettings[emotion] || emotionSettings.normal;
  
  // 添加随机微调，避免机械感
  const pitchVariation = 1 + (Math.random() - 0.5) * 0.06;  // ±3% 音调变化
  const rateVariation = 1 + (Math.random() - 0.5) * 0.08;   // ±4% 语速变化
  
  utterance.pitch = settings.pitch * pitchVariation;
  utterance.volume = settings.volume;
  utterance.rate = rate * settings.rate * rateVariation;
  
  // 选择最佳中文语音 - 优先选择更自然的在线语音
  const voices = window.speechSynthesis.getVoices();
  
  // 按优先级排序的语音选择器（更自然的语音优先）
  const preferredVoices = [
    // 微软在线语音（最自然）
    v => v.lang.startsWith('zh') && v.name.includes('Microsoft') && v.name.includes('Online'),
    v => v.lang.startsWith('zh') && v.name.includes('Xiaoxiao'),      // 微软晓晓
    v => v.lang.startsWith('zh') && v.name.includes('Yaoyao'),        // 微软瑶瑶
    v => v.lang.startsWith('zh') && v.name.includes('Kangkang'),      // 微软康康
    // 谷歌语音
    v => v.lang.startsWith('zh') && v.name.includes('Google'),
    // 其他高质量语音
    v => v.lang.startsWith('zh') && v.name.includes('Female'),
    v => v.lang.startsWith('zh') && v.name.includes('女'),
    v => v.lang.startsWith('zh') && v.name.includes('Male'),
    v => v.lang.startsWith('zh') && v.name.includes('男'),
    // 最后选择任何中文语音
    v => v.lang.startsWith('zh'),
  ];
  
  for (const matcher of preferredVoices) {
    const voice = voices.find(matcher);
    if (voice) {
      utterance.voice = voice;
      break;
    }
  }
  
  // 添加语音事件监听，增强情感表达
  utterance.onstart = () => {
    // 语音开始时的视觉反馈（可选）
  };
  
  window.speechSynthesis.speak(utterance);
}

function announcePlay(seat, patternName) {
  const name = getPlayerName(seat);
  const isMyPlay = seat === selectedSeat.value;
  
  // 更丰富的语音播报，带有情感变化
  if (patternName === 'PASS') {
    // 不要 - 平静或略带无奈
    const phrases = [`${name}，不要`, `${name}过`, `${name}说不要`];
    speak(phrases[Math.floor(Math.random() * phrases.length)], 0.95, 'calm');
  } else if (patternName === 'Bomb') {
    // 炸弹 - 激动兴奋
    const phrases = [
      `哇！炸弹！${name}出炸弹！`,
      `厉害！${name}扔了个炸弹！`,
      `轰！${name}的炸弹来了！`
    ];
    speak(phrases[Math.floor(Math.random() * phrases.length)], 1.0, 'excited');
  } else if (patternName === 'FourKings') {
    // 天王炸 - 极度兴奋
    const phrases = ['太厉害了！天王炸！', '哇塞！天王炸！', '无敌了！天王炸！'];
    speak(phrases[Math.floor(Math.random() * phrases.length)], 1.0, 'surprised');
  } else if (patternName === 'StraightFlush') {
    // 同花顺 - 惊喜
    const phrases = ['漂亮！同花顺！', `${name}的同花顺！太美了！`, '精彩！同花顺！'];
    speak(phrases[Math.floor(Math.random() * phrases.length)], 0.95, 'happy');
  } else if (patternName === 'Straight') {
    // 顺子 - 自信
    speak(`${name}出顺子`, 0.9, 'confident');
  } else if (patternName === 'TwoTrips') {
    // 连对 - 自信
    speak(`${name}出连对`, 0.9, 'confident');
  } else if (patternName === 'Plate') {
    // 钢板 - 自信
    speak(`${name}出钢板`, 0.9, 'confident');
  } else if (patternName === 'FullHouse') {
    // 三带二 - 俏皮
    speak(`${name}出三带二`, 0.92, 'playful');
  } else if (patternName === 'Trips') {
    // 三条 - 正常
    speak(`${name}出三条`, 0.9, 'normal');
  } else if (patternName === 'Pair') {
    // 对子 - 正常
    speak(`${name}出对子`, 0.9, 'normal');
  } else if (patternName === 'Single') {
    // 单张 - 正常，偶尔俏皮
    const emotion = Math.random() > 0.8 ? 'playful' : 'normal';
    speak(`${name}出单张`, 0.9, emotion);
  } else {
    speak(`${name}出牌`, 0.9, 'normal');
  }
}

function announceGameStart() {
  // 游戏开始 - 欢快期待
  const phrases = [
    '掼蛋游戏开始！祝你好运！',
    '准备好了吗？掼蛋开始！',
    '来吧！掼蛋大战开始！'
  ];
  speak(phrases[Math.floor(Math.random() * phrases.length)], 0.88, 'happy');
}

function announceGameOver(isWin) {
  if (isWin) {
    // 获胜 - 极度兴奋
    const phrases = [
      '恭喜你获胜！太棒了！',
      '赢了！你太厉害了！',
      '漂亮！完美获胜！'
    ];
    speak(phrases[Math.floor(Math.random() * phrases.length)], 0.95, 'excited');
  } else {
    // 失败 - 温柔鼓励
    const phrases = [
      '游戏结束，再接再厉！',
      '没关系，下次一定行！',
      '继续加油，你可以的！'
    ];
    speak(phrases[Math.floor(Math.random() * phrases.length)], 0.9, 'calm');
  }
}

const hands = computed(() => uiState.hands);
const currentSeat = computed(() => uiState.currentSeat);
const gameRound = computed(() => uiState.gameRound);
const finishOrder = computed(() => uiState.finishOrder);

const lastActionCards = computed(() => {
  if (!uiState.lastAction || uiState.lastAction.type === 'PASS') return [];
  return uiState.lastAction.cards || [];
});

const lastActionType = computed(() => {
  if (!uiState.lastAction || uiState.lastAction.type === 'PASS') return '';
  return PATTERN_NAMES[uiState.lastAction.type] || uiState.lastAction.type || '';
});

const lastActionSeat = computed(() => uiState.lastActionSeat);

const myHand = computed(() => hands.value[mySeat.value] || []);

const isMyTurn = computed(() => {
  return gamePhase.value === 'play' && currentSeat.value === mySeat.value;
});

const canPass = computed(() => {
  if (!isMyTurn.value) return false;
  return !!uiState.lastAction && uiState.lastAction.type !== 'PASS';
});

const canPlay = computed(() => {
  return isMyTurn.value && selectedCards.value.length > 0;
});

const statusMessage = computed(() => {
  if (gamePhase.value === 'gameover') return '游戏结束';
  if (currentSeat.value === mySeat.value) return '→ 轮到你出牌';
  return `${getPlayerName(currentSeat.value)} 出牌中...`;
});

const isWinner = computed(() => {
  return finishOrder.value.length > 0 && finishOrder.value[0] % 2 === mySeat.value % 2;
});

const currentRankDisplay = computed(() => {
  const rankMap = { '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A' };
  return rankMap[uiState.currentRank] || uiState.currentRank;
});

const tributeText = computed(() => {
  if (finishOrder.value.length < 4) return '';
  const first = finishOrder.value[0];
  const second = finishOrder.value[1];
  const third = finishOrder.value[2];
  const fourth = finishOrder.value[3];
  const firstTeam = first % 2;
  const secondTeam = second % 2;

  if (firstTeam === secondTeam) {
    // 双上：双贡，进贡方两人都要进贡
    return `${getPlayerName(third)}、${getPlayerName(fourth)} 进贡给 ${getPlayerName(first)}、${getPlayerName(second)}，升级3级`;
  } else if ((first + 2) % 4 === third) {
    // 单贡：只有末游进贡
    return `${getPlayerName(fourth)} 进贡给 ${getPlayerName(first)}，升级2级`;
  } else {
    // 平牌：末游进贡
    return `${getPlayerName(fourth)} 进贡给 ${getPlayerName(first)}，升级1级`;
  }
});

const winTypeText = computed(() => {
  if (finishOrder.value.length < 4) return '';
  const firstPlace = finishOrder.value[0];
  const firstTeam = firstPlace % 2;
  const secondPlace = finishOrder.value[1];
  const secondTeam = secondPlace % 2;
  let result = '';
  if (firstTeam === secondTeam) {
    result = '双上胜利！';
  } else if ((firstPlace + 2) % 4 === finishOrder.value[2]) {
    result = '单贡胜利';
  } else {
    result = '平牌';
  }
  return firstTeam === mySeat.value % 2 ? `我方获胜 - ${result}` : `对方获胜 - ${result}`;
});

function playAreaCards(seat) {
  const area = uiState.playArea[seat];
  return area ? (area.cards || []) : [];
}

function getSeatLabel(seat) {
  return seat % 2 === 0 ? '红队' : '蓝队';
}

function getPlayerName(seat) {
  if (seat === mySeat.value) return playerName.value || '我';
  // 其他玩家根据座位号分配名字
  const aiNames = ['小明', '小红', '小强', '小刚'];
  // 给每个非我座位分配一个不重复的名字
  let nameIndex = 0;
  for (let i = 0; i < 4; i++) {
    if (i === mySeat.value) continue;
    if (i === seat) return aiNames[nameIndex];
    nameIndex++;
  }
  return aiNames[seat % 4];
}

// 获取卡牌完整显示（牌值 + 花色符号）
function getCardFullDisplay(card) {
  if (!card) return '';
  // 大王小王
  if (card === 'HR') return { rank: '大', suit: '', isJoker: true, isRed: true };
  if (card === 'SB' || card === 'HB') return { rank: '小', suit: '', isJoker: true, isRed: false };

  const rank = getCardRank(card);
  const suit = getSuit(card);
  const displayMap = { 'T': '10', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A' };
  const rankDisplay = displayMap[rank] || rank;

  return {
    rank: rankDisplay,
    suit: suit || '',
    isJoker: false,
    isRed: suit === '♥' || suit === '♦'
  };
}

function getCardColorClass(card) {
  if (!card) return 'black';
  // 大王小王
  if (card === 'HR') return 'red joker red-joker';
  if (card === 'SB' || card === 'HB') return 'black joker black-joker';
  const suit = getSuit(card);
  return (suit === 'H' || suit === 'D') ? 'red' : 'black';
}

function getPatternName(type) {
  return PATTERN_NAMES[type] || type;
}

function getTeamClass(seat) {
  return seat % 2 === 0 ? 'team-red' : 'team-blue';
}

function forceUpdateHands() {
  // 触发响应式更新
  const temp = [...hands.value];
}

function handleStartGame() {
  if (!playerName.value.trim()) return;
  playSound('shuffle');
  gameState.startNewGame(selectedDifficulty.value);
  mySeat.value = selectedSeat.value;
  gamePhase.value = 'play';
  selectedCards.value = [];
  hintMessage.value = '';
  syncUIState();
  startBGM();
  setTimeout(() => {
    playSound('deal');
    announceGameStart();
  }, 500);
  nextTick(() => {
    setTimeout(triggerAIPlay, 1000);
  });
}

function handleGoHome() {
  playSound('click');
  stopBGM();
  window.speechSynthesis.cancel();
  gamePhase.value = 'idle';
  selectedCards.value = [];
  hintMessage.value = '';
}

function handleConfirmExit() {
  playSound('click');
  showExitConfirm.value = true;
}

function handleForceExit() {
  playSound('click');
  showExitConfirm.value = false;
  handleGoHome();
}

function toggleCardSelection(card, cardIndex) {
  if (!isMyTurn.value) return;
  // 使用索引来唯一标识牌，避免重复牌的问题
  const key = `${card}-${cardIndex}`;
  const idx = selectedCardKeys.value.indexOf(key);
  if (idx > -1) {
    selectedCardKeys.value.splice(idx, 1);
    selectedCards.value.splice(idx, 1);
  } else {
    selectedCardKeys.value.push(key);
    selectedCards.value.push(card);
  }
  playSound('select');
  hintMessage.value = '';
}

function handleClearSelection() {
  if (selectedCards.value.length > 0) {
    playSound('click');
  }
  selectedCards.value = [];
  selectedCardKeys.value = [];
  hintMessage.value = '';
}

function handleSelectHint() {
  if (!isMyTurn.value) return;
  playSound('click');
  const actions = getLegalActions(myHand.value, gameState.lastAction, gameState.currentRank);
  const validActions = actions.filter(a => a.type !== 'PASS');
  if (validActions.length === 0) {
    hintMessage.value = '没有能压过上家的牌，请选择不要';
    hintType.value = 'error';
    playSound('error');
    return;
  }

  const lastAction = gameState.lastAction;
  const lastType = lastAction?.type;
  const isFreePlay = !lastAction || lastType === 'PASS';
  let action = null;

  if (isFreePlay) {
    // 首攻/自由出 - 找最小单张
    const singles = validActions.filter(a => a.type === 'Single').sort((a, b) => a.rank - b.rank);
    if (singles.length > 0) {
      action = singles.find(s => s.rank < 13) || singles[0];
    } else {
      const pairs = validActions.filter(a => a.type === 'Pair').sort((a, b) => a.rank - b.rank);
      if (pairs.length > 0) action = pairs[0];
      else {
        const nonBomb = validActions.filter(a => a.type !== 'Bomb' && a.type !== 'FourKings' && a.type !== 'StraightFlush');
        action = nonBomb.length > 0 ? nonBomb[0] : validActions[0];
      }
    }
  } else {
    // 有上家出牌 - 优先同类型
    const sameType = validActions.filter(a => a.type === lastType).sort((a, b) => a.rank - b.rank);
    for (const a of sameType) {
      if (compareActions(a, lastAction)) { action = a; break; }
    }
    // 尝试最小炸弹
    if (!action) {
      const bombs = validActions.filter(a => a.type === 'Bomb').sort((a, b) => {
        if (a.size !== b.size) return a.size - b.size;
        return a.rank - b.rank;
      });
      for (const b of bombs) {
        if (compareActions(b, lastAction)) { action = b; break; }
      }
    }
    // 尝试同花顺
    if (!action) {
      const sf = validActions.find(a => a.type === 'StraightFlush');
      if (sf && compareActions(sf, lastAction)) action = sf;
    }
  }

  if (action) {
    selectedCards.value = [...action.cards];
    // 计算对应的 keys
    selectedCardKeys.value = [];
    const hand = myHand.value;
    const usedIndices = new Set();
    for (const card of action.cards) {
      for (let i = 0; i < hand.length; i++) {
        if (hand[i] === card && !usedIndices.has(i)) {
          selectedCardKeys.value.push(`${card}-${i}`);
          usedIndices.add(i);
          break;
        }
      }
    }
    hintMessage.value = `推荐: ${getPatternName(action.type)}`;
    hintType.value = 'info';
  } else {
    hintMessage.value = '没有能压过上家的牌，请选择不要';
    hintType.value = 'error';
    playSound('error');
  }
}

function handlePlay() {
  if (!isMyTurn.value || selectedCards.value.length === 0) return;
  const pattern = identifyPattern(selectedCards.value, gameState.currentRank);
  if (!pattern) {
    hintMessage.value = '请选择有效的牌型';
    hintType.value = 'error';
    playSound('error');
    return;
  }
  if (gameState.lastAction && gameState.lastAction.type !== 'PASS') {
    if (!compareActions(pattern, gameState.lastAction)) {
      hintMessage.value = `无法压过当前的 ${getPatternName(gameState.lastAction.type)}`;
      hintType.value = 'error';
      playSound('error');
      return;
    }
  }
  const success = gameState.playCards(mySeat.value, [...selectedCards.value]);
  if (success) {
    if (pattern.type === 'Bomb') playSound('bomb');
    else if (pattern.type === 'FourKings') playSound('bomb');
    else if (pattern.type === 'StraightFlush') playSound('bomb');
    else playSound('play');
    announcePlay(mySeat.value, getPatternName(pattern.type));
    selectedCards.value = [];
    selectedCardKeys.value = [];
    hintMessage.value = '';
    syncUIState();
    // 进贡/还贡阶段也视为游戏结束（结算）
    if (gameState.phase === 'gameover' || gameState.phase === 'tribute') {
      gamePhase.value = 'gameover';
      stopBGM();
      playSound(isWinner.value ? 'win' : 'lose');
      announceGameOver(isWinner.value);
      return;
    }
    nextTick(() => {
      setTimeout(triggerAIPlay, 600);
    });
  }
}

function handlePass() {
  if (!isMyTurn.value) return;
  if (!gameState.lastAction || gameState.lastAction.type === 'PASS') {
    hintMessage.value = '你是首攻，必须出牌';
    hintType.value = 'error';
    playSound('error');
    return;
  }
  gameState.pass(mySeat.value);
  playSound('pass');
  selectedCards.value = [];
  hintMessage.value = '';
  syncUIState();
  nextTick(() => {
    setTimeout(triggerAIPlay, 500);
  });
}

function triggerAIPlay() {
  // 调试日志
  console.log('[AI] triggerAIPlay called', {
    gamePhase: gamePhase.value,
    currentSeat: currentSeat.value,
    mySeat: mySeat.value,
    isProcessingAI: isProcessingAI.value,
    handsLength: gameState.hands.map(h => h.length)
  });
  
  if (gamePhase.value !== 'play') {
    console.log('[AI] Skipped: gamePhase !== play');
    return;
  }
  if (currentSeat.value === mySeat.value) {
    console.log('[AI] Skipped: currentSeat === mySeat (player turn)');
    return;
  }
  if (isProcessingAI.value) {
    console.log('[AI] Skipped: isProcessingAI is true (already processing)');
    return;
  }
  
  isProcessingAI.value = true;
  const aiSeat = currentSeat.value;
  const hand = gameState.hands[aiSeat];
  
  console.log('[AI] Processing seat:', aiSeat, 'hand length:', hand?.length);
  
  if (!hand || hand.length === 0) {
    console.log('[AI] AI has no cards, skipping');
    isProcessingAI.value = false;
    syncUIState();
    return;
  }
  
  const delay = 300 + Math.random() * 300;
  setTimeout(() => {
    console.log('[AI] Executing AI play for seat:', aiSeat);
    
    if (gamePhase.value !== 'play') {
      console.log('[AI] Cancelled: gamePhase changed');
      isProcessingAI.value = false;
      return;
    }
    
    if (currentSeat.value !== aiSeat) {
      console.log('[AI] Cancelled: currentSeat changed from', aiSeat, 'to', currentSeat.value);
      isProcessingAI.value = false;
      return;
    }
    
    const isFirst = !gameState.lastAction || gameState.lastAction.type === 'PASS';
    const action = aiChooseAction(
      hand,
      gameState.lastAction,
      gameState.currentRank,
      isFirst,
      aiSeat,
      gameState.lastActionSeat,
      gameState.hands.map(h => h.length),
      selectedDifficulty.value
    );
    
    console.log('[AI] Chosen action:', action?.type, action?.cards);
    
    let patternName = 'PASS';
    if (action && action.type !== 'PASS') {
      gameState.playCards(aiSeat, action.cards);
      patternName = getPatternName(action.type);
      if (action.type === 'Bomb' || action.type === 'FourKings' || action.type === 'StraightFlush') {
        playSound('bomb');
      } else {
        playSound('play');
      }
    } else {
      gameState.pass(aiSeat);
      playSound('pass');
    }
    
    announcePlay(aiSeat, patternName);
    syncUIState();
    isProcessingAI.value = false;
    
    console.log('[AI] After play:', {
      phase: gameState.phase,
      currentSeat: gameState.currentSeat,
      handsLength: gameState.hands.map(h => h.length),
      isMyTurn: currentSeat.value === mySeat.value
    });
    
    // 进贡/还贡阶段也视为游戏结束（结算）
    if (gameState.phase === 'gameover' || gameState.phase === 'tribute') {
      gamePhase.value = 'gameover';
      stopBGM();
      playSound(isWinner.value ? 'win' : 'lose');
      announceGameOver(isWinner.value);
      return;
    }
    
    // 继续下一个AI
    console.log('[AI] Scheduling next AI');
    nextTick(() => {
      setTimeout(triggerAIPlay, 300);
    });
  }, delay);
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.game-wrapper {
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
    "Microsoft YaHei", "Hiragino Sans GB", "WenQuanYi Micro Hei", sans-serif;
  overscroll-behavior: none;
}

.home-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 1rem;
  position: relative;
  overflow: hidden;
}

.hero-section {
  position: relative;
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 0;
}

.floating-cards {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  font-size: 2.5rem;
  opacity: 0.3;
}

.floating-cards.left { left: -2rem; }
.floating-cards.right { right: -2rem; }

.float-card {
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(5deg); }
}

.logo-badge {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.hero-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.title-icon {
  font-size: 4rem;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.title-text {
  font-size: 4rem;
  font-weight: 800;
  background: linear-gradient(135deg, #fbbf24, #f59e0b, #ea580c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  margin-top: 0.5rem;
}

.form-section {
  width: 100%;
  max-width: 400px;
  margin-bottom: 2rem;
}

.input-group, .seat-section {
  margin-bottom: 1.5rem;
}

.input-label {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.styled-input {
  width: 100%;
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  color: white;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.styled-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

.styled-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.seat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.seat-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.seat-btn.active {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-color: #3b82f6;
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.seat-number {
  font-size: 1.5rem;
  font-weight: 700;
}

.seat-label {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

.start-btn {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #6b7280, #4b5563);
  border: none;
  border-radius: 1.5rem;
  color: white;
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.start-btn.ready {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  box-shadow: 0 8px 20px rgba(34, 197, 94, 0.4);
}

.start-btn.ready:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(34, 197, 94, 0.5);
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% { left: -100%; }
  50%, 100% { left: 100%; }
}

.rules-section {
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 1.5rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.rules-title {
  color: #fbbf24;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1rem;
  text-align: center;
}

.rules-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rule-icon {
  font-size: 1.5rem;
}

.rule-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.game-screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.control-btns {
  display: flex;
  gap: 0.5rem;
}

.control-btn {
  width: 2.25rem;
  height: 2.25rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.control-btn.off {
  opacity: 0.4;
}

.header-center {
  text-align: center;
}

.game-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: white;
}

.round-info {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.game-table {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1rem;
  min-height: 0;
}

.table-felt {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(34, 197, 94, 0.1) 0%, transparent 70%);
  pointer-events: none;
}

.player-position {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
}

.player-position.top, .player-position.bottom {
  width: 100%;
}

.player-position.left {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.player-position.right {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.middle-section {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 2;
}

.center-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.table-center {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1.5rem;
  padding: 1.5rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.current-play {
  text-align: center;
}

.play-label {
  color: #fbbf24;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.played-cards {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.play-source {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.75rem;
}

.waiting-play {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}

.card-back {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.waiting-text {
  font-size: 0.875rem;
}

.turn-indicator {
  margin-top: 1rem;
}

.turn-text {
  padding: 0.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2rem;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.3s;
}

.turn-text.myturn {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
  animation: pulse-glow 2s infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 4px 20px rgba(34, 197, 94, 0.6); }
}

.player-panel {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.player-panel.vertical {
  flex-direction: column;
  padding: 0.75rem;
}

.player-panel.active {
  border-color: #fbbf24;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
  transform: scale(1.05);
}

.player-avatar {
  position: relative;
}

.avatar-circle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.25rem;
  color: white;
}

.avatar-circle.small {
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1rem;
}

.avatar-circle.me {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.team-red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.team-blue {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.active-indicator {
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  width: 0.75rem;
  height: 0.75rem;
  background: #fbbf24;
  border-radius: 50%;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: 600;
  color: white;
  font-size: 0.875rem;
}

.me-tag {
  color: #22c55e;
  font-size: 0.75rem;
}

.player-cards-count {
  color: #fbbf24;
  font-size: 0.875rem;
  font-weight: 700;
}

.played-area {
  display: flex;
  gap: 0.25rem;
  min-width: 60px;
  flex-wrap: wrap;
}

.played-area.vertical {
  flex-direction: column;
  min-width: auto;
}

.table-card {
  width: 48px;
  height: 68px;
  background: transparent;
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
  position: relative;
  overflow: hidden;
}

.table-card.mini {
  width: 34px;
  height: 48px;
}

.table-card.rotated {
  transform: rotate(90deg);
}

.table-card.rotated-rev {
  transform: rotate(-90deg);
}

.hand-section {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
}

.hand-cards {
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  overflow-x: auto;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  min-height: 110px;
  max-height: 120px;
}

.hand-cards::-webkit-scrollbar {
  display: none;
}

.hand-card {
  /* 真实扑克牌尺寸比例 2.5:3.5 */
  width: 62px;
  height: 88px;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35);
  flex-shrink: 0;
  animation: card-enter 0.3s ease-out backwards;
  position: relative;
  overflow: hidden;
}

.hand-card.playable:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
}

.hand-card.selected {
  transform: translateY(-16px);
  box-shadow:
    0 12px 24px rgba(251, 191, 36, 0.55),
    0 0 0 3px #fbbf24;
}

.card-svg {
  width: 100%;
  height: 100%;
  display: block;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.card-value.bottom {
  align-self: flex-end;
  transform: rotate(180deg);
}

.card-suit {
  font-size: 1.25rem;
  text-align: center;
  line-height: 1;
}

.action-bar {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.25rem;
  border: none;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.action-btn.secondary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.action-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.action-btn.danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.action-btn.primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
  min-width: 120px;
}

.action-btn.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.btn-icon {
  font-size: 1.25rem;
}

.card-count {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  background: #fbbf24;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #1f2937;
}

.hint-toast {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  animation: slide-up 0.3s ease;
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hint-toast.info {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.hint-toast.error {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-modal, .confirm-modal {
  background: linear-gradient(135deg, #1f2937, #111827);
  border-radius: 2rem;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: scale-in 0.3s ease;
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.result-icon {
  text-align: center;
  font-size: 5rem;
  margin-bottom: 1rem;
}

.result-title {
  text-align: center;
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.result-title.win { color: #fbbf24; }
.result-title.lose { color: #9ca3af; }

.result-subtitle {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}

.ranking-board {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.ranking-title {
  text-align: center;
  color: #fbbf24;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
}

.rank-badge {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.ranking-item.rank-1 .rank-badge { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #1f2937; }
.ranking-item.rank-2 .rank-badge { background: linear-gradient(135deg, #9ca3af, #6b7280); color: white; }
.ranking-item.rank-3 .rank-badge { background: linear-gradient(135deg, #d97706, #b45309); color: white; }
.ranking-item.rank-4 .rank-badge { background: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.5); }

.rank-name {
  flex: 1;
  color: white;
  font-weight: 500;
}

.rank-tag {
  color: #22c55e;
  font-size: 0.75rem;
  font-weight: 600;
}

.tribute-info {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.tribute-title {
  color: #60a5fa;
  font-size: 0.875rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 0.5rem;
}

.tribute-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  line-height: 1.5;
  text-align: center;
}

.level-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.level-num {
  color: #fbbf24;
  font-weight: 700;
  font-size: 1rem;
}

.modal-actions, .confirm-actions {
  display: flex;
  gap: 1rem;
}

.modal-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 1rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-btn.secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.modal-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-btn.primary {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.modal-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
}

.modal-btn.danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
}

.modal-btn.danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.confirm-title {
  text-align: center;
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.confirm-text {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
}
</style>
