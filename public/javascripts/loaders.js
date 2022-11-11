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
    async function success(data){
      filename=data.file.name
      hash=data.file.hash
      if(filename=="UnsupportedFile"){
        displayToast("Warning!","Unsupported file type! Please try again with another file. Should be a tab seperated value (.tsv) file.")
        resetProgressBar(".progress-augment-dynamic")
      }else if( filename.endsWith(".xlsx") || filename.endsWith(".xls") || filename.endsWith(".ods") ){
        let jSheet=data.jsheet
        window.jSheet=jSheet
        jSheet.file=data.file
        let completeness=makeCompleteness(jSheet)
    //---------------- Load Tabs ----------------//
        await loadWorksheetTabs(jSheet,completeness) //vue-components.js
    //---------------- Components worksheets -----------------------------------------------------//

        loadWorksheetGrids(jSheet)
        //Loads the other components
        await loadMapping(jSheet)
        Vue.config.ignoredElements = ['canvas-datagrid'];
        window.app = new Vue({                                                  //Anonymous can't get back to it if necessary!!!!
          el:"#preview-table",
          data:{
          },
          methods:{
            saveNTfile(){
              let blob = new Blob([$('textarea.generated-ntriples').text()], {type: 'application/n-triples'})
              let url=(URL.createObjectURL(blob))
              let a = document.createElement("a");
              document.body.appendChild(a);
              a.style = "display: none";
              a.href = url;
              a.download = window.jSheet.file.name.replace(/\.[a-z]+$/,".nt");
              a.click();
              window.URL.revokeObjectURL(url);
              a.remove()
            }
          }
        })

        self.closest('div').nextAll('.preview-table').removeClass('d-none')

        function resetUploadAbility(){
          $(".upload-augment-file").text("Upload another file")
          $(".upload-augment-file").unbind('click')
          $(".upload-augment-file").click(function(){
            if(confirm("All unsaved mappings will be lost! Proceed?")){
             window.location.reload();
            }
          })
        }
        resetUploadAbility()
        ntGenerationButton()


      }else{
        let table=makePreviewTable(self,data)
        //makeSelectors(table)
        //generateSubmitButton(table,self,data)
      }
    }
  })

  //TODO autorun
  function getOntoterms(){
    $.ajax({
      url:"/forms/ontologyterms/ppeo/",
      success:function(data,textStatus,jqXHR){
        loadOntoTerms(data)
      },
      fail:function(jqXHR,textStatus,data){
        displayToast("Error",err,4000)
      }
    })

  }
  getOntoterms()

  
  //TODO transform into FUNCTION. This has to be run when it's loaded. 
  function ntGenerationButton(){  
    $('button.generate-nt').click(function(){
      try{
        let button=$(this)
        let spinner=mkel('span',{class:"spinner-border spinner-border-sm",role:"status","aria-hidden":"true"},button)
        let selection=window.app.$children[0].$children[0].selection
        let jSheet=window.jSheet
        let payload=JSON.stringify({selection,jSheet},null, 2)
        
        let formData = new FormData();
        formData.set('payload', payload, );
        
        $.ajax({
          url:"/forms/parse/file/xlsx",
          method:"POST",
          contentType:false,
          processData:false,
          data:formData,
          success:function(data,textStatus,jqXHR){
            spinner.remove()
            loadNTriples(data)
          },
          error:function(jqXHR,textStatus,data){
            displayToast("Some error while generating N-Triples!",data,4000)
          }
        })                
      }catch(err){
        displayToast("Unable to load data to process!",err,4000)
      }
    })
  }
  function loadNTriples(data){
      console.log("Loading NT!")
      $('textarea').removeClass('d-none')
      $('button.save-nt-file').removeClass('d-none')
      $('textarea').text(data)
  }

  $('button.load-mapping-file').click(function(){
    $('input#open-mapping-file').click()
  })
  $('input#augment-file').on('change', function() {
    //TODO
    let self = $(this)
    var files = $(this).get(0).files;
    if (files.length == 1) {
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
        success: function (data, textStatus, jqXHR) {
          if (success) success(data)
        },
        fail: function (jqXHR, textStatus, err) {
          displayToast("Error", err, 4000)
        },
        xhr: function () {
          return progress()
        }
      });
    }
  })

})



