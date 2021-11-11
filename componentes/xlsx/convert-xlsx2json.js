let XLSX = require('xlsx');



//TODO
//export named sheet

//exports all sheets
module.exports=function(file){
  let xlsxPath=`${file.filePath}/${file.name}`
  var xlsx = XLSX.readFile(xlsxPath);
  xlsx.jsonSheets={}
  xlsx.csvSheets={}
  xlsx.headers={}
  makeCompatible(xlsx)
  for (sheetName of xlsx.SheetNames){
    xlsx.jsonSheets[sheetName]=XLSX.utils.sheet_to_json(xlsx.Sheets[sheetName])
    xlsx.csvSheets[sheetName]=XLSX.utils.sheet_to_csv(xlsx.Sheets[sheetName])
    xlsx.headers[sheetName]=getHeaders(xlsx.csvSheets[sheetName])
    
  }
  return xlsx
}

function getHeaders(csvSheets){
  let emptyNumber=""
  let headerLine=0
  let headers=csvSheets.split("\n")[headerLine].split(",")
  headers.forEach((column,index)=>{
    if(column==""){
      column="__EMPTY"+emptyNumber 
      if(emptyNumber==""){
        emptyNumber="_1"
      }else{
        emptyNumber="_"+(parseInt(emptyNumber.replace(/_+/g,""))+1)
      }
    }
    headers[index]=column
  })
  return headers
}

function makeCompatible(jSheet){ 
  if(!jSheet.Workbook.Sheets) jSheet.Workbook.Sheets={}
  jSheet.SheetNames.forEach((sheetName,index)=>{
    if(!jSheet.Workbook.Sheets[sheetName]){
      jSheet.Workbook.Sheets[sheetName]={
        id:`sheet${index}`,
        name:sheetName,
        SheetId:index,
        Sheetid:index,
      }
    }
  })
}
