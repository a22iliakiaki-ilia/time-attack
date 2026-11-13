
<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import KeyPad from '@/components/KeyPad.vue'
import RoundResults from '@/components/RoundResults.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'
import { useGameStore } from '@/stores/game'
import { socket } from '@/services/socket'

const store = useGameStore()

type Target = {
  key: string
  targetMs: number
}

type Attempt = {
  key: string
  elapsed: number
  diff: number
}

const targets: Target[] = [
  { key: 'A', targetMs: 2000 },
  { key: 'S', targetMs: 4000 },
  { key: 'D', targetMs: 5000 },
  { key: 'F', targetMs: 7000 },
]

const usernameInput = ref(store.username || '')
const joinError = ref('')
const phase = ref<'ready' | 'playing' | 'results'>('ready')
const startedAt = ref(0)
const attempts = ref<Attempt[]>([])
const roundSaved = ref(false)
const roomConnected = computed(() => store.connected)
let rafId: number | null = null

const pressedKeys = computed(() => attempts.value.map((attempt) => attempt.key))

function finishRound() {
  if (phase.value === 'results' && roundSaved.value) return

  phase.value = 'results'

  if (!roundSaved.value && attempts.value.length > 0) {
    const totalError = attempts.value.reduce((sum, attempt) => sum + attempt.diff, 0)
    store.guardarPartida([...attempts.value])
    socket.emit('score:submit', {
      nickname: usernameInput.value.trim() || store.nomJugador,
      totalErrorMs: totalError,
      attempts: attempts.value,
    }, (ack: { ok?: boolean; error?: string }) => {
      if (!ack?.ok) {
        joinError.value = ack?.error ?? 'No s’ha pogut guardar el resultat.'
      }
    })
    roundSaved.value = true
  }

  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
}

function joinRoom() {
  const username = usernameInput.value.trim()

  if (!username) {
    joinError.value = 'Necesites un nom per jugar.'
    return
  }

  store.setUsername(username)
  usernameInput.value = username
  joinError.value = ''
  phase.value = 'ready'
}

function leaveRoom() {
  joinError.value = ''
  store.reiniciarSala()
  phase.value = 'ready'
  attempts.value = []
  roundSaved.value = false
}

function playAgain() {
  startRound()
}

function startRound() {
  if (!socket.connected) {
    joinError.value = 'La connexió al servidor encara no està preparada.'
    return
  }

  startedAt.value = performance.now()
  attempts.value = []
  roundSaved.value = false
  phase.value = 'playing'

  if (rafId !== null) cancelAnimationFrame(rafId)

  const tick = () => {
    if (phase.value !== 'playing') return

    if (performance.now() - startedAt.value >= 9000) {
      finishRound()
      return
    }

    rafId = requestAnimationFrame(tick)
  }

  rafId = requestAnimationFrame(tick)
}

function stopRound() {
  if (phase.value !== 'playing') return
  finishRound()
}

function rebreClassificacio(dades: any) {
  store.actualitzarClassificacio(dades)
}

function handleKeyPress(key: string) {
  if (phase.value !== 'playing') return

  const target = targets.find((item) => item.key === key)
  if (!target) return

  const alreadyPressed = attempts.value.some((attempt) => attempt.key === key)
  if (alreadyPressed) return

  joinError.value = ''
  const elapsed = performance.now() - startedAt.value
  const diff = Math.abs(elapsed - target.targetMs)
  attempts.value.push({ key, elapsed, diff })

  if (attempts.value.length === targets.length) {
    finishRound()
  }
}

function connectat() {
  store.setConnected(true)
}

function desconnectat() {
  store.setConnected(false)
}

onMounted(() => {
  socket.on('connect', connectat)
  socket.on('disconnect', desconnectat)
  socket.on('leaderboard:state', (entries) => {
    store.applyLeaderboard(entries)
  })
  socket.on('classificacio', rebreClassificacio)
  socket.connect()
})

onUnmounted(() => {
  socket.off('connect', connectat)
  socket.off('disconnect', desconnectat)
  socket.off('leaderboard:state')
  socket.off('classificacio', rebreClassificacio)
  socket.disconnect()
})
</script>

<template>
  <main class="gameboard-view">
    <section class="panel">
      <div class="header-row">
        <div>
          <p class="eyebrow">TIME ATTACK</p>
        </div>
      </div>

      <div class="player-form">
        <label>
          <span>Username</span>
          <input v-model="usernameInput" placeholder="Write your name" maxlength="18" />
        </label>

        <div class="actions">
          <button class="primary" @click="joinRoom">Save name</button>
        </div>
      </div>

      <p v-if="joinError" class="error">{{ joinError }}</p>

      <div class="room-card">
        <div class="controls">
          <div>
            <p class="label">Player</p>
            <strong>{{ store.nomJugador || usernameInput.trim() || 'Anonymous' }}</strong>
          </div>
        </div>

        <div class="controls actions">
          <button v-if="phase !== 'playing'" class="primary" @click="playAgain">
            {{ phase === 'ready' ? 'Start round' : 'Play again' }}
          </button>
          <button v-else class="secondary" @click="stopRound">Stop round</button>
        </div>
      </div>

      <div class="game-shell">
        <KeyPad
          :targets="targets"
          :pressedKeys="pressedKeys"
          :disabled="phase !== 'playing'"
          @press="handleKeyPress"
        />

        <div v-if="phase === 'results'" class="results-box">
          <RoundResults :attempts="attempts" />
          <ScoreBoard />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.gameboard-view {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: #f5f7fb;
  color: #1f2937;
}

.panel {
  width: min(760px, 100%);
  background: #fff;
  border: 1px solid #dfe7f3;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
  padding: 1.5rem;
  display: grid;
  gap: 1rem;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  color: #64748b;
  text-transform: uppercase;
}

h1 {
  margin: 0.25rem 0 0;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
}

.connection-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 86px;
  padding: 0.5rem 0.75rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  font-weight: 700;
}

.connection-status.connected {
  background: #dcfce7;
  color: #166534;
}

.player-form {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
}

label {
  display: grid;
  gap: 0.45rem;
  font-weight: 600;
  color: #334155;
}

input {
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 0.8rem 0.9rem;
  font-size: 1rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

button {
  border: none;
  border-radius: 12px;
  padding: 0.8rem 1rem;
  font-weight: 700;
  cursor: pointer;
}

button.primary {
  background: #2563eb;
  color: #fff;
}

button.secondary {
  background: #e2e8f0;
  color: #0f172a;
}

.error {
  margin: 0;
  color: #b91c1c;
  font-weight: 600;
}

.room-card {
  display: grid;
  gap: 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1rem;
}

.controls {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.label {
  margin: 0 0 0.2rem;
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.game-shell {
  display: grid;
  gap: 1rem;
  justify-items: center;
}

.results-box {
  width: min(520px, 100%);
}
</style>
