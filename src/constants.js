
export const firebaseConfig = {

    apiKey: "AIzaSyBWJmpNZvlexkgSRvCi9IGe4ZZFGgaE9sc",
    authDomain: "keystroke-dialogue.firebaseapp.com",
    projectId: "keystroke-dialogue",
    storageBucket: "keystroke-dialogue.appspot.com",
    messagingSenderId: "258869565916",
    appId: "1:258869565916:web:a5388f1b8ec7ee25709719"
  };

export const ec2Base = 'http://ec2-18-223-160-60.us-east-2.compute.amazonaws.com'

// This is the array of prompts that will be displayed to the experiment subjects.
export const prompts = [
    {pNum: 1, pText:`Subj1 to Subj2`, pTime:10000},
    {pNum: 1, pText:`warning1`, pTime:3000},
    {pNum: 1, pText:`Subj1 to Subj2`, pTime:10000},
    {pNum: 2, pText:`Subj2 to Subj1`, pTime:10000},
    {pNum: 2, pText:`warning2`, pTime:3000},
    {pNum: 2, pText:`Subj2 to Subj1`, pTime:10000},
  ]

//   long week at work, 
//   and would like to relax and watch a movie to unwind. 
//   [Subject2], what movie or movies would you recommend and why?
//   Feel free to get to know each other, your tastes in movies, 
//   and discuss why you’ve recommended these movies. 
//   Do not hesitate to express opinions, 
//   for example about what you like or don’t like about certain movies or movie genres, 
//   or certain actors and actresses.`