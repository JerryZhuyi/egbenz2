<template>
  <span>{{ aNode.data.text }}</span>
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
  }}
})
</script>