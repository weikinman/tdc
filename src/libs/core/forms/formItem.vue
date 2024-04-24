<template>
    <el-form-item :label="props.label" :prop="props.name">
        <component :is="props.formElement" :type="props.formType"  v-bind:model-value="props.modelValue" @input="inputValue($event)" @change="changeValue($event)">
            <slot name="form-child" v-bind="{ props, value }"></slot>
        </component>
        <slot name="default" v-bind="{ props, value }"></slot>
    </el-form-item>
</template>
<script setup lang="js">
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
    if(props.formElement==='el-input'){
        console.log(event);
        value.value = event;
        emits('update:modelValue',event);  
    } 
}
function changeValue(event){
    if(props.formElement!=='el-input'){
        console.log(event);
        value.value = event;
        emits('update:modelValue',event);   
    }
}
</script>