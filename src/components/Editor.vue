<script setup lang="ts">
import { docStruct, renderAditorFromJSON, AditorDocView, SysEventsEnum } from '@lib/aditor'
import { onMounted } from 'vue';
import { PropType, watchEffect } from 'vue'
import EditorToolbar from './EditorToolbar.vue';
const props = defineProps({
  docJson: {
    type: Object as PropType<docStruct|undefined>,
    required: false
  },
  toolBar: {
    type: Object as PropType<typeof EditorToolbar | null>,
    required: false,
  }
})
let aditorView:AditorDocView


watchEffect(() => {
  if(props.docJson){
    aditorView = renderAditorFromJSON(props.docJson)
    aditorView.addDocEventHook(SysEventsEnum.click, props.toolBar?.init)
  }
});

onMounted(() => {
})
</script>

<template>
  <div class="editor-main">
    <component v-if="aditorView && aditorView.vNode" :is="aditorView.vNode"></component>
  </div>
</template>

<style scoped>
.editor-main {
  height: 100%;
  width: 100%;
  background-color: #fff;
  padding: 10px 0px;
  position: relative;
}

</style>
