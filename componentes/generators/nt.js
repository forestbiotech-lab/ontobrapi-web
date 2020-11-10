const fs=require('fs')

class Triples{
  constructor(prefixes){
    this.type=["class","objectProperty"]
  }
  makeNamedNode(type,){


  }
  getObservation(num){

  }
  addProperties(){

  }
}

module.exports=function(file,mappings){
  return new Promise((res,rej)=>{
    fs.readFile(file,'utf8',(err,data)=>{
      if (err){
        rej(err)
      }else{
        var parsedFile,distinctElements,header;
        ({parsedFile,header,distinctElements}=getDistintElementsFromEachColumn(data,headerLineNumber=0))
        makeTriples(parsedFile,header,distinctElements)
        res(distinctElements)
      }
    })
  })
  //isIRI()


}
function makeTriples(parsedFile,header,distinctElements){
  const raiz={
    prefix:"PREFIX raiz <http://brapi.biodata.pt/raiz#>",
    url:"http://brapi.biodata.pt/raiz/"
  }
  const ppeo={
    prefix:"PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>",
    url:"http://purl.org/ppeo/PPEO.owl#"
  }  
```
PREFIX raiz <http://brapi.biodata.pt/raiz/>
PREFIX miappe: <http://purl.org/ppeo/PPEO.owl#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

<raiz:study_353> <rdf:type> <ppeo:study>
<raiz:environment_53055> <rdf:type> <ppeo:environment>
<raiz:study_353> <ppeo:has_environment> <raiz:environment_53055>

<http://brapi.biodata.pt/raiz/obs_00000001> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2002/07/owl#NamedIndividual> .

<raiz:obs_00000001> <rdf:type> <miappe:observation> .

<raiz:obs_00000001> <miappe:hasObservedSubject> <raiz:position_118_n356> .
<raiz:obs_00000001> <miappe:hasVariable> <raiz:age> .
<raiz:obs_00000001> <miappe:hasDateTime> "2014-11-24T00:00:00"^^<xsd:dateTime> .
<raiz:obs_00000001> <miappe:hasValue> "3.0"^^<xsd:float> .
```
  let default_named_nodes={
    "block_level":{
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
    }
  }


  let mapping={
    "Ensaio":{
      type:"class",
      name:"study",
      valueType:"named_node",
      "naming_scheme":'n${value}'
    },
    "Data":{
      type:"dataProperity",
      name:"hasDateTime",
      valueType:"dateTime",
    },
    "Ordem":{
      type:"class",
      name:"observation_unit",
      valueType:"named_node",
      "naming_scheme":'position_${value}_${study}'
    },
    "Rep":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"plot_${value}",
      properties:[
        {hasSpatialDistributionType:plot_level},
        {hasValue:"${value}"}    
      ]
    },
    "Bloco":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"plot_${value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"${plot_level}"},
        ],
        DataProperties:[
          {hasValue:"${value}"}    
        ]      
      }
    },
    "t":{
      type:"class",
      name:"observation",
      valueType:"float",
      "naming_scheme":'obs_${pad(value,6)}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"${Ordem}"},
          {hasVariable:"${age}"}
        ],
        DataProperties:[
          {hasValue:"${value}${valueType}"},
          {hasDateTime:"${Data}"}
        ]
      }
    },
    "Alt (m)":{
     type:"class",
     name:"observation",
     valueType:"float",
     properties:{
       ObjectProperties:[
         {hasObservedSubject:"${Ordem}"},
         {hasVariable:"${age}"}
       ],
       DataProperties:[
         {hasValue:"${value}${valueType}"},
         {hasDateTime:"${Data}"}
       ]
     }
    },
    "Dap (cm)":{
      type:"class",
      name:"observation",
      valueType:"float"
    },
    "Cop_Med":{

    }
  }

  study={
      p:"<rdf:type>",
      o:"<miappe:study>"
     }
  parsedFile.forEach((line)=>{
    line.forEach((column,index)=>{
      header[index]
    })
  })
}

function getDistintElementsFromEachColumn(data,headerLineNumber){
  let result={}
  let header=[]
  let parsedFile=[]
  data.split("\n").forEach((line,index)=>{
    line=line.trim()
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