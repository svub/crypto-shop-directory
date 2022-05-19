<script setup lang="ts">
import { useSearchResults } from '@/stores/results';
import { ref, watchEffect } from 'vue';
import { useCurrencySymbols } from '../composables/currencySymbols';
import _ from 'lodash';

const results = useSearchResults();
let place = ref(results.shown?.place);

const symbol = useCurrencySymbols();
const images = ref(new Map<string, string>());
watchEffect(async () => { // load logos for each currency accepted by currently shown venue
  if (results.shown){
    results.shown.accepts.forEach(async currency => {
      const url = await symbol.image(currency);
      images.value.set(currency, url);
    });
  }
});

watchEffect(() => place.value = results.shown?.place);
</script>

<template lang="pug">
.details(v-if="results.shown && place")
  .x(@click="results.show()") 𝗫

  h1 {{ results.shown.label }}

  .rating.panel
    .star(v-for="star in [1,2,3,4,5]") {{ star <= place.rating ? '★' : '☆' }}
    .total ({{ place.user_ratings_total ?? 0 }})

  .description.panel(v-if="results.shown.description") {{ results.shown.description }}

  .accepted.panel
    .currency(v-for="currency in results.shown.accepts" :class="_.kebabCase(_.deburr(currency))")
      img(v-if="images.has(currency)" :src="images.get(currency)" :title="`${currency} accepted here`")

  .contact.panel
    .address {{ place.formatted_address}}
    .phone(v-if="results.shown.phone") {{ results.shown.phone }}
    .website(v-if="results.shown.website") {{ results.shown.website }}
    .googleMaps(v-if="place.url")
      a(:href="place.url" target="_blank") View on Google Maps

  .open.panel(v-if="place.opening_hours")
    .day(v-for="day in (place.opening_hours.weekday_text ?? [])") {{ day }}
</template>

<style lang="stylus" scoped>
space=1em

.details
  padding space

  .panel
    margin-bottom space

  .x
    text-align right
    cursor pointer

  .rating
    .star, .total
      display inline

  .total
    padding-left .25em

  .accepted
    background rgba(255,255,255,0.95)
    padding .5em
    display flex
    flex 1
    flex-direction row
    justify-content space-around

    .currency
      display flex
      margin-right .5em

</style>
