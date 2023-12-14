<script setup lang="ts">
import { docStruct, renderAditorFromJSON, AditorDocState } from '@lib/aditor'
import { onMounted } from 'vue';
import { PropType, watchEffect } from 'vue'
const props = defineProps({
  docJson: {
    type: Object as PropType<docStruct|undefined>,
    required: false
  }
})
let aditor:AditorDocState
watchEffect(() => {
  if(props.docJson){
    aditor = renderAditorFromJSON(props.docJson)
  }
});

onMounted(() => {
})
</script>

<template>
  <div class="editor-main">
    <component v-if="aditor && aditor.vnode" :is="aditor.vnode"></component>
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
