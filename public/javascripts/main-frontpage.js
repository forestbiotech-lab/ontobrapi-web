window.app = new Vue({
    el: '#app',
    data:{
        "lookup_data_property": "",
        lookup_result:[],
        devhost_admin:"",
        graph:"staging:",
        organisms:[]
    },
    computed:{

    },
    methods:{
        loginPanel(){
            window.modal.show()
        },
        async fetchDataProperty(graph, term) {
            try {
                const response = await $.post(this.devhost_admin + "/admin/query/lookup/data-property", {
                    graph,
                    term,
                });
                if (response.data && response.data.length > 0) {
                    this.lookup_result = response.data;
                    return; // Early exit if data is found
                }

                // Set default result for no data found
                this.lookup_result = [{
                    class: "#None",
                    dataPropertyURI: "",
                    property: "#None",
                    dataValue: "No results found!",
                }];
            } catch (error) {
                console.error("Error fetching data property:", error);
                // Handle errors appropriately (e.g., display an error message)
            }
        },
        async lookupTerm() {
            if (this.lookup_data_property.length > 2) {
                this.fetchDataProperty(this.graph, this.lookup_data_property)
                    .then(() => {
                        //TODO something
                    })
                    .catch((error) => {
                        console.error("Error fetching data property:", error);
                    })

            }else{
                this.lookup_result = []
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
        response = await fetch("/dev/configs")
        let admin=await response.json()
        if(Object.keys(admin).length>0){
            this.devhost_admin=`${admin.protocol}://${admin.hostname}:${admin.port}`
        }
        response = await $.post(this.devhost_admin + "/admin/query/list/species", {
            graph:this.graph
        });
        if (response.data && response.data.length > 0) {
            this.organisms = response.data;
        }
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


//Analytics INESC
var _paq = window._paq = window._paq || [];
  /* tracker methods like "setCustomDimension" should be called before "trackPageView" */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);
  (function() {
    var u="//analytics.biodata.pt/";
    _paq.push(['setTrackerUrl', u+'matomo.php']);
    _paq.push(['setSiteId', '12']);
    var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
    g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
  })();

