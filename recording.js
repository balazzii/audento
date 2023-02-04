// set up basic variables for app

const record = document.getElementById("record");
const stopRec = document.getElementById("stopRec");
const canvas = document.getElementById("visualizer");

// disable stop button while not recording

//stopRec.disabled = true;

// visualiser setup - create web audio api context and canvas

let audioCtx;
let totalSecs = 50;
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
      addRec.classList.add('btn')
      addRec.classList.add('btn-info')
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
      delRec.classList.add('btn')
      delRec.classList.add('btn-dark')
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

      addRec.onclick = function() {
        blob.arrayBuffer().then(arrayBuffer => 
          audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
            // Do something with audioBuffer
            console.log(audioBuffer);
            let key = count;
            audioFilesMap.set(key, {
              name: "Recording",
              buffer: audioBuffer
            });
            count++;
          }));
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

let audioFilesMap = new Map();
let count = 0;
function onLoad(){
  // this has to be decided on server side but for this example, the sound files are hardcoded
  let sounds = ["audento-mixer/sounds/applause.mp3",
  "audento-mixer/sounds/door.mp3",
  "audento-mixer/sounds/landslide.mp3",
  "audento-mixer/sounds/rain.mp3",
  "audento-mixer/sounds/glass-falls.mp3",
  "audento-mixer/sounds/yodel.mp3"
  ]

  // load audio files
  sounds.forEach(createPreloadedContainers);
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  if (typeof stroke == "undefined" ) {
    stroke = true;
  }
  if (typeof radius === "undefined") {
    radius = 5;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (stroke) {
    ctx.stroke();
  }
  if (fill) {
    ctx.fill();
  }        
}

function createPreloadedContainers(item) {
  const preLoadedContainer = document.getElementById("preLoadedRow");
  
  const div = document.createElement('div');
  div.classList.add('col');
  div.classList.add('col-sm-6');
  div.classList.add('col-md-4');
  div.classList.add('col-lg-3');
  div.classList.add('preloadedContainers');

  const h6 = document.createElement('h6');
  h6.classList.add('card-subtitle');
  h6.classList.add('mb-2');
  h6.classList.add('text-muted');
  var text = item.substring(21, item.length - 4);
  h6.innerHTML = text;

  const button = document.createElement("button");
  button.classList.add('btn');
  button.classList.add('btn-primary');
  
  const image = document.createElement('img');
  image.src = 'audento-mixer/wave.jpeg';
  image.width='100';
  button.appendChild(image);

  const mixButton = document.createElement('button');
  mixButton.classList.add('btn')
  mixButton.classList.add('btn-info')
  mixButton.innerHTML = 'Mix';
  const mixButtonIcon = document.createElement('i');
  mixButtonIcon.classList.add('bi');
  mixButtonIcon.classList.add('bi-plus');
  mixButtonIcon.classList.add('btnAddRec');
  mixButton.appendChild(mixButtonIcon);

  div.appendChild(h6);
  div.appendChild(button);
  div.appendChild(mixButton);

  preLoadedContainer.appendChild(div);

  button.onclick = function() {
    if(!audioCtx) {
      audioCtx = new AudioContext();
    }
    window.fetch(item)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    });
  }

  mixButton.onclick = function() {
    // for preloaded audios
    window.fetch(item)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      let key = count;
      let lastAudioDuration = 0;
      if(audioFilesMap.size > 0){
        audioFilesMap.forEach((v) => {
          lastAudioDuration += v.buffer.duration;
        });
      }
      audioFilesMap.set(key, {
        name: text,
        buffer: audioBuffer
      });
      addToFinalAudio(text, audioBuffer, (lastAudioDuration/totalSecs) * 100);
      count++;
    });
  }
}

function addToFinalAudio(name, audioBuffer, lastAudioDurationPercentage) {
  let playButton = document.getElementById("playFinal");
  playButton.disabled = false;

  let percentageAudio = (audioBuffer.duration / totalSecs) * 100;
  const container = document.getElementById("finalAudioRows");
  let elementRow = document.createElement("div");
  elementRow.classList.add("row");

  let divLabel = document.createElement("div");
  divLabel.classList.add("col");
  divLabel.classList.add("col-lg-1");
  divLabel.classList.add("col-md-2");
  divLabel.classList.add("col-sm-2");
  divLabel.classList.add("labelContainer");
  let label = document.createElement("span");
  label.classList.add("label");
  label.classList.add("label-md");
  label.classList.add("text-primary");
  label.innerHTML = name;
  divLabel.appendChild(label);

  let elementCol = document.createElement("div");
  elementCol.classList.add("col");
  elementCol.classList.add("col-lg-11");
  elementCol.classList.add("col-md-10");
  elementCol.classList.add("col-sm-10");
  let element = document.createElement("div");
  element.classList.add("boxAudios");
  element.draggable = "true";
  //element.style.paddingLeft = lastAudioDurationPercentage + "%"
  element.style.width = percentageAudio + "%";

  elementCol.appendChild(element);
  elementRow.appendChild(divLabel);
  elementRow.appendChild(elementCol);
  container.appendChild(elementRow);
}

function playFinal(){
  let playButton = document.getElementById("playFinal");
  playButton.disabled = true;
  let stopButton = document.getElementById("stopFinal");
  stopButton.disabled = false;

  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  audioFilesMap.forEach((v) => {
    const trackSource = new AudioBufferSourceNode(audioCtx, {
      buffer: v.buffer,
    });
    trackSource.connect(audioCtx.destination);
    let offset = 0;
    if (offset == 0) {
      trackSource.start();
      offset = audioCtx.currentTime;
    } else {
      trackSource.start(0, offset);
    }
  });
}

function stopFinal() {
  let playButton = document.getElementById("playFinal");
  let stopButton = document.getElementById("stopFinal");
  audioCtx.suspend().then(() => {
    console.log("audioContext suspended");
    playButton.disabled = false;
    stopButton.disabled = true;
  });
}