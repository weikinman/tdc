<template>
  <!-- <div>
    <Form :entityName="'user'"></Form>
    <Table :entityName="'user'" :data="tableDatas" ></Table>
  </div>

  <div>
    <Form :entityName="'role'"></Form>
    <Table :entityName="'role'" :data="tableDatas" ></Table>
  </div>

  <div>
    <Form :entityName="'mail'"></Form>
    <Table :entityName="'mail'" :data="tableDatas" ></Table>
  </div> -->
  <Editer></Editer>
</template>

<script setup>
import Form from './libs/core/forms/form.vue'
import Table from './libs/core/tables/table.vue'
import Editer from './libs/editor/index.vue'
const tableDatas = reactive([
  {username:'1111'}
  ]);
</script>
