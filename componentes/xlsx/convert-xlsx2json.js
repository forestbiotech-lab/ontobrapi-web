let XLSX = require('xlsx');



//TODO
//export named sheet

//exports all sheets
module.exports=function(file){
  let xlsxPath=`${file.filePath}/${file.name}`
  var xlsx = XLSX.readFile(xlsxPath);
  xlsx.jsonSheets={}
  
  for (sheetName of xlsx.SheetNames){
    xlsx.jsonSheets[sheetName]=XLSX.utils.sheet_to_json(xlsx.Sheets[sheetName])
  }
  return xlsx
}

