<script setup lang="ts">
import { onMounted } from 'vue';
import { request } from './api';
import Explorer from './components/Explorer.vue';
import FileNav from './components/FileNav.vue';
import Editor from './components/Editor.vue';

onMounted(() => {
  request.getAditorFiles().then((res) => {
    console.log(res)
  })
})

</script>

<template>
  <div class="app">
    <div class="explorer">
      <explorer></explorer>
    </div>
    <div class="content">
      <div class="file-nav">
        <file-nav></file-nav>
      </div>
      <div class="editor">
        <editor></editor>
      </div>
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

.file-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50px; /* 你可以根据需要调整这个值 */
}

.editor {
  position: absolute;
  top: 50px; /* 这个值应该和 .file-nav 的 height 相同 */
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}
</style>