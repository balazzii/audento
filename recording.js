// set up basic variables for app

const record = document.getElementById("record");
const stopRec = document.getElementById("stopRec");
const canvas = document.getElementById("visualizer");
const canvasFinalLine = document.createElement('canvas');
let finalLineDiv = document.getElementById("finalLineDiv");
let finalLineLabel = document.getElementById("finalLineLabel");
canvasFinalLine.width = finalLineDiv.offsetWidth;
canvasFinalLine.height = 50;
canvasFinalLine.setAttribute('width', finalLineDiv.offsetWidth - 15);
canvasFinalLine.setAttribute('height', 50);
canvasFinalLine.id = "finalLineCanvas";
canvasFinalLine.hidden = true;
finalLineLabel.hidden = true;
finalLineDiv.appendChild(canvasFinalLine);

let audioFilesMap = new Map();
let finalAudioBufferSourceNodes = [];
let count = 0;
let finalAudioBufferSourceNodeEndedCount = 0;

// visualiser setup - create web audio api context and canvas

let audioCtx;
let totalSecs = 100;
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
            let key = "finalElement" + count;
            let gainNode = audioCtx.createGain();
            audioFilesMap.set(key, {
              name: "Recording",
              buffer: audioBuffer,
              secDelay: 0,
              gainNode: gainNode,
            });
            gainNode.gain.value = 1;
            addToFinalAudio("Recording", audioBuffer,key,gainNode);
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
    let warn = document.getElementById("warningLabel");
    warn.hidden = false;
    record.disabled = true;
    stopRec.disabled = true;
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
  "audento-mixer/sounds/glass-falls.mp3",
  "audento-mixer/sounds/yodel.mp3"
  ]

  // load audio files
  sounds.forEach(createPreloadedContainers);
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
  button.classList.add('btn-secondary');
  
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
    let audioSource = null;
    if(button.classList.contains("btn-secondary")){
      button.classList.remove("btn-secondary");
      button.classList.add("btn-primary");
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
        source.addEventListener("ended", () => {
          button.classList.remove("btn-primary");
          button.classList.add("btn-secondary");
        });
        audioSource = source;
      });
    }
    else {
      button.classList.remove("btn-primary");
      button.classList.add("btn-secondary");
      if(audioSource) {
        audioSource.stop();
      }
    }
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

  let percentageAudio = (audioBuffer.duration / totalSecs) * 100;
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
  input.classList.add("form-range");
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

  let element = document.createElement("div");
  element.classList.add("boxAudios");
  element.draggable = "true";
  element.style.width = percentageAudio + "%";
  element.style.left = "0%";
  element.id = id;

  elementCol.appendChild(element);
  elementRow.appendChild(divLabel);
  elementRow.appendChild(elementCol);
  container.appendChild(elementRow);

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
  dragElement(element,elementCol);
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
      let secDelay = v.secDelay;
      if (secDelay == 0) {
        trackSource.start();
      } else {
        trackSource.start(audioCtx.currentTime + secDelay);
      }
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