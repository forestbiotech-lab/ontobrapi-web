window.app = new Vue({
    el: '#app',
    data:{
        "lookup_data_property": "",
        lookup_result:[],
        devhost_admin:""
    },
    computed:{

    },
    methods:{
        loginPanel(){
            window.modal.show()
        },
        async lookupTerm(){
            if(this.lookup_data_property.length>2){
                that=this
                $.post(this.devhost_admin+"/admin/query/lookup/data-property",{
                    graph: "staging:",
                    term:this.lookup_data_property
                }).then(result=>{
                    if(result.data.length>0){
                        that.lookup_result=result.data
                    }else{
                        that.lookup_result=[{
                            class:"#None",
                            dataPropertyURI:"",
                            property:"#None",
                            dataValue:"No results found!"
                        }]
                    }

                })


            } else{
                this.lookup_result=[]
            }

        }
    },
    async beforeMount() {
        let response= await fetch('/factory/vue/index/modal')
        let htmlString=await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(htmlString, 'text/html')
        document.getElementById("app").append(doc.getElementById("modal-results"))
        window.modal = new bootstrap.Modal(document.getElementById('modal-results'), {})
        fetch("/dev/configs").then(res=>res.json()).then(admin=>{
            if(admin){
                this.devhost_admin=`${admin.protocol}://${admin.hostname}:${admin.port}`
            }
        })
    }
})


loadChart({
    nodes:[
        {id:"Investigation",group:0,value:20},
        {id:"Study",group:0,value:20},
        {id:"Biological Material",group:0,value:20},
        {id:"Observation Unit",group:0,value:20},
        {id:"Observation",group:0,value:20},
        {id:"Environment",group:0,value:20},
        {id:"EnvironmentParameter",group:0,value:20},
        {id:"MaterialSource",group:0},
        {id:"id",group:1,value:10},
        {id:"title",group:1,value:10},
        {id:"description",group:1,value:10},
        {id:"Arabidopsis",group:2,value:10},
        {id:"thaliana",group:2,value:10},
    ],
    links:[
        {source:"Investigation",target:"Study",value:10,name:"partOf/hasPart"},
        {source:"Study",target:"Biological Material",value:10,name:"hasBiologicalMaterial"},
        {source:"Study",target:"Observation Unit",value:10,name:"partOf/hasPart"},
        {source:"Observation Unit",target:"Biological Material",name:"hasBiologicalMaterial",value: 10},
        {source:"Observation Unit",target:"Observation",value:10,name:"part of"},
        {source:"Study",target:"Environment",value:10},
        {source:"Environment",target:"EnvironmentParameter",value:10,name:"hasEnvironmentParameter"},
        {source:"Biological Material",target:"MaterialSource",value:10,name:"hasMaterialSource"},
        {source:"Investigation",target:"id",value:5,name:"hasIdentifier"},
        {source:"Investigation",target:"title",value:5,name:"hasName"},
        {source:"Investigation",target:"description",value:5,name:"hasDescription"},
        {source:"Biological Material",target:"Arabidopsis",value:5,name:"hasGenus"},
        {source:"Biological Material",target:"thaliana",value:5,name:"hasSpecies"},
    ]},"graph-ppeo")
$("svg#graph-ppeo").attr("viewBox", "-300 -200 1000 410")



