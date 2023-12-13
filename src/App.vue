<script setup lang="ts">
import { onMounted, ref, reactive } from 'vue';
import Explorer from './components/Explorer.vue';
import explorerState from './components/Explorer.ts'
import Breadcrumb from './components/Breadcrumb.vue';
import Editor from './components/Editor.vue';

const activeTabName = ref(explorerState.state.openedDoc?.path)
const paths = reactive(['所有笔记', '历史', '古代史超长名称测试，一口气拉到最'])
onMounted(() => {
})

</script>

<template>
  <div class="app">
    <div class="explorer">
      <explorer></explorer>
    </div>
    <div class="content">
      <el-tabs
        v-model="activeTabName"
        type="card"
        closable
      >
        <el-tab-pane
          v-for="item in explorerState.state.openedDocs"
          :key="item.path"
          :label="item.label"
          :name="item.label"
        >
          <div class="content-main">
            <div class="breadcrumb">
              <breadcrumb :paths="paths"></breadcrumb>
            </div>
            <div>
              <editor></editor>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

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
  padding: 5px 15px;
}

</style>