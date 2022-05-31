const puppeteer = require('puppeteer');
const fs=require('fs');
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
    let mapping = fs.readFileSync("/Users/brunocosta/Documents/Projectos/ontobrapi/9may/OntoBrAPI_9May_mapping-added.json",{encoding:"utf8"})
    mapping=mapping.split("/n")[0];
    let element;


    //Start browser
    //const browser = await puppeteer.launch(opts);
    const browserURL = 'http://localhost:59292'
    const browser = await puppeteer.connect({browserURL, defaultViewport: null})


    const pages = await browser.pages()
    const firstPage=pages[0]
    await firstPage.bringToFront();
    await firstPage.goto('http://localhost:3000');


    //LOAD SpreadSheet and Mapping
    await firstPage.waitForSelector('#augment-file')
    await (await firstPage.$('#augment-file')).uploadFile(`/Users/brunocosta/Documents/Projectos/ontobrapi/MIAPPEv1.1_compliant_vitis_submissionOntobrapi.xlsx`)
    element=await firstPage.$("#mapping-loading-options button.load-mapping-button")
    await element.evaluate(element=>element.click())
    await firstPage.waitForTimeout(1500);

    await setTextInputValue(firstPage, "#loadingPanel textarea", mapping)
    element=await firstPage.$('textarea');
    await element.type(" ");
    element = await firstPage.waitForSelector("#loadingPanel button.load-mapping-text");
    await element.click();

    if(switchTabAndColumn == true){
        //TEST
        element = await firstPage.waitForSelector("#rId2");
        await element.click();
        await firstPage.waitForTimeout(1500);
        element = await firstPage.waitForSelector('.v-select#column-selection input')
        await element.click()
        await firstPage.waitForTimeout(1500);
        element = await firstPage.waitForSelector('.v-select#column-selection li[id$=\'__option-20\'')
        await firstPage.waitForTimeout(1500);
        element = await firstPage.waitForSelector('.v-select#column-selection li[id$=\'__option-20\'')
        await element.click()
    }

    await firstPage.waitForTimeout(1500);

    browser.disconnect();
})();