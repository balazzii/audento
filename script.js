// set up basic variables for app

const record = document.getElementById("record");
const stopRec = document.getElementById("stopRec");
const canvas = document.getElementById("visualizer");

// disable stop button while not recording

//stopRec.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;
const canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function(stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function() {
      const divRecContainer = document.getElementById("recContainer");
      const divActionContainer = document.getElementById("actionContainer");
      while (divRecContainer.lastElementChild) {
        divRecContainer.removeChild(divRecContainer.lastElementChild);
      }
      while (divActionContainer.lastElementChild) {
        divActionContainer.removeChild(divActionContainer.lastElementChild);
      }
      mediaRecorder.start();
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stopRec.disabled = false;
      record.disabled = true;
    }

    stopRec.onclick = function() {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stopRec.disabled = true;
      record.disabled = false;
    }

    mediaRecorder.onstop = function(e) {
      console.log("data available after MediaRecorder.stop() called.");
      const audio = document.createElement('audio');
      const divRecContainer = document.getElementById("recContainer");
      const divActionContainer = document.getElementById("actionContainer");

      const audioRecDiv = document.createElement('div');
      audioRecDiv.classList.add("col");
      audioRecDiv.appendChild(audio);
      divRecContainer.appendChild(audioRecDiv);

      audio.controls = true;
      const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");
      
      // add button
      const addRecDiv = document.createElement('div');
      addRecDiv.classList.add("col");
      addRecDiv.classList.add("col-lg-1");
      addRecDiv.classList.add("col-md-2");
      addRecDiv.classList.add("col-sm-4");
      const addRec = document.createElement('button');
      addRec.innerHTML = 'Mix';
      const addRecIcon = document.createElement('i');
      addRecIcon.classList.add('bi');
      addRecIcon.classList.add('bi-plus');
      addRecIcon.classList.add('btnAddRec');
      addRec.appendChild(addRecIcon);
      addRecDiv.appendChild(addRec);
      divActionContainer.appendChild(addRecDiv);
      
      // delete button
      const delRecDiv = document.createElement('div');
      delRecDiv.classList.add("col");
      delRecDiv.classList.add("col-lg-1");
      delRecDiv.classList.add("col-md-2");
      delRecDiv.classList.add("col-sm-4");
      const delRec = document.createElement('button');
      delRec.innerHTML = 'Trash';
      const delRecIcon = document.createElement('i');
      delRecIcon.classList.add('bi');
      delRecIcon.classList.add('bi-trash');
      delRecIcon.classList.add('btnTrash');
      delRec.appendChild(delRecIcon);
      delRecDiv.appendChild(delRec);
      divActionContainer.appendChild(delRecDiv);


      delRec.onclick = function() {
        while (divRecContainer.lastElementChild) {
            divRecContainer.removeChild(divRecContainer.lastElementChild);
          }
          while (divActionContainer.lastElementChild) {
            divActionContainer.removeChild(divActionContainer.lastElementChild);
          }
      }
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw()

  function draw() {
    const WIDTH = canvas.width
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(250, 220, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(50, 50, 230)';

    canvasCtx.beginPath();

    let sliceWidth = WIDTH * 1.0 / bufferLength;
    let x = 0;


    for(let i = 0; i < bufferLength; i++) {

      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}