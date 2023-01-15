let audioFilesMap = new Map();
let recordings = new Map();
let count = 0;
let audioContext;


function onLoad(){
    // this has to be decided on server side but for this example, the sound files are hardcoded
    let sounds = ["sounds/applause.mp3",
    "sounds/birds.mp3",
    "sounds/cinematic.mp3",
    "sounds/door.mp3",
    "sounds/landslide.mp3",
    "sounds/piano.mp3",
    "sounds/rain.mp3"
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
    //button.classList.add("addToMixerButton");
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
    audioContext = new AudioContext();
    fetch(source,{mode: "no-cors"})
    .then((response)=> response.arrayBuffer())
    .then((arrayBuffer) => 
    {
        var decoded = audioContext.decodeAudioData(arrayBuffer);
        // audioContext.decodeAudioData(response,(arrayBuffer) => 
        // {
            audioFilesMap.set(key, decoded);   
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
            });

            let span = document.createElement("span");
            span.innerHTML = source.substring(7, source.length - 4);
            span.classList.add("finalAudioText");
            
            item.appendChild(button);
            item.appendChild(span);
            list.appendChild(item);

            let finalAudio = document.getElementById("audFinal");
            let data = [];
            audioFilesMap.forEach((value) => {
                data.push(value);
            });
            let blob = new Blob(data.flat(),{ type: "audio/wav" });
            finalAudio.src = URL.createObjectURL(blob);
            // increase count which is used as key
            count++;
    });
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

        let constraints = {
			audio: true,
			video: false
		}

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
			console.log("getUserMedia supported");
            let media = navigator.mediaDevices.getUserMedia(constraints);

		} else {
			console.log("getUserMedia is not supported on your browser!")
		}
    }
    else{
        button.classList.remove("startRec");
        button.classList.remove("Rec");
        button.classList.add("notRec");
    }
}