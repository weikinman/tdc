const shim = {
    setInterval(_fn,_interval){
        console.log('no im')
    },
    setTimeout(_fn,_interval) {
        console.log('no im')
    },
    clearInterval(_id){
        console.log('no im')
    },
    clearTimeout(_id){
        console.log('no im')
    }
}

export default shim 