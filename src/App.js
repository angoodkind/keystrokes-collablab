import React, { useState, useEffect } from 'react';
import openSocket from 'socket.io-client';
import './App.css';
import firebase from 'firebase/app';

import 'firebase/database';



const firebaseConfig = {
  apiKey: "AIzaSyClIAFsYniP3urgKonGG107ZvNj4k6XO9Q",
  authDomain: "keystrokes-collablab.firebaseapp.com",
  projectId: "keystrokes-collablab",
  storageBucket: "keystrokes-collablab.appspot.com",
  messagingSenderId: "840523701382",
  appId: "1:840523701382:web:fef2f9e89331274fcd0507",
  measurementId: "G-HVG23GCK81"
};

firebase.initializeApp(firebaseConfig);

const socket = openSocket('https://keystrokes-collablab.herokuapp.com', {rejectUnauthorized: false, transports: ['websocket']});

function App() {

  const prompts = [
    `[Subject1] has had a long week at work, 
      and would like to relax and watch a movie to unwind. 
      [Subject2], what movie or movies would you recommend and why?
      Feel free to get to know each other, your tastes in movies, 
      and discuss why you’ve recommended these movies. 
      Do not hesitate to express opinions, 
      for example about what you like or don’t like about certain movies or movie genres, 
      or certain actors and actresses.`,
      `prompt 2`,
      'prompt 3',
      `Finished`
  ]
  
  const [subject, setSubject] = useState(null);
  const [room, setRoom] = useState();
  const [message, setMessage] = useState("");
  const [prompt, setPrompt] = useState(1);
  const [experiment, setExperiment] = useState(null);
  const [sentTime, setSentTime] = useState(Date.now());
  const [sends, setSends] = useState(null);


  useEffect(()=> {
    // The warning and timer Timeouts will run once every time the prompt changes.
    // Code will run after the miliseconds specified by the setTimeout's second arg.
    const warning = setTimeout(() => {
      if (prompt < 4) {
        alert('5 minutes remaining!');
      }
    }, 500000)
    const timer = setTimeout(() => {
      if (prompt < 4) {
        // When the time is up, increment the prompt state variable.
        console.log("happened");
        setPrompt(prompt + 1);
        alert(`Moving on to the next prompt!`);

        
      }
    }, 1000000);
    return () => {
      clearTimeout(timer);
      clearTimeout(warning);
    };
  // The second argument to useEffect says, execute the code in useEffect 
  // every time the state variables in the array change.
  // These are special variables controlled by React Hooks (e.g. useState())
  },[prompt])

  useEffect(()=> {
    if (prompt >= 4) {
      // After the last prompt, signal the parent frame to run jatos.endStudyAndRedirect
      window.parent.postMessage({
        'func': 'parentFunc',
        'message': 'Message text from iframe.'
      }, "http://localhost:9000");
    }
  },[prompt])

  // Set up the socket in a useEffect with nothing in the dependency array,
  // to avoid setting up multiple connections.
  useEffect(() => {
    socket.once('connection', (data) => {
      console.log("My ID:", socket.id);
      console.log("my index:", data.count);
      console.log(`I'm connected with the back-end in room ${data.room}`);
      setSubject(data.count + 1);
      setRoom(data.room);
    });
    
  },[message])
  
  const [keystrokes, setKeystrokes] = useState({});

  useEffect(() => {
    window.onkeydown = async function (e) {
      const info = {
        "keyupordown": "down",
        "eCode": e.code, 
        "eKey": e.key, 
        "eKeyCode": e.keyCode, 
        "timestamp": Date.now(),
        "existingTextMessage": message,
        "visibleTextKeystroke": null
      }
      if (experiment != null) {
        setKeystrokes(Object.assign(keystrokes, {[e.code]: firebase.database().ref('prod/' + experiment + '/prompt' + prompt + '/subject' +  subject + '/keys').push().key}));
        firebase.database().ref('prod/' + experiment + '/prompt' + prompt + '/subject'  + subject + '/keys/' + keystrokes[[e.code]]).push(info); 
        console.log("After down: ", keystrokes)
      }
    }
    window.onkeyup = async function (e) {
      const info = {
        "keyupordown": "up",
        "eCode": e.code, 
        "eKey": e.key, 
        "eKeyCode": e.keyCode, 
        "timestamp": Date.now(),
        "existingTextMessage": message,
        "visibleTextKeystroke": (e.key.length == 1 || e.code == "Backspace" ? e.key : null),
      }
      if (experiment != null) {
        firebase.database().ref('prod/' + experiment + '/prompt' + prompt + '/subject'  +  subject + '/keys/' + keystrokes[[e.code]]).push(info).then(() => {
          console.log("In the middle: ", keystrokes);
          setKeystrokes(Object.assign(keystrokes, {[e.code]: null}));
        }).then(() => {
          console.log("After up: ", keystrokes);
        })
      }
    }
    
   
  })


  useEffect(()=> {
    if (sends != null && sends.from == subject) {
      firebase.database().ref('prod/' + experiment + '/prompt' + prompt + '/subject' + subject + '/sends').push(sends)
    }
  },[sends])

  useEffect(()=> {
    if (subject == 1) {
      let myKey = firebase.database().ref('prod').push().key;
      socket.emit('setNode', {signal: myKey, room: room });
    } else {
      socket.emit('getNode', {room: room});
    }
  },[subject, room])


  function updateScroll(){
    var element = document.getElementById("messages");
    element.scrollTop = element.scrollHeight;
  }

  useEffect(() => { 
    if (subject != null) {
      socket.on("message", (result) => {
        console.log(`result.user: ${result.user}`);
        console.log(`subject number: ${subject}`);
        console.log("received: ", Date.now())
        const data = {
          "from": result.user,
          "timeSent": sentTime,
          "timeReceived": Date.now(),
          "message": result.data
        }
        setSends(data);
        if (result.user == subject) {
          console.log("same")
          document.getElementById('messages').innerHTML += 
          ` 
            <div class="o-out band">
              <div class="o-in message">${result.data}</div>
            </div>
          `
        } else {
          console.log("different")
          document.getElementById('messages').innerHTML += 
          ` 
            <div class="m-out band">
              <div class="m-in message">${result.data}</div>
            </div>
          `
        }
        updateScroll();
      })
    }
  },[subject])

  useEffect(()=> {
    window.onkeypress = function (e) {
      if (e.code == "Enter") {
        sendMessage(message)
      }
    }
  },[message])
  
  function sendMessage (message) {
    document.getElementById("text-input").value = "";
    setMessage("");
    if (message != "") {
      setSentTime(Date.now());
      socket.emit("message", {signal: {user: subject, data: message}, room: room});
    } else {
      console.log("empty message:", Date.now())
    }
  }

  useEffect(()=> {
    // If the client is the first member in their room, initialize a firebase Node for the room to write to.
    socket.on('setNode', (data) => {
      console.log("setNode", data);
      setExperiment(data);
    })
  },[])

  useEffect(() => {
    // If the client is the second member in their room, get the firebase Node that was alread initialized.
    socket.on('getNode', (data) => {
      console.log("getNode", data);
      setExperiment(data);
    })
  },[])

  useEffect(()=> {
    console.log("Experiment:", experiment)
  },[experiment])

  return (
    // There will never be 3 people in a room.
    subject >= 3 ? <div>ERROR</div> : 
    <div className="app">
      <div className="chatbox">
        <div id="messages" className="messages">
          
        </div>
        <div className="bar">
          <div className="type">
            <input type="text" id="text-input" className="text-input" onChange={(e) => {
              setMessage(e.target.value)            
            }}>
            </input>
          </div>
          {/* Button code below. */}
          {/* <div className="send-btn" onClick={() => sendMessage(message)}></div> */}
        </div>
      </div>
      <div className="prompt">
        {/* Display the prompt based on which prompt you're on: */}
        <div style={{margin: "50px"}}>{prompts[prompt - 1]}</div>
      </div>
    </div>
  );
}

export default App;
