let XLSX = require('xlsx');


function getHeaders(jsheet,sheet){
    let firstCol=jsheet.headers[sheet][0]
    return jsheet.jsonSheets.Investigation.map(row=>row[firstCol])
}






function addInvestigationID_to_study(jsheet) {
    if(!jsheet.headers.Study[0].startsWith("Investigation")){
        let investigationIDKey = jsheet.headers.Investigation[0]
        let investigationID = jsheet.jsonSheets.Investigation[0][investigationIDKey]
        let study = XLSX.utils.sheet_to_json(jsheet.Sheets.Study)
        study=study.map(row=> {
            row=Object.assign({[investigationIDKey]:investigationID},row)
            return row
        })
        study=XLSX.utils.json_to_sheet(study)
        jsheet.Sheets.Study = study
        jsheet.csvSheets.Study = XLSX.utils.sheet_to_csv(study)
        jsheet.jsonSheets.Study = XLSX.utils.sheet_to_json(study)
        jsheet.headers.Study.unshift(investigationIDKey)
    }
}

/* transpose the first two columns of the Investigation sheet */
function transpose_investigation(jsheet){
    let newHeaders = getHeaders(jsheet,"Investigation")
    let investigation = XLSX.utils.sheet_to_json(jsheet.Sheets.Investigation)
    let newInvestigation = {}
    investigation=investigation.map(row=>{
        let keys = Object.keys(row)
        row[keys[1]] instanceof Date ? row[keys[1]] = row[keys[1]].toISOString() : null
        newInvestigation[row[keys[0]]]=row[keys[1]]
    })
    jsheet.Sheets.Investigation = XLSX.utils.json_to_sheet([newInvestigation])
    jsheet.csvSheets.Investigation = XLSX.utils.sheet_to_csv(jsheet.Sheets.Investigation)
    jsheet.jsonSheets.Investigation = XLSX.utils.sheet_to_json(jsheet.Sheets.Investigation)
    jsheet.headers.Investigation = newHeaders
}

function isTransposed(jsheet){
    return jsheet.headers.Investigation[0]=="Field"
}


module.exports = function (jsheet) {
    try {
        if (jsheet.SheetNames.includes("Investigation")) {
            if (isTransposed(jsheet) === true) {

                transpose_investigation(jsheet)
                //Add Investigation ID to Study
                addInvestigationID_to_study(jsheet)
                return jsheet
            }throw new Error("TransformationError")
        }throw new Error("TransformationError")
    }catch (err){
        console.log(err)
        return jsheet
    }
}