const nt=require("./nt")
const {expect,assert} = require('chai')
const fs=require("fs")
const glob=require("glob")
const convertXlsx2json = require("../xlsx/convert-xlsx2json");
const path=require('path')
const reference_files_dir="reference_files"
const Triples=require("./../helpers/triples")
let nt_file=glob.sync(path.join(reference_files_dir,`/*.json`))[0]
let spreadsheet_file=glob.sync(path.join(reference_files_dir,`/*.ods`))[0]


let mapping={}
let jsheet={}


function extractClassesFromSpreadsheet(mappping,spreadsheetName){
    return Object.values(mapping[spreadsheetName]).filter(value => value.type=="class")
}
function compileIndividuals(mappingClasses,jSheet,spreadsheetName,triples){
    let individuals=[]
    mappingClasses.forEach(ppeoClass =>{
        individuals.push(triples.interpolator(ppeoClass.naming_scheme,jsheet.jsonSheets[spreadsheetName][0],{}))
    })
    return individuals
}



describe("NT generator", () => {
    describe("I/0", () => {
        it("Get reference JSheet", () => {
            let absolutePath_spreadsheet = path.join(__dirname, "../..", spreadsheet_file)
            jsheet = convertXlsx2json({
                filePath: path.dirname(absolutePath_spreadsheet),
                name: path.basename(absolutePath_spreadsheet)
            })
            assert.instanceOf(jsheet, Object )
            assert.notInstanceOf(jsheet, Array )
        })
        it("Validate JSON mapping file", () => {
            mapping = JSON.parse(fs.readFileSync(nt_file))

            assert.instanceOf(mapping, Object ,"Is not an Object")
            assert.notInstanceOf(mapping, Array, "Is an Array" )
        })
        it("Generate Triples", async function(){
            this.timeout(3000)
            mapping = JSON.parse(fs.readFileSync(nt_file))
            let absolutePath_spreadsheet = path.join(__dirname, "../..", spreadsheet_file)
            jsheet = convertXlsx2json({
                filePath: path.dirname(absolutePath_spreadsheet),
                name: path.basename(absolutePath_spreadsheet)
            })
            let triples = new Triples()
            let jsonTriples=await nt.json(jsheet,mapping)
            assert.containsAllKeys(jsonTriples,["prefix","individuals","properties"],"Contains the main keys")
            assert.isNotArray(jsonTriples.individuals,"Individuals in triples is an array")
            assert.isNotArray(jsonTriples.properties,"Properties in triples is an array")
            for ([spreadsheetName,val] of Object.entries(mapping)){
                let mappingClasses=extractClassesFromSpreadsheet(mapping,spreadsheetName)
                let individuals=compileIndividuals(mappingClasses,jsheet,spreadsheetName,triples)
                assert.containsAllKeys(jsonTriples.individuals,individuals,`Missing individual in ${spreadsheetName}`)
            }

        })
    })
})


