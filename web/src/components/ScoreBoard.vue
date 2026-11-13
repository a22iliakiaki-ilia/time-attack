<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const store = useGameStore()

const scoreboardRows = computed(() => {
  const leaderboardRows = [...(store.leaderboard ?? [])]
    .map((entry) => ({
      id: `${entry.nickname}-${entry.totalErrorMs}`,
      nom: entry.nickname,
      errorTotal: Number(entry.totalErrorMs ?? 0),
    }))
    .sort((a, b) => a.errorTotal - b.errorTotal)

  if (leaderboardRows.length > 0) return leaderboardRows

  return [...store.partidesOrdenades]
    .map((partida) => ({
      id: partida.id,
      nom: partida.nom,
      errorTotal: partida.errorTotal,
    }))
    .sort((a, b) => a.errorTotal - b.errorTotal)
})
</script>

<template>
  <section class="scoreboard">
    <h2>Scoreboard</h2>
    <button @click="store.esborrarPartides()">Esborrar Partides</button>
    <table>
      <thead>
        <tr>
          <th>Pos.</th>
          <th>Jugador</th>
          <th>Error total</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(row, index) in scoreboardRows" :key="row.id ?? `${row.nom}-${index}`">
          <td>{{ index + 1 }}</td>
          <td>{{ row.nom }}</td>
          <td>{{ row.errorTotal.toFixed(0) }} ms</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.scoreboard {
  display: grid;
  gap: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border: 1px solid #d0d7de;
  padding: 0.5rem 0.75rem;
  text-align: left;
}
</style>