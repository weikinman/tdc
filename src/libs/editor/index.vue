<template>
    <div>
        <Bases></Bases>
        <Preview :paramWidth="paramWidth"></Preview>
        <Params v-model:paramWidth="paramWidth"></Params>
    </div>
</template>
<script setup>
import Bases from './bases/index.vue'
import Params from './params/index.vue'
import Preview from './preview/index.vue'
const paramWidth = ref('65%');
</script>

