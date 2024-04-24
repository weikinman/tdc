import fields from '@/libs/core/fields/index';
export function useForm(entityName){
    let fieldData = {};
    let fieldDataArr = []
    const fieldInfo = fields[entityName];
    if(fieldInfo){
        fieldDataArr = Object.keys(fieldInfo).map(item=>{
            fieldData[item] = '';
            const info = {
                ...fieldInfo[item]
            };
            if(fieldInfo[item].dataType==='picklist'){
                info.formElement = 'el-select'
            }else{
                info.formElement = 'el-input'
            }
            return  info;
        });
    }
    return [fieldData,fieldDataArr];
}