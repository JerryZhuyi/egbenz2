<template>
  <div ref="aditorRef" contenteditable="true">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent,ref, onMounted, PropType} from 'vue'
import { AditorChildNode, AditorLeafNode } from '@lib/aditor/nodes.ts';
import { AditorDocState } from '@lib/aditor/index'

export default defineComponent({
  name: 'aditor',
  props: {
    aNode:{
      type: Object as PropType<AditorChildNode | AditorLeafNode>,
      required: true,
    },
    state:{
      type: Object as PropType<AditorDocState>,
      required: true,
    }
  },
  setup(props) {
    const aditorRef = ref()
    onMounted(() => {
      props.state.docView.bindDocSysEvent(aditorRef.value);
      props.state.docView.bindGlobalSysEvent(aditorRef.value);
    })

    return {
      aditorRef,
    }
  }
})
</script>
