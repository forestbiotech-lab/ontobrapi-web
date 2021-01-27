const fs=require('fs')
const path=require('path')
const mapping=require('./../helpers/default-mapping')
const Triples=require('./../helpers/triples')


module.exports={str,json}


function str(files,mapping){
  return openAndSort(files,mapping,type="str")
}
function json(files,mapping){
  return openAndSort(files,mapping,type="json")
}
function openAndSort(files,mappings,type){
  return new Promise((res,rej)=>{
    let openFiles={}
    //Might be better with async or opening files as buffer
    files.forEach(file=>{
      let basename=path.basename(file,'.tsv')
      let data=fs.readFileSync(file,'utf8')
      openFiles[basename]={filename:file,contents:({parsedFile,header,distinctElements}=getDistintElementsFromEachColumn(data,headerLineNumber=0))}
    })
    res(makeTriples(openFiles,type))
    
/*  fs.readFile(file,'utf8',(err,data)=>{
      if (err){
        rej(err)
      }else{
        var parsedFile,distinctElements,header;
        ({parsedFile,header,distinctElements}=getDistintElementsFromEachColumn(data,headerLineNumber=0))
        res(makeTriples(parsedFile,header,distinctElements,type))
      }
    })
  */

  })
}

function makeTriples(openFiles,type){

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


  //Must add observation Levels and Observation Variables
  let default_named_nodes={
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
      name:"observation_variable"
    },
    "height":{
      type:"class",
      name:"observation_variable"
    },
    "diameter_at_breast_height":{
      type:"class",
      name:"observation_variable"
    },
    "status_assessment":{
      type:"class",
      name:"observation_variable"
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
  
  Object.entries(openFiles).forEach(([file,data])=>{
    let parsedFile,header,distinctElements
    ({parsedFile,header,distinctElements}=data.contents)
    let fileName=file.split(" - ")[1]
    makeNamedNodes(triples,distinctElements,dependentClasses,fileName)
  })
  Object.entries(openFiles).forEach(([file,data])=>{
    let parsedFile,header,distinctElements
    ({parsedFile,header,distinctElements}=data.contents)
    let fileName=file.split(" - ")[1]
    addProperties(parsedFile,fileName,header,triples)
  })

  function makeNamedNodes(triples,distinctElements,dependentClasses,fileName){
    Object.entries(distinctElements).forEach(([columnHeader,values])=>{
      let valueMap=mapping[fileName][columnHeader]
      if(!dependentClasses.includes(valueMap.name)){
        values.forEach(value=>{
          triples.makeNamedNode(valueMap,value)
        })
      }//Observation namednodes are generated when the line is being parsed.
    })
  }
  function addProperties(parsedFile,fileName,header,triples){
    parsedFile.forEach((line)=>{
      line.forEach((value,column)=>{
        let columnHeader=header[column]
        mapping[fileName][columnHeader].currentLine=line
        mapping[fileName][columnHeader].header=header
        mapping[fileName][columnHeader].mapping=mapping[fileName]
        triples.parseLineItem(mapping[fileName][columnHeader],value)
      })
    })
  }

  let typeFunctions={str:"toString",json:"toJSON"}
  return triples[typeFunctions[type]]()
}

function getDistintElementsFromEachColumn(data,headerLineNumber){
  let result={}
  let header=[]
  let parsedFile=[]
  data.split("\n").forEach((line,index)=>{
    line=line.replace(/\t/g,"@£@")
    line=line.trim()
    line=line.replace(/@£@/g,"\t")
    if(index==headerLineNumber){
      header=line.split('\t')
      header.forEach(column=>{
        result[column]={}
      })
    }else{
      parsedFile.push(line.split('\t'))
      line.split('\t').forEach((column,index)=>{
        result[header[index]][column]=""
      })
    }
  })
  Object.entries(result).forEach(([key,value])=>{
    result[key]=Object.keys(value)
  })
  return {parsedFile,header,distinctElements:result}
}