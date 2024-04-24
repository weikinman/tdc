<template>
<div  class="base-box">
    <div v-for="(item,index) in fieldDataArr" :key="index" >
        <draggable  group="a" :list="item" :sort="false" item-key="key">
            <template #item="{element}">
            
                <div class="base-item"> {{element.key}}</div>
            </template>
        </draggable>
    </div>
</div>
</template>
<script setup>
import draggable from 'vuedraggable'
import fields from '@/libs/core/fields/index';
let props = defineProps({
    entityName:{
        default:'user'   
    },   
})
let fieldData = {};
let fieldDataArr = reactive([]);
Object.keys(fields).forEach(item=>{
    const fieldInfo = fields[item];
    if(fieldInfo){
        let res = Object.keys(fieldInfo).map(key=>{
            fieldData[key] = '';
            const info = {
                ...fieldInfo[key],
                children:[]
            };
            return  info;
        });
        fieldDataArr.push(res)
    }

});
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

