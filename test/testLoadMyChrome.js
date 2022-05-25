const {Builder, By, until, WebElement, JavascriptExecutor, Capabilities} = require('selenium-webdriver');
const chrome = require("selenium-webdriver/chrome");
const firefox = require("selenium-webdriver/firefox")
const {Keyboard} = require("selenium-webdriver/lib/input");
const fs=require('fs')
const {copy} = require("selenium-webdriver/io");
let opts = new chrome.Options();
//let service= new chrome.ServiceBuilder().build()
const capabilities = {
    browserName: "chrome",
    version: "67.0",
    resolution: "1280x800",
    network: true,
    visual: true,
    console: true,
    video: true,
    name: "Test 123", // name of the test
    build: "NodeJS build 23" // name of the build
};
const caps = new Capabilities(capabilities);

//opts.setAcceptInsecureCerts(true);
//opts.setBrowserVersion('67');
//opts.setPlatform('Linux');
//opts.addArguments("remote--debugging-port=9222","user-data-dir=/home/brunocosta/.config/google-chrome","localhost")
//opts.setChromeBinaryPath( "/usr/bin/google-chrome-stable" )
//opts.set("debuggerAddress":"localhost:9222")
//opts.set( "debuggerAddress", "localhost:9222")

(async function example() {
    let driver = await new Builder().forBrowser('chrome')
        //.setFirefoxOptions(ffOpts)
        .withCapabilities(caps)
        .setChromeOptions(opts)
        .build();
    try {
        await driver.get('http://localhost:3000');
        await driver.wait(sleep(20000))
    } catch (e) {
        console.log(e)
    }
})