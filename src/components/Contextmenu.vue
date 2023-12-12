<script setup lang="ts">
import { ref } from 'vue'
const contextmenuRef = ref()
const triggerButtonRef = ref()
const popoverRef = ref()
const popoverVisible = ref(false)

const clickButtonManual = async (e: MouseEvent) => {
  triggerButtonRef.value.$el.click();
  if(popoverVisible.value){
    popoverVisible.value = false
    setTimeout(() => {
      popoverVisible.value = true
      if (contextmenuRef.value) {
        contextmenuRef.value.style.left = `${e.clientX-60}px`
        contextmenuRef.value.style.top = `${e.clientY-30}px`
      }
    }, 100);
  }else{
    if (contextmenuRef.value) {
      contextmenuRef.value.style.left = `${e.clientX-60}px`
      contextmenuRef.value.style.top = `${e.clientY-30}px`
    }
  }
  
}

defineExpose({clickButtonManual})
const props = defineProps({
  data:{
    type: Array,
    default: () => [],
    required: false
  },
})
</script>

<template>
  <div ref="contextmenuRef" class="contextmenu">
    <el-popover
      ref="popoverRef"
      :virtual-ref="triggerButtonRef"
      trigger="click"
      v-model:visible="popoverVisible"
      :hide-after="50"
    >
      <template #reference>
        <el-button ref="triggerButtonRef"></el-button>
      </template>
      <span>
        some content
      </span>
    </el-popover>
  </div>
</template>

<style scoped>
.contextmenu{
  position: absolute;
  visibility: hidden;
}
</style>