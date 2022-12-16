const express = require('express');
const {exec} = require("child_process");
const router = express.Router();

router.get('/vue/index/:part/preview',(req,res)=>{
    res.render(`factory/vue/index/preview`,{part:req.params.part})
})

router.get('/vue/index/:part',(req,res)=>{
    res.render(`factory/vue/index/${req.params.part}`)
})


module.exports = router;