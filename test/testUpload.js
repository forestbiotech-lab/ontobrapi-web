const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require("selenium-webdriver/chrome");
const firefox = require("selenium-webdriver/firefox")
const {Keyboard} = require("selenium-webdriver/lib/input");
let opts = new chrome.Options();
let service= new chrome.ServiceBuilder().build()
let ffOpts= new firefox.Options();
ffOpts.addArguments("--jsconsole")
//opts.setAcceptInsecureCerts(true);
//opts.setBrowserVersion('67');
//opts.setPlatform('Linux');
opts.addArguments("remote--debugging-port=9222","user-data-dir=/home/brunocosta/.config/selenium-chrome","localhost")

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



let switchTab=false;
let switchColumn=true;

(async function example() {
    let driver = await new Builder().forBrowser('chrome')
        //.setFirefoxOptions(ffOpts)
        .setChromeOptions(opts)
        .build();

    try{
        await driver.get('http://localhost:3000');

        await  driver.findElement(By.css('#augment-file')).sendKeys('/home/brunocosta/Transferências/dados.xlsx');
        //Fill properties
        await driver.wait(until.elementLocated(By.xpath("//input[@type='search']"))).click() //Open Column Select
        await driver.wait(until.elementLocated(By.id("vs1__option-1"))).click() //Select Column
        await driver.wait(until.elementLocated(By.css(".v-select#type input[type='search']"))).click() //Open type select
        await driver.wait(until.elementLocated(By.css(".v-select#type [id$='__option-0']"))).click()  //Select Dataproperties
        await driver.wait(until.elementLocated(By.css(".v-select#name input[type='search']"))).click()
        await driver.wait(until.elementLocated(By.css(".v-select#name [id$='__option-1']"))).click()
        await driver.wait(until.elementLocated(By.css(".v-select#valueType input[type='search']"))).click()
        await driver.wait(until.elementLocated(By.css(".v-select#valueType [id$='__option-1']"))).click()
        await driver.wait(until.elementLocated(By.css("input#naming_scheme"))).sendKeys("Something Clever")
        await driver.wait(until.elementLocated(By.css(".objectProperties button"))).click()

        await driver.executeScript('window.scrollBy(0,600)')


        if(switchColumn === true) {
            await driver.wait(until.elementLocated(By.xpath("//input[@type='search']"))).click()
            await driver.wait(until.elementLocated(By.id("vs1__option-2"))).click()
            await driver.wait(until.elementLocated(By.css(".v-select#type input[type='search']"))).click()
            await driver.wait(until.elementLocated(By.css(".v-select#type li[id$='__option-2'"))).click()

            await driver.wait(until.elementLocated(By.css(".v-select#name input[type='search']"))).click()
            await driver.wait(until.elementLocated(By.css(".v-select#name li[id$='__option-2'"))).click()
            await driver.wait(until.elementLocated(By.css(".v-select#valueType input[type='search']"))).click()
            await driver.wait(until.elementLocated(By.css(".v-select#valueType li[id$='__option-2'"))).click()
            await driver.wait(until.elementLocated(By.css("input#naming_scheme"))).sendKeys("Weird data")

        }

        if(switchTab === true ) {
            await driver.wait(sleep(3000))
            //Switch Tab
            await driver.findElement(By.css("#rId5")).click()
            //await driver.wait(until.elementLocated(By.id("vs1__option-1"))).click()
            //await driver.findElement(By.css('body')).sendKeys(Key.F12)  //Try to open console not working like this
        }
        //await driver.wait(sleep(20000))
        await driver.wait(until.elementLocated(By.css(".visibility-wrapper #objectProperty")));   //does nothing
    } finally {
        await driver.quit();
    }
})();