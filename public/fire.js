import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js';
//import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js'";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";
import { getFirestore, setDoc, collection, doc, serverTimestamp, getDocs, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDziLdM-BRkZ19wnfGP0_y5TB1rUrD2yis",
  authDomain: "wiki-link-491ae.firebaseapp.com",
  projectId: "wiki-link-491ae",
  storageBucket: "wiki-link-491ae.firebasestorage.app",
  messagingSenderId: "738436280216",
  appId: "1:738436280216:web:65a28c6651a909275445ed",
  measurementId: "G-EJT2M1LV0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

//----------AUTHENTICATION------------
const auth = getAuth();

export async function signUp(email, password, username) {
    try {
        const userCredential = createUserWithEmailAndPassword(auth, email, password)
                                    .then((userCredential) => {
                                        const user = userCredential.user;
                                        localStorage.setItem('user', JSON.stringify(user));
                                        localStorage.setItem('logged-in', true);
                                        updateProfile(user, {
                                              displayName: username
                                            }).then(()=> {
                                              alert(user.displayName);
                                              //window.location.href = "index.html";
                                              
                                            }).catch((e) => {
                                              console.log('error: ', e);
                                        })
                                    })
                                    .catch((e) => {
                                        const errorCode = e.code;
                                        const errorMessage = e.message;
                                    });
    } catch {
        console.error("Sign-up error:", error.message);
    }
}

export async function signIn(email, password) {
    try {
            const userCredential = signInWithEmailAndPassword(auth, email, password)
                                        .then((userCredential) => {
                                            const user = userCredential.user;
                                            localStorage.setItem('user', JSON.stringify(user));
                                            window.location.href = "index.html";
                                        })
                                        .catch((e) => {
                                            const errorCode = e.code;
                                            const errorMessage = e.message;
                                            console.log(errorCode, errorMessage);
                                        });
        } 
    catch {
            console.error("Sign-up error:", error.message);
    }
}

export async function signOutCompletely() {
  signOut(auth)
    .then(() => {
      location.reload();
      console.log("Sign out successful");      
    })
    .catch((e) => {
      console.error(e);
    })
}

export function getUser() {
  console.log(auth);
  if (auth.currentUser) {
    return auth;
  } else {
    return null;
  }
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    if (window.location.pathname !== '/index.html'){
      //window.location.href = "index.html";
    }
  } else {
    localStorage.removeItem('user');
  }
});

//---------------DATABASE---------------
const db = getFirestore();

export async function saveGraph(name, nodes, links) {
  var curUser = JSON.parse(localStorage.getItem("user"));
  if (curUser) {
    var graph = {
      name: name,
      owner: curUser.uid,
      createdAt: serverTimestamp(),
      nodes: nodes,
      links: links
    }
    const graphsRef = collection(db, "graphs");
    await setDoc(doc(graphsRef, name), graph);
    console.log("DONE");
  }
}

export async function deleteGraph(graphID) {
  var curUser = JSON.parse(localStorage.getItem("user"));
  if (curUser) {
    const graphDocRef = doc(db, "graphs", graphID);
    await deleteDoc(graphDocRef);
  }
}

export async function loadGraph(userDATA) {
  const graphsRef = collection(db, "graphs");
  const snapshot = await getDocs(query(graphsRef, where("owner", "==", userDATA.uid), orderBy("createdAt", "desc")));
  const graphList = document.getElementById("graph-list");
  var i = 1;
  snapshot.forEach((doc) => {
      const data = doc.data();
      const gID = document.createElement("div");
      gID.classList.add("graphViewElement")
      gID.innerHTML = `
          <span class="graphViewNum">
            <p>${i}</p>
          </span>
          <a>${data.name}</a>
          <p>${data.createdAt.toDate().toLocaleString()}</p>
          <hr></hr>
      `
      graphList.appendChild(gID);
      i++;
  });
}

export async function loadGraphByName(userDATA, name) {
  const graphsRef = collection(db, "graphs");
  const snapshot = await getDocs(query(graphsRef, where("owner", "==", userDATA.uid), where("name", "==", name)));
  const doc = snapshot.docs[0];
  return doc.data();
}