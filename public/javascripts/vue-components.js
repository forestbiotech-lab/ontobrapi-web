async function loadWorksheetTabs(jSheet,completeness){
  // Children:
  // - MappingWorkSheet Last Function

  let info=await loadDataStructure("info")
  Vue.component('worksheet-tabs', {
    template: $('#worksheets').clone()[0],
    data: function () {
      return {
        sheets: jSheet.Workbook.Sheets,  //Not available in .ods 
        currentTab: jSheet.SheetNames[0], //Sets first as active //also known as WorkSheet
        completeness,
        info
      }
    },
    computed: {
      currentTabComponent: function () {
        return "tab-" + this.currentTab.replace(/ /g, "-").toLowerCase();
      },
      currentWorkSheet: function () {
        if(this.$children[0]){
          updateGraph(this.$children[0]._data.selection,this.$children[0]._data.formOptions,this.currentTab,this.$children[0]._data.graph)
        }
        return this.currentTab
      }
    },
    methods: {
      resetColumnSelection(){
        let mappingWorksheet=this.$children[0]
        mappingWorksheet.column=""
        mappingWorksheet.loadWorkSheetColumns
      }
    },
    mounted: function () {
      //The first load takes some extra time since it is still loading the grid canvas
      setTimeout(function () {
        syncHorizontalScrolls($('input#augment-file'))
      }, 1000)
    }
  })
}
function loadWorksheetGrids(jSheet){
  jSheet.SheetNames.forEach(function(sheet){
    //Don't use a for loop for this.
    tabName=sheet.replace(/ /g,"-").toLowerCase()
    Vue.component(`tab-${tabName}`,{
      template:`<canvas-datagrid v-bind.prop="grid"></canvas-datagrid>`,
      data:function(){
        return {
          grid: {
            //TODO 
            // rebuild this based on a header extracted from the csv accounting for empty cells.
            data: jSheet.jsonSheets[sheet].slice(0,52) //Only first 50 lines //Last 2 are hidden.
          }
        }
      },
      mounted: function () {
        syncHorizontalScrolls($('input#augment-file'))
      }
    })
  })
}

Vue.component('v-select', VueSelect.VueSelect);

//TODO
// Split all the components into individual loader functions
async function loadMapping(jSheet) {

  let formOptions=await loadDataStructure("formOptions")
  let worksheets = jSheet.SheetNames
  let $data = {}
  //TODO maybe not here but these things should be set all in the same place and globally accessible but immutable except through copy.


  //TODO columns are not calculated properly 
  //  Columns are not present in JSON if they do not have data.
  //  Use csv to correct at lest header
  //  Redo grid data for first 50 lines
  worksheets.map(worksheet => {
    $data[worksheet] = {}
    getColumns(jSheet, worksheet).map(column => {
      {
        $data = window.structures.addColumnToSelection($data,worksheet,column)
      }
    })
  })

  function loadPreviousSelectionFromLocalStorage(jSheet, $data) {
    let result = null
    if (localStorage) {
      if (localStorage.selection && localStorage.fileHash) {
        if (localStorage.fileHash === jSheet.file.hash) {
          let timeout = 4000
          displayToast("Previous Selection Available", document.createElement("load-previous-selection"), timeout)
          result = JSON.parse(localStorage.selection)
          componentPreviousSelection(result, timeout)
        }
      }
      localStorage.fileHash = jSheet.file.hash
    }
  }

  loadPreviousSelectionFromLocalStorage(jSheet, $data)

  $data = validateSelectionJSON(jSheet, $data)

  loadOntologyDataToFormOptions(formOptions)

  try {
    let xsdDatatypes = await loadXSDdatatypes()
    formOptions.valueType=Object.keys(xsdDatatypes).map(value=>{return {"name":value,"label":value}})
    formOptions.valueType.unshift({
      label: "Named Node",
      name: "named_node"
    })
  } catch (e) {
    displayToast("Unable to load!","There was a problem while attempting to load xsd data types!")
  }

  componentMappingForm()
  componentSimplePropertySelect()
  componentSimpleSelect()
  componentPropertySelect()
  await componentMappingWorksheet(formOptions, $data)
  componentInformationTooltip()

  Vue.config.warnHandler = function (msg, vm, trace) {
    if (msg === `Avoid mutating a prop directly since the value will be overwritten whenever the parent component re-renders. Instead, use a data or computed property based on the prop's value. Prop being mutated: "column"`) {
      //Do nothing
    }
  }
}
function componentPreviousSelection(result,timeout){
  Vue.component("load-previous-selection", {
    methods:{
      yes(){
        window.app.$children[0].$children[0].selection=result //Loads previous selection from localStorage
        updateCompleteness(result,window.app.$children[0].$children[0].completeness)
        $('.toast').remove()
      },
      no(){
        $('.toast').remove()
      }
    },
    mounted:function(){
      setTimeout(function(){
        $('.toast').remove()
      },timeout)
    },
    template: $('#template-load-previous-selection').clone()[0]
  })

  let app2=new Vue({
    el:"#toaster"
  })
}
function componentMappingForm(){
  //TODO Add a watcher to updateRestrictions on name change. For dataproperties in classes
  Vue.component('mapping-form',{
    template:$("#mapping-select").clone()[0],
    props:{
      formOptions:{type: Object},
      selection:{type:Object},
      worksheet:{type: String},
      column:{type: String},
      namedIndividuals:{type:Array},
      completeness:{type:Object},
      info:{type:Object},
      graph:{type:Object},
      dataPropertiesCache:{type:Object}
    },
    data:function(){
      return {
        displayLabel:"",
        label:"",
        termType:"",
        formType:""
      }
    },
    computed:{
      getDisplayLabel:function(){
        return capitalize(this.label)
      },
      displayTextWithBadges(){
        try{
          let cellValue=window.jSheet.jsonSheets[this.worksheet][0][this.column]
          let referenceCellValue=window.jSheet.jsonSheets[this.worksheet][0]
          cellValue=cellValue.length>10 ? cellValue.substr(0,20).concat("...") : cellValue
          return this.selection[this.worksheet][this.column][this.label]
              .replace("@{__auto_increment__}",`<span class="badge bg-info">Auto Increment</span>`)
              .replace("@{__value__}",`<span class="badge bg-success value">${cellValue}</span>`)
              .replace(/@{([\w *\w*]*)}/g,`<span class="badge bg-danger">$1</span>`)
        }catch(e){
          return this.selection[this.worksheet][this.column][this.label]
              .replace("@{auto_increment}",`<span class="badge bg-info">Auto Increment</span>`)
              .replace("@{value}",`<span class="badge bg-success">Value</span>`)
              .replace(/@{([\w *\w*]*)}/g,`<span class="badge bg-danger">$1</span>`)
        }


      },
      //TODO Not working async. Must load before hand
      // Should be copied from the other component MappingWorksheet
      dataProperties(){
        return new Promise(async (res,rej)=>{
          if(this.dataPropertiesCache.loaded === true ){
            res(this.dataPropertiesCache.dataProperties)
          }else{
            try {
              let className = this.selection[this.worksheet][this.column].name.name
              this.dataPropertiesCache.dataProperties[this.column] = await $.get(`/query/inferred/dataProperty/${className}`)
              this.dataPropertiesCache.loaded = true
            }catch (e) {

            }finally {
              res(this.dataPropertiesCache.dataProperties)
            }
          }
        })
      }
    },
    methods:{
      //TODO Not working async must be done beforehand on name choice
      async loadDataProperties(){
        this.dataPropertiesCache.loaded=false
        this.dataPropertiesCache.dataProperties[this.column]={}
        let dataProperties= await this.dataProperties
      },
      disableDataProperties(value){
        try{
          return this.selection[this.worksheet][value].type.name=="class"
        }catch (e) {
          console.log(`Unable to locate type for this value: ${value} - `,e)
          return false
        }
      },
      disableClasses(value){
        let result=false
        try{
          let dataProperties=this.dataPropertiesCache.dataProperties[this.column]
          if(dataProperties.length>0){
            result=dataProperties.find(dataProperty=> {
                  return dataProperty.name === this.selection[this.worksheet][value].name.label
                }
            ) !== undefined
          }else{
            throw new Error("No data properties found")
          }
        }catch (e) {
          result=this.selection[this.worksheet][value].type.name=="dataProperty"
        }
        return result

      },
      removeProperty(index,propertyType){
        this.selection[this.worksheet][this.column][propertyType][index].show=false
      },
      setAutoIncrement:function(){
        this.selection[this.worksheet][this.column].naming_scheme+="@{__auto_increment__}"
      },
      setValueAttribute:function(){
        this.selection[this.worksheet][this.column].naming_scheme+="@{__value__}"
      },
      setReferenceAttribute(value){
        try{
          this.selection[this.worksheet][this.column].naming_scheme+="@{"+value+"}"
        }catch(err){
          console.log("Unable to update reference")
        }
      },
      updateDataProperty(propertyForm){
        this.selection[this.worksheet][this.column].dataProperties[propertyForm.id].data.value=this.selection[this.worksheet][propertyForm.referenceNode].name.name
        this.selection[this.worksheet][this.column].dataProperties[propertyForm.id].data.type=this.selection[this.worksheet][propertyForm.referenceNode].valueType.name
      },
      updateGraphModel(PropertyForm) {  //TODO is this ok for dataProperties?
        updateGraph(this.selection,this.formOptions,this.worksheet,this.graph)
      },
      addPropertyForm:function(propertyType){
        try{
          this.selection[this.worksheet][this.column][propertyType].push({
            id:this.selection[this.worksheet][this.column][propertyType].length,
            property:"",
            show:true,
            referenceNode:"",
            data:{value:"",type:""}
          })

          //property: the name of the chosen property
          //data: value/type object
          //referenceNode: reference to another individual/node

        }catch(err){
          console.log("unable to addPropertyForm!")
        }

      }
    }
  })
}
function componentSimplePropertySelect() {
  Vue.component('simple-property-select', {
    template: $('#template-simple-property-select').clone()[0],
    props: {
      worksheet: {type: String},
      column: {type: String},
      label: {type: String},
      termType: {type: String},
      formOptions: {type: Object},
      selection: {type: Object},
      info:{type:Object},
      graph:{type:Object},
    },
    computed: {
      getDisplayLabel() {
        return capitalize(this.label)
      },
    },
    methods:{
      updateGraphModel(){  //How to get this to work
        if(this.termType=="Class"){
          updateGraph(this.selection,this.formOptions,this.worksheet,this.graph)
        }
      },
      async queryInferredProperties(){
        //TODO this should be in selection of value type
        let type=this.selection[this.worksheet][this.column].type.name
        let name=this.selection[this.worksheet][this.column].name.name
        if(type === "dataProperty" && name !== "" ){
          this.formOptions.valueType=await $.get(`/query/inferred/dataPropertyRange/${name}`)
          Vue.set(this.selection[this.worksheet][this.column],valueType,{})
        }else if(type == "class"){
          this.formOptions.valueType=[{name:"name_node",label:"Named Node"}]
        }
      }
    }
  })
}
function componentSimpleSelect() {
  Vue.component('simple-select', {
    template: $('#template-simple-select').clone()[0],
    props: {
      worksheet: {type: String},
      column: {type: String},
      label: {type: String},
      formOptions: {type: Object},
      selection: {type: Object},
      info:{type:Object},
      graph:{type:Object},
      selectable:{type:Boolean}
    },
    computed: {
      getDisplayLabel() {
        return capitalize(this.label)
      },
    },
    methods:{
      selectValidAttributes(value,search){
        try{
          if(this.selection[this.worksheet][this.column].type.name=="class" ){
            return value.name=="named_node";
          }else if (this.selection[this.worksheet][this.column].type.name=="dataProperty" ){
            return value.name!="named_node"
          }
        }catch(err){
          return true
        }
      },
      updateGraphModel(value){
        if(value.name!="class" &&  this.label=="type"){
          updateGraph(this.selection,this.formOptions,this.worksheet,this.graph)
        }
      }
    }
  })
}
function componentPropertySelect(){
  Vue.component('property-select',{
    template:$('#template-property-select').clone()[0],
    props:{
      worksheet:{type:String},
      column:{type:String},
      label:{type:String},
      termType:{type:String},
      propertyType:{type:String},
      formOptions:{type:Object},
      selection:{type:Object},
      dataPropertyForm:{type:Object},
      info:{type:Object}
    },
    computed:{
      getDisplayLabel(){
        return capitalize(this.label)
      }
    },
    methods:{
      async queryInferredProperties(){
        let type=this.selection[this.worksheet][this.column].type.name
        let name=this.selection[this.worksheet][this.column].name.name
        let vselectVM=this.$children[1]
        let loading=vselectVM.loading
        if(type === "class" && name !== "" && this.termType=="objectPropertyInferred"){
          loading=true
          this.formOptions.name.objectPropertyInferred=await $.get(`/query/inferred/objectProperty/${name}`)
          vselectVM.options=this.formOptions.name.objectPropertyInferred
          loading=false
        }else{
          this.formOptions.name.objectPropertyInferred=[]

          loading=false
        }
      },
      loadInferredDestinationClass(options){
        try {
          let destinationClass = options.destination.split("#")[1]
          let destinationColumn = Object.entries(this.selection[this.worksheet]).find(value=> {
            return value[1].name.name == destinationClass
          })
          if(destinationColumn !== undefined ){
            this.selection[this.worksheet][this.column].objectProperties[this.dataPropertyForm.id].referenceNode=destinationColumn[0]
          }else{
            this.selection[this.worksheet][this.column].objectProperties[this.dataPropertyForm.id].referenceNode=""
          }
        }catch (e) {
          //TODO something if necessary, but be careful because one of the exceptions is the lack of options.destination to split typeError
          this.selection[this.worksheet][this.column].objectProperties[this.dataPropertyForm.id].referenceNode=""
        }
      }
    },
    mounted:function(){
      //Loads tooltips
      $('[data-toggle="tooltip"]').tooltip()
    }
  })
}
function componentInformationTooltip(){
  Vue.component('information-tooltip',{
    template:$("#template-information-tooltip").clone()[0],
    props:{
      label:{type:String},
      info:{type:Object}
    },
    mounted:function(){
      //Loads tooltips
      $('[data-toggle="tooltip"]').tooltip()  //Could be specific for this loading. But work well
    }
  })
}
async function componentMappingWorksheet(formOptions,$data,jSheet){
  //PARENT WorkSheetTabs (LoadWorkSheetTabs) 1st Function
  Vue.component("mapping-worksheet",{
    template: await getTemplate('mapping-column'),
    props:{
      worksheet:{type:String},
      //columns:{type:Array},
      completeness:{type: Object},
      info:{type:Object},
    },
    data:function(){
      return {
        column:"",
        missingClass:"",
        missingClasses:[],
        uploadedJSON:"",
        formOptions,
        selection:$data, //Change this to data
        graph:{
          links:[],
          nodes:[]
        },
        graph_overview:{
          links:[],
          nodes:[]
        },
        dataPropertiesCache:{loaded:false,dataProperties: {}},
        ppeoClasses:[]
      }
    },
    computed:{
      columns(){
        return Object.keys(this.selection[this.worksheet])
      },
      namedIndividuals(){
        return this.columns
      },
      validMissingClass(){
        return this.columns.indexOf(this.missingClass) === -1
      },
      isAddingClassesDisabled(){
        return this.missingClasses.length==0
      },
      notBlank(){
        return this.missingClass !== ""
      },
      isAddingClassDisabled(){
        return !(this.validMissingClass && this.notBlank)
      },
      missingClassBGcolor(){
        return this.validMissingClass ? "white" : "red"
      },
      dataProperties(){
        return new Promise(async (res,rej)=>{
          if(this.dataPropertiesCache.loaded === true ){
            res(this.dataPropertiesCache.dataProperties[this.column])
          }else{
            try {
              let className = this.selection[this.worksheet][this.column].name.name
              let type= this.selection[this.worksheet][this.column].type.name
              if(className!== undefined && type === "class") {
                this.dataPropertiesCache.dataProperties[this.column] = await $.get(`/query/inferred/dataProperty/${className}`)
              }
              this.dataPropertiesCache.loaded = true
              res(this.dataPropertiesCache.dataProperties[this.column])
            }catch (e) {
              res(this.dataPropertiesCache.dataProperties)
            }
          }
        })
      }
    },
    methods:{
      async loadDataProperties(){
        this.dataPropertiesCache.loaded=false
        this.dataPropertiesCache.dataProperties[this.column]=[]
        let dataProperties= await this.dataProperties
      },
      addMissingClass(){
        if(this.validMissingClass === true && this.notBlank === true ){
          //TODO Why does this duplicate?
          //this.columns.push(this.missingClass)

          //TODO verify that this works with vue or if I have to do it property
          this.completeness[this.worksheet].total++
          this.completeness[this.worksheet].columnNames.push(this.missingClass)

          Vue.set(this.completeness[this.worksheet].columns,this.missingClass,window.structures.completeness.column)
          window.structures.addColumnToSelection(this.selection,this.worksheet,this.missingClass)
          this.missingClass=""
          //TODO add to selection, and possibly some other data structures. Export function to add column to <<selection>> in validateSelection.
        }
      },
      addMissingClasses(){
        if(this.missingClasses.length>0 ){
          for(let ppeoClass of this.missingClasses){
            this.missingClass=ppeoClass
            this.addMissingClass()
          }
        }
      },
      updateGraphModel(){
        updateGraph(this.selection,this.formOptions,this.worksheet,this.graph)
      },
      loadGraphOverview(){
        updateOverviewGraph(this.selection,this.formOptions,this.graph_overview)
      },
      updateCompleteness(value){
        if(localStorage){
          localStorage.selection=JSON.stringify(this.selection)  //Save current Selection
        }
        updateWorksheetCompleteness(this.selection,this.completeness,this.worksheet)
        let that=this
        setTimeout(function(){that.column=value},1000) //Updates the column to the selection in case parent re-renders because of updateCompleteness()
      },
      saveMapping(){ //To big
        let data=JSON.stringify(this.selection,null, 2)
      },
      async loadTemplateMapping(event){
        let target=event.target
        let file=target.closest(".flex-row").querySelectorAll(".fileName")[0].textContent+".json"
        let mapping=await $.post("/forms/get/mapping", {file})
        this.uploadedJSON=mapping
        this.loadJSON()
      },
      downloadMapping(){
        let blob = new Blob([JSON.stringify(this.selection,null, 2)], {type: 'application/json'})
        let url=(URL.createObjectURL(blob))
        window.open(url, '_blank')
      },
      downloadMappingFile(){
        let blob = new Blob([JSON.stringify(this.selection,null, 2)], {type: 'application/json'})
        let url=(URL.createObjectURL(blob))
        let a = document.createElement("a");
        document.body.appendChild(a);
        a.style = "display: none";
        a.href = url;
        a.download = window.jSheet.file.name.replace(/\.[a-z]+$/,".json");
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove()
        //window.open(url, '_blank')
      },
      loadJSON(){
        try{
          let parsedJSON=JSON.parse(this.uploadedJSON)
          parsedJSON=validateSelectionJSON(window.jSheet,parsedJSON,this.completeness)
          this.selection=parsedJSON
          //TODO calculate completeness Still has error for  Biological material which is empty
          // Study in study not showing then one but nothing on screen (Because false) Exclude show:false from count Requires a if not a oneliner anymore

          updateCompleteness(this.selection,this.completeness)
          this.updateGraphModel()
          $('#loadingPanel.collapse').collapse('hide')
          this.loadGraphOverview()
          window.appActiveClasses.selection=this.selection
        }catch(err){
          displayToast("Invalid JSON Error",err,4000)
        }
      },
    },
    mounted:function(){
      //Loads tooltips
      $('[data-toggle="tooltip"]').tooltip()
      loadActiveClasses(this.selection)
    },
    async beforeMount() {
      try {
        let ppeoClasses = await $.get("/query/ppeo/listClasses")
        this.ppeoClasses = ppeoClasses
      }catch (e) {
        displayToast("Unable to load Classes from PPEO",e)
      }
    }
  })
}
function loadActiveClasses(selection){
  $('#active-classes .card-body').removeClass('d-none')
  window.appActiveClasses = new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
    el:"#active-classes",
    data:{
      selection
    },
    computed:{

    },
    methods:{

    }
  })
}