const hash = require('object-hash');
const Blob = require('fetch-blob'); //v2
const http = require('http');
const fs=require("fs")
const {Transform} = require('stream');
const options=require('./../../.config').admin


function staging(jsonTriples){
 return new Promise(async (resolve,reject)=>{
     let payload=JSON.stringify(jsonTriples)
     let uid=generateUID(payload)
     let formData = new FormData();
     formData.set('payload', payload);
     fetch(`${options.protocol}://${options.hostname}:${options.port}${options.path}${uid}`, {
         method: options.method,
         body: formData
     }).then(async (res)=>{
         res=await res.json()
         resolve({uid, data: res.data, err:res.err})
     }).catch(err=>{
         resolve({uid, data:null, err,})
     })
 })
}

function production(){

}


function generateUID(payload){
    return hash(payload, {algorithm: 'md5'})
}

module.exports = {staging,production}