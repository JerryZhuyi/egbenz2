<template>
  <span>{{ aNode.data.text ? aNode.data.text:"&#8203;" }}</span>
</template>

<script>
import { defineComponent } from 'vue'
import { AditorLeafNode } from '../nodes';

export default defineComponent({
  name: 'aditorText',
  props:{
    aNode:{
      type: AditorLeafNode,
      required: true,
    },
    docView:{
      type: Object,
      required: true,
    }
  },
  aditorConfig:{
    type:"leaf",
  }
})
</script>