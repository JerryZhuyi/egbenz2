<template>
  <div><slot></slot><br v-if="aNode.children.length==1 && aNode.children[0].text == ''" /></div>
</template>
  
<script>
import { defineComponent } from 'vue'
import { AditorChildNode, AditorLeafNode } from '@lib/aditor/nodes.ts';

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
  aditorConfig:{
    class: AditorChildNode
  }
})
</script>