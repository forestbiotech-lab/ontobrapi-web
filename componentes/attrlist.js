#!/usr/bin/env node



function main(){
  var res = require('./BrAPI-phenotyping.json');
  let attrList={"_list":{},"_listSorted":{}};
  Object.entries(res).forEach(([call,callValue])=>{
    attrList[call]={}
    console.log(call)
    let attributes;
    if(callValue.result){
      if (callValue.result.data){
        if ( callValue.result.data instanceof Array ){
          listAttr(callValue.result.data[0],call,attrList)
        }
      }else{
        if ( callValue.result instanceof Array ){
          attributes=callValue.result
        }else{
          listAttr(callValue.result,call,attrList)
        }
      }      
    }
  })
  let keys=Object.keys(attrList["_list"]).sort()
  keys.forEach(key=>{attrList["_listSorted"][key]=attrList["_list"][key]})
  return attrList
}

function listAttr(attributes,call,attrList){
  Object.entries(attributes).forEach(([attr,attrValue])=>{
   attrList[call][attr]=attrValue
   attrList["_list"][attr]=attrValue 
   console.log("\t"+attr)
  })
    
}


module.exports=main()