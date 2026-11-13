import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type Attempt = {
  key: string
  elapsed: number
  diff: number
}

export type Partida = {
  id: number
  nom: string
  errorTotal: number
  attempts: Attempt[]
}

export type AttemptScore = Attempt & {
  jugador: string
  partidaId: number
}

export type RoomPlayer = {
  id: string
  nickname: string
  pressedKeys?: string[]
  attempts?: Array<{ key: string; targetMs: number; elapsedMs: number | null; errorMs: number }>
  totalErrorMs?: number
  completed?: number
}

export type LeaderboardEntry = {
  nickname: string
  totalErrorMs: number
  attempts?: Array<{ key: string; targetMs?: number; elapsedMs?: number | null; errorMs?: number }>
}

const STORAGE_KEY = 'gameboard-store'
const TOP_SCOREBOARD_LIMIT = 10

function readPersistedState() {
  try {
    if (typeof localStorage === 'undefined') {
      return { nomJugador: '', partides: [] as Partida[] }
    }

    const rawValue = localStorage.getItem(STORAGE_KEY)
    if (!rawValue) return { nomJugador: '', partides: [] as Partida[] }

    const parsedValue = JSON.parse(rawValue) as {
      nomJugador?: string
      partides?: Partida[]
    }

    return {
      nomJugador: typeof parsedValue.nomJugador === 'string' ? parsedValue.nomJugador : '',
      partides: Array.isArray(parsedValue.partides) ? parsedValue.partides : [],
    }
  } catch {
    return { nomJugador: '', partides: [] as Partida[] }
  }
}

function persistState(nomJugador: string, partides: Partida[]) {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        nomJugador,
        partides,
      }),
    )
  } catch {
    // ignore storage quota or privacy errors
  }
}

export const useGameStore = defineStore('game', () => {
  const storedState = readPersistedState()
  const nomJugador = ref(storedState.nomJugador)
  const partides = ref<Partida[]>(storedState.partides)
  const playerId = ref('')
  const roomCode = ref('')
  const phase = ref('lobby')
  const round = ref(0)
  const hostId = ref('')
  const targets = ref<any[]>([])
  const players = ref<RoomPlayer[]>([])
  const connected = ref(false)
  const classificacio = ref<any[]>([])
  const leaderboard = ref<LeaderboardEntry[]>([])

  const attemptsOrdenats = computed<AttemptScore[]>(() =>
    partides.value
      .flatMap((partida) =>
        partida.attempts.map((attempt) => ({
          ...attempt,
          jugador: partida.nom,
          partidaId: partida.id,
        })),
      )
      .sort((a, b) => a.diff - b.diff),
  )

  const partidesOrdenades = computed(() =>
    [...partides.value]
      .sort((a, b) => a.errorTotal - b.errorTotal)
      .slice(0, TOP_SCOREBOARD_LIMIT),
  )

  const username = computed({
    get: () => nomJugador.value,
    set: (value: string) => {
      const clean = value.trim()
      if (!clean) return
      nomJugador.value = clean
      persistState(nomJugador.value, partides.value)
    },
  })

  function setUsername(value: string) {
    username.value = value
  }

  function guardarNom(nom: string) {
    setUsername(nom)
  }

  function atualitzarClassificacio(dades: any[]) {
    classificacio.value = Array.isArray(dades) ? dades : []
  }

  function actualitzarClassificacio(dades: any[]) {
    atualitzarClassificacio(dades)
  }

  function esborrarPartides() {
    partides.value = []
    persistState(nomJugador.value, partides.value)
  }

  function guardarPartida(attempts: Attempt[]) {
    const errorTotal = attempts.reduce((sum, attempt) => sum + attempt.diff, 0)

    partides.value.push({
      id: partides.value.length + 1,
      nom: nomJugador.value || 'Anònim',
      errorTotal,
      attempts: [...attempts].sort((a, b) => a.diff - b.diff),
    })

    persistState(nomJugador.value, partides.value)
    return errorTotal
  }

  function applyRoomState(dades: any) {
    if (!dades) return
    roomCode.value = typeof dades.roomCode === 'string' ? dades.roomCode : roomCode.value
    phase.value = typeof dades.phase === 'string' ? dades.phase : phase.value
    round.value = typeof dades.round === 'number' ? dades.round : round.value
    hostId.value = typeof dades.hostId === 'string' ? dades.hostId : hostId.value
    targets.value = Array.isArray(dades.targets) ? dades.targets : targets.value
    players.value = Array.isArray(dades.players) ? dades.players : players.value
    if (typeof dades.playerId === 'string') {
      playerId.value = dades.playerId
    }
  }

  function actualitzarSala(dades: any) {
    applyRoomState(dades)
  }

  function setConnected(value: boolean) {
    connected.value = value
  }

  function applyLeaderboard(entries: LeaderboardEntry[]) {
    leaderboard.value = Array.isArray(entries)
      ? [...entries].sort((a, b) => a.totalErrorMs - b.totalErrorMs)
      : []
  }

  function reiniciarSala() {
    playerId.value = ''
    roomCode.value = ''
    phase.value = 'lobby'
    round.value = 0
    hostId.value = ''
    targets.value = []
    players.value = []
  }

  return {
    username,
    nomJugador,
    partides,
    playerId,
    roomCode,
    phase,
    round,
    hostId,
    targets,
    players,
    connected,
    classificacio,
    setUsername,
    guardarNom,
    guardarPartida,
    esborrarPartides,
    applyRoomState,
    actualitzarSala,
    actualitzarClassificacio,
    reiniciarSala,
    setConnected,
    applyLeaderboard,
    leaderboard,
    partidesOrdenades,
    attemptsOrdenats,
  }
})


