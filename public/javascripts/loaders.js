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
              progressBar.html('Validating...');
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
        let progressBar = $('.progress.progress-augment-dynamic .progress-bar')
        progressBar.html('Done');
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
        window.app = mainApp()  //vue-apps.js

        self.closest('div').nextAll('.preview-table').removeClass('d-none')

        if(data.validation){
          let fail=0
          let success=0
          let warn = 0
          data.validation.split("\n").forEach(function(line){
            if(line.startsWith("CHECK FAILED")){
              fail++
              let li=document.createElement("li")
              li.className="list-group-item"
              li.textContent=line.replace("CHECK FAILED - ","")
              $('div#validation-results .validation-fail ul.validation-item-fail').append(li)
            }
            if(line.startsWith("CHECK PASSED")){
              success++
              let li=document.createElement("li")
              li.className="list-group-item"
              li.textContent=line.replace("CHECK PASSED - ","")
              $('div#validation-results .validation-success ul.validation-item-success').append(li)
            }
            if(line.startsWith("CHECK WARNING")){
              success++
              let li=document.createElement("li")
              li.className="list-group-item"
              li.textContent=line.replace("CHECK WARNING - ","")
              $('div#validation-results .validation-warn ul.validation-item-warn').append(li)
            }
          })
          if(fail>0) {


            var alertPlaceholder = document.getElementById('loadingPanel')
            var alertTrigger = document.getElementById('loadingPanel')

            function alert(message, type) {
              var wrapper = document.createElement('div')
              wrapper.innerHTML = '<div class="alert alert-' + type + ' alert-dismissible" role="alert">' + message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>'

              alertPlaceholder.prepend(wrapper)
            }

            if (alertTrigger) {
              alertTrigger.addEventListener('show.bs.collapse', function () {
                alert('The input validation has failed! Please fix the errors to continue, or click on the "Upload another file" button to try again. Click the Fail panel on the right to see the errors.', 'danger')
              })
            }

            $('div#validation-results .validation-fail').removeClass('d-none')
            $('div#validation-results .validation-fail .fail-counter').text(fail)
          }
          if(warn>0) {
            $('div#validation-results .validation-warn').removeClass('d-none')
            $('div#validation-results .validation-warn .warn-counter').text(warn)
          }
          if(success>0) {
            $('div#validation-results .validation-success').removeClass('d-none')
            $('div#validation-results .validation-success .success-counter').text(success)
          }
          progressBar.hide()
        }
        function resetUploadAbility(){
          $(".upload-augment-file").text("Upload another file")
          $(".upload-augment-file").unbind('click')
          $(".upload-augment-file").click(function(){
             window.location.reload();
          })
        }
        resetUploadAbility()



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



