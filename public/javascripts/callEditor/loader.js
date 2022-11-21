Vue.component('subitemObject',{
    template: $('#template-object').clone()[0],
    props:{
        subItem:{type: String},
        attribute:{type: String},
        subType:{type:String},
        callStructure:{type:Object},
        dataProperties:{type:Object},
        objectProperties:{type:Object}
    },
    computed: {
        mapping: function () {
            if (this.callStructure.result) {
                if (this.callStructure.result.data[0][this.attribute])
                    return this.callStructure.result.data[0][this.attribute]
            } else {
                return {}
            }
        },
    },
    data: function(){
        return {

        }
    }
})
Vue.component('test',{
    template: $('#template-test').clone()[0],
    props:{
        tester:{type: String}
    }
})
function dynamicLayer(name) {
    Vue.component(name, {
        template: $('#template-layer').clone()[0],
        props: {
            callStructure: {type: Object},
            dataProperties: {type: Object},
            objectProperties: {type: Object},
            layer: {type: Number},
            attribute: {type: String},
            subType:{type:String},
            subItem: {type:String}
        },
        data: function () {
            return {}
        },
        computed: {
            mapping: function () {
                if (this.callStructure.result) {
                    if (this.callStructure.result.data[0][this.attribute])
                        if(this.subType=="object"){
                            return this.callStructure.result.data[0][this.attribute][this.subItem]
                        }else {
                            return this.callStructure.result.data[0][this.attribute]
                        }
                } else {
                    return {}
                }
            },
            className: function () {
                if (this.mapping._sparQL) {
                    return this.mapping._sparQL[this.layer].class
                } else {
                    return ""
                }
            },
            property: function () {
                if (this.mapping._sparQL) {
                    return this.mapping._sparQL[this.layer].property
                } else {
                    return ""
                }
            },
            anchor: function () {
                if (this.callStructure._anchor) {
                    if (this.layer == 0) {
                        return this.callStructure._anchor.class
                    } else if (this.layer > 0) {
                        //TODO check if it's a object property before adding new layer
                        try {
                            let lastClass = this.mapping._sparQL[this.layer - 1].class.split("#")[1]
                            if (this.objectProperties[lastClass] === undefined) {
                                this.loadMissingProperty(lastClass)
                            }
                            return lastClass
                        } catch (e) {
                            console.log("Error getting new anchor for this layer: ", e)
                            return this.callStructure._anchor.class
                        }
                    }
                } else {
                    return ""
                }
            },
            canHideLayer: function () {
                try {
                    if (this.className.split("#")[1] === undefined)
                        return true
                    else if (this.className.split("#")[1] !== this.anchor && this.anchor !== "")
                        return false
                    else
                        return true
                } catch (e) {
                    //If it catches an error it's not ready so hide
                    return true
                }
            }

        },
        methods: {
            async loadMissingProperty(className) {
                this.objectProperties[className] = await $.get(`/query/inferred/objectProperty/${className}`)
                this.dataProperties[className] = await $.get(`/query/inferred/dataProperty/${className}`)
            },
            loadValues(id) {
                let that = this
                id = id || this.attribute
                this.$children.filter(child => child.$attrs.attribute == id)
                    .forEach(vselect => {
                        try {
                            let className = vselect.$attrs.anchor
                            let properties = that.objectProperties[className].concat(that.dataProperties[className])
                            let layer = parseInt(that.layer)
                            //let layer = parseInt(vselect.$attrs.layer)  Old
                            //if (layer == 0) {
                            //this.mapping[id]=[{className:"",property:""}]
                            //}else if (layer >= this.mapping.length && layer != 0) {
                            //this.mapping[id].push({className:"",property:""})
                            //} else {
                            //Not necessary it aready exists
                            //this.mapping[id][layer]={className:"",property:""}
                            //}  //TODO layer0 only
                            vselect.options = properties;
                            vselect.loading = false
                        } catch (e) {
                            console.log("Failed to load Properties")
                        }
                    })

            },
            saveInputValue(event, dataType) {
                let input = event ? event.target : $(`#${this.attribute} [layer|= ${this.layer}] input[name|=${dataType}]:nth(0)`)
                dataType = dataType || input.name
                let value = input.value || input.val()
                let target = input.closest('.form-group').children('label').children('.badge-holder')
                modifyCallStructure(this.attribute, this.layer, dataType, value, this.mapping)
                saveCallStruture(target)
            },
            setValueForLayer(val) {
                //TODO subType Object and Array
                if (this.mapping._sparQL) {
                    this.mapping._sparQL[this.layer].class = val.class
                    this.mapping._sparQL[this.layer].property = val.label
                    //Test if the layer that was just saved was a lower lever. In that case the levels above should be removed to be corrected
                    if (this.layer < this.mapping._sparQL.length - 1) {
                        for (let i = this.mapping._sparQL.length - 1; i > this.layer; i--) {
                            this.callStructure.result.data[0][this.attribute]._sparQL.pop()
                        }
                    }
                } else {
                    let prevValue = this.mapping
                    this.callStructure.result.data[0][this.attribute] = {
                        _sparQL: [{
                            class: val.class,
                            property: val.label
                        }], _value: prevValue
                    }
                }
                this.saveInputValue(null, "class")
                this.saveInputValue(null, "property")
                let className = val.class.split("#")[1]
                if (this.anchor != className)
                    this.loadMissingProperty(className)
            },
            addNewLayer2() {
                let layers = this.mapping._sparQL
                if (layers) {
                    layers.push({class: "", property: ""})
                } else {
                    let value = this.mapping
                    this.callStructure.result.data[0][this.attribute] = {_sparQL: [], _value: value}
                }
            },
            //TODO rewrite into 2 and replace
            addNewLayer(evt) {
                let target
                if (data) data = data.data
                if (data) target = data.target
                let self = target || $(this)
                //let card=self.closest('.card')
                let card = $(``)
                let newCard = card.clone()
                let newCardTitle = newCard.children('.card-title')
                let layer = parseInt(newCardTitle.attr("layer")) + 1
                newCard.attr('layer', layer)
                newCard.find('input').each(function () {
                    let previousId = $(this).attr('id')
                    let newId = previousId.replace(/layer(\d)/, `layer${layer}`)
                    $(this).attr('id', newId)
                })
                newCardTitle.text(`Layer ${layer}`)
                newCardTitle.attr("layer", layer)
                card.closest('.collapse').append(newCard)
                newCard = card.closest('.collapse').children('.card').last()
                newCard.children('input').each(function () {
                    let self = $(this)
                    self.val("")
                })
                onInputChange(null, null, {data: newCard})
                self.remove()
                if (data) {
                    if (data.callback) {
                        self = data
                        self.callback(self.layerData, self.layer, self.callAttribute)
                    }
                }
                let select = newCard.find('select')
                let classNameShortHand = card.find('input[name|=class]').val()
                loadOptionsForNextLayer(classNameShortHand, select)
                addSelectPropertyOnChange(newCard)
                addNewLayerOnClick(newCard)
            }
        },
        mounted: function () {
            //this.loadValues()
            //addNewLayerOnClick(element)
            //addSelectPropertyOnChange(element)

        }
    })
}
dynamicLayer("layer")
dynamicLayer("layer-sub-object")
window.vmapping = new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
    el: "#mapping",
    data: {
        dataProperties: {},
        objectProperties: {},
        mapping: {},
        className: $('#mapping').attr('anchor'),
        callStructure: {}
    },
    computed: {},
    methods: {
        valueType(attribute) {
            let key = this.callStructure.result.data[0][attribute]
            if (typeof key === "object")
                if (key._sparQL) {
                    return "directProcessed"
                } else if (key instanceof Array) {
                    return "array"
                } else {
                    return "object"
                }
            else return "direct"
        }
    },
    beforeMount: async function () {
        //Loads the Properties on all v-select
        this.objectProperties[this.className] = await $.get(`/query/inferred/objectProperty/${this.className}`)
        this.dataProperties[this.className] = await $.get(`/query/inferred/dataProperty/${this.className}`)
        let that = this
        /*window.vmapping.$children.filter(child=> child.$vnode.tag.startsWith("vue-component"))
            .forEach(
                layer=>{
                    //vselect.options=this.dataProperties[this.className]
                    let id=layer.$children[0].$attrs.attribute
                    //that.mapping[id]=[]
                    //layer.loadValues(id)
                    layer.$children[0].loading=false

                }
            )

         */
    }
})

Vue.component('v-select', VueSelect.VueSelect);

Vue.config.warnHandler = function (msg, vm, trace) {
    if (msg === `Avoid mutating a prop directly since the value will be overwritten whenever the parent component re-renders. Instead, use a data or computed property based on the prop's value. Prop being mutated: "column"`) {
        //Do nothing
    }
}

// Loads JSON call spec
$.ajax({
    url:window.location.pathname.replace(/map$/,"json"),
    method:"get",
    success:function(data,textStatus,jqXHR){
        (function triggerLoadingOfCallStructure(data) {
            if(window.callStructureLoaded){
                window.callStructure = data
                window.callStructureLoaded.status = true
            }else{
                setTimeout(function () {
                    triggerLoadingOfCallStructure(data)
                }, 1000)
            }
        })(data)
    },
    error:function(jqXHR,textStatus,error){
        console.log(error)
    }
})

function getRelatedItems(ontoTerm){
    ////THIS is ClassProperties from
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
            $(`button[attribute|="${attributes.string}"]`).addClass('dropdown-toggle').removeClass('btn-primary').addClass('btn-warning')

            if(typeof value[0] === "string"){

            }else{
             //TODO Objects inside Array
            }
        }else{
            if(Object.keys(value).length !== 2 ){
                $(`button[attribute|="${attributes.string}"]`).addClass('dropdown-toggle').removeClass('btn-primary').addClass('btn-secondary')
            }else{
                if(Object.keys(value).indexOf('_sparql')!==-1){
                    $(`button[attribute|="${attributes.string}"]`).addClass('dropdown-toggle').removeClass('btn-primary').addClass('btn-secondary')
                }else{
                    //Fills in the button value
                    $(`button[attribute|="${attributes.string}"]`).children('span.badge').text(value["_value"])
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
        $(`button[attribute|="${attributes.string}"]`).children('span.badge').text(value)
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