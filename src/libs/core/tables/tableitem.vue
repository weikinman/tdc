<template>
    <el-table-column :label="props.label" :prop="props.name">
        <slot v-bind="{props,value}"></slot>
    </el-table-column>
</template>
<script setup lang="js">
import { reactive } from 'vue';
const emits = defineEmits(['update:modelValue'])
let props = defineProps({
    formElement: {
        type:String,
        default: 'el-input'
    },
    name:'',
    modelValue:'',
    label:'',
    formType:''
})
let value = ref('');

function inputValue(event){
    console.log(event);
    value.value = event;
    emits('update:modelValue',event);   
}

</script>