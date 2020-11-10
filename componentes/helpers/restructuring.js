


function organizeSubjectsByObservation(data){
  result={}
  data.forEach(resultLine=>{
    try{
      result[resultLine.o].push(resultLine.s)
    }catch(err){
      result[resultLine.o]=[resultLine.s]
    }
  })
  return result
}


module.exports={
  organizeSubjectsByObservation
}