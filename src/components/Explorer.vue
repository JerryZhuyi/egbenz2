<script setup lang="ts">
import { ref } from 'vue';

// 假设我们有以下的文件和文件夹结构
const files = ref([
  { name: 'Folder 1', type: 'folder', children: [{ name: 'File 1', type: 'file' }], isOpen: false },
  { name: 'File 2', type: 'file' },
]);

const toggleFolder = (folder:any) => {
  folder.isOpen = !folder.isOpen;
};
</script>

<template>
  <div class="explorer-body">
    <div class="exporer-head">
      <div class="head-content">目录</div>
    </div>
    <ul>
      <li v-for="file in files" :key="file.name" :class="{ folder: file.type === 'folder' }">
        <div @click="file.type === 'folder' && toggleFolder(file)">
          <span class="icon">{{ file.type === 'folder' ? (file.isOpen ? '▽' : '▷') : '📄' }}</span>
          <span>{{ file.name }}</span>
        </div>
        <ul v-if="file.type === 'folder' && file.isOpen">
          <li v-for="child in file.children" :key="child.name">
            <span class="icon">{{ child.type === 'folder' ? '▷' : '📄' }}</span>
            <span>{{ child.name }}</span>
          </li>
        </ul>
      </li>
    </ul>
    
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
  height: 50px;

}
.exporer-head .head-content {
  margin-left: 20px;
}
.folder > div {
  cursor: pointer;
}

.icon {
  margin-right: 5px;
}
</style>
