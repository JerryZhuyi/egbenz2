<template>
  <div contenteditable="true">
    <slot></slot>
  </div>
</template>
  
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'aditor',
  props: {
    aNode:{
      type: Object,
      required: true,
    }
  },
})
</script>