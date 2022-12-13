//TODO implement cache update
let origin="https://raw.githubusercontent.com/plantbreeding/BrAPI/brapi-V2.1/Specification/BrAPI-Core/Studies/Studies_GET_POST.yaml"

const yaml  = require("js-yaml")
const fs    = require('fs');

// Get document, or throw exception on error
function getSpecs() {
    try {
        const doc = yaml.load(fs.readFileSync('./componentes/modules/Core/schemes/Studies_GET_POST.yaml', 'utf8'));
        //console.log(doc);
        return doc
    } catch (e) {
        console.log(e);
    }
}
function main(params){
    if(params instanceof Object){
        let specs=getSpecs()
        //TODO follow $refs
        /*for(key of params.keys()){
            for(names of specs.paths["/studies"].get.parameters.map(item=> {if(item.name) return item.name})){

            }
        }*/
        return params //TODO not doing absolutely nothing!!!!!!
    }else{
        return
    }
}

module.exports = main