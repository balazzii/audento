let audioFilesMap = new Map();
let recordings = new Map();
let count = 0;
let audioContext = new AudioContext();
let mediaRecorder = null;
let chunks = [];

let constraints = {
    audio: true,
    video: false
}

navigator.mediaDevices.getUserMedia(constraints).then((stream) => 
{
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
    }
    
    mediaRecorder.onstop = function(e) {
        let recordAudioElement = document.getElementById(audRecord);
        const blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        const audioURL = window.URL.createObjectURL(blob);
        recordAudioElement.src = audioURL;
    }

}, 
{
    "sounds/door.mp3",
    "sounds/landslide.mp3",
    "sounds/piano.mp3",
    "sounds/rain.mp3",
    "sounds/yodel.mp3"
    ]

    // load audio files
    sounds.forEach(createAudioContainers);

}

function createAudioContainers(item){
    let div = createDiv(item);
    let divRightPane = document.getElementById("rightAsideSection");
    divRightPane.appendChild(div);
}

function createAddToMixerButton(source){
    let button = document.createElement("button");
    button.classList.add("w3-button");
    button.classList.add("w3-circle");
    button.classList.add("w3-red");
    button.classList.add("w3-xlarge");
    button.classList.add("addButton");
    button.innerText = "+";
    button.addEventListener('click', function(){
        handleAddToFinalList(source);
    });
    return button;
}

function handleAddToFinalList(source) {
    let key = count;

    let request = new XMLHttpRequest();
    request.open("GET", source, true);
    request.responseType = "arraybuffer";

    request.onload = () => {
        let audioData = request.response;

        audioContext.decodeAudioData(
          audioData,
          (buffer) => {
            audioFilesMap.set(key, buffer);
            let list = document.getElementById("finalAudioListSection");
            
            let item = document.createElement("div");
            item.classList.add("finalListItem");

            let button = document.createElement("button");
            button.classList.add("fa");
            button.classList.add("fa-trash");
            button.classList.add("btnDelete");
            button.addEventListener('click', function() {
                audioFilesMap.delete(key);
                list.removeChild(item);

                if(audioFilesMap.size > 0){
                    document.getElementById("finalAudio").disabled = false;
                }
                else{
                    document.getElementById("finalAudio").disabled = true;
                }
            });

            let span = document.createElement("span");
            span.innerHTML = source.substring(7, source.length - 4);
            span.classList.add("finalAudioText");

            if(audioFilesMap.size > 0){
                document.getElementById("finalAudio").disabled = false;
            }
            else{
                document.getElementById("finalAudio").disabled = true;
            }
            
            item.appendChild(button);
            item.appendChild(span);
            list.appendChild(item);
            count++;
          },
          (e) => {
            `Error with decoding audio data ${e.error}`;
          }
        );
      };

    request.send(null);
}

function getAudioFromFile(source) {
    return new Response(source).arrayBuffer();
}

function createAudioFieldset(source){
    let fieldset = document.createElement("fieldset");
    let legend = document.createElement("legend");
    legend.innerHTML = source.substring(7,source.length - 4);
    fieldset.appendChild(legend);
    return fieldset;
}

function createAudio(source){
    let audio = new Audio(source);
    audio.controls = true;
    audio.controlsList = "noplaybackrate";
    audio.addEventListener('what',()=>{

    });
    return audio;
}

function createDiv(source){
    let div = document.createElement("div");
    div.class = "audio-container";
    
    let fieldset = createAudioFieldset(source);
    div.appendChild(fieldset);

    let audio = createAudio(source);
    fieldset.appendChild(audio);

    let button = createAddToMixerButton(source);
    fieldset.appendChild(button);

    return fieldset;
}

function recordClick(){
    var button = document.getElementById("btnRecord");
    if(button.classList.contains("notRec")){
        button.classList.remove("notRec");
        button.classList.add("startRec");
        button.classList.add("Rec");
        mediaRecorder.start();
    }
    else{
        button.classList.remove("startRec");
        button.classList.remove("Rec");
        button.classList.add("notRec");
        mediaRecorder.stop();
    }
}

function finalClick(){
    audioFilesMap.forEach((value) => {
        let source = new AudioBufferSourceNode(audioContext);
        source.buffer = value;
        source.connect(audioContext.destination);
        source.start(0);
        sleep(value.duration);
    });
}

function sleep(seconds) 
{
  var e = new Date().getTime() + (seconds * 1000);
  while (new Date().getTime() <= e) {}
}