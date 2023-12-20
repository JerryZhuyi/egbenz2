<template>
  <div :id="aid" class="aditor" ref="aditorRef" contenteditable="true">
    <slot></slot>
  </div>
</template>

<script lang="ts">
import { defineComponent,ref, onMounted, PropType} from 'vue'
import { AditorChildNode, AditorLeafNode } from '@lib/aditor/nodes.ts';
import { AditorDocView } from '@lib/aditor/index'

export default defineComponent({
  name: 'aditor',
  props: {
    aNode:{
      type: Object as PropType<AditorChildNode | AditorLeafNode>,
      required: true,
    },
    docView:{
      type: Object as PropType<AditorDocView>,
      required: true,
    }
  },
  setup(props) {
    const aditorRef = ref()
    const aid=props.aNode.virtualId
    onMounted(() => {
      props.docView.bindDocSysEvent(aditorRef.value);
      props.docView.bindGlobalSysEvent(aditorRef.value);
    })

    return {
      aditorRef,
      aid
    }
  }
})
</script>

<style scoped>
.aditor{
  /* 取消contentediable元素的边框 */
  outline: none;
  white-space: pre-wrap;
}
</style>
