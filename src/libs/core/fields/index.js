const fields = import.meta.glob('./**/*.js',{ eager: true });
const modules = {};
for(let key in fields){
    // console.log(key)
    let entity = key?.replace(/\.\/(\w+)\/index\.js/g,(a,b)=>{
        return b;
    });
    if(fields[key]?.default){
        modules[entity] = {}
        fields[key]?.default.forEach(field=>{
            modules[entity][field.key] = {...field}
        })
    }
    
}

export function getField(entity,field){
    return getEntity(entity)[field];
}
export function getFieldLabel(entity,field){
    return getEntity(entity)[field]?.label;
}
export function getEntity(entity){
    return modules[entity] || {};
}

export function useEntity(entity){
    function _getField(field) {
        return getField(entity,field)
    }
    function _getFieldLabel(field){
        return getFieldLabel(entity,field);
    }
    return [_getField,_getFieldLabel];
}

export default modules;