<script setup lang="ts">
import { onMounted,ref } from 'vue';
import Explorer from './components/Explorer.vue';
import explorerState from './components/Explorer.ts'
import Breadcrumb from './components/Breadcrumb.vue';
import Editor from './components/Editor.vue';
import EditorToolbar from './components/EditorToolbar.vue';
const toolBarRef = ref(null)

onMounted(() => {
  console.log(toolBarRef.value)
})

</script>

<template>
  <div class="app">
    <div class="explorer">
      <explorer></explorer>
    </div>
    <div class="content">
      <el-tabs
        v-model="explorerState.openedNodePath.value"
        type="card"
        closable
        @tab-remove="explorerState.closeOpenedDoc"
      >
        <el-tab-pane
          v-for="item in explorerState.state.openedNodes"
          :key="item.data.path"
          :label="item.data.label"
          :name="item.data.path"
        >
          <div class="content-main">
            <div class="breadcrumb">
              <breadcrumb :openedNodePath="explorerState.openedNodePath.value"></breadcrumb>
            </div>
            <div>
              <editor :toolBar="toolBarRef" :docJson="(item.data.docJson as undefined)"></editor>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <editor-toolbar ref="toolBarRef"></editor-toolbar>
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  height: 100vh;
  position: relative;
}

.explorer {
  width: 300px;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
}

.content {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 300px;
}
.content :deep(.el-tabs .el-tabs__content){
  height: calc(100vh - 41px);
}
.content :deep(.el-tabs__header){
  margin: 0;
}

.content-main{
  height: calc(100vh - 61px);
  padding: 5px 15px;
  overflow-y: auto;
  overflow-x: hidden;
}

</style>