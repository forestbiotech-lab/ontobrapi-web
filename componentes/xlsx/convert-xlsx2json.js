let XLSX = require('xlsx');






module.exports=function(file){
  let xlsxPath=`${file.filePath}/${file.name}`
  var xlsx = XLSX.readFile(xlsxPath);

  return xlsx
}

