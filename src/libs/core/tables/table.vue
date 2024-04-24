<template>
    <div>
      <el-table :data="props.data">
        <TableItem v-for="(item,index) in fieldDataArr" :key="index" :name="item.key" :formType="item.formType" :label="item.label" >
          <template #default="scope">
            {{ scope }}
          </template>
        </TableItem>
      </el-table>
    </div>
  </template>
  
  <script setup>
  import TableItem from '@/libs/core/tables/tableitem.vue'
  import fields from '@/libs/core/fields/index';
  const props = defineProps({
    entityName:'', 
    data:{
      default(){
       return []; 
      } 
    }
  })
  let fieldData = {};
  let fieldDataArr = []
  const fieldInfo = fields[props.entityName];
  if(fieldInfo){
        fieldDataArr = Object.keys(fieldInfo).map(item=>{
            fieldData[item] = '';
            return {
                ...fieldInfo[item]
            } 
        });
    }

  let data = reactive({...fieldData});

  console.log('fields', fields);
  </script>
  