let XLSX = require('xlsx');






module.exports=function(file){
  let xlsxPath=`${file.filePath}/${file.name}`
  var xlsx = XLSX.readFile(xlsxPath);


  let jSheet={
    worksheets:xlsx.SheetNames,
    sheets:xlsx.Sheets
  }

  return jSheet
}

