<template>
    
    <draggable class="preview-content" group="a" :sort="false" :list="props.list" item-key="key">
        <template #item="{element}">
            <div>
                <div class="preview-item"> {{element.key}}</div>
                    <div class="preview-child">
                        <Nested  :list="element.children"></Nested>
                    </div>
            </div>
        </template>
    </draggable>
</template>
<script>
    export default {
     name:'Nested'   
    }
</script>
<script setup>
import draggable from 'vuedraggable'

const fieldDataArr = reactive([]);
let props = defineProps({
    paramWidth:'',
    list:{
        default(){
            return [];
        }   
    } 
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
.preview-child{
    width:100%;
    min-height: 100px;
    border:1px solid #e99
}
</style>

