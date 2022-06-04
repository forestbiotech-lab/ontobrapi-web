
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
            //TODO process arrays
            $(`button[key|='${attributes.string}']`).addClass('dropdown-toggle').removeClass('btn-primary').addClass('btn-warning')
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
            target.empty()
            let table=mkel("table",{},target)

            for( var [subAttr,subValue] of Object.entries(value)) {
                attributes.array.push(subAttr)
                attributes.string=attributes['array'].join(attributeGlue)
                if (subAttr === '_sparQL') {
                    value['_sparQL'].forEach((layerData, layer) => {
                        if (layer > 0) {
                            let data = {
                                layerData,
                                callAttribute,
                                layer,
                                callback: loadEntries,
                                target: $(`.collapse[id|=${callAttribute}] .card-title[layer|=${layer - 1}]`).closest('.card').find('button.add-new-layer').first()
                            } //So its removed
                            addNewLayer(null, null, {data})
                            let ss = $('.form-group select')
                        } else {
                            //TODO Recursive I have to do the same as I did for Modify Call Structure
                            loadEntries(layerData, layer, callAttribute)
                        }

                        function loadEntries(layerData, layer, callAttribute) {
                            Object.entries(layerData).forEach(([attribute, val]) => {
                                $(`.form-group input#layer${layer}-${callAttribute}-${attribute}`).val(val)
                            })
                        }

                    })
                }else if(subAttr === '_value'){
                    //TODO - Use for deeper buttons
                }else{
                    let element=$('tr.template-element').clone()
                    fillElement(element,table,subAttr,attributes)
                    iterObject(attributes,subAttr,subValue)
                }

            }
        }


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
    // TODO on change
    // --
}