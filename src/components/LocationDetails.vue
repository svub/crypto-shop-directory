<script setup lang="ts">
import { useSearchResults } from '@/stores/results';
import { ref, watchEffect } from 'vue';
import { useCurrencySymbols } from '../composables/currencySymbols';
import _ from 'lodash';

const results = useSearchResults();
let place = ref(results.shown?.place);

const symbol = useCurrencySymbols();
const images = ref();
watchEffect(async () => {
  if (results.shown){
    const map = new Map<string, string>();
    for (const currency of results.shown.accepts) {
      const url = await symbol.image(currency);
      map.set(currency, url);
    }
    images.value = Object.fromEntries(map);
    console.log(images.value);
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
      img(:src="images[currency]" :title="`${currency} accepted here`")
  .contact.panel
    .address {{ place.formatted_address}}
    .phone(v-if="results.shown.phone") {{ results.shown.phone }}
    .website(v-if="results.shown.website") {{ results.shown.website }}
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
    align-items center

    .currency
      margin-right .5em

</style>
