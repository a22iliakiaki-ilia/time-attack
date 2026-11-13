<script setup lang="ts">
type Target = {
  key: string
  targetMs: number
}

withDefaults(
  defineProps<{
    targets: Target[]
    pressedKeys?: string[]
    disabled?: boolean
  }>(),
  {
    pressedKeys: () => [],
    disabled: false,
  },
)

const emit = defineEmits<{
  press: [key: string]
}>()
</script>

<template>
  <div class="keypad">
    <button
      v-for="target in targets"
      :key="target.key"
      :disabled="disabled || pressedKeys.includes(target.key)"
      @click="emit('press', target.key)"
    >
      {{ target.key }}
    </button>
  </div>
</template>

<style scoped>
.keypad {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
}

button {
  min-width: 72px;
  padding: 0.75rem 1rem;
  font-size: 1.25rem;
}
</style>
