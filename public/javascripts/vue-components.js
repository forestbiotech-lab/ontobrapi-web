async function loadWorksheetTabs(jSheet,completeness){
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
      currentColumns: function () {
        return getColumns(jSheet,this.currentTab)
      },
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
        this.$children[0].column=""
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
  let selectionStructure = {
    type: "",
    name: "",
    naming_scheme: "",
    dataProperties: "",
    objectProperties: "",
  }

  //TODO columns are not calculated properly 
  //  Columns are not present in JSON if they do not have data.
  //  Use csv to correct at lest header
  //  Redo grid data for first 50 lines
  worksheets.map(worksheet => {
    $data[worksheet] = {}
    getColumns(jSheet, worksheet).map(column => {
      {
        $data[worksheet][column] = Object.assign({}, selectionStructure)
        $data[worksheet][column].dataProperties = []
        $data[worksheet][column].objectProperties = []
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

  $data = validateSelectionJSON(jSheet, $data, selectionStructure)

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
  componentMappingWorksheet(formOptions, $data)
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
      graph:{type:Object}
    },
    data:function(){
      return {
        displayLabel:"",
        label:"",
        currentSelectOptions:[{}],  //Removable???
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
            .replace("@{auto_increment}",`<span class="badge bg-info">Auto Increment</span>`)
            .replace("@{value}",`<span class="badge bg-success">Value</span>`)
            .replace(/@{([\w *\w*]*)}/g,`<span class="badge bg-danger">$1</span>`)

      }
    },
    methods:{
      disableClasses(value){
        return this.selection[this.worksheet][value].type.name=="dataProperty"
      },
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
function componentMappingWorksheet(formOptions,$data,jSheet){
  Vue.component("mapping-worksheet",{
    template:$("#mapping-column").clone()[0],
    props:{
      worksheet:{type:String},
      columns:{type:Array},
      completeness:{type: Object},
      info:{type:Object},
    },
    data:function(){
      return {
        column:"",
        uploadedJSON:"",
        formOptions,
        selection:$data, //Change this to data
        graph:{
          links:[],
          nodes:[]
        }
      }
    },
    computed:{
      namedIndividuals(){
        return this.columns
      }
    },
    methods:{
      updateGraphModel(){
        updateGraph(this.selection,this.formOptions,this.worksheet,this.graph)
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
      downloadMapping(){
        let blob = new Blob([JSON.stringify(this.selection,null, 2)], {type: 'application/json'})
        let url=(URL.createObjectURL(blob))
        window.open(url, '_blank')
      },
      loadJSON(){
        try{
          let parsedJSON=JSON.parse(this.uploadedJSON)
          //Ensure this works!
          //validateSelectionJSON(jSheet,this.uploadedJSON,selectionStructure)
          //validateWorksheets()  //add missing worksheets
          //validateColumns()      //add missing columns
          //validateStructure()   //add missing structure
          //calculate completeness
          //remove infiltrated functions
          this.selection=parsedJSON
          updateCompleteness(this.selection,this.completeness)
          this.updateGraphModel()
          $('#loadingPanel.collapse').collapse('hide')
        }catch(err){
          displayToast("Invalid JSON Error",err,4000)
        }
      },
    },
    mounted:function(){
      //Loads tooltips
      $('[data-toggle="tooltip"]').tooltip()
    }
  })
}