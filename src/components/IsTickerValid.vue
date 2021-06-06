<template>
  <div v-if="invalidTicker" class="text-sm text-red-600">
    Такой тикер уже добавлен
  </div>
</template>
<script>
export default {
  props: {
    invalidTicker: {
      type: Boolean,
    },
  },
};
</script>
