<template>
    <div>
        <span @click="testOpen">open</span>
        <el-drawer
            v-model="dialog"
            title="I have a nested form inside!"
            :before-close="handleClose"
            direction="rtl"
            class="demo-drawer"
            @open="open"
            @close="close"
            :size="'25%'"
        >
            <div class="demo-drawer__content">
            <el-form :model="form">
                <el-form-item label="Name" :label-width="formLabelWidth">
                <el-input v-model="form.name" autocomplete="off" />
                </el-form-item>
                <el-form-item label="Area" :label-width="formLabelWidth">
                <el-select
                    v-model="form.region"
                    placeholder="Please select activity area"
                >
                    <el-option label="Area1" value="shanghai" />
                    <el-option label="Area2" value="beijing" />
                </el-select>
                </el-form-item>
            </el-form>
            <div class="demo-drawer__footer">
                <el-button @click="cancelForm">Cancel</el-button>
                <el-button type="primary" :loading="loading" @click="onClick">
                {{ loading ? 'Submitting ...' : 'Submit' }}
                </el-button>
            </div>
            </div>
        </el-drawer>
    </div>
</template>
<script setup>
import { reactive, ref } from 'vue'
import { ElDrawer, ElMessageBox } from 'element-plus'

const formLabelWidth = '80px'
let timer

const table = ref(false)
const dialog = ref(false)
const loading = ref(false)

let props = defineProps({
    paramWidth:''   
});

const emits = defineEmits('update:paramWidth');

function open(){
 emits('update:paramWidth','40%');   
}
function close(){
 emits('update:paramWidth','65%');   
}
function testOpen(){
 dialog.value = true;   
}
const form = reactive({
  name: '',
  region: '',
  date1: '',
  date2: '',
  delivery: false,
  type: [],
  resource: '',
  desc: '',
})
</script>

