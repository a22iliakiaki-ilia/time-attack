<script setup lang="ts">
type Attempt = {
  key: string
  elapsed: number
  diff: number
}

const props = defineProps<{
  attempts: Attempt[]
}>()

const totalDiff = props.attempts.reduce((sum, attempt) => sum + attempt.diff, 0)
const score = Math.max(0, Math.round(10000 - totalDiff))
</script>

<template>
  <section class="round-results">
    <h2>Results</h2>
    <p>Score: {{ score }}</p>
    <ul>
      <li v-for="attempt in attempts" :key="attempt.key">
        {{ attempt.key }}: {{ attempt.elapsed.toFixed(0) }} ms (diff {{ attempt.diff.toFixed(0) }} ms)
      </li>
    </ul>
  </section>
</template>

<style scoped>
.round-results {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 1rem;
  text-align: left;
}

ul {
  margin: 0.75rem 0 0;
  padding-left: 1.25rem;
}
</style>
