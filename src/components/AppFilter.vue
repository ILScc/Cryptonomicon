<template>
  <section>
    <div>
      Фильтр:
      <input v-model="filter" />
      <p>
        <button
          v-if="page > 1"
          @click="handlePrevPage"
          class="mx-4 my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Назад
        </button>
        <button
          v-if="hasNextPage"
          @click="handleNextPage"
          class="mx-4 my-4 inline-flex items-center py-2 px-4 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-full text-white bg-gray-600 hover:bg-gray-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Вперед
        </button>
      </p>
    </div>
  </section>
</template>
<script>
export default {
  data() {
    return {
      filter: "",
      page: 1,
    };
  },
  props: {
    tickers: {
      type: Array,
      required: true,
    },
  },
  emits: {
    "paginated-tickers": (value) => typeof value === "object",
  },
  mounted() {
    this.$emit("paginated-tickers", this.paginatedTickers);
  },
  methods: {
    handleNextPage() {
      this.page = this.page + 1;
      this.$emit("paginated-tickers", this.paginatedTickers);
    },
    handlePrevPage() {
      this.page = this.page - 1;
      this.$emit("paginated-tickers", this.paginatedTickers);
    },
  },
  computed: {
    startIndex() {
      return (this.page - 1) * 6;
    },
    endIndex() {
      return this.page * 6;
    },
    filteredTickers() {
      return this.tickers.filter((ticker) =>
        ticker.name?.toLowerCase().includes(this.filter.toLowerCase())
      );
    },
    paginatedTickers() {
      return this.filteredTickers.slice(this.startIndex, this.endIndex);
    },

    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },
    pageStateOptions() {
      return {
        filter: this.filter,
        page: this.page,
      };
    },
  },
  watch: {
    filter() {
      this.page = 1;
    },
    filteredTickers() {
      this.$emit("paginated-tickers", this.paginatedTickers);
    },
    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
        this.$emit("paginated-tickers", this.paginatedTickers);
      }
    },
    pageStateOptions(value) {
      window.history.pushState(
        null,
        document.title,
        `${window.location.pathname}?filter=${value.filter}&page=${value.page}`
      );
    },
  },
};
</script>
