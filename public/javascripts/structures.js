class Structures{
    constructor() {
        this.columnStructure={
            complete:false,
            dataProperties:0,
            objectProperties:0
        }
        this.selectionStructure = {
            type: "",
            name: "",
            valueType:"",
            naming_scheme: "",
            dataProperties: "",
            objectProperties: "",
        }
        this.workSheetStructure={
            complete:0,
            total:0,
            columnNames:[],
            columns:{}
        }
        this.completeness={}
        this.completeness.column=this.completenessColumn
        this.completeness.worksheet=this.completenessWorksheet
        this.selection=this.selectionBase
    }
    get completenessColumn(){

        return Object.assign({},this.columnStructure)
    }
    get completenessWorksheet(){
        return Object.assign({},this.workSheetStructure)
    }
    get selectionBase(){
        return Object.assign({},this.selectionStructure)
    }
    addColumnToSelection(selection,worksheet,column){
        Vue.set( selection[worksheet],column,this.selectionBase )
        selection[worksheet][column].dataProperties = []
        selection[worksheet][column].objectProperties = []
        return selection
    }
    addColumnToCompleteness(completeness,worksheet,column){
        let workSheetStructure=this.completeness.worksheet
        let columnStructure=this.completeness.column

        completeness[worksheet].columnNames.push(column)
        completeness[worksheet].total=completeness[worksheet].columnNames.length
        Vue.set(completeness[worksheet].columns,column,columnStructure)
        return completeness
    }
}






window.structures=new Structures()

