<template v-if="tickers.length">
  <dl class="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
    <div
      v-for="(ticker, idx) in tickersToShow"
      :key="idx"
      @click="select(ticker)"
      :class="{
        'border-2  border-purple-800': selectedTicker === ticker,
        'border-2 border-red-800': !ticker.price,
      }"
      class="
        bg-white
        overflow-hidden
        shadow
        rounded-lg
        border-solid
        cursor-pointer
        h-40
      "
    >
      <div class="px-4 py-5 sm:p-6 text-center">
        <dt class="text-sm font-medium text-gray-500 truncate">
          {{ ticker.name }} - USD
        </dt>
        <dd class="mt-1 text-3xl font-semibold text-gray-900">
          {{ formatPrice(ticker.price) }}
        </dd>
      </div>
      <div class="w-full border-t border-gray-200"></div>
      <delete-ticker
        @delete-ticker="$emit('delete-ticker', ticker)"
        :ticker="ticker"
      />
    </div>
  </dl>
</template>
<script>
import DeleteTicker from "./DeleteTicker.vue";
export default {
  components: {
    DeleteTicker,
  },
  data() {
    return {
      invalidTickers: [],
    };
  },

  props: {
    tickersToShow: {
      type: Array,
      required: true,
    },
    selectedTicker: {
      type: Object,
      required: false,
    },
  },

  methods: {
    select(ticker) {
      this.$emit("select-ticker", ticker);
    },
    formatPrice(price) {
      if (price === "-" || !price) {
        return "-";
      }

      return price > 1 ? price.toFixed(2) : price.toPrecision(2);
    },
  },
};
</script>
