<script setup lang="ts">
import MapView from "@/components/MapView.vue";
import LocationDetails from "@/components/LocationDetails.vue";
import { useSearchResults } from '@/stores/results'

// for debugging
const results = useSearchResults();
(window as any).cryptoMap = { results };
</script>

<template lang="pug">
.cryptoMap
  MapView.map
  LocationDetails.details
</template>

<style lang="stylus" scoped>

.cryptoMap
  position relative

  &, .map
    display flex
    flex 1

  .details
    position absolute
    top 0
    left 0
    max-width 50%
    height 100%
    overflow-y auto
    background rgba(0, 0, 0, .9)
    flex 1
</style>
