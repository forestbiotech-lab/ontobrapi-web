const fs=require('fs')

class Triples{
  constructor(prefixes){
    this.type=["class","objectProperty"]
    this.triples={
      prefix:[],
      individuals:{

      },
      body:[]
    }
  }
  makeNamedNode(mapping,value){
    /*<raiz:study_353> <rdf:type> <ppeo:study>
    type:"class",
    name:"study",
    valueType:"named_node",
    "naming_scheme":'study_n${value}'*/
    if(mapping.type=="class" && mapping.valueType=="named_node"){    

      let context={value} //Add missing contexts
      let triple={s:"",p:"",o:""}
      let naming_scheme=""

      //Subject
      if(mapping.valueType=="named_node"){
        naming_scheme=this.interpolator(mapping.naming_scheme,context)
        triple.s=`<raiz:${naming_scheme}`
      }
      //Predicate
      if (mapping.type=="class"){
        triple.p="<rdf:type>"
      }
      //Observation
      if(mapping.name){
        triple.o=`<ppeo:${mapping.name}>`
      }
      
      this.triples.individuals[`${naming_scheme}`]=triple
    }
  }
  getObservation(num){

  }
  addProperties(){

  }
  interpolator(string,context){
    let variables=[]
    let result=""
    let re = new RegExp(/@{\w+}/g)
    let re2 = new RegExp(/[@{}]/g)
    let re3 = new RegExp(/@{\w+}/)
    string.match(re).forEach(variable=>{
      let temp=variable.replace(re2,"")
      temp=context[temp]

      variables.push(temp)
    })
    variables.forEach(variable=>{
      result=string.replace(re3,variable)
    })
    return result
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
        res(makeTriples(parsedFile,header,distinctElements))
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
  /*
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
*/

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
    }

  }


  let mapping={
    "Ensaio":{
      type:"class",
      name:"study",
      valueType:"named_node",
      "naming_scheme":'study_n@{value}'
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
      "naming_scheme":'position_@{value}_@{Ensaio}'
    },
    "Rep":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"plot_@{value}",
      properties:[
        {hasSpatialDistributionType:"plot_level"},
        {hasValue:"@{value}"}    
      ]
    },
    "Bloco":{
      type:"NA",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"plot_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"${plot_level}"},
        ],
        DataProperties:[
          {hasValue:"${value}"}    
        ]      
      }
    },
    "Poligono":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"block_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"${block_level}"},
        ],
        DataProperties:[
          {hasValue:"${value}"}    
        ]      
      }
    },
    "Linha":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"row_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"${row}"},
        ],
        DataProperties:[
          {hasValue:"${value}"}    
        ]      
      }
    },
    "Pos/linha":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"column_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"${column}"},
        ],
        DataProperties:[
          {hasValue:"${value}"}    
        ]      
      }      
    },
    "Codigo":{
      type:"class",
      name:"biological_material",
      valueType:"named_node",
      "naming_scheme":'pedigree_@{value}',
      properties:{
        ObjectProperties:[],
        DataProperties:[
          {hasSpecies:{value:"globulus", type:"string"}},
          {hasGenus:{value:"Eucalyptus",type:"string"}},
          {hasTaxonIdentifier:"http://purl.bioontology.org/ontology/NCBITAXON/34317"},
          {hasInternalIdentifier:"@{value}"},
          {hasDescription:{value:"unknown parants#{mustbecodedsomehow}",type:"string"}}
        ]
      }      
    },
    "t":{
      type:"class",
      name:"observation",
      valueType:"float",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{age}"}
        ],
        DataProperties:[
          {hasValue:"@{value}@{mapping.valueType}"},
          {hasDateTime:"#{Data}"}
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
         {hasVariable:"${height}"}
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
      valueType:"integer",
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"${Ordem}"},
          {hasVariable:"${diameter_at_breast_height}"}
        ],
        DataProperties:[
          {hasValue:"${value}${valueType}"},
          {hasDateTime:"${Data}"}
        ]
      }
    },
    "Cod_Med":{
      type:"class",
      name:"observation",
      valueType:"integer",
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{status_assessment}"}
        ],
        DataProperties:[
          {hasValue:"${value}${valueType}"},
          {hasDateTime:"${Data}"}
        ]
      }
    }
  }

  let dependentClasses=["observation","observation_unit"] 
  // Either their name has dependencies or its not for distinctElements.
  let triples=new Triples(raiz)
  Object.entries(distinctElements).forEach(([columnHeader,values])=>{
    let valueMap=mapping[columnHeader]
    if(!dependentClasses.includes(valueMap.name)){
      values.forEach(value=>{
        triples.makeNamedNode(valueMap,value)
      })
    }//Observation namednodes are generated when the line is being parsed.
  })
  parsedFile.forEach((line)=>{
    line.forEach((value,column)=>{
      let columnHeader=header[column]
      mapping[columnHeader].currentLine=line
      mapping[columnHeader].header=header
      mapping[columnHeader].mapping=mapping
      triples.makeNamedNode(mapping[columnHeader],value)
    })
  }) 
  return triples.triples.individuals
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