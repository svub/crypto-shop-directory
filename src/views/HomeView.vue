<script setup lang="ts">
import MapView from "@/components/MapView.vue";
import { useSearchResults } from '@/stores/results'

const results = useSearchResults();
(window as any).rrr = results;
</script>

<template lang="pug">
MapView.map
#details
  //- pre(v-if="results.shown") {{ JSON.stringify(results.shown, undefined,  '  ') }}
  pre {{ JSON.stringify(results.shown, undefined,  '  ') }}
</template>
