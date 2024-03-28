function mainApp() {
    return new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
        el: "#preview-table",
        data: {
            "uriGraph": "http://localhost:8890/ontobrapi",
            triples:{
                json: null,
                str: null,
                uid: null
            },
        },
        methods: {
            async saveNTfile(event) {
                if(this.triples.str==null){
                    this.triples.str=await this.convertNTs(event)
                }
                let blob = new Blob([this.triples.str], {type: 'application/n-triples'})
                let url = (URL.createObjectURL(blob))
                let a = document.createElement("a");
                document.body.appendChild(a);
                a.style = "display: none";
                a.href = url;
                a.download = window.jSheet.file.name.replace(/\.[a-z]+$/, ".nt");
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove()
            },
            uploadGraph(event) {
                let button = event.target
                let spinner = mkel('span', {
                    class: "spinner-border spinner-border-sm",
                    role: "status",
                    "aria-hidden": "true"
                }, button)
                let graph = $('textarea.generated-ntriples').text()
                let that = this
                let data = JSON.stringify(this.triples.json)
                let formData = new FormData();
                // loop through all the selected files
                formData.set('payload', data);
                $.ajax({
                    url: "/forms/upload/graph",
                    type: "POST",
                    processData: false,
                    contentType: false,
                    data: formData,
                    success: (data, textStatus, jqXHR) => {
                        spinner.remove()
                        //TODO This is useless otherwise it wouldn't be in success
                        if ( textStatus === "success"){
                            if(data.err == null){
                                that.triples.uid = data.uid
                            }else{
                                displayToast("Error",JSON.stringify(data.err),4000)
                            }

                        }else{
                            //todo?? will it break?
                            displayToast("Error",data.err,4000)
                        }
                    }
                })
            },
            loadNTriples(data){
                console.log("Loading NT!")
                //TODO this could be done in vue
                $('textarea.generated-ntriples').removeClass('d-none')
                $('button.save-nt-file').removeClass('d-none')
                this.triples.json=data
                first10=Object.keys(data.prefix).map(p=>`${data.prefix[p].prefix}`).join('\n')+"\n\n"
                first10+=Object.keys(data.individuals).slice(0,10).map(i=>`${data.individuals[i].s} ${data.individuals[i].p} ${data.individuals[i].o}`).join('\n')

                $('textarea.generated-ntriples').text(first10)
                $('textarea.generated-ntriples').addClass('loaded')
                $('textarea.generated-ntriples').trigger('load',["Loaded","Event"])
                $('div.d-grid.upload-graph').removeClass('d-none')
            },
            generateNTs(event) {
                let that=this
                try {
                    let button = event.target
                    let spinner = mkel('span', {
                        class: "spinner-border spinner-border-sm",
                        role: "status",
                        "aria-hidden": "true"
                    }, button)
                    let selection = window.app.$children[0].$children[0].selection
                    let jSheet = window.jSheet
                    let payload = JSON.stringify({selection, jSheet}, null, 2)

                    let formData = new FormData();
                    formData.set('payload', payload,);

                    $.ajax({
                        url: "/forms/parse/file/xlsx",
                        method: "POST",
                        contentType: false,
                        processData: false,
                        data: formData,
                        success: function (data, textStatus, jqXHR) {
                            spinner.remove()
                            that.loadNTriples(data)
                        },
                        error: function (jqXHR, textStatus, data) {
                            displayToast("Some error while generating N-Triples!", data, 4000)
                            spinner.remove()
                        }
                    })
                } catch (err) {
                    displayToast("Unable to load data to process!", err, 4000)
                }
            },
            convertNTs(event) {
                return new Promise(async (resolve, reject) => {
                    let that = this
                    try {
                        let button = event.target
                        let spinner = mkel('span', {
                            class: "spinner-border spinner-border-sm",
                            role: "status",
                            "aria-hidden": "true"
                        }, button)
                        let selection = window.app.$children[0].$children[0].selection
                        let jSheet = window.jSheet
                        let payload = JSON.stringify(this.triples.json, null, 2)

                        let formData = new FormData();
                        formData.set('payload', payload,);

                        $.ajax({
                            url: "/forms/convert/json/triples/string",
                            method: "POST",
                            contentType: false,
                            processData: false,
                            data: formData,
                            success: function (data, textStatus, jqXHR) {
                                spinner.remove()
                                resolve(data)
                            },
                            error: function (jqXHR, textStatus, data) {
                                resolve(data)
                                displayToast("Some error while generating N-Triples!", data, 4000)
                                spinner.remove()
                            }
                        })
                    } catch (err) {
                        resolve(err)
                        displayToast("Unable to load data to process!", err, 4000)
                    }
                })
            }
        }
    })
}