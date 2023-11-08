function mainApp() {
    return new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
        el: "#preview-table",
        data: {
            "uriGraph": "http://localhost:8890/ontobrapi"
        },
        methods: {
            saveNTfile() {
                let blob = new Blob([$('textarea.generated-ntriples').text()], {type: 'application/n-triples'})
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
            uploadGraph() {
                let graph = $('textarea.generated-ntriples').text()
                let that = this
                let data = JSON.stringify({
                    graph,
                    "uri": that.uriGraph,
                })
                let formData = new FormData();
                // loop through all the selected files
                formData.set('newGraph', data);
                $.ajax({
                    url: "/forms/upload/graph",
                    type: "POST",
                    processData: false,
                    contentType: false,
                    data: formData,
                    success: (data, textStatus, jqXHR) => {
                        console.log(data)
                    }
                })
            },
            loadNTriples(data){
                console.log("Loading NT!")
                //TODO this could be done in vue
                $('textarea.generated-ntriples').removeClass('d-none')
                $('button.save-nt-file').removeClass('d-none')
                $('textarea.generated-ntriples').text(data)
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
            }
        }
    })
}