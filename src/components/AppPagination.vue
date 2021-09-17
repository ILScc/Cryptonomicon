<template>
  <button
    v-if="page > 1"
    @click="handlePrevPage"
    class="
      mx-4
      my-4
      inline-flex
      items-center
      py-2
      px-4
      border border-transparent
      shadow-sm
      text-sm
      leading-4
      font-medium
      rounded-full
      text-white
      bg-gray-600
      hover:bg-gray-700
      transition-colors
      duration-300
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
    "
  >
    Назад
  </button>
  <button
    v-if="hasNextPage"
    @click="handleNextPage"
    class="
      mx-4
      my-4
      inline-flex
      items-center
      py-2
      px-4
      border border-transparent
      shadow-sm
      text-sm
      leading-4
      font-medium
      rounded-full
      text-white
      bg-gray-600
      hover:bg-gray-700
      transition-colors
      duration-300
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
    "
  >
    Вперед
  </button>
</template>
<script>
export default {
  data() {
    return {
      page: 1,
    };
  },
  methods: {
    handleNextPage() {
      this.page = this.page + 1;
      this.$emit("next-page", this.page);
    },
    handlePrevPage() {
      this.page = this.page - 1;
      this.$emit("prev-page", this.page);
    },
  },
  computed: {
    endIndex() {
      return this.page * 6;
    },
    hasNextPage() {
      return this.filteredTickers.length > this.endIndex;
    },
  },
  emits: {
    "next-page": (value) => typeof value === "number",
    "prev-page": (value) => typeof value === "number",
  },
  props: {
    filteredTickers: { type: Array, required: true },
  },
};
</script>
