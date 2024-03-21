const formidable = require("formidable");



function singleFile(req) {
    return new Promise((resolve, rej) => {
        // create an incoming form object
        let form = new formidable.IncomingForm();
        form.multiples = false;
        // log any errors that occur
        form.on('error', function (err) {
            console.log('An error has occured: \n' + err);
            rej(err);
        });
        // once all the files have been uploaded, send a response to the client
        form.on('end', function () {
            //Not necessary for single file
        });
        // parse the incoming request containing the form data
        form.parse(req, (err, field, files) => {
            if (err) rej(err)
            if (field) {
                resolve(field)
            } else {
                rej(new Error("Something failed while retreiving data from client!"))
            }

        });
    })
}


























module.exports = {singleFile}