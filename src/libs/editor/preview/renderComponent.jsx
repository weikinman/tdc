//高階組件
export default function renderComponent(Comp,props){
    try{
        return (
            <Comp {...props}></Comp>
        )
    }catch(e){
        console.log('error',e)
    }
}