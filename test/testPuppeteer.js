const puppeteer = require('puppeteer');
const fs=require('fs');
const path=require('path');
let chai=require('chai');
const {direct} = require("selenium-webdriver/lib/proxy");
const {objectProperty} = require("../componentes/dataStructures/info");
/*
  Check chrome://version for details
  userdata, remote-debugging port and others
  To connect to running session user puppeteer.connect(url)
  the url is localhost and the port running the remote-debugging
 */

const testCalls=true;
const testInput=false;
function random(max){
    return Math.floor(Math.random()*max);
}

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

    if(testInput==true) {
        await firstPage.goto('http://localhost:3000');


        //LOAD SpreadSheet and Mapping
        await firstPage.waitForSelector('#augment-file')
        //await (await firstPage.$('#augment-file')).uploadFile(path.join(root,`/brunocosta/Documents/Projectos/ontobrapi/MIAPPEv1.1_compliant_vitis_submissionOntobrapi.xlsx`))
        await (await firstPage.$('#augment-file')).uploadFile(path.join(root, `/brunocosta/Documents/Projectos/ontobrapi/OntoBrAPI-TEST-IChaves/MIAPPEv1.1_compliant_vitis_submissionOntobrapi.xlsx`))
        element = await firstPage.$("#mapping-loading-options button.load-mapping-button")
        await element.evaluate(element => element.click())
        await firstPage.waitForTimeout(1500);

        await setTextInputValue(firstPage, "#loadingPanel textarea", mapping)
        element = await firstPage.$('textarea');
        await element.type(" ");
        element = await firstPage.waitForSelector("#loadingPanel button.load-mapping-text");
        await element.click();

        if (switchTabAndColumn == false) {
            //TEST
            element = await firstPage.waitForSelector("#rId2");
            await element.click();
            await firstPage.waitForTimeout(1500);
            element = await firstPage.waitForSelector('.v-select#column-selection input')
            await element.click()
            await firstPage.waitForTimeout(1000);
            element = await firstPage.waitForSelector('.v-select#column-selection li[id$=\'__option-2\'')
            await firstPage.waitForTimeout(1000);
            await element.click();

        }
        //await firstPage.waitForTimeout(6500);
        if (true === true) {
            //Generate triples
            genNT = await firstPage.waitForSelector('button.generate-nt')
            await genNT.evaluate(b => b.click());
            //await  genNT.click();
            //await genNT.hover() //Just to bring into view
            await firstPage.evaluate(() => {
                window.scrollBy(500, window.innerHeight);
            });
            //await firstPage.waitForTimeout(6000);

            let textarea = await firstPage.waitForSelector('textarea.generated-ntriples')
            let value = await firstPage.evaluate(el => el.textContent, textarea)
            try {
                chai.assert.isTrue(value.includes("<http://brapi.biodata.pt/raiz/Investigation_THERMAL%20REQUIREMENTS,%20DURATION%20AND%20PRECOCITY%20OF%20PHENOLOGICAL%20STAGES%20OF%20GRAPEVINE%20CULTIVARS%20OF%20THE%20PORTUGUESE%20COLLECTIONINIAV:2Portos:VitisPhenology>"), "Creation of class investigation")
            } catch (e) {
                console.log("Assertion fail: ", e)
            }


        }
    }
    if(testCalls==true){
        //TODO Crawl call and select one at random
        await firstPage.goto('http://localhost:3000/callEditor/listcalls/Core/programs.json/map');

        async function getStateOfLoading(){
            return await firstPage.evaluate(()=> {
                const loading=document.querySelector('.spinner-grow')
                return JSON.parse(JSON.stringify(getComputedStyle(loading)))
            })
        }
        async function testStateOfLoading(){
            let stateOfLoading=await getStateOfLoading()
            if (stateOfLoading.display == undefined || stateOfLoading.display == 'block' ) {
                await firstPage.waitForTimeout(1500);
                console.log("Waiting for GUI to load")
                await testStateOfLoading()
            }else if(stateOfLoading.display == 'none'){
                console.log("Loaded!")
            }
        }


        //Test select random direct layer
        async function loadSelectSave(type) {
            await testStateOfLoading()
            let attributeTypeName,selectorTypeClass,collapseId

            if(type=="directAttribute"){
                selectorTypeClass="direct-attribute"
                attributeTypeName="Direct Attribute"
            }else if(type=="objectAttribute"){
                selectorTypeClass="object-attribute"
                attributeTypeName="Object Attribute"
            }
            const directRows = (await firstPage.$$(`td.${selectorTypeClass}`))
            let attributeChoice = random(directRows.length)
            let attributeName = await directRows[attributeChoice].evaluate(el => el.getAttribute('attribute'));
            collapseId=attributeName //For direct, will be overwritten if sub-item
            await directRows[attributeChoice].hover()
            if(type=="directAttribute")
                await directRows[attributeChoice].evaluate(el => {
                    //window.scrollBy(500, window.innerHeight);
                    el.querySelector('button').click()
                })
            else{
                collapseId=await (await directRows[attributeChoice].$(`button.${selectorTypeClass}`)).evaluate(el => {
                    //window.scrollBy(500, window.innerHeight);
                    el.click();
                    var buttons=el.closest('td').querySelectorAll('p>button.btn-primary');
                    var buttonNumber=Math.floor(Math.random()*buttons.length);
                    buttons[buttonNumber].click();
                    return buttons[buttonNumber].getAttribute('attribute')
                })

            }
            await firstPage.waitForTimeout(1500)


            await firstPage.waitForTimeout(1500)
            let vSelect = await firstPage.waitForSelector(`td[attribute="${attributeName}"] .collapse#${collapseId} .v-select`)
            try {
                await vSelect.click()
            }catch (e){
                console.log(`******Fail***** [${attributeTypeName}] - V-select not clickable`)
            }
            await firstPage.waitForTimeout(1500)
            let options = await firstPage.$$(`td[attribute="${attributeName}"] .collapse#${collapseId} .v-select li`)
            if(options<1){
                console.log(`*****Fail***** [${attributeTypeName}] - V-select has no options`)
            }
            let optionRandom = random(options.length)
            let optionText = await options[optionRandom].evaluate(v => v.textContent)
            try {
                console.log("Testing Direct Attributes....")
                chai.assert.include(optionText, "Property", "- Failed to load options")
                await options[optionRandom].hover()
                await options[optionRandom].click()
                await firstPage.waitForTimeout(1000)
                let classNameNew = await(await directRows[attributeChoice].$(`.collapse#${collapseId} input[name="class"]`)).evaluate(el => el.value)
                let propertyNameNew = await(await directRows[attributeChoice].$(`.collapse#${collapseId} input[name="property"]`)).evaluate(el => el.value)
                let expectedClassName, expectedPropertyName
                let anchor = await(await firstPage.$(`td[attribute="${attributeName}"] .collapse#${collapseId} .v-select`)).evaluate(el => el.getAttribute("anchor"))
                if (optionText.startsWith("Object Property")) {
                    expectedPropertyName = optionText.split(/Class/)[0].replace(/^.* Property/, "")
                    expectedClassName = optionText.split(/Class/)[1]
                } else {
                    expectedPropertyName = optionText.split(/Range/)[0].replace(/^.* Property/, "")
                    expectedClassName = anchor
                }
                chai.assert.include(classNameNew, expectedClassName, " - Selection of class failed")
                chai.assert.include(propertyNameNew, expectedPropertyName, " - Selection of property failed!")
            } catch (e) {
                console.log(`****Failed**** ${attributeTypeName} test: `, e)
            } finally {
                console.log(`[${attributeTypeName}] |Finished| Select / Save - Unit tests`)
            }
            let className = await(await directRows[attributeChoice].$(`.collapse#${collapseId} input[name="class"]`)).evaluate(el => el.value);
            let propertyName = await(await directRows[attributeChoice].$(`.collapse#${collapseId} input[name="property"]`)).evaluate(el => el.value);

            try {
                console.log(`[${attributeTypeName}] Test save/load of previous attribute`)
                await firstPage.reload("3000")
                let directRow;
                //if(type=="directAttribute")
                    directRow = await firstPage.$(`td.${selectorTypeClass}[attribute='${attributeName}'] .collapse#${collapseId}`) //Todo not set for subitem
                //else
                //    directRow = await firstPage.$(`td.${selectorTypeClass}[attribute='${attributeName}'] .collapse#`) //Todo not set for subitem
                let currentClassName = await(await directRow.$('input[name="class"]')).evaluate(el => el.value);
                let currentPropertyName = await(await directRow.$('input[name="property"]')).evaluate(el => el.value);
                chai.assert.equal(className, currentClassName, " - Save ClassName")
                chai.assert.equal(propertyName, currentPropertyName, " - Save PropertyName")
            } catch (e) {
                console.log(`****Failed**** ${attributeTypeName} test: `,e)
            } finally {
                console.log(`[${attributeTypeName} Load] |Finished| - (Save / Load) Unit tests`)
            }
        }
        //await loadSelectSave("directAttribute")
        await loadSelectSave("objectAttribute")

    }
    browser.disconnect();
})();