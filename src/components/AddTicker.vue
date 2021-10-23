<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keydown.enter="add"
            type="text"
            name="wallet"
            id="wallet"
            class="
              block
              w-full
              pr-10
              border-gray-300
              text-gray-900
              focus:outline-none focus:ring-gray-500 focus:border-gray-500
              sm:text-sm
              rounded-md
            "
            placeholder="Например DOGE"
          />
        </div>
        <div
          v-if="suggestedTickers?.length"
          class="flex bg-white shadow-md p-1 rounded-md flex-wrap"
        >
          <span
            v-for="coinSymbol in suggestedTickers"
            @click="
              fillInput(coinSymbol);
              add();
            "
            :key="coinSymbol.index"
            class="
              inline-flex
              items-center
              px-2
              m-1
              rounded-md
              text-xs
              font-medium
              bg-gray-300
              text-gray-800
              cursor-pointer
            "
          >
            {{ coinSymbol }}
          </span>
        </div>
        <div v-if="invalidTicker" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <add-button @click="add" />
  </section>
</template>
<script>
import AddButton from "./AddButton.vue";
export default {
  emits: {
    "add-ticker": (value) => typeof value === "string",
  },
  props: {
    listOfCoinsSymbols: {
      type: Array,
      required: true,
    },
    invalidTicker: {
      type: Boolean,
      required: true,
    },
  },
  components: { AddButton },

  data() {
    return {
      ticker: "",
    };
  },

  methods: {
    fillInput(clickedTicker) {
      this.ticker = clickedTicker;
    },

    add() {
      if (!this.ticker) {
        return;
      }
      this.$emit("add-ticker", this.ticker);
      this.ticker = "";
    },
  },
  computed: {
    filteredCoinsSymbols() {
      return this.listOfCoinsSymbols.filter((coinSymbol) =>
        coinSymbol.includes(this.ticker)
      );
    },
    suggestedTickers() {
      if (!this.ticker) {
        return;
      }
      return this.filteredCoinsSymbols.slice(0, 4);
    },
  },
};
</script>
