<template lang="pug">
#map
</template>

<script setup lang="ts">
import { onMounted, watch, warn, watchEffect } from 'vue';
import * as mb from 'mapbox-gl'
import _ from 'lodash'
// import { useSearchResults, type Place } from '@/stores/results'
import { useSearchResults } from '@/stores/results'
import { useSearchApi, ExpiredRequest, DuplicatedRequest } from '../composables/searchApi';
import { useGooglePlaces } from '../composables/googlePlaces';

type MapEntry = {
  marker: mb.Marker;
  listener: EventListener;
}

const props = defineProps(); // for later use
const markers = new Map<number, MapEntry>();
const results = useSearchResults();
const searchApi = useSearchApi();
const googlePlaces = useGooglePlaces();
let map: mb.Map;

// When vue mounted add mapbox
onMounted(async () => {
  map = new mb.Map({
    accessToken: "pk.eyJ1Ijoic3Zlbi1uaW1pcSIsImEiOiJja3puOHdkaWk0dnIwMm9wcWM4bnZuZ2xhIn0.4lPscV4Ong3kJys9340Fkw",
    container: 'map',
    style: 'mapbox://styles/sven-nimiq/cl0tuu2ge000816mn3uwffool', // 'mapbox://styles/mapbox/dark-v10',
    center: { lat: 48.154645, lng: 14.007738 }, // starting position [lng, lat]
    zoom: 7, // starting zoom
    minZoom: 3,
    maxZoom: 15,
    attributionControl: false,
  });
  map.on('move', _.throttle(viewPortChanged, 250, { leading: false })); // also triggered when zooming
  map.addControl(new mb.FullscreenControl(), 'bottom-right'); //({ container: document.body, }));
  map.addControl(new mb.NavigationControl(), 'top-right');
  map.addControl(new mb.GeolocateControl({
    fitBoundsOptions: {
      maxZoom: 14,
      minZoom: 3,
    },
    showUserLocation: true,
    showUserHeading: true
  }));

  viewPortChanged();
})

async function viewPortChanged() {
  const bounds = map.getBounds();
  results.setBoundingBox (bounds.getNorth(), bounds.getEast(), bounds.getSouth(), bounds.getWest());
}

function pickupLocation(result: any) { return result?.pickups?.[0]?.place_information; }

async function loadResults(boundingBox: number[]) {
  const [north, east, south, west] = boundingBox;
  const loadedResults = await searchApi.search(boundingBox); // body.data as Array<any>;
  const loadedIds = loadedResults.map(result => result.id);
  const oldIds = results.all.map(result => result.id);
  const toRemove = _.without(oldIds, ...loadedIds);
  const keep = _.intersection(oldIds, loadedIds);
  const newIds = _.without(loadedIds, ...keep);

  // remove all markers from the map that are not among the results anymore
  toRemove.forEach(id => {
    const entry = markers.get(id);
    if (!entry) return console.warn(`MapView.loadResults toRemove: Map entry ${id} not found.`); // can happen on vite dev mode after hot code update
    entry.marker.remove();
    entry.marker.getElement().removeEventListener('click', entry.listener);
    markers.delete(id);
  })

  // copy over all results that are already on the map
  const keepResults = results.all.filter(result => keep.indexOf(result.id) >= 0);

  // convert and add remaining search results
  const newResults = loadedResults
    .filter(result => newIds.indexOf(result.id) >= 0 && !!pickupLocation(result))
    .map(result => {
      try {
        return {
          id: result.id,
          label: result.label,
          description: result.description,
          accepts: result.accepts,
          phone: result.phone,
          website: result.website,
          place: JSON.parse(pickupLocation(result))
        };
      } catch (e) {
        warn('Failed to parse', e, result);
        return result;
      }
    });
    // .filter(result => result.place.business_status !== "CLOSED_PERMANENTLY");

  results.all = [...keepResults, ...newResults];

  let permanentlyClosed = 0
  results.all.forEach(result => {
    if (result.place.business_status == "CLOSED_PERMANENTLY") {
      permanentlyClosed++;
      result.place.opening_hours = { weekday_text: ['permanently closed'] }; };
  });
  if (permanentlyClosed > 0) warn(`${permanentlyClosed} locations permanently closed`);

  // add markers for all entries that don't have one (could be new result, or all markers are gone after dev hot reload)
  results.all
    .filter(result => !markers.has(result.id) || !markers.get(result.id)?.marker.getElement().isConnected)
    .forEach(async (result) => {
      try {
        const marker = new mb.Marker({ scale: .8, }).setLngLat(result.place.geometry.location).addTo(map);
        const listener = () => results.shown = result;
        marker.getElement().addEventListener('click', listener);
        markers.set(result.id, { marker, listener});
      } catch (e){
        return console.error(e, result);
      }
  })

  console.log(`Now showing ${results.all.length} results. Got ${loadedIds.length} entries from API, had ${oldIds.length} markers before, removed ${toRemove.length} entries, kept ${keep.length}, added ${newIds.length}.`);
}

function highlightMarker(id: number, highlight = true) {
  const element = markers.get(id)?.marker.getElement();
  console.warn('highlight', id, highlight, element);
  element?.classList.toggle('highlight', highlight);
}

let previous: number | undefined;
watchEffect(async () => {
  if (previous) {
    highlightMarker(previous, false);
    previous = undefined;
  }
  if (results.shown) {
    // const placeId = pickupLocation(results.shown).place_id;
    highlightMarker(results.shown.id);
    previous = results.shown.id;
    // results.place = await loadGooglePlaceDetails(placeId);
  }
});

watchEffect(async () => {
  try {
    await loadResults(results.boundingBox);
  } catch(e) {
    if (e instanceof ExpiredRequest) return console.log('expired');
    if (e instanceof DuplicatedRequest) return console.log('duplicate');
    console.warn('Error occured loading results', e);
  }
});

</script>

<style lang="stylus">
#map
  .mapboxgl-control-container
    position initial
  .mapboxgl-marker
    cursor pointer
    background #0ca6fe
    --marker-width 14px
    width var(--marker-width)
    height var(--marker-width)
    border-radius var(--marker-width)
    box-shadow 1px 1px calc(var(--marker-width) / 5) rgba(0, 0, 0, .5)
    transition all .2s ease-out

    &.highlight
      background #d9b213
      --marker-width 20px

    svg
      display none

    // svg
    //   &, path
    //     transition all .2s ease-out

    //   path
    //     color #0ca6fe

    // &.highlight svg
    //   transform scale(1.333)

    //   path
    //     fill red

  .mapboxgl-ctrl-top-right .mapboxgl-ctrl // zoom and location button styling
    background rgba(255, 255, 255, .1)
    margin 14px 13px 0 0
    border-radius 24px

    button
      border none

      &.mapboxgl-ctrl-zoom-in .mapboxgl-ctrl-icon
        background-image url("data:image/svg+xml,%3Csvg width='14' height='14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M7 1v12M13 7H1' stroke='%23fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
      &.mapboxgl-ctrl-zoom-out .mapboxgl-ctrl-icon
        background-image url("data:image/svg+xml,%3Csvg width='14' height='2' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M13 1H1' stroke='%23fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
      &.mapboxgl-ctrl-geolocate .mapboxgl-ctrl-icon
        background-image url("data:image/svg+xml,%3Csvg width='18' height='18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M9 14.5A5.7 5.7 0 1 0 9 3a5.7 5.7 0 0 0 0 11.4ZM9 1v2.1M9 14.5v2M16.8 8.8h-2.1M3.3 8.8h-2' stroke='%23fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")

  .mapboxgl-ctrl-bottom-right .mapboxgl-ctrl // fullscreen button styling
    margin 0

    button
      background #0CA6FE
      width 44px
      height 44px

      &.mapboxgl-ctrl-fullscreen .mapboxgl-ctrl-icon
        // background-image url(icon-expand.svg)
        background-image url("data:image/svg+xml,%3Csvg width='20' height='18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6.2 15.7H2.8v-3.4M2.8 15.7l5.4-5.4M10.8 7.7l5.4-5.4M16.2 5.7V2.3h-3.4' stroke='%23fff' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
      &.mapboxgl-ctrl-shrink .mapboxgl-ctrl-icon
        background-image url(icon-shrink.svg) // TODO:

</style>
