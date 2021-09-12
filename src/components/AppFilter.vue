<template>
  <section>
    <div>
      Фильтр:
      <input v-model="filter" />
      <p>
        <app-pagination
          @next-page="handleNextPage"
          @prev-page="handlePrevPage"
          :filteredTickers="filteredTickers"
        />
      </p>
    </div>
  </section>
</template>
<script>
import AppPagination from "./AppPagination.vue";
export default {
  components: { AppPagination },
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
    this.sendPaginatedTickers();
  },
  methods: {
    handleNextPage(page) {
      this.page = page;
      this.sendPaginatedTickers();
    },
    handlePrevPage(page) {
      this.page = page;
      this.sendPaginatedTickers();
    },
    sendPaginatedTickers() {
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
      this.sendPaginatedTickers();
    },
    paginatedTickers() {
      if (this.paginatedTickers.length === 0 && this.page > 1) {
        this.page -= 1;
        this.sendPaginatedTickers();
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
