<template>
  <div ref="aditorRef" contenteditable="true">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent,ref, onMounted, PropType} from 'vue'
import { AditorChildNode, AditorLeafNode } from '@lib/aditor/nodes.ts';

export default defineComponent({
  name: 'aditor',
  props: {
    aNode:{
      type: Object as PropType<AditorChildNode | AditorLeafNode>,
      required: true,
    }
  },
  setup(props) {
    const aditorRef = ref()
    onMounted(() => {
      props.aNode.state.docView.bindDocSysEvent(aditorRef.value);
      props.aNode.state.docView.bindGlobalSysEvent(aditorRef.value);
    })

    return {
      aditorRef,
    }
  }
})
</script>
