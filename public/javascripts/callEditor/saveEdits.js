  const attributeGlue="-"
  let callStructure=""
  let callStructureLoaded = {
    aInternal: false,
    aListener: function(val) {},
    set status(val) {
      this.aInternal = val;
      this.aListener(val);
    },
    get status() {
      return this.aInternal;
    },
    registerListener: function(listener) {
      this.aListener = listener;
    }
  }
  callStructureLoaded.registerListener(function(val){
    if(val=== true){
      callStructure=window.callStructure
      loadValues()
    }
  })
  //Export the function for laoder
  window.callStructureLoaded=callStructureLoaded
  function loadValues(){
    for( [callAttribute,value] of Object.entries(callStructure.result.data[0])){
      let attributes={array:[callAttribute],string:callAttribute}
      iterObject(attributes, callAttribute, value)
    }
  }


  $('.collapse').on("shown.bs.collapse",onInputChange)
  
  function onInputChange(evt,selector,data,handler){
    if(data) data=data.data
    let self=data || $(this)
    self.find(' > .card > .form-group > input').change(function(){
      let input=$(this)
      let callAttribute=self.attr('id') || self.closest('.collapse').attr('id')
      let attribute=input.attr('name')
      let value=input.val()
      let target=input.closest(".form-group").children('label').children('.badge-holder')
      let layer=parseInt(input.closest(".card").children('.card-title').attr('layer'))
      modifyCallStructure(callAttribute,layer,attribute,value,callStructure.result.data[0])
      saveCallStruture(target)
    })
  }


    
  function setTemporaryBadge(msg,target,options){
    let extraOptions={}
    //Add badge stating save was successful
    if(options){
      extraOptions.duration=options.duration || 5000
      extraOptions.type=options.type || "success"
    }
    let badge=mkel("span",{class:`badge bg-${extraOptions.type}`},target)
    badge.textContent=msg
    target.empty()
    target.append(badge)
    setTimeout(function(){
      target.empty()
    },extraOptions.duration)    
  }
  function modifyCallStructure(callAttribute,layer,inputAttribute,inputValue,callStructureFragment){
    let data=callStructureFragment
    if( data[callAttribute] ) {
      if (typeof data[callAttribute]["_sparQL"] === "object") {
        if (data[callAttribute]["_sparQL"].length < layer + 1) {
          data[callAttribute]["_sparQL"][layer] = {}
        }
        data[callAttribute]["_sparQL"][layer][inputAttribute] = value
      } else {
        let value = data[callAttribute]
        let previousValue
        if (typeof value === "object") {
          previousValue = Object.assign({}, data[callAttribute])
          delete previousValue["_sparQL"]
        } else {
          previousValue = data[callAttribute]
        }
        data[callAttribute] = {
          "_sparQL": [{
            [inputAttribute]: inputValue
          }],
          "_value": previousValue
        }

      }
    }else{
      if(callAttribute.includes("-")){
        callAttribute=callAttribute.split(attributeGlue)
        let topAttribute=callAttribute.shift()
        callAttribute=callAttribute.join(attributeGlue)
        if(callStructureFragment[topAttribute]){
          modifyCallStructure(callAttribute,layer,inputAttribute,inputValue,data[topAttribute])
        }

      }
    }
  }
  function addNewLayerOnClick(target){
    target.find('button.add-new-layer').click(addNewLayer)    
  }
  addNewLayerOnClick($("body"))
  function addNewLayer(evt,selector,data,handler){
    let target
    if(data) data=data.data
    if(data) target=data.target
    let self=target || $(this)
    let card=self.closest('.card')
    let newCard=card.clone()
    let newCardTitle=newCard.children('.card-title')
    let layer=parseInt(newCardTitle.attr("layer"))+1
    newCard.attr('layer',layer)
    newCard.find('input').each(function(){
      let previousId=$(this).attr('id')
      let newId=previousId.replace(/layer(\d)/,`layer${layer}`)
      $(this).attr('id',newId)
    })
    newCardTitle.text(`Layer ${layer}`)
    newCardTitle.attr("layer",layer)
    card.closest('.collapse').append(newCard)
    newCard=card.closest('.collapse').children('.card').last()
    newCard.children('input').each(function(){
      let self=$(this)
      self.val("")
    })
    onInputChange(null,null,{data:newCard})
    self.remove()
    if(data){
      if(data.callback){
        self=data
        self.callback(self.layerData,self.layer,self.callAttribute)
      }
    }
    let select=newCard.find('select')
    let classNameShortHand=card.find('input[name|=class]').val()
    loadOptionsForNextLayer(classNameShortHand,select)  
    addSelectPropertyOnChange(newCard)
    addNewLayerOnClick(newCard)
  }

  function addSelectPropertyOnChange(target){
    target.find('.form-group select').change(selectProperty)  
  }
  addSelectPropertyOnChange($('body'))
  function selectProperty(evt,selector,data,handler){
    if(data) data=data.data
    let self=data || $(this)
    let selectedOptions=self[0].selectedOptions[0]
    let card=self.closest('.card')
    
    let classNameShortHand=selectedOptions.attributes['classnameshorthand'].value
    let propertyShortHand=selectedOptions.attributes['propertyshorthand'].value
    
    let classInput=card.find('input[name|=class]')
    let propertyInput=card.find('input[name|=property]')
    classInput.val(classNameShortHand)
    classInput.trigger('change')
    propertyInput.val(propertyShortHand)
    propertyInput.trigger('change')
    
  }
  
  async function loadOptionsForNextLayer(ontoTerm,target){
   let queryResults
   try{
     ontoTerm=ontoTerm.split(":")[1]
     queryResults=await getRelatedItems(ontoTerm)
    target.empty()  
   }catch(err){
    console.log(err)
   }
   mkel("option",{},target)
   queryResults.forEach(double=>{
     let {className,property}=double
     className=double.class 
     let classNameShortHand=className.replace("http://purl.org/ppeo/PPEO.owl#","ppeo:")
     let propertyShortHand=property.replace("http://purl.org/ppeo/PPEO.owl#","ppeo:")
     let option=mkel("option",{className,property,propertyShortHand,classNameShortHand},target)
     option.text=`Property:[${propertyShortHand}] | Class:[${classNameShortHand}]` 
   })
  }

