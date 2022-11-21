const puppeteer = require('puppeteer');
const fs=require('fs');
const path=require('path');
let chai=require('chai');
/*
  Check chrome://version for details
  userdata, remote-debugging port and others
  To connect to running session user puppeteer.connect(url)
  the url is localhost and the port running the remote-debugging
 */


(async () => {
    let switchTabAndColumn=true;

    let opts={
        headless:false,
        executablePath:"/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome",
        //devtools: true,
        //slowMo: 250, // slow down by 250ms
        userDataDir: "/Users/brunocosta/Library/Application Support/Google/Chrome"
    }
    const setTextInputValue =(async (page,selector,value)=> {
        await page.waitForSelector(selector);
        await page.evaluate((data) => {
            return document.querySelector(data.selector).value = data.value
        }, {selector, value})
    })
    let defaultMapPath="/brunocosta/Documents/Projectos/ontobrapi/9may/OntoBrAPI_9May_mapping-added.json"
    //let mapInvestigation="brunocosta/Documents/Projectos/ontobrapi/OntoBrAPI-TEST-IChaves/investigation.json"
    //let mapInvestigation="brunocosta/Documents/Projectos/ontobrapi/OntoBrAPI-TEST-IChaves/ontobrapi_vitis.json"
    let mapInvestigation="brunocosta/Documents/Projectos/ontobrapi/OntoBrAPI-TEST-IChaves/investigationNstudyNperson.json"
    let root=""
    if(process.platform=="darwin"){
            root="/Users"
    }else if(process.platform=="linux"){
        root="/home"
    }
    let mappingGeneral = fs.readFileSync(path.join(root,defaultMapPath),{encoding:"utf8"})
    let mappingInvestigation=fs.readFileSync(path.join(root,mapInvestigation),{encoding:"utf8"})
    mappingGeneral=mappingGeneral.split("/n")[0];
    mappingInvestigation=mappingInvestigation.split("/n")[0];
    let mapping=mappingInvestigation
    let element;


    //Start browser
    //const browser = await puppeteer.launch(opts);
    // Lookup on chrome session "chrome://"
    const browserURL = 'http://localhost:45553'
    const browser = await puppeteer.connect({browserURL, defaultViewport: null})


    const pages = await browser.pages()
    const firstPage=pages[0]
    await firstPage.bringToFront();
    await firstPage.goto('http://localhost:3000');


    //LOAD SpreadSheet and Mapping
    await firstPage.waitForSelector('#augment-file')
    //await (await firstPage.$('#augment-file')).uploadFile(path.join(root,`/brunocosta/Documents/Projectos/ontobrapi/MIAPPEv1.1_compliant_vitis_submissionOntobrapi.xlsx`))
    await (await firstPage.$('#augment-file')).uploadFile(path.join(root,`/brunocosta/Documents/Projectos/ontobrapi/OntoBrAPI-TEST-IChaves/MIAPPEv1.1_compliant_vitis_submissionOntobrapi.xlsx`))
    element=await firstPage.$("#mapping-loading-options button.load-mapping-button")
    await element.evaluate(element=>element.click())
    await firstPage.waitForTimeout(1500);

    await setTextInputValue(firstPage, "#loadingPanel textarea", mapping)
    element=await firstPage.$('textarea');
    await element.type(" ");
    element = await firstPage.waitForSelector("#loadingPanel button.load-mapping-text");
    await element.click();

    if(switchTabAndColumn == false){
        //TEST
        element = await firstPage.waitForSelector("#rId2");
        await element.click();
        await firstPage.waitForTimeout(1500);
        element = await firstPage.waitForSelector('.v-select#column-selection input')
        await element.click()
        await firstPage.waitForTimeout(1000);
        element = await firstPage.waitForSelector('.v-select#column-selection li[id$=\'__option-2\'')
        await firstPage.waitForTimeout(1000);
        await  element.click();

    }
    //await firstPage.waitForTimeout(6500);
    if(true===true){
        //Generate triples
        genNT = await firstPage.waitForSelector('button.generate-nt')
        await genNT.evaluate(b => b.click());
        //await  genNT.click();
        //await genNT.hover() //Just to bring into view
        await firstPage.evaluate( () => {
            window.scrollBy(500, window.innerHeight);
        });
        //await firstPage.waitForTimeout(6000);

        let textarea=await firstPage.waitForSelector('textarea.generated-ntriples')
        let value = await firstPage.evaluate(el => el.textContent, textarea)
        try {
            chai.assert.isTrue(value.includes("<http://brapi.biodata.pt/raiz/Investigation_THERMAL%20REQUIREMENTS,%20DURATION%20AND%20PRECOCITY%20OF%20PHENOLOGICAL%20STAGES%20OF%20GRAPEVINE%20CULTIVARS%20OF%20THE%20PORTUGUESE%20COLLECTIONINIAV:2Portos:VitisPhenology>"), "Creation of class investigation")
        }catch(e){
            console.log("Assertion fail: ",e)
        }


    }

    browser.disconnect();
})();