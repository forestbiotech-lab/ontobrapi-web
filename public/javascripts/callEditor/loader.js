// TODO url must reflect the call mapping
// Loads JSON
//let url=
$.ajax({
    url:"/calleditor/listcalls/genotyping/observations.json/json",
    method:"get",
    success:function(data,textStatus,jqXHR){
        callStructure=data
        callStructureLoaded.status=true
    },
    error:function(jqXHR,textStatus,error){
        console.log(error)
    }
})

function getRelatedItems(ontoTerm){
    url=`http://localhost:3000/query/ppeo/class/${ontoTerm}/properties`
    return new Promise((res,rej)=>{
        $.ajax({
            url,
            method:"get",
            success:function(data,textStatus,jqXHR){
                res(data)
            },
            error:function(jqXHR,textStatus,error){
                rej(error)
            }
        })
    })
}

//TODO URL DATA
function saveCallStruture(target){
    $.ajax({
        url:"/calleditor/listcalls/genotyping/observations.json/update",
        method:"POST",
        data:{data:JSON.stringify(callStructure)},
        success:function(data,textStatus,jqXHR){
            if(data=="ok"){
                setTemporaryBadge("Saved!",target,{})
            }else{
                setTemporaryBadge("Not saved!",target,{type:"danger",duration:10000})
            }
        },
        error:function(jqXHR,textStatus,error){
            setTemporaryBadge("Not saved!",target,{type:"danger",duration:10000})
        }
    })
}