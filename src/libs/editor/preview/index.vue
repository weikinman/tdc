<template>
    <div class="preview-box" :style="`width:${paramWidth}`">
        <!-- <draggable class="preview-content" group="a" :sort="false" :list="fieldDataArr" item-key="key">
            <template #item="{element}">
                <div class="preview-item"> {{element.key}}</div>
            </template>
        </draggable> -->
        <Nested :list="fieldDataArr"></Nested>
    </div>
</template>
<script setup>
import draggable from 'vuedraggable'
import Nested from './nested.vue'
const fieldDataArr = reactive([]);
let props = defineProps({
    paramWidth:''   
})
const activeNames = ref('')
function handleChange() {
      console.log('changed');
    }
    function inputChanged(value) {
      activeNames = value;
    }
    function getComponentData() {
      return {
        onChange: handleChange,
        onInput: inputChanged,
        wrap: true,
        value: activeNames
      };
    }
</script>
<style scoped>
.preview-box{
    height: 500px;
    /* width:400px; */
    border: 1px solid #ddd;
    float: left;
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

