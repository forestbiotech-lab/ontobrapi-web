
// Loads JSON call spec
$.ajax({
    url:window.location.pathname.replace(/map$/,"json"),
    method:"get",
    success:function(data,textStatus,jqXHR){
        window.callStructure=data
        window.callStructureLoaded.status=true
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


function saveCallStruture(target){
    $.ajax({
        url:window.location.pathname.replace(/map$/,"update"),
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




//---------------------------------
function iterObject(attributes,callAttribute,value){
    if(typeof value === "object"){
        if( value instanceof Array){
            $(`button[key|='${attributes.string}']`).addClass('dropdown-toggle').removeClass('btn-primary').addClass('btn-warning')

            if(typeof value[0] === "string"){

            }else{
             //TODO Objects inside Array
            }
        }else{
            if(Object.keys(value).length !== 2 ){
                $(`button[key|='${attributes.string}']`).addClass('dropdown-toggle').removeClass('btn-primary').addClass('btn-secondary')
            }else{
                if(Object.keys(value).indexOf('_sparql')!==-1){
                    $(`button[key|='${attributes.string}']`).addClass('dropdown-toggle').removeClass('btn-primary').addClass('btn-secondary')
                }else{
                    $(`button[key|='${attributes.string}']`).children('span.badge').text(value["_value"])
                }
            }
            let target=$(`.collapse#${attributes.string}`)
            if(!Object.keys(value).includes("_sparQL") && Object.keys(value).length!=2)
                target.empty()
            let table=mkel("table",{},target)


            for( var [subAttr,subValue] of Object.entries(value)) {

                if (subAttr === '_sparQL') {
                    value['_sparQL'].forEach((layerData, layer) => {
                        if (layer > 0) {
                            let data = {
                                layerData,
                                longAttribute:attributes.string,
                                layer,
                                callback: loadEntries,
                                target: $(`.collapse[id|=${callAttribute}] .card-title[layer|=${layer - 1}]`).closest('.card').find('button.add-new-layer').first()
                            } //So its removed
                            addNewLayer(null, null, {data})
                        } else {
                            loadEntries(layerData, layer, attributes.string)
                        }

                        function loadEntries(layerData, layer, longAttribute) {
                            Object.entries(layerData).forEach(([attribute, val]) => {
                                $(`.collapse#${longAttribute} .form-group input#layer${layer}-${attribute}`).val(val)
                            })
                        }

                    })
                }else if(subAttr === '_value'){
                    //TODO - Use for deeper buttons
                }else{
                    attributes.array.push(subAttr)
                    attributes.string=attributes['array'].join(attributeGlue)
                    let element=$('tr.template-element').clone()
                    fillElement(element,table,subAttr,attributes)
                    iterObject(attributes,subAttr,subValue)
                }

            }
        }


    }else if(typeof value === "string"){
        $(`button[key|='${attributes.string}']`).children('span.badge').text(value)
    }
}


function fillElement(element,table,attr,attributes){
    element.removeClass("template-element")
    let button = element.find('button')
    button.attr('data-bs-target',`#${attributes.string}`)
    button.attr('aria-controls',`#${attributes.string}`)
    button.attr('key',`${attributes.string}`)
    let collapse = element.find('.collapse')
    collapse.attr('id',`${attributes.string}`)
    button.find('span.button-text').text(attr)
    table.append(element[0])
    addNewLayerOnClick(element)
    addSelectPropertyOnChange(element)
    element.find('.collapse').on("shown.bs.collapse",onInputChange)
}