$('document').ready(function(){
  $('button.upload-augment-file').on('click', function (){
    $('input#augment-file').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
  });
  $('input#augment-file').on('change', function(){
    let self=$(this)
    var files = $(this).get(0).files;
    if (files.length == 1){
      // One or more files selected, process the file upload

      // create a FormData object which will be sent as the data payload in the
      // AJAX request
      var formData = new FormData();
      // loop through all the selected files
      formData.append('uploads[]', files[0], files[0].name);
      
      $.ajax({
        url: `/forms/datafile/upload`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(data,textStatus,jqXHR){
          if(success) success(data)
        },
        fail: function(jqXHR,textStatus,err){
          displayToast("Error",err,4000)
        },
        xhr: function() {
          return progress()
        }
      });
      function progress(){
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // listen to the 'progress' event
        xhr.upload.addEventListener('progress', function(evt) {
          let progressBar=makeProgressBar("progress-augment-dynamic")
          let pocketProgress=self.closest('.form-group').children('.pocket-progress')
          pocketProgress.empty()
          pocketProgress.append(progressBar)
          if (evt.lengthComputable) {
            var percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);
            progressBar=$('.progress.progress-augment-dynamic .progress-bar')
            progressBar.text(percentComplete + '%');
            progressBar.width(percentComplete + '%');
            if (percentComplete === 100) {
              progressBar.html('Done');
            }
          }
        }, false);
        return xhr;
      }
    }
    function success(data){
      filename=data.file.name
      hash=data.file.hash
      if(filename=="UnsupportedFile"){
        displayToast("Warning!","Unsupported file type! Please try again with another file. Should be a tab seperated value (.tsv) file.")
        resetProgressBar(".progress-augment-dynamic")
      }else if( filename.endsWith(".xlsx") ){
        let jSheet=data.jsheet
        //Set first tab as active
        jSheet.Workbook.Sheets[0].isActive=true
        let completeness=makeCompleteness(jSheet)
    //---------------- Load Tabs ----------------//
        Vue.component('worksheet-tabs',{
          data:function(){
            return {
              sheets:jSheet.Workbook.Sheets,
              currentTab:jSheet.SheetNames[0],
              column:"",
              completeness,
            }
          },
          computed: {
            currentColumns: function(){
              return Object.keys(jSheet.jsonSheets[this.currentTab][0])
            },
            currentTabComponent: function() {
              return "tab-" + this.currentTab.replace(/ /g,"-").toLowerCase();
            },
            currentWorkSheet:function(){
              this.column="";
              return this.currentTab
            }
          },
          mounted: function () {
            //The first load takes some extra time since it is still loading the grid canvas 
            setTimeout(function(){syncHorizontalScrolls($('input#augment-file'))},1000)
          },                     
          template:vTab()
        })
    //---------------- Components worksheets -----------------------------------------------------//
     
        
        jSheet.SheetNames.forEach(function(sheet){
          //Don't use a for loop for this. 
          tabName=sheet.replace(/ /g,"-").toLowerCase()
          Vue.component(`tab-${tabName}`,{
            data:function(){
              return {            
                grid: {
                  data: jSheet.jsonSheets[sheet].slice(0,52) //Only first 50 lines //Last 2 are hidden.
                }
              }
            },
            mounted: function () {
              syncHorizontalScrolls($('input#augment-file'))
            },              
            template:`<canvas-datagrid v-bind.prop="grid"></canvas-datagrid>`
          })
        })
        //Loads the other components
        loadMapping(jSheet)
        Vue.config.ignoredElements = ['canvas-datagrid'];
        window.app = new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
          el:"#preview-table",
          data:{
          },   
        })
        
        

        self.closest('div').nextAll('.preview-table').removeClass('d-none')
        
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

        function resetUploadAbility(){
          $(".upload-augment-file").text("Upload another file")  
        }
        resetUploadAbility()  

        

      }else{
        let table=makePreviewTable(self,data)
        //makeSelectors(table)
        //generateSubmitButton(table,self,data)
      }
    }
  })

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


  (function(){
    $.ajax({
      url:"/forms/ontologyterms/ppeo/",
      success:function(data,textStatus,jqXHR){
        loadOntoTerms(data)
      },
      fail:function(jqXHR,textStatus,data){
        displayToast("Error",err,4000)
      }
    })

  })();
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
  $('button.generate-nt').click(function(){
    $('textarea').removeClass('d-none')
    $('textarea').text("<raiz:study_353> <rdf:type> <ppeo:study>")
  })


/// TODO!! ---- Compile templates and get them via ajax -----///
  function vTab(){
    return `<div id="worksheets">
              <ul class="nav nav-tabs" id="myTab" role="tablist">
                <li class="nav-item" v-for="worksheet in sheets" role="presentation">
                  <a class="nav-link" v-bind:key="worksheet.name" v-on:click=" currentTab = worksheet.name " v-bind:id="worksheet.id" v-bind:class="{ active: worksheet.name === currentTab }" role="tab" data-toggle="tab">{{ worksheet.name }} 
                    <span class="badge badge-success">{{completeness[worksheet.name].complete}}/{{completeness[worksheet.name].total}}</span>
                  </a>
                </li>
              </ul>
              <mapping-worksheet id="mapping" :worksheet="currentWorkSheet" :columns="currentColumns" :column="column" :completeness="completeness" ></mapping-worksheet>
              <div class="scroll" style="overflow-x:scroll">
                <div class="dummy" style="width:1000px;height:20px"></div>
              </div>
              <div class="table-div" style="overflow-x:scroll;overflow-y:scroll;height:500px;">
                <div class="grid" id="grid">
                  <component v-bind:is="currentTabComponent"></component>
                  <div class="alert alert-info" role="alert" style="position:absolute;bottom:55px;left:21px;width:91%">
                    Only loaded first 50 lines into this preview!
                  </div>
                </div>
              </div>
            </div>
            `
  }


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
function formatName(worksheet){
  return text.replace(/ /g,"_").toLowerCase()
}

let formOptions={
  type:[
  {
    label:"Class",
    name:"class"
  },{
    label:"Data Property",
    name:"dataProperty",    
  },{
    label:"Object Property",
    name:"objectProperty"
  },{
    label:"Not Applicable",
    name:"NA"
  }],
  name: {},
  valueType:[{
    label:"Named Node",
    name:"named_node"
  },{
    label:"String (xsd:string)",
    name:"xsd:string"
  },{
    label:"Integer (xsd:integer??)",
    name:"integer"   //Possibly a xsd:integer
  },{
    label:"Not Applicable",
    name:"NA"  
  }],
  "naming_scheme":{
    displayName:"Naming Scheme"
  }
}

function traverseWorkSheets(data){
    let result={}

    Object.entries(data).forEach(([worksheetName,worksheetData])=>{
      result[worksheetName]=getWorksheetColumns(worksheetData)
    })
    return result
}
function updateWorksheetCompleteness(selection,completeness,currentWorksheet){
    completeness[currentWorksheet].complete=0
    Object.entries(selection[currentWorksheet]).forEach(([column,columnData])=>{
      identifyCompleteness(completeness,currentWorksheet,column,columnData)
      completeness[currentWorksheet]+= completeness[currentWorksheet].columns[column].complete ? 1 : 0
    })
    //Void return because it maniputlates the Object directly
    //return completeness
}
function listCompleteAttributesAndProperties(data){
    traverseWorkSheets(data)
    //TODO load completeness template

}
function identifyCompleteness(completeness,currentWorksheet,column,columnData){
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
    //return { complete: result, objectProperties: columnData.objectProperties.length, dataProperties: columnData.dataProperties.length}
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
  function getWorksheets(jSheet){
    return jSheet.SheetNames
  }
  function getColumns(jSheet,worksheet){
    return Object.keys(jSheet.jsonSheets[worksheet][0])
  }
  function loadColumns(workSheetStructure,columnStructure,jSheet){
    let result={}
    getWorksheets(jSheet).map(worksheet=>{
      result[worksheet]=Object.assign({},workSheetStructure)
      result[worksheet].columnNames=getColumns(jSheet,worksheet)
      result[worksheet].total=result[worksheet].columnNames.length
      getColumns(jSheet,worksheet).map(column=>{
        result[worksheet].columns[column]=Object.assign({},columnStructure)
      })
    })
    return result
  }
  return loadColumns(workSheetStructure,columnStructure,jSheet)
}


Vue.component('v-select', VueSelect.VueSelect);

function loadMapping(jSheet){
  
  let worksheets=jSheet.SheetNames  
  let $data={}
  let selection={
    type:"",
    name:"",
    naming_scheme:"",
    dataProperties:[],
    objectProperties:[],
  }
  let namedIndividuals=[] //List of all columns
  worksheets.map(worksheet=>{
    $data[worksheet]={}
    Object.keys(jSheet.jsonSheets[worksheet][0]).map(column=>{{$data[worksheet][column]=Object.assign({},selection)}})
  })
  function validateSelectionJSON(jSheet,$data,selectionScheme){
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
  $data=validateSelectionJSON(jSheet,$data,selection)

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
  Vue.component('simple-property-select',{
    props:{
      worksheet:{type:String},
      column:{type:String},
      label:{type:String},
      termType:{type:String},
      formOptions:{type:Object},
      selection:{type:Object},
    },
    computed:{
      getDisplayLabel(){
        return capitalize(this.label)
      }
    },
    template:$('#template-simple-property-select').clone()[0]
  })  
  Vue.component('simple-select',{
    props:{
      worksheet:{type:String},
      column:{type:String},
      label:{type:String},
      formOptions:{type:Object},
      selection:{type:Object},
    },
    computed:{
      getDisplayLabel(){
        return capitalize(this.label)
      }
    },
    template:$('#template-simple-select').clone()[0]
  })
  Vue.component('property-select',{
    props:{
      worksheet:{type:String},
      column:{type:String},
      label:{type:String},
      termType:{type:String},
      propertyType:{type:String},
      formOptions:{type:Object},
      selection:{type:Object},
      dataPropertyForm:{type:Object}
    },
    computed:{
      getDisplayLabel(){
        return capitalize(this.label)
      }
    },
    template:$('#template-property-select').clone()[0]
  })
  Vue.component('mapping-form',{
    props:{
      formOptions:{type: Object},
      selection:{type:Object},
      worksheet:{type: String},
      column:{type: String},
      namedIndividuals:{type:Array}
    },
    data:function(){
      return {
        displayLabel:"",
        label:"",
        currentSelectOptions:[{}],
        termType:"",
        formType:"",
      }
    },
    computed:{
      getDisplayLabel:function(){
        return capitalize(this.label)  
      },
      displayTextWithBadges(){
        return this.selection[this.worksheet][this.column][this.label]
          .replace("@{auto_increment}",`<span class="badge badge-info">Auto Increment</span>`)
          .replace("@{value}",`<span class="badge badge-success">Value</span>`)
          .replace(/#\{([\w]*)\}/g,`<span class="badge badge-danger">$1</span>`)

      }
    },
    methods:{
      removeProperty(index,propertyType){
        this.selection[this.worksheet][this.column][propertyType][index].show=false
      },      
      setAutoIncrement:function(){
        this.selection[this.worksheet][this.column].naming_scheme+="@{auto_increment}"
      },
      setValueAttribute:function(){
        this.selection[this.worksheet][this.column].naming_scheme+="@{value}"
      },      
      setReferenceAttribute(value){
        try{
          this.selection[this.worksheet][this.column].naming_scheme+="#{"+value+"}"
        }catch(err){
          console.log("Unable to update reference")
        }        
      },      
      addPropertyForm:function(propertyType){
        try{
          this.selection[this.worksheet][this.column][propertyType].push({id:this.selection[this.worksheet][this.column][propertyType].length,property:"",show:true,referenceNode:"",data:{value:"",type:""}})  
          //property: the name of the chosen property 
          //data: value/type object 
          //referenceNode: reference to another individual/node

        }catch(err){
          console.log("unable to addPropertyForm!")
        }
        
      }      
    },
    template:$("#mapping-select").clone()[0],
  })
  Vue.config.warnHandler= function(msg,vm,trace){
    if(msg === `Avoid mutating a prop directly since the value will be overwritten whenever the parent component re-renders. Instead, use a data or computed property based on the prop's value. Prop being mutated: "column"`){
      //Do nothing
    }
    
  }
  Vue.component("mapping-worksheet",{
    template:$("#mapping-column").clone()[0],
    props:{
      worksheet:{type:String},
      columns:{type:Array},
      column:{type:String},
      completeness:{type: Object}
    },
    data:function(){
      return {
        uploadedJSON:"",      
        formOptions,
        namedIndividuals:this.columns,  //!! ATTENTION --- This might not be updated
        selection:$data //Change this to data    
      }
    },
    computed:{

    },
    methods:{    
      updateCompleteness(){
        updateWorksheetCompleteness(this.selection,this.completeness,this.worksheet)
      },
      saveMapping(){ //To big
        let now=new Date()
        let oneWeekFromNow=new Date()
        oneWeekFromNow.setDate(now.getDate()+7)
        let data=JSON.stringify(this.selection,null, 2)
        document.cookie=`mapping=${data}; expires=${oneWeekFromNow}; SameSite=None; Secure`;
      },    
      downloadMapping(){
        let blob = new Blob([JSON.stringify(this.selection,null, 2)], {type: 'application/json'})
        let url=(URL.createObjectURL(blob))
        window.open(url, '_blank');
      },
      loadJSON(){
        try{
          let parsedJSON=JSON.parse(this.uploadedJSON)  
          //Ensure this works!
          validateSelectionJSON(jSheet,this.uploadedJSON,selection)
          //validateWorksheets()  //add missing worksheets
          //validateColums()      //add missing columns
          //validateStructure()   //add missing structure
          //calculate completeness
          //remove infiltrated functions
          this.selection=parsedJSON
          $('#loadingPanel.collapse').collapse('hide')
        }catch(err){
          displayToast("Invalid JSON Error",err,4000)
        }  
      },
    }
  })
    
  
  /*
  var app = new Vue({
    el:"#app-test",
    data:{
      uploadedJSON:"",      
      worksheet:"N353",
      column:"",
      columns,
      formOptions,
      namedIndividuals,
      selection:$data //Change this to data    
    },
    computed:{
    },
    methods:{      
      downloadMapping(){
        let blob = new Blob([JSON.stringify(this.selection,null, 2)], {type: 'application/json'})
        let url=(URL.createObjectURL(blob))
        window.open(url, '_blank');
      },
      loadJSON(){
        try{
          let parsedJSON=JSON.parse(this.uploadedJSON)  
          //validateWorksheets()  //add missing worksheets
          //validateColums()      //add missing columns
          //validateStructure()   //add missing structure
          //remove infiltrated functions
          this.selection=parsedJSON
          $('#loadingPanel.collapse').collapse('hide')
        }catch(err){
          displayToast("Invalid JSON Error",err,4000)
        }  
      },
    }
  })*/
  
}




})

