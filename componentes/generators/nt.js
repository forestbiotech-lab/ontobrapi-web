const fs=require('fs')
const hash = require('object-hash');

class Triples{
  constructor(prefixes,dependentClasses,default_named_nodes){
    this.type=["class","objectProperty"] //Unecessary 
    this.dependentClasses=dependentClasses //Possible rename 
    this.triples={
      prefix:{},
      metadata:[
        {s:"<http://brapi.biodata.pt/raiz>",p:"<rdf:type>",o:"<owl:Ontology>"},
        {s:"<http://brapi.biodata.pt/raiz>",p:"<owl:imports>",o:"<http://purl.org/ppeo/PPEO.owl>"},
        {s:"<miappe:hasLicense>",p:"<http://www.w3.org/2000/01/rdf-schema#subPropertyOf>",o:"<miappe#hasName>"}
      ],
      individuals:{

      },
      properties:{}
    }
    this.addPrefixes(prefixes)
    this.cache={auto_increment:{}}
    this.makeObservationProperties(default_named_nodes)
  }
  addPrefixes(prefixes){
    let that=this
    let mandatoryKeys=["url","prefix"]

    if(prefixes instanceof Object){
      Object.entries(prefixes).forEach(([prefixName,prefix])=>{
        if(validMinStructure(prefix,mandatoryKeys)==true){
          that.triples.prefix[prefixName]=prefix
        }
      })
    }
    function validMinStructure(prefix,mandatoryKeys){
      let add=true
      if(prefix instanceof Object){
        mandatoryKeys.forEach(key=>{
          if(!Object.keys(prefix).includes(key)){
            add=false
            console.log(`Prefix ${prefix} not added due to missing keys`)
          }
        })
      }else{
        add=false 
      }
      return add    
    }
  }
  parseLineItem(mapping,value){
    let context=this.makeNamedContext(mapping.header,mapping.currentLine)
    if(this.dependentClasses.includes(mapping.name)){
      this.makeNamedNode(mapping,value,context)
    }
    this.makeDependencies(mapping,value,context)
  }
  makeObservationProperties(observationProperties){
    if(typeof observationProperties =="object"){
      let triples=this.triples
      Object.entries(observationProperties).forEach(([key,value])=>{
        let s,p,o;
        s=`<raiz:${key}>`
        p=`<rdf:type>`
        o=`<miappe:${value.name}>`
        if(s && p && o){  //Should actually check if value was found before saving
          triples.individuals[key]={s,p,o}
        }
      })
    }
  }
  makeDependencies(mapping,value,context){
    if(mapping.properties){
      mapping.properties.ObjectProperties.forEach(objectProperty=>{
        context.value=value
        this.makeObjectPropertyTriple(objectProperty,mapping,context)
      })
      mapping.properties.DataProperties.forEach(dataProperty=>{
        context.value=value
        this.makeObjectPropertyTriple(dataProperty,mapping,context)
      })
    }
  }
  makeObjectPropertyTriple(objProp,mapping,context){
    Object.entries(objProp).forEach(([key,value])=>{
      let node_name

      //Subject
      if(mapping.name=="observation" && mapping.node_name){
        node_name=mapping.node_name
      }else{
        node_name=this.interpolator(mapping.naming_scheme,context)  
      }
      
      
      let s,p,o,referenced_node;
      try{
        s=this.triples.individuals[node_name].s 
      }catch(err){
        console.log(`The node_name hasn't been created yet: ${node_name}`)
      }
      p=`<miappe:${key}>`
      //Observation
      if(typeof value == "string"){
        let isSubject=this.isSubject(value)
        if(isSubject){
          isSubject=isSubject[0].replace(/[#{}]/g,"")
          if (mapping.mapping[isSubject]){
            context.value=context[isSubject]
            referenced_node=this.interpolator(mapping.mapping[isSubject].naming_scheme,context)            
          }else{
            referenced_node=isSubject            
          }
          try{
            o=this.triples.individuals[referenced_node].s   
          }catch(err){
            console.log(`The referenced node hasn't been created yet: ${referenced_node}`)
          }
        }else{
          this.interpolator(mapping.naming_scheme,context)  
        }
      }else{
        if(value instanceof Object){
          let vValue=value.value;
          let vType=value.type
          o=this.interpolator(vValue,context)
        }
        //TODO
        //value + dataType
      }
      this.addProperty({s,p,o})
    })    
  }
  makeNamedNode(mapping,value,context){
    if(mapping.type=="class"){    

      if(context) context=Object.assign(context,{value})
      else context={value}

      let triple={s:"",p:"",o:""},naming_scheme=""

      //Subject
      naming_scheme=this.interpolator(mapping.naming_scheme,context)
      triple.s=`<raiz:${naming_scheme}>`
      if(mapping.name=="observation"){
        mapping.node_name=naming_scheme
      }
      
      //Predicate
      if (mapping.type=="class"){
        triple.p="<rdf:type>"
      }//Is there an other option?

      //Observation
      if(mapping.name){
        triple.o=`<miappe:${mapping.name}>`
      }
      this.addIndividual(naming_scheme,triple)
      
    }
  }
  addIndividual(name,triple){
    let re = /Undefined|null/
    let add=true
    if(!name.match(re)){
      Object.entries(triple).forEach(([type,value])=>{
        if(value.match(re)){
          add=false
        }
      })
      if(add==true){
        if(this.triples.individuals[name]){
          console.log(`An individual with this name:${name} has already been created: Triples has been discarded!`)
        }else{
          this.triples.individuals[name]=triple      
        }
      }else{
        console.log(`On of the elements in the triple:${JSON.stringify(triple)}, has not been properly formulated!`)
      }
    }else{
      console.log(`The name for the individual contains invalid nameing:${name}. It seems there was some error in the mapping perhaps!`) 
    }
  }
  getObservation(num){

  }
  addProperty(triple){
    let key=hash(triple)
    if(this.triples.properties[key]){
      console.log(`The property triple already exists: ${JSON.stringify(triple)}`)
    }else{
      this.triples.properties[key]=triple
    }
  }
  isSubject(string){
    let re = new RegExp(/#{[\w\/-]+}/g)
    return string.match(re)
  }
  interpolator(string,context){
    let that=this
    let reserved_vars={
      auto_increment:this.auto_increment
    }
    let variables=[]
    let result=string
    let re = new RegExp(/@{[\w\/-]+}/g)
    let re2 = new RegExp(/[@{}]/g)
    let re3 = new RegExp(/@{[\w\/-]+}/)

    string.match(re).forEach(variable=>{
      let temp=variable.replace(re2,"")
      if(Object.keys(reserved_vars).includes(temp)){
        temp=reserved_vars[temp](string,that)        
      }else{
        temp=context[temp]  
      }
      variables.push(temp)
    })
    variables.forEach(variable=>{
      result=result.replace(re3,variable)
    })
    return result
  }
  auto_increment(naming_scheme,that){
    function pad(num, size) {
      num = num.toString();
      while (num.length < size) num = "0" + num;
        return num;
    }
    let auto_increment=that.cache.auto_increment
    let value=null
    if(auto_increment[naming_scheme]){
      auto_increment[naming_scheme].value++
      value=auto_increment[naming_scheme].value
    }else{
      auto_increment[naming_scheme]={value:1}
      value=1
    }
    return pad(value,6) 
  }
  makeNamedContext(keys,values){
    let result={}
    if(keys.length==values.length){
      keys.forEach((key,index)=>{
        result[key]=values[index]
      })
    }
    return result
  }   
  toString(){
    let result=""
    let that=this
    /*Object.entries(this.triples.prefix).forEach(([name,prefix])=>{
      result+=prefix.prefix+"\n"
    })*/
    this.triples.metadata.forEach(individual=>{
      result+=`${that.complete(individual.s,that)} ${that.complete(individual.p,that)} ${that.complete(individual.o,that)} .\n`
    })
    Object.entries(this.triples.individuals).forEach(([name,individual])=>{
      result+=`${that.complete(individual.s,that)} ${that.complete(individual.p,that)} ${that.complete(individual.o,that)} .\n`
    })
    Object.entries(this.triples.properties).forEach(([name,individual])=>{
      result+=`${that.complete(individual.s,that)} ${that.complete(individual.p,that)} ${that.complete(individual.o,that)} .\n`
    })
    return result
  }
  toJSON(){
    return {prefix:this.triples.prefix,individuals:this.triples.individuals,properties:this.triples.properties}
  }
  complete(element,that){
    let prefixes=Object.keys(that.triples.prefix)
    let re=new RegExp(/<(\w+):/)
    let match=element.match(re)
    if(match){
      if(prefixes.includes(match[1])){ 
        return element.replace(re,`<${that.triples.prefix[match[1]].url}`)
      }else{return element}
    }else{return element}
  }
}

module.exports={str,json}


function str(file,mapping){
  return openAndSort(file,mapping,type="str")
}
function json(file,mapping){
  return openAndSort(file,mapping,type="json")
}



function openAndSort(file,mappings,type){
  return new Promise((res,rej)=>{
    fs.readFile(file,'utf8',(err,data)=>{
      if (err){
        rej(err)
      }else{
        var parsedFile,distinctElements,header;
        ({parsedFile,header,distinctElements}=getDistintElementsFromEachColumn(data,headerLineNumber=0))
        res(makeTriples(parsedFile,header,distinctElements,type))
      }
    })
  })
}


function makeTriples(parsedFile,header,distinctElements,type){
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
      "naming_scheme":'study_n@{value}',
      properties:{
        ObjectProperties:[
          //{partEnvironment:"#{}"},
          {hasBiologicalMaterial:"#{Codigo}"},
          //{hasLocation:"#{}"},
          //{partOf:"#{}"}
        ],
        DataProperties:[
          {hasInternalIdentifier:"@{value}"},
          {"hasStartDate-time":{value:"@{Data}",type:"dateTime"}},
          {hasObservationUnitDescription:{value:"Eucalyptus forests at Monte da Nave divided into three plots of areas 0.302ha, 0.129ha and 0.180ha, with trees organized into rows and columns.",type:"@en"}}    
        ]    
      }
    },
    "Data":{
      type:"dataProperity",
      name:"hasDateTime",
      valueType:"dateTime",
      "naming_scheme":'@{value}'
    },
    "Ordem":{
      type:"class",
      name:"observation_unit",
      valueType:"named_node",
      "naming_scheme":'position_@{value}_n@{Ensaio}',
      properties:{
        ObjectProperties:[
          {partOf:"#{Ensaio}"},
          {hasObservationLevel:"#{plant_level}"},
          {hasSpatialDistribution:"#{Rep}"},    
          {hasSpatialDistribution:"#{Poligono}"},
          {hasBiologicalMaterial:"#{Codigo}"},
          {hasSpatialDistribution:"#{Linha}"},    
          {hasSpatialDistribution:"#{Pos/linha}"},    
        ],
        DataProperties:[
          {hasInternalIdentifier:"@{value}"}    
        ]    
      }
    },
    "Rep":{
      type:"class",
      name:"spatial_distribution",
      valueType:"named_node",
      "naming_scheme":"plot_@{value}",
      properties:{
        ObjectProperties:[
          {hasSpatialDistributionType:"#{plot_level}"},
        ],
        DataProperties:[  
          {hasValue:"@{value}"}    
        ]
      }
    },
    "Bloco":{
      type:"NA",
      name:"spatial_distribution",
      valueType:"NA",
      "naming_scheme":"plot_@{value}",
      properties:{
        ObjectProperties:[
        ],
        DataProperties:[
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
          {hasSpatialDistributionType:"#{block_level}"},
        ],
        DataProperties:[
          {hasValue:"@{value}"}    
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
          {hasSpatialDistributionType:"#{Linha}"},
        ],
        DataProperties:[
          {hasValue:"@{value}"}    
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
          {hasSpatialDistributionType:"#{Pos/linha}"},
        ],
        DataProperties:[
          {hasValue:"@{value}"}    
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
          //{hasDescription:{value:"unknown parants#{mustbecodedsomehow}",type:"string"}} //
        ]
      }      
    },
    "t":{
      type:"class",
      name:"observation",
      valueType:"named_node",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{age}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"float"}},
          {hasDateTime:"#{Data}"}
        ]
      }
    },
    "Alt (m)":{
     type:"class",
     name:"observation",
     valueType:"named_node",
     "naming_scheme":'obs_@{auto_increment}',
     properties:{
       ObjectProperties:[
         {hasObservedSubject:"#{Ordem}"},
         {hasVariable:"#{height}"}
       ],
       DataProperties:[
         {hasValue:{value:"@{value}",type:"float"}},
         {hasDateTime:"@{Data}"}
       ]
     }
    },
    "Dap (cm)":{
      type:"class",
      name:"observation",
      valueType:"integer",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{diameter_at_breast_height}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"float"}},
          {hasDateTime:"@{Data}"}
        ]
      }
    },
    "Cod_Med":{
      type:"class",
      name:"observation",
      valueType:"integer",
      "naming_scheme":'obs_@{auto_increment}',
      properties:{
        ObjectProperties:[
          {hasObservedSubject:"#{Ordem}"},
          {hasVariable:"#{status_assessment}"}
        ],
        DataProperties:[
          {hasValue:{value:"@{value}",type:"string"}}, ///Scale (convert)
          {hasDateTime:"@{Date}"}
        ]
      }
    }
  }
  
  let dependentClasses=["observation","observation_unit"] 

  // Either their name has dependencies or its not for distinctElements.
  let triples=new Triples(prefixes,dependentClasses,default_named_nodes)
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
      triples.parseLineItem(mapping[columnHeader],value)
    })
  }) 
  let typeFunctions={str:"toString",json:"toJSON"}
  return triples[typeFunctions[type]]()
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