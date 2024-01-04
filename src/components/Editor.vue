<script setup lang="ts">
import { docStruct, renderAditorFromJSON, AditorDocView } from '@lib/aditor'
import { onMounted } from 'vue';
import { PropType, watchEffect } from 'vue'
const props = defineProps({
  docJson: {
    type: Object as PropType<docStruct|undefined>,
    required: false
  }
})
let aditorView:AditorDocView


watchEffect(() => {
  if(props.docJson){
    aditorView = renderAditorFromJSON(props.docJson)
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
}

</style>
