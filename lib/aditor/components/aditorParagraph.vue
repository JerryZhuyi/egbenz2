<template>
  <div><slot></slot><br v-if="aNode.children.length==1 && aNode.children[0].text == ''" /></div>
</template>
  
<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'aditorParagraph',
  props: {
    aNode:{
      type: Object,
      required: true,
    },
    docView:{
      type: Object,
      required: true,
    }
  },
})
</script>