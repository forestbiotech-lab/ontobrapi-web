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
        /*var grid = canvasDatagrid();
          document.getElementById('grid').appendChild(grid);
          grid.data = [
            { col1: 'row 1 column 1', col2: 'row 1 column 2', col3: 'row 1 column 3' },
            { col1: 'row 2 column 1', col2: 'row 2 column 2', col3: 'row 2 column 3' },
          ];*/
        self.closest('div').nextAll('.preview-table').removeClass('d-none')
        let gridEl=$('.grid')
        let dummyScrollDiv=self.closest('div').nextAll('.preview-table').find('.scroll .dummy')
        let tableScroll=self.closest('div').nextAll('.preview-table').children('.table-div')
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


  function loadXLSX(){
    
  }

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
          <div class="tab-pane fade" v-bind:id="worksheet.id" v-bind:class="{ active: worksheet.isActive, show: worksheet.isActive }" role="tabpanel" v-bind:aria-labelledby="worksheet.tab" v-for="worksheet in worksheets">{{ worksheet.data }}
            <datagrid-wrapper></datagrid-wrapper>
          </div>
        </div>  
      </div>
    `}
  )  
  /*Vue.component("my-tab-content",{template:`
      <div class="tab-pane fade" v-bind:id="worksheet.id" v-bind:class="{ active: worksheet.isActive, show: worksheet.isActive }" role="tabpanel" v-bind:aria-labelledby="worksheet.tab" v-for="worksheet in worksheets">{{ worksheet.data }}</div>
  `}
  )*/
  
  Vue.component("datagrid-wrapper",{
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
      worksheets:[
        {
          id:"home",
          ref:"#home",
          name:"First sheet",
          isActive:true,
          //tab:"sec-tab",
          data:`canvas-datagrid("v-bind.prop"="grid")`

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
  })     


})
  Vue.config.ignoredElements = ['canvas-datagrid'];
  var app = new Vue({
    el: "#app",
    data:{
      message: "Hello Vue!",
      grid: {
        data: [
          {col1: 'foo', col2: 0, col3: 'a'},
          {col1: 'bar', col2: 1, col3: 'b'},
          {col1: 'baz', col2: 2, col3: 'c'}
        ]
      },
      worksheets:[
        {
          id:"home",
          ref:"#home",
          name:"First sheet",
          isActive:true,
          //tab:"sec-tab",
          data:"1- fdsfsdfsdfsdfsd"

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
    },
    methods:{
      loadXLSX: function(event){
        loadXLSX()
      }
    }  
  })
