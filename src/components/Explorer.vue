<script setup lang="ts">
import { ref } from 'vue';
import { Document,DocumentAdd,FolderAdd,RefreshLeft } from '@element-plus/icons-vue';
import Contextmenu from './Contextmenu.vue';
import ExplorerState from './Explorer'
import { onMounted } from 'vue';

const contextmenuRef = ref()

const showContextMenu = (e: MouseEvent)=>{
  contextmenuRef.value.clickButtonManual(e)
}

const defaultProps = {
  children: 'children',
  label: 'label',
  path: 'path',
  isLeaf: 'isLeaf',
}
onMounted(()=>{
  console.log(ExplorerState.state.root)
})

</script>

<template>
  <div class="explorer-body">
    <Contextmenu ref="contextmenuRef"/>
    <div class="exporer-head">
      <span class="head-content">Egbenz</span>
      <span class="head-options">
        <el-button-group>
          <el-button :size="'small'" :icon="DocumentAdd" />
          <el-button :size="'small'" :icon="FolderAdd" />
          <el-button :size="'small'" :icon="RefreshLeft" />
        </el-button-group>
      </span>
    </div>
    <div class="exporer-content" @contextmenu.prevent="showContextMenu" >
      <!-- :data="[ExplorerState.state.tree]"  -->
      <el-tree 
        lazy 
        auto-expand-parent
        :indent="8"
        :props="defaultProps" 
        :load="ExplorerState.loadNode" 
        @node-click="ExplorerState.nodeClickHandler"
        >
        <template #default="{ node, data }">
          <span class="custom-tree-node">
            <el-icon v-if="!data?.children" size="14px" style="margin-right: 5px;">
              <Document />
            </el-icon>
            <span>{{ node.label }}</span>
          </span>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<style scoped>
.explorer-body {
  width: 100%;
  height: 100%;
  overflow: auto;
  border-right: 1px solid var(--e-border-color);
  box-shadow: var(--e-box-shadow-right);
}
.exporer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
}
.exporer-head .head-content {
  margin-left: 20px;
}
.exporer-head .head-options {
  margin-right: 20px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding-right: 8px;
}
</style>
