<template>
    <div>
        <el-form :model="data" ref="formRef">
            <FormItem v-for="(item, index) in fieldDataArr" :formElement="item.formElement" :key="index" :name="item.key" :formType="item.formType"
                :label="item.label" v-model:modelValue="data[item.key]">
                <template #default="scope">
                    {{ scope.props }}
                </template>
                <template #form-child="scope" >
                   
                        <el-option v-if="scope.props.name==='userrole'" v-for="(ditem,dindex) in roleDatas" :key="dindex" :value="ditem.id" :label="ditem.label">{{ ditem.label }}</el-option>
                </template>
            </FormItem>
        </el-form>
        <div @click="reset">reset</div>
    </div>
</template>

<script setup>
import FormItem from '@/libs/core/forms/formItem.vue'
import {useForm} from '@/libs/hooks/forms/index'
const props = defineProps({
    entityName: '',
});
let [fieldData, fieldDataArr] = useForm(props.entityName)
const formRef = ref();
let data = reactive({ ...fieldData });
onMounted(() => {
    console.log(formRef.value);
});
const roleDatas = reactive([
    {id:'1',label:'111'},
    {id:'2',label:'222'},
    {id:'3',label:'333'},
]);
function reset() {
    formRef.value.resetFields();
}
</script>