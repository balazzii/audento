// set up basic variables for app
let audioFilesMap = new Map();
let finalAudioBufferSourceNodes = [];
let count = 0;
let finalAudioBufferSourceNodeEndedCount = 0;
let audioCtx;
let totalSecs = 100;
let recordedBuffer;

// Fetch elements for load set up
const record = document.getElementById("record");
const stopRec = document.getElementById("stopRec");
const canvas = document.getElementById("visualizer");
const canvasFinalLine = document.createElement('canvas');
let finalLineDiv = document.getElementById("finalLineDiv");
let finalLineLabel = document.getElementById("finalLineLabel");
let playRecording = document.getElementById("playRec");
let mixRecording = document.getElementById("mixRec");
let stopPlayRecording = document.getElementById("stopPlayRec");

// final audio x-axis set up
canvasFinalLine.width = finalLineDiv.offsetWidth;
canvasFinalLine.height = 50;
canvasFinalLine.setAttribute('width', finalLineDiv.offsetWidth - 15);
canvasFinalLine.setAttribute('height', 50);
canvasFinalLine.id = "finalLineCanvas";
canvasFinalLine.hidden = true;
finalLineLabel.hidden = true;
finalLineDiv.appendChild(canvasFinalLine);

// visualiser setup - create web audio api context and canvas
const canvasCtx = canvas.getContext("2d");
const finalLineCtx = canvasFinalLine.getContext("2d");

// draw final line
let width = parseInt(canvasFinalLine.width);
let half = parseInt(canvasFinalLine.height)/2;
finalLineCtx.beginPath();
finalLineCtx.moveTo(0, half);
finalLineCtx.lineTo(width, half);
finalLineCtx.lineWidth = 1;
finalLineCtx.stroke();

let divisions = 50;
let totalSecDivision = width / divisions;
let valueAddition = Math.round(totalSecs / totalSecDivision);

// draw axis
let i = 0;
let value = 0;
while(i <= width)
{
  finalLineCtx.strokeText(value, i, half+10);
  finalLineCtx.beginPath();
  finalLineCtx.moveTo(i, half);
  finalLineCtx.lineTo(i, half-5);
  finalLineCtx.lineWidth = 1;
  finalLineCtx.stroke();
  i=i+divisions;
  value = value + valueAddition;
}

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
      const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
      chunks = [];

      blob.arrayBuffer().then(arrayBuffer => 
        audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
          recordedBuffer = audioBuffer;
          playRecording.disabled = false;
          mixRecording.disabled = false;
      }));
    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  let onError = function(err) {
    console.log('The following error occured: ' + err);
    let warn = document.getElementById("warningLabel");
    warn.hidden = false;
    record.hidden = true;
    stopRec.hidden = true;
    playRecording.hidden = true;
    mixRecording.hidden = true;
  }

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);

}
else {
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

function onLoad(){
  // this has to be decided on server side but for this example, the sound files are hardcoded
  let sounds = ["audento-mixer/sounds/applause.mp3",
  "audento-mixer/sounds/door.mp3",
  "audento-mixer/sounds/landslide.mp3",
  "audento-mixer/sounds/rain.mp3",
  "audento-mixer/sounds/glass.mp3",
  "audento-mixer/sounds/yodel.mp3",
  "audento-mixer/sounds/piano.mp3",
  "audento-mixer/sounds/cinema.mp3",
  "audento-mixer/sounds/birds.mp3"
  ]

  // load audio files
  sounds.forEach(createPreloadedContainers);

  // resize iFrame
  let iFrame = document.getElementById("pdfViewer");
  let audiosContainer = document.getElementById("audiosContainer");
  let scriptHeader = document.getElementById("scriptHeader");
  let scriptUploadButton = document.getElementById("scriptUploadButton");
  iFrame.height = audiosContainer.clientHeight - scriptHeader.clientHeight - scriptUploadButton.clientHeight - 80;
  document.getElementById('scriptFile').addEventListener('change', function(e) {
    if (e.target.files[0]) {
      console.log(e.target.files[0]);
      alert("Local file needs to be uploaded in server and server functionality is pending.");
    }
  });
}

function createPreloadedContainers(item) {
  const preLoadedContainer = document.getElementById("preLoadedRow");
  
  const div = document.createElement('div');
  div.classList.add('col');
  div.classList.add('col-sm-12');
  div.classList.add('col-md-6');
  div.classList.add('col-lg-4');
  div.classList.add('preloadedContainers');

  const preLoadedAudioLabel = document.createElement('span');
  preLoadedAudioLabel.classList.add('card-subtitle');
  preLoadedAudioLabel.classList.add('mb-2');
  preLoadedAudioLabel.classList.add('text-muted');
  var text = item.substring(21, item.length - 4);
  preLoadedAudioLabel.innerHTML = text;

  const button = document.createElement("button");
  button.classList.add('btn');
  button.classList.add('btn-outline-success');
  
  const icon = document.createElement('i');
  icon.classList.add("bi");
  icon.classList.add("bi-volume-up");
  button.appendChild(icon);

  const stopbutton = document.createElement("button");
  stopbutton.classList.add('btn');
  stopbutton.classList.add('btn-outline-danger');
  
  const stopbuttonIcon = document.createElement('i');
  stopbuttonIcon.classList.add("bi");
  stopbuttonIcon.classList.add("bi-stop");
  stopbutton.appendChild(stopbuttonIcon);
  stopbutton.hidden = true;

  const mixButton = document.createElement('button');
  mixButton.classList.add('btn');
  mixButton.classList.add('btn-outline-dark');
  // mixButton.innerHTML = 'Mix';
  const mixButtonIcon = document.createElement('i');
  mixButtonIcon.classList.add('bi');
  mixButtonIcon.classList.add('bi-plus');
  mixButtonIcon.classList.add('btnAddRec');
  mixButton.appendChild(mixButtonIcon);

  div.appendChild(button);
  div.appendChild(stopbutton);
  div.appendChild(mixButton);
  div.appendChild(preLoadedAudioLabel);

  preLoadedContainer.appendChild(div);

  let preLoadedSource;
  button.onclick = function() {
    stopbutton.hidden = false;
    button.hidden = true;
    let audioSource = null;
    if(!audioCtx) {
      audioCtx = new AudioContext();
    }
    window.fetch(item)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      const source = audioCtx.createBufferSource();
      preLoadedSource = source;
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
      source.addEventListener("ended", () => {
        stopbutton.hidden = true;
        button.hidden = false;
    });
    audioSource = source;
    });
  }

  stopbutton.onclick = () => {
    button.hidden = false;
    stopbutton.hidden = true;
    preLoadedSource.stop();
  }

  mixButton.onclick = function() {
    // for preloaded audios
    window.fetch(item)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => audioCtx.decodeAudioData(arrayBuffer))
    .then(audioBuffer => {
      let key = "finalElement" + count;
      let gainNode = audioCtx.createGain();
      audioFilesMap.set(key, {
        name: text,
        buffer: audioBuffer,
        secDelay: 0,
        xPosition: 0,
        playOffset: 0,
        playDuration: audioBuffer.duration,
        gainNode: gainNode
      });
      gainNode.gain.value = 1;
      addToFinalAudio(text, audioBuffer,key,gainNode);
      count++;
    });
  }
}

function addToFinalAudio(name, audioBuffer, id,gainNode) {
  let playButton = document.getElementById("playFinal");
  playButton.disabled = false;
  let pauseButton = document.getElementById("pauseFinal");
  pauseButton.disabled = false;

  canvasFinalLine.hidden = false;
  finalLineLabel.hidden = false;

  let percentageAudio = (audioBuffer.duration / totalSecs);
  const container = document.getElementById("finalAudioRows");
  let elementRow = document.createElement("div");
  elementRow.classList.add("row");

  let divLabel = document.createElement("div");
  divLabel.classList.add("col");
  divLabel.classList.add("col-lg-2");
  divLabel.classList.add("col-md-3");
  divLabel.classList.add("col-sm-3");
  divLabel.classList.add("labelContainer");

  let delButton = document.createElement("button");
  delButton.classList.add("btn");
  delButton.classList.add("btn-dark");
  let delIcon = document.createElement("i");
  delIcon.classList.add("bi");
  delIcon.classList.add("bi-trash");
  delButton.appendChild(delIcon);

  let label = document.createElement("span");
  label.classList.add("label");
  label.classList.add("label-md");
  label.classList.add("text-primary");
  label.style.marginLeft = "1rem";
  label.innerHTML = name;

  let input = document.createElement("input");
  input.type = "range";
  // input.classList.add("form-range");
  input.classList.add("slider");
  input.min = 0;
  input.max = 2;
  input.value = 1;
  input.step = 0.01;
  divLabel.appendChild(delButton);
  divLabel.appendChild(label);
  divLabel.appendChild(input);

  let elementCol = document.createElement("div");
  elementCol.classList.add("col");
  elementCol.classList.add("col-lg-10");
  elementCol.classList.add("col-md-9");
  elementCol.classList.add("col-sm-9");
  elementCol.id = id;

  elementRow.appendChild(divLabel);
  elementRow.appendChild(elementCol);
  container.appendChild(elementRow);

  let width = elementCol.offsetWidth;
  let height = elementCol.offsetHeight;

  let stage = new Konva.Stage({
    container: id,
    width: width,
    height: height,
  });

  let layer = new Konva.Layer();

  let audioWidth = percentageAudio * width;
  var group = new Konva.Group({
    x: 0,
    y: 0,
    width: audioWidth,
    height: height - 1,
    draggable: true,
    dragBoundFunc: function (pos) {
      let returnX = pos.x;
      if(pos.x + audioWidth > width)
        returnX = width - audioWidth;
      
      if(pos.x  < 0)
        returnX = 0;
      
      let returnXPercentage = (returnX / width ) * totalSecs;
      let buffer = audioFilesMap.get(id);
      buffer.xPosition = returnX;
      buffer.secDelay = returnXPercentage;

      return {
        x: returnX,
        y: this.absolutePosition().y,
      }
    }
  });
  let baseRect = new Konva.Rect({
    x: 0,
    y: 0,
    width: audioWidth,
    height: height - 1,
    fill: 'cyan',
    cornerRadius: 10,
  });
  let rect = new Konva.Rect({
    x: 0,
    y: 0,
    width: audioWidth,
    height: height - 1,
    fill: 'rgb(250, 220, 200)',
    cornerRadius: 10,
  });
  group.add(baseRect);
  group.add(rect);
  layer.add(group);

  rect.on('mouseenter', function () {
    stage.container().style.cursor = 'pointer';
  });

  rect.on('mouseleave', function () {
    stage.container().style.cursor = 'default';
  });

  let tr = new Konva.Transformer({
    enabledAnchors: ['middle-right', 'middle-left'],
    anchorCornerRadius: 5,
    boundBoxFunc: function (oldBoundBox, newBoundBox) {
      let buffer = audioFilesMap.get(id);
      if(Math.abs(newBoundBox.x < buffer.xPosition)){
        return oldBoundBox;
      }
      if(Math.abs(buffer.xPosition + newBoundBox.width > buffer.xPosition + audioWidth)){
        return oldBoundBox;
      }
      buffer.playOffset = ((newBoundBox.x - buffer.xPosition) / audioWidth) * buffer.buffer.duration;
      buffer.playDuration = (newBoundBox.width / audioWidth) * buffer.buffer.duration;
      return newBoundBox;
    },
  });
  layer.add(tr);
  tr.nodes([rect]);

  // add the layer to the stage
  stage.add(layer);

  delButton.onclick = function(){
    audioFilesMap.delete(id);
    container.removeChild(elementRow);
    if(audioFilesMap.size === 0){
      changeToPlayButton();
      playButton.disabled = true;
      canvasFinalLine.hidden = true;
      finalLineLabel.hidden = true;
    }
  }

  input.oninput = function(){
    gainNode.gain.value = this.value;
  }
}

function dragElement(elmnt,elementCol) {
  var pos1 = 0;
  let containerOffsetWidth = elementCol.offsetWidth;
  let containerOffsetX = elementCol.offsetLeft;
  let containerWidth = containerOffsetWidth - containerOffsetX;
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = e.clientX;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    let newPos = e.clientX - pos1;
    let percentage = (newPos/containerWidth);
    let existingLeft = parseFloat(elmnt.style.left);
    if(existingLeft + percentage > 0 && existingLeft + percentage + parseFloat(elmnt.style.width) <  100){
      elmnt.style.left = existingLeft + percentage + "%";
    }

    var buffer = audioFilesMap.get(elmnt.id);
    buffer.secDelay = parseFloat(elmnt.style.left);
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function playFinal(){
  let stopButton = document.getElementById("stopFinal");
  stopButton.disabled = false;

  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  changeToPauseButton();
    audioFilesMap.forEach((v) => {
      const trackSource = new AudioBufferSourceNode(audioCtx, {
        buffer: v.buffer,
      });
      trackSource.connect(v.gainNode).connect(audioCtx.destination);
      trackSource.start(audioCtx.currentTime + v.secDelay + v.playOffset, v.playOffset, v.playDuration);
      trackSource.addEventListener("ended", () => {
        finalAudioBufferSourceNodeEndedCount++;
        if(finalAudioBufferSourceNodeEndedCount === audioFilesMap.size ) {
          changeToPlayButton();
          finalAudioBufferSourceNodeEndedCount = 0;
        }
      });
      finalAudioBufferSourceNodes.push(trackSource);
    });
  }

function pauseFinal(){
  audioCtx.suspend().then(()=>{
    changeToPlayButton();
  });
}

function changeToPauseButton(){
  let playButton = document.getElementById("playFinal");
  playButton.hidden = true;

  let pauseButton = document.getElementById("pauseFinal");
  pauseButton.hidden = false;
}

function changeToPlayButton(){
  let pauseButton = document.getElementById("pauseFinal");
  pauseButton.hidden = true;

  let playButton = document.getElementById("playFinal");
  playButton.hidden = false;
}

function stopFinal() {
  let stopButton = document.getElementById("stopFinal");
  finalAudioBufferSourceNodes.forEach((v) => {
    v.stop();
  });
  finalAudioBufferSourceNodes = [];
  changeToPlayButton();
  stopButton.disabled = true;
}

mixRecording.onclick = () => {
  // Do something with audioBuffer
  let key = "finalElement" + count;
  let gainNode = audioCtx.createGain();
  audioFilesMap.set(key, {
    name: "Recording",
    buffer: recordedBuffer,
    secDelay: 0,
    xPosition: 0,
    playOffset: 0,
    playDuration: recordedBuffer.duration,
    gainNode: gainNode,
  });
  gainNode.gain.value = 1;
  addToFinalAudio("Recording", recordedBuffer,key,gainNode);
  count++;
}

let recordingTrackSource;
playRecording.onclick = ()=>{
  playRecording.hidden = true;
  stopPlayRecording.hidden = false;
  
  if(!audioCtx) {
    audioCtx = new AudioContext();
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const trackSource = new AudioBufferSourceNode(audioCtx, {
    buffer: recordedBuffer,
  });
  recordingTrackSource = trackSource;
  trackSource.connect(audioCtx.destination);
  trackSource.start();
  trackSource.addEventListener("ended", () => {
    playRecording.hidden = false;
    stopPlayRecording.hidden = true;
  });
}

stopPlayRecording.onclick = ()=>{
  playRecording.hidden = false;
  stopPlayRecording.hidden = true;
  recordingTrackSource.stop();
}