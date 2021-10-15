$('document').ready(function(){
  $('button.upload-augment-file').on('click', function (){
    $('input#augment-file').click();
    $('.progress-bar').text('0%');
    $('.progress-bar').width('0%');
  });
  $('input#augment-file').on('change', function(){
    let self=$(this)
    var files = $(this).get(0).files;
    if (files.length == 1){
      // One or more files selected, process the file upload

      // create a FormData object which will be sent as the data payload in the
      // AJAX request
      var formData = new FormData();
      // loop through all the selected files
      formData.append('uploads[]', files[0], files[0].name);
      
      $.ajax({
        url: `/forms/datafile/upload`,
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        success: function(data,textStatus,jqXHR){
          if(success) success(data)
        },
        fail: function(jqXHR,textStatus,err){
          displayToast("Error",err,4000)
        },
        xhr: function() {
          return progress()
        }
      });
      function progress(){
        // create an XMLHttpRequest
        var xhr = new XMLHttpRequest();

        // listen to the 'progress' event
        xhr.upload.addEventListener('progress', function(evt) {
          let progressBar=makeProgressBar("progress-augment-dynamic")
          let pocketProgress=self.closest('.form-group').children('.pocket-progress')
          pocketProgress.empty()
          pocketProgress.append(progressBar)
          if (evt.lengthComputable) {
            var percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100);
            progressBar=$('.progress.progress-augment-dynamic .progress-bar')
            progressBar.text(percentComplete + '%');
            progressBar.width(percentComplete + '%');
            if (percentComplete === 100) {
              progressBar.html('Done');
            }
          }
        }, false);
        return xhr;
      }
    }
    function success(data){
      filename=data.file.name
      hash=data.file.hash
      if(filename=="UnsupportedFile"){
        displayToast("Warning!","Unsupported file type! Please try again with another file. Should be a tab seperated value (.tsv) file.")
        resetProgressBar(".progress-augment-dynamic")
      }else if( filename.endsWith(".xlsx") ){
        let jSheet=data.jsheet
        //Set first tab as active
        jSheet.Workbook.Sheets[0].isActive=true
        
   //---------------- Load Tabs ----------------//  
        Vue.component('worksheet-tabs',{
          data:function(){
            return {
              sheets:jSheet.Workbook.Sheets,
              currentTab:jSheet.SheetNames[0],
            }
          },
          computed: {
            currentTabComponent: function() {
              return "tab-" + this.currentTab.replace(/ /g,"-").toLowerCase();
            }
          },
          mounted: function () {
            //The first load takes some extra time since it is still loading the grid canvas 
            setTimeout(function(){syncHorizontalScrolls($('input#augment-file'))},1000)
          },                     
          template:vTab()
        })
   //---------------- Componets worksheet 0 -----------------------------------------------------//
     
        
        jSheet.SheetNames.forEach(function(sheet){
          //Don't use a for loop for this. 
          tabName=sheet.replace(/ /g,"-").toLowerCase()
          Vue.component(`tab-${tabName}`,{
            data:function(){
              return {            
                grid: {
                  data: jSheet.jsonSheets[sheet].slice(0,52) //Only first 50 lines //Last 2 are hidden.
                }
              }
            },
            mounted: function () {
              syncHorizontalScrolls($('input#augment-file'))
            },              
            template:`<canvas-datagrid v-bind.prop="grid"></canvas-datagrid>`
          })
        })

        Vue.config.ignoredElements = ['canvas-datagrid'];
        new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
          el:"#preview-table",
          data:{
          },   
        })
        
        self.closest('div').nextAll('.preview-table').removeClass('d-none')
        
        function syncHorizontalScrolls(self){  //
            
          let gridEl=$('.grid')
          let dummyScrollDiv=self.closest('div').nextAll('.preview-table').find('.scroll .dummy')
          let tableScroll=self.closest('div').nextAll('.preview-table').find('.table-div')
          tableScroll.html(gridEl)//gridEl

          dummyScrollDiv.width(self.closest('div').nextAll('.preview-table').find('canvas-datagrid').width())
          $(function(){
            let dummyScroll=dummyScrollDiv.closest('.scroll');
            dummyScroll.scroll(function(){
                tableScroll.scrollLeft(dummyScroll.scrollLeft());
            });
            tableScroll.scroll(function(){
                dummyScroll.scrollLeft(tableScroll.scrollLeft());
            });
          });
          
          
        }

        function resetUploadAbility(){
          $(".upload-augment-file").text("Upload another file")  
        }
        resetUploadAbility()  

        

      }else{
        let table=makePreviewTable(self,data)
        //makeSelectors(table)
        //generateSubmitButton(table,self,data)
      }
    }
  })

  function makeProgressBar(identifier){
    let progress=mkel('div',{class:`progress ${identifier}`})
    mkel("div",{
      class:"progress-bar bg-success",
      role:'progressbar'
    },progress)
    return progress
  }
  function makePreviewTable(self,data){
    let table=mkel("table",{class:"table preview-augment-file"})
    let dummyScrollDiv=self.closest('div').nextAll('.preview-table').find('.scroll .dummy')
    let tableScroll=self.closest('div').nextAll('.preview-table').children('.table-div')
    tableScroll.html(table)
    tableScroll.closest('.preview-table').removeClass('d-none')
    table.append(makeRow({},data.filePreview[0].split('\t'),{ondrop:"drop(event)",ondragover:"allowDrop(event)"},true))
    Array.from(table.children[0].children).forEach(el=>{el.textContent=""}) //Clear newly created row. //Should build the row in another manner
    data.filePreview.forEach((line,index)=>{
      table.append(makeRow({},line.split("\t"),{},index==0))
    })
    dummyScrollDiv.width(self.closest('div').nextAll('.preview-table').find('table.table').width())
    $(function(){
      let dummyScroll=dummyScrollDiv.closest('.scroll');
      dummyScroll.scroll(function(){
          tableScroll.scrollLeft(dummyScroll.scrollLeft());
      });
      tableScroll.scroll(function(){
          dummyScroll.scrollLeft(tableScroll.scrollLeft());
      });
    });
    return tableScroll.children('table')
  }


  (function(){
    $.ajax({
      url:"/forms/ontologyterms/ppeo/",
      success:function(data,textStatus,jqXHR){
        loadOntoTerms(data)
      },
      fail:function(jqXHR,textStatus,data){
        displayToast("Error",err,4000)
      }
    })

  })();
  function loadOntoTerms(data){
    let cardBody=$('.ontology-terms .card-body')  
    cardBody.empty()
    Object.entries(data).forEach(([key,value])=>{
      cardBody.append(makeOntoCard(key,value))
    })  
  }

  function makeOntoCard(header,body){
    let rdfType=header.split("#")[1]
    let title=mkel('button',{
      class:"btn btn-link btn-block text-left",
      title:header,
      type:'button',
      "data-toggle":'collapse',
      "data-target":`#${rdfType}`,
      "aria-expanded":'false', 
      "aria-controls":rdfType,
      id:`drag-${rdfType}`
    })
    title.textContent=rdfType
    
    let ul=mkel("ul",{class:"list-group"}) 
    body.forEach(item=>{
      let li=mkel('li',{
      class:"list-group-item",
      draggable:"true",
      title:item,
      ondragstart:"drag(event)",
      id:item.split("#")[1]
      },ul)
      li.textContent=item.split("#")[1]
    })
    let card=makeCard(title,ul)
    return card
  }
  function makeCard(header,body){
    let card=mkel('div',{class:"card"})
    let cardHeader=mkel('div',{class:"card-header",id:header.textContent},card)
    let collapse=mkel('div',{
      id:header.textContent,
      class:"collapse",
      "aria-labelledby":header.textContent,
      "data-parent":'#accordian-rdf-type'
    },card)
    let cardBody=mkel('div',{class:"card-body"},collapse)
    cardHeader.append(header)
    cardBody.append(body)
    return card
  }

  window.allowDrop=function(ev) {
   ev.preventDefault();
  }

  window.drag=function(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
  }

  window.drop=function(ev) {
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text");
    ev.target.appendChild(document.getElementById(data));
  }
  $('button.generate-nt').click(function(){
    $('textarea').removeClass('d-none')
    $('textarea').text("<raiz:study_353> <rdf:type> <ppeo:study>")
  })


/// TODO!! ---- Compile templates and get them via ajax -----///
  function vTab(){
    return `<div id="worksheets">
              <ul class="nav nav-tabs" id="myTab" role="tablist">
                <li class="nav-item" v-for="worksheet in sheets" role="presentation">
                  <a class="nav-link" v-bind:key="worksheet.name" v-on:click=" currentTab = worksheet.name " v-bind:id="worksheet.id" v-bind:class="{ active: worksheet.name === currentTab }" role="tab" data-toggle="tab">{{ worksheet.name }}</a>
                </li>
              </ul>
              <div class="scroll" style="overflow-x:scroll">
                <div class="dummy" style="width:1000px;height:20px"></div>
              </div>
              <div class="table-div" style="overflow-x:scroll;overflow-y:scroll;height:500px;">
                <div class="grid" id="grid">
                  <component v-bind:is="currentTabComponent"></component>
                  <div class="alert alert-info" role="alert" style="position:absolute;bottom:55px;left:21px;width:91%">
                    Only loaded first 50 lines into this preview!
                  </div>
                </div>
              </div>
            </div>
            `
  }

/**
  Vue.component("my-tab",{
    data: function () {
      return {
        worksheets:[
          {
            id:"home",
            ref:"#home",
            name:"First sheet",
            isActive:true,
            //tab:"sec-tab",
            data:``

          },
          { 
            id:"sec",
            ref:"#sec",
            name:"second sheet",
            //isActive:false,
            //tab:"sec-tab",
            data: "2- fsfsdf"
          }
        ]        
      }
    },
    template:`<div>
        <ul class="nav nav-tabs" id="myTab" role="tablist">
          <li class="nav-item" v-for="worksheet in worksheets" role="presentation">
            <a class="nav-link" v-bind:id="worksheet.tab" v-bind:class="{ active: worksheet.isActive }" v-bind:href="worksheet.ref" role="tab" data-toggle="tab">{{ worksheet.name }}</a>
          </li>
        </ul>
        <div class="tab-content" id="myTabContent">
          <div class="tab-pane fade" v-bind:id="worksheet.id" v-bind:class="{ active: worksheet.isActive, show: worksheet.isActive }" role="tabpanel" v-bind:aria-labelledby="worksheet.tab" v-for="worksheet in worksheets">
            <component v-bind:is="worksheet.id"></datagrid-wrapper>
          </div>
        </div>  
      </div>
    `}
  )  

  
  Vue.component("home",{
    data:function(){
      return { 
        grid: {
          data: [
            {col1: 'foo', col2: 0, col3: 'a'},
            {col1: 'bar', col2: 1, col3: 'b'},
            {col1: 'baz', col2: 2, col3: 'c'}
          ]
        }
      }
    },  
    template:`<canvas-datagrid v-bind.prop="grid"></canvas-datagrid>`
  }) 

  var app2= new Vue({
    el:"#app-test",
    data:{
    }
  })    

Vue.component('my-tab-test',{
  data: function () {
    return {
      currentTab:"home",
      worksheets:[
        {
          id:"home",
          ref:"#home",
          name:"First sheet",
          isActive:true,
          //tab:"sec-tab",
          data:``

        },
        { 
          id:"sec",
          ref:"#sec",
          name:"second sheet",
          //isActive:false,
          //tab:"sec-tab",
          data: "2- fsfsdf"
        }
      ]        
    }
  },
  computed: {
    currentTabComponent: function() {
      return "tab-" + this.currentTab.toLowerCase();
    }
  },
  template:
    `<div id="dynamic-component-demo" class="demo">
      <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item" v-for="worksheet in worksheets" role="presentation">
          <a class="nav-link" v-bind:key="worksheet.name" v-on:click="currentTab = worksheet.id" v-bind:id="worksheet.tab" v-bind:class="{ active: worksheet.isActive }" role="tab" data-toggle="tab">{{ worksheet.name }}</a>
        </li>
      </ul>      
      <component v-bind:is="currentTabComponent" class="tab"></component>
    </div>`
  }
)

Vue.component("tab-sec",{
  data:function(){
    return { 
      grid: {
        data: [
          {col1: 'foo', col2: 0, col3: 'a'},
          {col1: 'bar', col2: 1, col3: 'b'},
          {col1: 'baz', col2: 2, col3: 'c'}
        ]
      }
    }
  },  
  template:`<canvas-datagrid v-bind.prop="grid"></canvas-datagrid>`
})
   
Vue.component("tab-home", {
   template: "<div>Home component</div>"
});*/


/*Vue.config.ignoredElements = ['canvas-datagrid','my-tab-test'];
var app = new Vue({
  el: "#app-test",
  data:{
    message: "Hello Vue!",
  },
  methods:{
    loadXLSX: function(event){
      loadXLSX()
    }
  }  
})
*/



})

