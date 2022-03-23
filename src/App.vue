<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
</script>

<template lang="pug">
main
  RouterView
header
  nav
    //- RouterLink.logo(to="/")
    //-   h1 Crypto map
    //- RouterLink(to="/about") About
</template>

<style lang="stylus">
@import "@/assets/base.css";

body, #app, main, #map
    display flex
    flex 1

header
  position absolute
  top 0
  left 0
  display flex
  flex 1
  padding 1em
  background rgba(0, 0, 0, 0.5)
  nav
    display flex
    flex 1
    align-items center

    a
      margin-left 1em

main
  position

  #details
    position absolute
    top 0
    left 0
    max-width 50%
    height 100%
    overflow hidden
    background rgba(0, 0, 0, .9)
    flex 1

</style>
