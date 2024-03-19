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

    if(process.platform=="darwin"){
            root="/Users"
    }else if(process.platform=="linux"){
        root="/home"
    }


    //Start browser
    //const browser = await puppeteer.launch(opts);
    // Lookup on chrome session "chrome://"
    const browserURL = 'http://localhost:45553'
    const browser = await puppeteer.connect({browserURL, defaultViewport: null})


    const pages = await browser.pages()
    const firstPage=pages[0]
    await firstPage.bringToFront();


    if(testCalls==true){
        //TODO Crawl call and select one at random
        await firstPage.goto('http://localhost:3000/callEditor/listcalls/Core/test_object.json/map');

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
                let expecqtedClassName, expectedPropertyName
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