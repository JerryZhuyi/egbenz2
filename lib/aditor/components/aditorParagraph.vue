<template>
  <div><slot></slot></div>
</template>
  
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'aditorParagraph',
  props: {
    aNode:{
      type: Object,
      required: true,
    }
  },
})
</script>