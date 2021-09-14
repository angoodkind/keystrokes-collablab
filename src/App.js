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

// Important
window.onbeforeunload = function () {
  return '';
}

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
    const warning = setTimeout(() => {
      if (prompt < 4) {
        alert('5 minutes remaining!');
      }
    }, 50000)
    const timer = setTimeout(() => {
      if (prompt < 4) {
        alert(`Moving on to the next prompt!`);
        console.log("happened");
        setPrompt(prompt + 1);
      }
    }, 100000);
    return () => {
      clearTimeout(timer);
      clearTimeout(warning);
    };
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

  useEffect(() => {
    window.onkeydown = function (e) {
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
        firebase.database().ref('prod/' + experiment + '/prompt' + prompt + '/subject' +  subject + '/keys').push(info);
      }
    }
    
    window.onkeyup = function (e) {
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
        firebase.database().ref('prod/' + experiment + '/prompt' + prompt + '/subject' +  subject + '/keys').push(info);
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
      //
      socket.emit("message", {signal: {user: subject, data: message}, room: room});
    } else {
      console.log("empty message:", Date.now())
    }
  }

  useEffect(()=> {
    socket.on('setNode', (data) => {
      console.log("setNode", data);
      setExperiment(data);
    })
  },[])

  useEffect(() => {
    socket.on('getNode', (data) => {
      console.log("getNode", data);
      setExperiment(data);
    })
  },[])

  useEffect(()=> {
    console.log("Experiment:", experiment)
  },[experiment])



  return (
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
          {/* <div className="send-btn" onClick={() => sendMessage(message)}></div> */}
        </div>
      </div>
      <div className="prompt">
          <div style={{margin: "50px"}}>{prompts[prompt - 1]}</div>
      </div>
    </div>
  );
}

export default App;
