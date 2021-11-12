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

function traverseWorkSheets(data){  //TODO is it used? For any thing?
    let result={}

    Object.entries(data).forEach(([worksheetName,worksheetData])=>{
        result[worksheetName]=getWorksheetColumns(worksheetData)
    })
    return result
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
    completeness[currentWorksheet].columns[column].objectProperties=columnData.objectProperties.length
    completeness[currentWorksheet].columns[column].dataProperties=columnData.dataProperties.length
}

function getWorksheets(jSheet){
    return jSheet.SheetNames
}
function getColumns(jSheet,worksheet){
    return jSheet.headers[worksheet]
}

function makeCompleteness(jSheet){
    let workSheetStructure={
        complete:0,
        total:0,
        columnNames:[],
        columns:{}
    }
    let columnStructure={
        complete:false,
        dataProperties:0,
        objectProperties:0
    }

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
function validateSelectionJSON(jSheet,$data,selectionScheme){
    window.selection=$data
    try{
        let worksheets=jSheet.SheetNames
        //check if all are present
        //add missing
        let missingWorksheets=[]
        let extraWorksheets=[]
        Object.entries($data).forEach(([worksheet,sheetMeta])=>{
            if ( worksheets.indexOf(worksheet) === -1 ){
                extraWorksheets.push(worksheet)
            }else{
                let extraColumns=[]
                Object.entries(sheetMeta).forEach(([column,selection])=>{
                    //if( Object.keys(jSheet.jsonSheets[worksheet]) )
                })
            }

        })
        worksheets.forEach(worksheet=>{
            if( Object.keys($data).indexOf(worksheet)===-1) missingWorksheets.push(worksheet)
        })
        //deletes extraWorksheets
        extraWorksheets.forEach(worksheet=>delete $data[worksheet])
        //adds Missing worksheets
        missingWorksheets.forEach(worksheet=>{
            Object.keys(jSheet.jsonSheets[worksheet][0]).map(column=>{{$data[worksheet][column]=Object.assign({},selectionScheme)}})
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
            columnAttributes.objectProperties.forEach(property=>{
                try{
                    if (property.show===true) {
                        let source = selection[worksheet][column].name.label
                        let target = selection[worksheet][property.referenceNode].name.label
                        let selectedObjectProperty = property.property.name
                        let valueIndex = formOptions.name.ObjectProperty.findIndex(property => property.name === selectedObjectProperty)
                        if (typeof source === "string" && typeof target === "string" && typeof valueIndex === "number") {
                            graph.links.push({source, target, value: valueIndex})
                        }
                    }
                }catch(err){
                    displayToast("Unable to load one of your object properties")
                }
            })
        })
    }
}
function makeOntoCard(header,body){
    let rdfType=header.split("#")[1]
    let title=mkel('button',{
      class:"btn btn-link btn-block text-left",
      title:header,
      type:'button',
      "data-toggle":'collapse',
      "data-target":`#${rdfType}`,
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
    let card=mkel('div',{class:"card"})
    let cardHeader=mkel('div',{class:"card-header",id:header.textContent},card)
    let collapse=mkel('div',{
      id:header.textContent,
      class:"collapse",
      "aria-labelledby":header.textContent,
      "data-parent":'#accordian-rdf-type'
    },card)
    let cardBody=mkel('div',{class:"card-body"},collapse)
    cardHeader.append(header)
    cardBody.append(body)
    return card
}


//Possible removal
function listCompleteAttributesAndProperties(data){
    traverseWorkSheets(data)
    //TODO load completeness template

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