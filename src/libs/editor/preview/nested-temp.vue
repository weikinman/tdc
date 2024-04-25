<template>
    <draggable class="preview-content" :group="props.group" :sort="false" :list="props.list" item-key="key">
        <template #item="{element}">
            <div :class="element[DRAGER_TYPE_KEY]==='layout' ? 'preview-layout':'preview-sprite'">
                <div v-if="element[DRAGER_TYPE_KEY]!=='layout'" class="preview-item"> {{element.key || element.name}}</div>
                <Nested :class="element[DRAGER_TYPE_KEY]==='layout' ? 'preview-child-layout':''" v-else :group="{name:'sprite'}"  :list="element.children"></Nested>
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
import { DRAGER_TYPE_KEY } from '@/libs/const/editor/index'
const fieldDataArr = reactive([]);
let props = defineProps({
    paramWidth:'',
    list:{
        default(){
            return [];
        }   
    },
    group:'' 
})
const activeNames = ref('')
function handleChange() {
      console.log('changed');
    }
    function inputChanged(value) {
      activeNames.value = value;
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
    
}
.preview-layout{
    width:100%;
    border: 1px dashed #ddd;
}

.preview-sprite{
    display: inline-block;
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
.preview-child-layout{
    min-height: 30px;
}
</style>

