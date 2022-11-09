function capitalize(text){
    text=text.replace(/[-_]/," ").replace(/([A-Z])/," $1")
    let result=""
    let splitText=text.split(/[-_ ]/g)
    for(word of splitText){
        let lower=word.toLowerCase()
        result+=word.charAt(0).toUpperCase()+lower.slice(1)+" "
    }
    return result
}
function formatName(text){
    return text.replace(/ /g,"_").toLowerCase()
}

function updateWorksheetCompleteness(selection,completeness,currentWorksheet){
    let countCompleteColumns=0
    Object.entries(selection[currentWorksheet]).forEach(([column,columnData])=>{
        identifyCompleteness(completeness,currentWorksheet,column,columnData)
        countCompleteColumns+= completeness[currentWorksheet].columns[column].complete ? 1 : 0
    })
    //must be done this way or else vue will detect the value changes, due to the increment in value.
    completeness[currentWorksheet].complete=countCompleteColumns
}
function updateCompleteness(selection,completeness){
    Object.keys(completeness).forEach(worksheet=>{
        updateWorksheetCompleteness(selection,completeness,worksheet)
    })
}
function identifyCompleteness(completeness,currentWorksheet,column,columnData){
    column=column
    columnData=columnData
    let attributes=["type","name","naming_scheme"]
    let result=true
    attributes.forEach(attr=>{

        if(typeof columnData[attr] === "string"){
            //if string and length == 0 result will become false
            result= result && columnData[attr].length > 0
        }else{
            result= result && true
        }
    })
    completeness[currentWorksheet].columns[column].complete=result
    //TODO check if it's filled
    // property.name !=== "" can't do thing on a oneliner because if property doesn't exist it will induce an error. But this is incomplete
    let initialAmount=0
    completeness[currentWorksheet].columns[column].objectProperties=columnData.objectProperties.reduce( (amount ,objectProperty)=> {
        if (objectProperty.property !== "" && objectProperty.referenceNode !== "" && objectProperty.show == true){
            return amount + ( objectProperty.property.name !== "" ? 1 : 0 )
        }else{
            return amount
        }
    }, initialAmount=0)

    completeness[currentWorksheet].columns[column].dataProperties=columnData.dataProperties.reduce( (amount, dataProperty)=>{
        amount = amount + ( ( dataProperty.referenceNode !== ""  && dataProperty.show ) == true ? 1:0)
        return amount
        }, initialAmount=0

    )
}

function getWorksheets(jSheet){
    return jSheet.SheetNames
}
function getColumns(jSheet,worksheet){
    return jSheet.headers[worksheet]
}

function makeCompleteness(jSheet){
    let workSheetStructure=window.structures.completeness.worksheet
    let columnStructure=window.structures.completeness.column

    function loadColumns(workSheetStructure,columnStructure,jSheet){
        let result={}
        getWorksheets(jSheet).map(worksheet=>{
            let currentWorksheet=worksheet
            result[currentWorksheet]=Object.assign({},workSheetStructure)
            result[currentWorksheet].columns={}
            result[currentWorksheet].columnNames=getColumns(jSheet,currentWorksheet)
            result[currentWorksheet].total=result[currentWorksheet].columnNames.length
            result[currentWorksheet].columnNames.map(column=>{
                result[currentWorksheet].columns[column]=Object.assign({},columnStructure)
            })
        })
        return result
    }
    return loadColumns(workSheetStructure,columnStructure,jSheet)
}
//TODO
// not finished
function validateSelectionJSON(jSheet,$data,completeness){
    //TODO overwrites the saved Selection
    window.selection=$data

    try{
        let worksheets=jSheet.SheetNames
        //check if all are present
        //add missing
        let missingWorksheets=[]
        let extraWorksheets=[]
        //Each WorkSheet
        function forEach(object,callback){
            Object.entries(object).forEach(([key,value])=>{
                callback(key,value)
            })
        }
        forEach($data,(worksheet,selectionSheetMeta)=>{
            if ( worksheets.indexOf(worksheet) === -1 ){
                extraWorksheets.push(worksheet)
            }else{
                let selectionExtraColumns=[]
                let selectionMissingColumns=[]
                let jSheetColumns=getColumns(jSheet,worksheet)
                let selectionColumns=Object.keys(selectionSheetMeta)

                //Each Column in worksheet
                forEach(selectionSheetMeta,(selectionColumn,selectionColumnEntries)=>{
                    if(selectionColumnEntries.type.name!=="class"){ //Clear properties from non-class columns
                        if( selectionColumnEntries.dataProperties.length>0 || selectionColumnEntries.objectProperties.length>0){
                            selectionColumnEntries.dataProperties=[]
                            selectionColumnEntries.objectProperties=[]
                        }
                    }
                    if (jSheetColumns.indexOf(selectionColumn) === -1){
                        selectionExtraColumns.push(selectionColumn)
                    }
                })

                //Make named Function out of it
                jSheetColumns.forEach(jSheetColumn=>{
                    //TODO fix completeness
                    if(selectionColumns.indexOf(jSheetColumn) === -1 ){
                        selectionMissingColumns.push(jSheetColumn)
                    }
                })
                function syncColumnsInCompletenessAndSelection(selection,completeness){
                    let completenessMissingColumns=[]
                    Object.keys(selection[worksheet]).forEach(column=>{
                        if(completeness[worksheet].columnNames.indexOf(column) === -1){
                            completenessMissingColumns.push(column)
                        }
                    })
                    completenessMissingColumns.forEach(column=>{
                        window.structures.addColumnToCompleteness(completeness,worksheet,column)
                    })
                }

                if(selectionExtraColumns.length > 0 || selectionMissingColumns.length > 0){
                    displayToast("Mismatch between Mapping and SpreadSheet",`Uploaded mapping has <${worksheet}> with the following missing columns: << ${selectionMissingColumns} >>. And your spreadsheet doesn't have the following columns: << ${selectionExtraColumns} >> present in your mapping.`,600000)
                }


                //AddsMissingColumnsToSelection
                selectionMissingColumns.forEach( column=>$data=window.structures.addColumnToSelection($data,worksheet,column) )
                if(completeness) syncColumnsInCompletenessAndSelection(selection,completeness)
            }
        })
        Object.entries($data).forEach(([worksheet,selectionSheetMeta])=>{


        })
        worksheets.forEach(worksheet=>{
            if( Object.keys($data).indexOf(worksheet)===-1) missingWorksheets.push(worksheet)
        })
        //deletes extraWorksheets
        extraWorksheets.forEach(worksheet=>delete $data[worksheet])
        //adds Missing worksheets
        missingWorksheets.forEach(worksheet=>{
            $data[worksheet]={}
            getColumns(jSheet,worksheet).forEach( column=>{
                $data=window.structures.addColumnToSelection($data,worksheet,column)
            })
        })
        return $data
    }catch(err){
        console.log("Invalid Selection JSON!")
        throw err
    }
}

function syncHorizontalScrolls(self){  //
    let gridEl=$('.grid')
    let dummyScrollDiv=self.closest('div').nextAll('.preview-table').find('.scroll .dummy')
    let tableScroll=self.closest('div').nextAll('.preview-table').find('.table-div')
    tableScroll.html(gridEl)//gridEl

    dummyScrollDiv.width(self.closest('div').nextAll('.preview-table').find('canvas-datagrid').width())
    $(function(){
        let dummyScroll=dummyScrollDiv.closest('.scroll');
        dummyScroll.scroll(function(){
            tableScroll.scrollLeft(dummyScroll.scrollLeft());
        });
        tableScroll.scroll(function(){
            dummyScroll.scrollLeft(tableScroll.scrollLeft());
        });
    });
}

function makeProgressBar(identifier){
    let progress=mkel('div',{class:`progress ${identifier}`})
    mkel("div",{
        class:"progress-bar bg-success",
        role:'progressbar'
    },progress)
    return progress
}
function makePreviewTable(self,data){
    let table=mkel("table",{class:"table preview-augment-file"})
    let dummyScrollDiv=self.closest('div').nextAll('.preview-table').find('.scroll .dummy')
    let tableScroll=self.closest('div').nextAll('.preview-table').children('.table-div')
    tableScroll.html(table)
    tableScroll.closest('.preview-table').removeClass('d-none')
    table.append(makeRow({},data.filePreview[0].split('\t'),{ondrop:"drop(event)",ondragover:"allowDrop(event)"},true))
    Array.from(table.children[0].children).forEach(el=>{el.textContent=""}) //Clear newly created row. //Should build the row in another manner
    data.filePreview.forEach((line,index)=>{
        table.append(makeRow({},line.split("\t"),{},index==0))
    })
    dummyScrollDiv.width(self.closest('div').nextAll('.preview-table').find('table.table').width())
    $(function(){
        let dummyScroll=dummyScrollDiv.closest('.scroll');
        dummyScroll.scroll(function(){
            tableScroll.scrollLeft(dummyScroll.scrollLeft());
        });
        tableScroll.scroll(function(){
            dummyScroll.scrollLeft(tableScroll.scrollLeft());
        });
    });
    return tableScroll.children('table')
}

function loadOntoTerms(data){
    let cardBody=$('.ontology-terms .card-body')  
    cardBody.empty()
    window.ontologies={}
    window.ontologies.ppeo={}
    window.ontologies.ppeo=data

    Object.entries(data).forEach(([key,value])=>{
        cardBody.append(makeOntoCard(key,value))
    })  
}
//TODO get the xsd properties
function loadOntologyDataToFormOptions(formOptions){
    try{
        //Classes
        formOptions.name.Class=window.ontologies.ppeo[`http://www.w3.org/2002/07/owl#Class`].map((term)=>{return {name:term.split("#")[1],label:term.split("#")[1]}})
        window.ontologies.ppeo[`http://www.w3.org/2002/07/owl#NamedIndividual`].map((term)=>{formOptions.name.Class.push({name:term.split("#")[1],label:term.split("#")[1]})})
        //ObjectProperties
        formOptions.name.ObjectProperty=window.ontologies.ppeo[`http://www.w3.org/2002/07/owl#ObjectProperty`].map((term)=>{return {name:term.split("#")[1],label:term.split("#")[1]}})
        //Repeated all of them
        //window.ontologies.ppeo[`http://www.w3.org/2002/07/owl#TransitiveProperty`].map((term)=>{formOptions.name.ObjectProperty.push({name:term.split("#")[1],label:term.split("#")[1]})})
        //DataProperties
        formOptions.name.DataProperty=window.ontologies.ppeo[`http://www.w3.org/2002/07/owl#DatatypeProperty`].map((term)=>{return {name:term.split("#")[1],label:term.split("#")[1]}})
        window.ontologies.ppeo[`http://www.w3.org/2002/07/owl#AnnotationProperty`].map((term)=>{formOptions.name.DataProperty.push({name:term.split("#")[1],label:term.split("#")[1]})})
        //Repeated most of them!!!
        //window.ontologies.ppeo[`http://www.w3.org/2002/07/owl#FunctionalProperty`].map((term)=>{formOptions.name.DataProperty.push({name:term.split("#")[1],label:term.split("#")[1]})})
        window.ontologies.ppeo[`http://www.w3.org/2002/07/owl#IrreflexiveProperty`].map((term)=>{formOptions.name.DataProperty.push({name:term.split("#")[1],label:term.split("#")[1]})})
        //Not sure this is correctly classified
        window.ontologies.ppeo[`http://purl.org/ppeo/PPEO.owl#spatial_coordinate`].map((term)=>{formOptions.name.DataProperty.push({name:term.split("#")[1],label:term.split("#")[1]})})
    }catch(err){
        console.log("Ontologies haven't loaded yet")
        displayToast("Ontologies haven't loaded!",err,4000)
    }
}
async function loadXSDdatatypes(){
    return new Promise((res,rej)=>{
        $.ajax({
            url:"/query/xsd/datatypes",
            method:"GET",
            success:function(data,textStatus,jqXHR){
                res(data)
            },
            error:function(jqXHR,textStatus,err){
                displayToast("Error",err,4000)
                rej(err)
            }
        })
    })
}
async function loadDataStructure(name){
    return new Promise((res,rej)=>{
        $.ajax({
            url:`/query/dataStructures/${name}`,
            method:"GET",
            success:function(data,textStatus,jqXHR){
                res(data)
            },
            error:function(jqXHR,textStatus,err){
                displayToast("Error loading dataStructure",err,4000)
                rej(err)
            }
        })
    })
}
function updateGraph(selection,formOptions,worksheet,graph){
    extractNodes(graph,selection,formOptions,worksheet)
    extractLinks(graph,selection,formOptions,worksheet)
    loadChart(graph,"graph-demo")
    function extractNodes(graph,selection,formOptions,worksheet){
        graph.nodes=[]
        Object.entries(selection[worksheet]).forEach(([column,columnAttributes])=>{
            try {
                if(columnAttributes.type.name==="class" && columnAttributes.name.name){
                    let nodeName=columnAttributes.name.name
                    if(nodeName.length>0){
                        let nodeIndex=formOptions.name.Class.findIndex(term=> term.name==nodeName)
                        graph.nodes.push({id:nodeName,group:nodeIndex})
                    }
                }
            }catch(err){
                displayToast("Error loading a node for graph",err)
            }
        })
    }
    function extractLinks(graph,selection,formOptions,worksheet){
        graph.links=[]
        Object.entries(selection[worksheet]).forEach(([column,columnAttributes])=>{
            if(columnAttributes.type.name==="class") {
                columnAttributes.objectProperties.forEach(property => {
                    try {
                        if (property.show === true && property.referenceNode !== '') {
                            let source = selection[worksheet][column].name.label
                            let target = selection[worksheet][property.referenceNode].name.label
                            let targetType = selection[worksheet][property.referenceNode].type.name

                            let selectedObjectProperty = property.property.name
                            let valueIndex = formOptions.name.ObjectProperty.findIndex(property => property.name === selectedObjectProperty)
                            if (typeof source === "string" && typeof target === "string" && typeof valueIndex === "number" && targetType == "class") {
                                graph.links.push({source, target, value: valueIndex})
                            }
                        }
                    } catch (err) {
                        displayToast("Unable to load one of your object properties")
                    }
                })
            }
        })
    }
}
function makeOntoCard(header,body){
    let rdfType=header.split("#")[1]
    let title=mkel('button',{
      class:"btn btn-link btn-block text-left",
      title:header,
      type:'button',
      "data-bs-toggle":'collapse',
      "data-bs-target":`#item-${rdfType}`,
      "aria-expanded":'false', 
      "aria-controls":rdfType,
      id:`drag-${rdfType}`
    })
    title.textContent=rdfType
    
    let ul=mkel("ul",{class:"list-group"}) 
    body.forEach(item=>{
      let li=mkel('li',{
      class:"list-group-item",

      draggable:"true",
      title:item,
      ondragstart:"drag(event)",
      id:item.split("#")[1]
      },ul)
      li.textContent=item.split("#")[1]
    })
    let card=makeCard(title,ul)
    return card
}
function makeCard(header,body){
    let card=mkel('div',{class:"card accordion",id:`parent-${header.textContent}`})
    let cardHeader=mkel('div',{class:"card-header",id:header.textContent},card)
    let collapse=mkel('div',{
      id:`item-${header.textContent}`,
      class:"collapse",
      "aria-labelledby":header.textContent,
      "data-bs-parent":`parent-${header.textContent}`,
    },card)
    let cardBody=mkel('div',{class:"card-body"},collapse)
    cardHeader.append(header)
    cardBody.append(body)
    return card
}


window.allowDrop=function(ev) {
    ev.preventDefault();
}
window.drag=function(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}
window.drop=function(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
}