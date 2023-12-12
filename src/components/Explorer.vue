<script setup lang="ts">
import { ref } from 'vue';
import { Document,DocumentAdd,FolderAdd,RefreshLeft } from '@element-plus/icons-vue';
import Contextmenu from './Contextmenu.vue';

interface Tree {
  label: string,
  children?: Tree[]
}

const contextmenuRef = ref()

const handleNodeClick = (data: Tree) => {
  console.log(data)
}

const showContextMenu = (e: MouseEvent)=>{
  contextmenuRef.value.clickButtonManual(e)
}

const data: Tree[] = [
  {
    label: '所有笔记',
    children: [
      {
        label: '历史',
        children: [
          {
            label: '古代史超长名称测试，一口气拉到最最最最最最最最最最最最最最最最最最最最右边，第12345吗.txt',
          },
        ],
      },
    ],
  },
  {
    label: '配置文件',
    children: [
      {
        label: '链接地址',
      }
    ],
  },
]

const defaultProps = {
  children: 'children',
  label: 'label',
}
</script>

<template>
  <div @contextmenu.prevent="showContextMenu" class="explorer-body">
    <Contextmenu ref="contextmenuRef"/>
    <div class="exporer-head">
      <span class="head-content">/</span>
      <span class="head-options">
        <el-button-group>
          <el-button :size="'small'" :icon="DocumentAdd" />
          <el-button :size="'small'" :icon="FolderAdd" />
          <el-button :size="'small'" :icon="RefreshLeft" />
        </el-button-group>
      </span>
    </div>
    <div class="exporer-content">
      <el-tree :data="data" :props="defaultProps" @node-click="handleNodeClick" :indent="8">
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
