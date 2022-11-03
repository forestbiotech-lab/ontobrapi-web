const fs=require('fs')
const path=require('path')
//const mapping=require('./../helpers/default-mapping')
const Triples=require('./../helpers/triples')
const {map} = require("selenium-webdriver/lib/promise");


module.exports={str,json}


function str(files,mapping){
  return openAndSort(files,mapping,type="str")
}
function json(jSheet,mapping){
  return openAndSort(jSheet,mapping,type="json")
}
function openAndSort(jSheet,mappings,type){
  return new Promise((res,rej)=>{
    let spreadSheet={}
    jSheet.SheetNames.forEach(sheet=>{
      let data=jSheet.jsonSheets[sheet]
      let csvData=jSheet.csvSheets[sheet].trim().split("\n").map(line=>line.split(","))
      try{
        if(Object.keys(data[0]) != Object.keys(mappings[sheet])){
          addMissingCreatedColumns(sheet,data,mappings[sheet])
        }
        if((csvData[0]) != Object.keys(mappings[sheet])){
          addMissingCreatedColumns(sheet,csvData,mappings[sheet],"csv")
        }
      }catch (e){
        console.log("Unable to open and parse sheet")
      }
      spreadSheet[sheet]={sheet,contents:({parsedFile,header,distinctElements}=getDistinctElementsFromEachColumn(data,csvData,headerLineNumber=0))}
    })
    res(makeTriples(spreadSheet,mappings,type))
  })
}
function addMissingCreatedColumns(sheet,data,mappingSheet,type){
  if(type){
    if(type=="csv"){
      let missingColumns=Object.keys(mappingSheet).filter(key=>!data[0].includes(key))
      data.forEach((row,index)=>{
        missingColumns.forEach(column=>index==0?row.push(column):row.push(""))
      })
    }
  }else{
    let missingColumns=Object.keys(mappingSheet).filter(key=>!Object.keys(data[0]).includes(key) )
    data.forEach((row,index)=>{
      missingColumns.forEach(column=>data[index][column]="")
    })
  }

}
function makeTriples(spreadSheet,mapping,type){

  //START HARDCODED BLOCK ------------------------------------------------------------------------------------------------------
  let prefixes={}
  const raiz={
    prefix:"PREFIX raiz: <http://brapi.biodata.pt/raiz#>",
    url:"http://brapi.biodata.pt/raiz/"
  }
  prefixes["raiz"]=raiz
  const miappe={
    prefix:"PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>",
    url:"http://purl.org/ppeo/PPEO.owl#"
  }
  prefixes["miappe"]=miappe
  const rdf={
    prefix:"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>",
    url:"http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  }
  prefixes["rdf"]=rdf
  const xsd={
    prefix:"PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>",
    url:"http://www.w3.org/2001/XMLSchema#"
  }
  prefixes["xsd"]=xsd
  const owl={
    prefix:"PREFIX owl: <http://www.w3.org/2002/07/owl#>",
    url:"http://www.w3.org/2002/07/owl#"
  }
  prefixes["owl"]=owl

  //TODO this can't be hardcoded
  //Must add observation Levels and Observation Variables
  let default_named_nodes={}
  let default_named_nodes_backup={
    "rep_level":{
      type:"class",
      name:"observation_level"
     },
    "plot_level":{
      type:"class",
      name:"observation_level"
    },
    "plant_level":{
      type:"class",
      name:"observation_level"      
    },
    "age":{
      type:"class",
      name:"observed_variable"
    },
    "height":{
      type:"class",
      name:"observed_variable"
    },
    "diameter_at_breast_height":{
      type:"class",
      name:"observed_variable"
    },
    "status_assessment":{
      type:"class",
      name:"observed_variable"
    },
    "Pilodyn":{
      type:"class",
      name:"observation_level"
    },
    "NIR_pulp_yield":{
      type:"class",
      name:"observation_level"
    },
    "raiz_eucalyptus_pilot":{
      type:"class",
      name:"investigation"
    },
    "Portugal":{
      type:"class",
      name:"country"  //TODO properties hasName and hasCountryCode  
    }

  }
  let dependentClasses=["observation","observation_unit","environment_parameter"] //TO CHECK to I need to add others??? country,investigation, (...)

  //END HARDCODED -----------------------------------------------------------------------------------------------------------------

  // Either their name has dependencies or its not for distinctElements.
  let triples=new Triples(prefixes,dependentClasses,default_named_nodes)

  
  parsedFile,header,distinctElements
  
  Object.entries(spreadSheet).forEach(([sheetName,data])=>{
    let parsedFile,header,distinctElements
    ({parsedFile,header,distinctElements}=data.contents)
    makeNamedNodes(triples,distinctElements,dependentClasses,sheetName,parsedFile)
  })
  Object.entries(spreadSheet).forEach(([sheetName,data])=>{
    let parsedFile,header,distinctElements
    ({parsedFile,header,distinctElements}=data.contents)
    addProperties(parsedFile,sheetName,header,triples)
  })


  // As per the initial definition Classes weren't line wise. But they sho
  function makeNamedNodes(triples,distinctElements,dependentClasses,sheetName,parsedFile){
    Object.entries(distinctElements).forEach(([columnHeader,values])=>{
      let valueMap=mapping[sheetName][columnHeader]
      refactor(valueMap)//Object added by vue are no longer strings, this converts them to strings except the arrays
      valueMap['parsedFile']=parsedFile
      if(!dependentClasses.includes(valueMap.name)){  //TODO fix this name=Object not string
        values.forEach(value=>{
          triples.makeNamedNode(valueMap,value)
        })
      }//Observation namednodes are generated when the line is being parsed. //TODO Could be all now.
    })
  }
  function addProperties(parsedFile,sheetName,header,triples){
    parsedFile.forEach((line)=>{
      Object.entries(line).forEach(([column,value])=>{  //column == index ??? value== value  
        mapping[sheetName][column].currentLine=line
        mapping[sheetName][column].header=header
        mapping[sheetName][column].mapping=mapping[sheetName]
        triples.parseLineItem(mapping[sheetName][column],value)
      })
    })
  }
  function refactor(valueMap){
    Object.entries(valueMap).forEach(([attributeName,attributeValue])=>{
      if ((attributeValue instanceof Object) && !(attributeValue instanceof Array)){
        if(attributeValue.name){
          valueMap[attributeName]=attributeValue.name
        }
      } 
    })
  }

  let typeFunctions={str:"toString",json:"toJSON"}
  return triples[typeFunctions[type]]()
}

function getDistinctElementsFromEachColumn(data,csvData,headerLineNumber){
  let result={}
  let header=[]
  let parsedFile=[]
  data.forEach((line,index)=>{
    //line=line.replace(/\t/g,"@£@")
    //line=line.replace(/@£@/g,"\t")
    //TODO add missing columns
    if(index<=headerLineNumber){ //Might rewrite a couple of times if number is big, but usually it should be small.
      header=csvData[index]
      let emptyNumber=""
      header.forEach((column,index)=>{
        if(column==""){
          column="__EMPTY"+emptyNumber 
          if(emptyNumber==""){
            emptyNumber="_1"
          }else{
            emptyNumber="_"+(parseInt(emptyNumber.replace(/_+/g,""))+1)
          }
        }
        result[column]={}
      })
    }
    let newLine={}
    //Renaming the columns if we change the header
    Object.entries(line).map(([key,value],index)=>{Object.assign(newLine,{[header[index]]:value})})
    parsedFile.push(newLine)

    //Store unique value only as the key.
    Object.entries(line).forEach(([column,data])=>{
      result[column][data]=""
    })
  })
  //Restructure the entries to only have the array of unique value
  Object.entries(result).forEach(([key,value])=>{
    result[key]=Object.keys(value)
  })
  return {parsedFile,header,distinctElements:result}
}