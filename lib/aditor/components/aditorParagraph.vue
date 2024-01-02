<template>
  <div :selstart="selStart" :seloffsetcor="selOffsetCor"><slot></slot><br :selstart="selStart" v-if="aNode.children.length == 1 && aNode.children[0].length() == 0" /></div>
</template>
  
<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { AditorChildNode } from '@lib/aditor/nodes.ts';
import { AditorDocView } from '@lib/aditor/index'


export default defineComponent({
  name: 'aditorParagraph',
  props: {
    aNode: {
      type: Object as PropType<AditorChildNode>,
      required: true,
    },
    docView: {
      type: Object as PropType<AditorDocView>,
      required: true,
    }
  },
  setup(props) {
    const selStart = computed(() => {
      if(props.aNode.children.length > 0){
        if(props.aNode.children[0].length() == 0){
          return props.aNode.children[0].start
        }
      }
      return props.aNode.start
    })

    const selOffsetCor = computed(()=>{
      if(props.aNode.children.length > 0){
        if(props.aNode.children[0].length() == 0){
          return 3
        }
      }
      return 0
    })

    return {
      selStart,
      selOffsetCor
    }
  },

  aditorConfig: {
    class: AditorChildNode
  }
})
</script>

<style scoped></style>