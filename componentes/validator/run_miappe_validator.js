let http=require("node:http")
const { parse } = require('node-html-parser')
const config = require('./../../.config.json').validator

module.exports = {
    miappe
}

function miappe(file){
    return new Promise((resolve,reject)=> {
        let logs=""
        const postData = JSON.stringify({
            "file": `external/${file.name}`,
        });
        const options = {
            hostname: config.hostname,
            port: config.port,
            path: '/upload', //indifferent
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
                logs+=chunk
            });
            res.on('end', () => {
                console.log('No more data in response.');
                let data = extract(logs)
                resolve(data)
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });

        // Write data to request body
        req.write(postData);
        req.end();
    })

}


function extract(html){
    try{
        let root=parse(html.replace(/.*\<\/head\>/, "").replace("</html>",""))
        let data=root.getElementsByTagName("p")[0].innerHTML.replace(/<br>/g,"\n")
        return data
    }catch(err){
        //Error processing
        return `CHECK FAILED - Request from validator failed!\nCHECK FAILED - ${err.message}`
    }

}

//Deprecated version requires python dependencies to be install in the container
function miappe2(file){
    const { spawn,spawnSync} = require('child_process');
    // string
    return new Promise((resolve,reject)=>{
        try {

            let pythonProcess = spawn('docker', [
                'run', '--rm', "--mount",
                `type=bind,source=${__dirname}/../../uploads/uploadedfiles,target=/usr/src/app/external`,
                "ontobrapi/validator:latest", "python", "miappe_validator.py", "external/" + file.name
            ])

            pythonProcess.stdout.on('data', (data) => {
                console.log(`stdout: ${data}`);
                resolve(data)
            });

            pythonProcess.stderr.on('data', (err) => {
                console.error(`stderr: ${err}`);
                resolve(err)
            });

            pythonProcess.on('close', (code) => {
                console.log(`child process exited with code ${code}`);
            });
        }catch (e) {
            reject(e)
        }
    })

}


