<template>
<div  class="base-box">
    <Layouts></Layouts>
    <Comps></Comps>
    <FieldS></FieldS>
</div>
</template>
<script setup>
import draggable from 'vuedraggable'
import fields from '@/libs/core/fields/index';
import Layouts from './layout/index.vue'
import Comps from './components/index.vue'
import FieldS from './fields/index.vue'
import { DRAGER_TYPE_KEY } from '@/libs/const/editor/index'

</script>
<style scoped>
.base-box{
    margin: 10px;
    padding: 10px;
    border: 1px solid #eee;
    width: 30%;
    float: left;
}
.base-item{
    border: 1px solid #ccc;
    padding: 10px 20px;
    margin-bottom: 5px;
    display: inline-block;
    cursor: pointer;
}
</style>

