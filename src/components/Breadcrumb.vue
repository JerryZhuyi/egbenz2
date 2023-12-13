<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue';

const props = defineProps({
  paths: {
    type: [],
    default: () => ['/'],
  },
})
</script>

<template>
  <el-breadcrumb :separator-icon="ArrowRight">
    <el-breadcrumb-item v-for="(name, _) in paths">{{ name }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<style scoped></style>
