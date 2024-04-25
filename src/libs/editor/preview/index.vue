<template>
    <div class="preview-box" :style="`width:${props.paramWidth}`">
        <!-- <draggable class="preview-content" :group="{name:'layouts'}" :sort="false" :list="fieldDataArr" item-key="key">
            <template #item="{element}">
                <div class="preview-layout">
                    <div> {{element.key}}</div>
                </div>
            </template>
        </draggable> -->
        <Nested :group="{name:'sprite'}" :list="fieldDataArr"></Nested>
    </div>
</template>
<script>
    export default {
     name:'Preview'   
    }
</script>
<script setup>
import draggable from 'vuedraggable'
import Nested from './nested.vue'
const fieldDataArr = reactive([]);
let props = defineProps({
    paramWidth:''   
});
</script>
<style scoped>
.preview-box{
    height: 500px;
    /* width:400px; */
    border: 1px dashed #ddd;
    float: left;
}
.preview-layout{
    height: 300px;
    border: 1px dashed #ddd;
}
.preview-content{
    width:100%;
    height: 100%;
}
.preview-item{
    border: 1px solid #ccc;
    padding: 10px 20px;
    margin-bottom: 5px;
    display: inline-block;
    cursor: pointer;
}
</style>

