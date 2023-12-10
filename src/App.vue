<script setup lang="ts">
import { renderAditorFromJSON, AditorDocState } from '@lib/aditor/index'
import { onMounted } from 'vue';
import { request } from './api';

let doc : AditorDocState

const renderAditor = () => {
  doc = renderAditorFromJSON({
    "name": "aditor",
    "type": "child",
    "style":{},
    "data":{
      "version":"0.0.1",
    },
    "children":[
      {
        "name":"aditorText",
        "type": "leaf",
        "style":{},
        "data":{
          "text":"Hello, world!",
        },
        "children":[]
      },{
        "name":"aditorParagraph",
        "type": "child",
        "style":{},
        "data":{
          "text":"bad world",
        },
        "children":[{
          "name":"aditorText",
          "type": "leaf",
          "style":{},
          "data":{
            "text":"bad world",
          },
          "children":[]
        }]
      }
    ]
  })
  return doc.vnode
}

onMounted(() => {
  request.getFiles().then((res) => {
    console.log(res)
  })
})

</script>

<template>
  <div>
    <component :is="renderAditor()"></component>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
