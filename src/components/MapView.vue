<template lang="pug">
#map
</template>

<script setup lang="ts">
import { onMounted, watch, warn, watchEffect } from 'vue';
import * as mb from 'mapbox-gl'
import _ from 'lodash'
import { useSearchResults } from '@/stores/results'

const API = 'https://shop-directory.zeromox.com/api';

type MapEntry = {
  marker: mb.Marker;
  listener: EventListener;
}

let latestRequest = '';
const markers = new Map<number, MapEntry>();

const props = defineProps(); // for later use

let map: mb.Map;
const results = useSearchResults();

function clicked(result: any, marker: mb.Marker) {
    console.info('click', result, marker.getElement());
    // results.show(result);
    results.shown = result;
}

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
  return await loadResults(bounds.getNorth(), bounds.getEast(), bounds.getSouth(), bounds.getWest());
}

async function loadResults(north: number, east: number, south: number, west: number) {
  // url.value = `${API}/search?filter[location]=${lat},${lng}&filter[radius]=${radius}`;
  // url.value = `${API}/search?filter[limit]=200`;
  const url = latestRequest = `${API}/search?filter[limit]=200&filter[bounding_box]=${west},${south},${east},${north}`;
  console.log('Loading fresh results from', url);
  const result = await fetch(url);
  if (url !== latestRequest) {
    console.info('Skipping results as request has been updated in the meantime.');
    return;
  }
  if (result.status !== 200) {
    console.warn (await result.text());
    throw new Error(`Failed to load results. Error ${result.status}.`)
  }

  const body = await result.json();
  const findLocation = (result: any) => (Object.values(result?.pickups)[0] as any)?.geo_location.coordinates;
  if (body.total < 1 || body.data?.length < 1) {
    console.info('No results.');
    return;
  }

  const loadedResults = body.data as Array<any>;
  const loadedIds = loadedResults.map(result => result.id);
  const oldIds = results.all.map(result => result.id);
  const toRemove = _.without(oldIds, ...loadedIds);
//   const toRemove = _.difference(oldIds, loadedIds);
  console.log('ids', oldIds, loadedIds);
  console.log('w/t', _.without(oldIds, ...loadedIds));
  console.log('diff', _.difference(oldIds, loadedIds));
  const keep = _.intersection(oldIds, loadedIds);
  const newIds = _.without(loadedIds, ...keep);

  // remove all markers from the map that are not among the results anymore
  toRemove.forEach(id => {
    const entry = markers.get(id);
    // if (!entry) throw new Error(`Map entry ${id} not found.`);
    if (!entry) return console.warn(`MapView.loadResults toRemove: Map entry ${id} not found.`); // can happen on vite dev mode after hot code update
    entry.marker.remove();
    entry.marker.getElement().removeEventListener('click', entry.listener);
    markers.delete(id);
  })

  // copy over all results that are already on the map
  const newResults = results.all.filter(result => keep.indexOf(result.id) >= 0);

  // add entries for remaing results markers for remaining new results
  results.all = newResults.concat(loadedResults
    .filter(result => newIds.indexOf(result.id) >= 0 && findLocation(result)));;

  // add markers for all entries that don't have one (could be new result, or all markers are gone after dev hot reload)
  // console.log(results.all.forEach(result => markers.get(result.id)?.marker.getElement()))
  results.all
    .filter(result => !markers.has(result.id) || !markers.get(result.id)?.marker.getElement().isConnected)
    .forEach(result => {
      try {
        const marker = new mb.Marker({ scale: .8, }).setLngLat(findLocation(result)).addTo(map);
        const listener = () => clicked(result, marker);
        marker.getElement().addEventListener('click', listener);
        markers.set(result.id, { marker, listener});
      }
      catch (e){
        return console.error(e, result);
      }
  })

//   console.log('first', markers.get(results.all[0].id)?.marker.getElement())
  console.log(`Now showing ${results.all.length} results. Got ${loadedIds.length} entries from API, had ${oldIds.length} markers before, removed ${toRemove.length} entries, kept ${keep.length}, added ${newIds.length}.`);
}

function highlightMarker(id: number, highlight = true) {
  const element = markers.get(id)?.marker.getElement();
  console.warn('highlight', id, highlight, element);
  element?.classList.toggle('highlight', highlight);
}

let previous: number | undefined;
results.$subscribe(() => {
  console.warn('sub', results.shown);
  if (previous) {
    highlightMarker(previous, false);
    previous = undefined;
  }
  if (results.shown) {
    highlightMarker(results.shown.id);
    previous = results.shown.id;
  }
});

// watchEffect(() => {
//   console.warn('effect', results.shown);
//   if (previous) highlightMarker(previous, false);
//   if (results.shown) highlightMarker(results.shown.id);
//   previous = results.shown.id;
// });

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
