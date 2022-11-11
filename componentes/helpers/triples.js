const hash = require('object-hash');
const xsd = require("@ontologies/xsd")
class Triples{
  constructor(prefixes,dependentClasses,default_named_nodes){
    this.type=["class","objectProperty"] //Unnecessary
    this.dependentClasses=dependentClasses //Possible rename 
    this.ontology={
                    base:"miappe",
                    name:"raiz"
                  }
    this.hash=hash
    this.triples={
                    prefix:{},
                    metadata:[
                      {s:"<http://brapi.biodata.pt/raiz>",p:"<rdf:type>",o:"<owl:Ontology>"},
                      {s:"<http://brapi.biodata.pt/raiz>",p:"<owl:imports>",o:"<http://purl.org/ppeo/PPEO.owl>"},
                      {s:"<miappe:hasLicense>",p:"<http://www.w3.org/2000/01/rdf-schema#subPropertyOf>",o:"<miappe:hasName>"}
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
    //TODO I'm certain there probably are issues here due to the new format of currentLine in mapping.
    let context=mapping.currentLine
    //this.makeNamedContext(mapping.header,mapping.currentLine)  //Removable
    if(this.dependentClasses.includes(mapping.name)){
      this.makeNamedNode(mapping,value,context)
    }
    this.makeDependencies(mapping,value,context)
  }
  makeObservationProperties(observationProperties){
    let that=this
    if(typeof observationProperties =="object"){
      let triples=this.triples
      Object.entries(observationProperties).forEach(([key,value])=>{
        let s,p,o;
        // TODO HARDCODDED
        s=`<${that.ontology.name}:${key}>`
        p=`<rdf:type>`
        o=`<${that.ontology.base}:${value.name}>`
        if(s && p && o){  //Should actually check if value was found before saving
          triples.individuals[key]={s,p,o}
        }
      })
    }
  }
  makeDependencies(mapping,value,context){
     if(mapping.objectProperties){
        mapping.objectProperties.forEach(objectProperty=>{
          context.__value__=value
          this.makePropertyTriple(objectProperty,mapping,context)
        })
      }
     if(mapping.dataProperties){
      mapping.dataProperties.forEach(dataProperty=>{
        context.__value__=value
        this.makePropertyTriple(dataProperty,mapping,context)
      })
     }

  }
  makePropertyTriple(propertyAttributes,mapping,context){
    let that=this

    //Don't add it if not visible
    let addProperty=propertyAttributes.show 
    let propertyName,referenceNode,propertyValue,propertyType   
    if(propertyAttributes.property) propertyName=propertyAttributes.property.name
    if(propertyAttributes.referenceNode) referenceNode=propertyAttributes.referenceNode
    if(propertyAttributes.data){
      propertyValue=propertyAttributes.data.value 
      propertyType=propertyAttributes.data.type 
    } 


    let node_name=this.interpolator(mapping.naming_scheme,context,true)



    let s,p,o,referenced_node;
    try{
      s=this.triples.individuals[node_name].s 
    }catch(err){
      //TODO then create it.
      addProperty=false
      console.log(`The node_name hasn't been created yet: ${node_name}`)
    }

    //TODO check for objectProperties
    if(propertyName !== undefined){
      p=`<${that.ontology.base}:${propertyName}>` //Not working fo
    }else{
      p=`<${that.ontology.base}:${propertyValue}>`
    }

 
    if(typeof referenceNode == "string" && propertyName != undefined ){
      referenceNode=`#{${referenceNode}}`  //TODO This whole thing has problems does not generate observation for Ensaio. ObjProperty #1 column
      let isReferencedSubject=this.isReferencedSubject(referenceNode)
      if(isReferencedSubject){  
        let isReference=this.isReference(referenceNode)
        if(isReference){
          referenced_node=this.makeObservationFromSubject(isReference,referenceNode,mapping,context)  
        }else{
          referenced_node=this.interpolator(mapping.naming_scheme,context)
        }  
        try{
          o=this.triples.individuals[referenced_node].s   
        }catch(err){
          // Possible ISSUE!
          // IF this were an issue recusion could be used to build the missing node.
          console.log(`The referenced node hasn't been created yet: ${referenceNode} - Make sure it's named`)
          addProperty=false //
        }
      }else{
        //Not sure this exists since plain strings are set in objects
        o=referenceNode 
      }
    }else{ 
      if( (typeof propertyType === "string") && (typeof propertyValue == "string") ){
        o=context[referenceNode]
        //o=this.interpolator(propertyValue,context) //old definition
        if(o.length==0) addProperty=false //No value skip adding property
        //TODO Convert time
        //     lookup ontology for unit
        o+=`^^${propertyType}`
      }
      //TODO
      //value + dataType
    }
    if(addProperty){
      this.addProperty({s,p,o})        
    }

  }
  makeNamedNode(mapping,__value__,context){
    //TODO verify possible issues with context here. 
    if(mapping.type=="class"){    
      if(context) context=Object.assign(context,{__value__})
      else context={__value__}

      let triple={s:"",p:"",o:""},naming_scheme=""

      //Subject
      naming_scheme=this.interpolator(mapping.naming_scheme,context)
      triple.s=`<raiz:${encodeURI(naming_scheme)}>`  //Sanitize node names as URIs
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
          //Not an issue writting takes time.
          //console.log(`An individual with this name:${name} has already been created: Triples has been discarded!`)
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
    let key=this.hash(triple)
    if(this.triples.properties[key]){
      //console.log(`The property triple already exists: ${JSON.stringify(triple)}`)
    }else{
      this.triples.properties[key]=triple
    }
  }
  isReferencedSubject(string){
    let re = new RegExp(/[#@]{[\w \(\)\/-\\*]+}/g)
    return string.match(re)
  }
  isReference(string){
    let re = new RegExp(/#{[\w \(\)\/-\\*]+}/g)
    return string.match(re)
  }
  makeObservationFromSubject(isSubject,value,mapping,context){
    let referenced_node;
    isSubject=isSubject[0].replace(/[#{}]/g,"")
    if (mapping.mapping[isSubject]){
      context.__value__=context[isSubject]
      referenced_node=this.interpolator(mapping.mapping[isSubject].naming_scheme,context,true)            
    }else{
      if(this.triples.individuals[isSubject]){
        referenced_node=isSubject
      }else{
        //Current version validates that existance of isSubject in individuals 
        //Use this block for some other exception like lookup on other mappings
        referenced_node=isSubject            
      }
    }
    return referenced_node
  }
  interpolator(string,context,lookup){
    let that=this
    let reserved_vars={
      __auto_increment__:this.auto_increment
    }
    let variables=[]
    let result=string
    let re = new RegExp(/@{[\w\ \(\)\/\*-]+}/g)
    let re2 = new RegExp(/[@{}]/g)
    let re3 = new RegExp(/@{[\w \(\)\/\*-]+}/)
    try{
      let isInterpolatable=this.isInterpolatable(string,re)
      if(isInterpolatable){  
        isInterpolatable.forEach(variable=>{
          let temp=variable.replace(re2,"")
          //Tests for reserved_vars: Autoincrement
          if(Object.keys(reserved_vars).includes(temp)){
            temp=reserved_vars[temp](string,that,lookup)        
          }else{
            temp=context[temp]  
          }
          variables.push(temp)
        })
        //Remove codings @{}
        variables.forEach(variable=>{
          result=result.replace(re3,variable)
        })
      }else{
        result=string  
      }
    }catch(err){
     console.log(err)
    }
    finally{
     return result 
    }
  }
  isInterpolatable(value,re){
    return value.match(re)
  }
  auto_increment(naming_scheme,that,lookup){
    let auto_increment=that.cache.auto_increment
    let value=null
    if(lookup){
      if(auto_increment[naming_scheme]){
        value=auto_increment[naming_scheme].value
      } //TODO ELSE value will be null
    }else{
      if(auto_increment[naming_scheme]){
        auto_increment[naming_scheme].value++
        value=auto_increment[naming_scheme].value
      }else{
        auto_increment[naming_scheme]={value:1}
        value=1
      }
    }
    return pad(value,6)

    function pad(num, size) {
      num = num.toString();
      while (num.length < size) num = "0" + num;
        return num;
    }
  }
  //Deprecated since currentLine is already organized this way. 
  makeNamedContext(keys,values){  //keys=headers, value=currentLine
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
  getXSDdatatypeURI(name){
    try{
      return xsd[name].value
    }catch (e){
      console.log(`Datatype: "${name}" was not found. Can't convert`,e)
      return "https://brapi.biodata.pt/undefined_Datatype"
    }
  }
  isXSDdatatype(name){
    try{
      return typeof xsd[name].value === "string"
    }catch (e){
      return false
    }
  }
  complete(element,that,recusion){
    let prefixes=Object.keys(that.triples.prefix)

    let re=new RegExp(/<(\w+):/)
    let match=element.match(re)
    if(match){
      if(prefixes.includes(match[1])){ 
        return element.replace(re,`<${that.triples.prefix[match[1]].url}`)
      }else{return element}
    }else{
      try{
        let literal=`\"${element.split("^^")[0]}\"`
        let qualifier=element.split("^^")[1]
        if(qualifier.startsWith("@")){
          return `${literal}${qualifier}`
        }else{
          if(recusion){
            console.log("No completion found")
            return element
          }else if(this.isXSDdatatype(qualifier)){
            return `${literal}^^<${this.getXSDdatatypeURI(qualifier)}>`
          }else{
            //TODO possible removal for this method
            // Not sure when this is useful
            return `${literal}^^${this.getXSDdatatypeURI(qualifier)}`//${that.complete(`<${qualifier}>`,that,true)}`
          }
        }
      }catch(err){
        console.log(err)
      }
    }
  }
}

module.exports=Triples