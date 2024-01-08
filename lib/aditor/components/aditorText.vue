<template>
  <span :style="aNode.validStyle()" :seloffsetcor="selOffsetCor">{{ aNode.data.text ? aNode.data.text:"&#8203;" }}</span>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue'
import { AditorLeafNode } from '../nodes';
class AditorTextNode extends AditorLeafNode {
  constructor(name: string, style:{}, data:{}) {
    super(name, style, data)
  }
}

export default defineComponent({
  name: 'aditorText',
  props:{
    aNode:{
      type: Object as PropType<AditorLeafNode>,
      required: true,
    },
    docView:{
      type: Object,
      required: true,
    }
  },
  setup(props) {

    const selOffsetCor = computed(()=>{
      if(props.aNode.length() == 0){
        return 1
      }
      return 0
    })

    return {
      selOffsetCor    
    }
  },
  aditorConfig:{
    class: AditorTextNode
  }
})
</script>