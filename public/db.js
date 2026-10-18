import { getUser, saveGraph } from "./fire.js";  
document.getElementById("graph").addEventListener("wheel", function(e) {
    e.preventDefault(); // Prevent default scroll behavior
    }, { passive: false });
const graphSaver = document.getElementById('saver');
const currentUser = JSON.parse(localStorage.getItem('user'));
const header = document.getElementById('head');
if (currentUser) {
    header.textContent = "Hi " + currentUser.displayName;
} else {
    header.textContent = "Wiki-Link";
}

//----------------STORING GRAPHS------------
let popup = document.getElementById("popup");
let graphToFirestore = document.getElementById("graph-to-firestore");
let closePopup = document.getElementById('close-out');
function openPopup() {
    popup.classList.add("open-popup");
}

async function closePopUp() {
    let graphTitle = document.getElementById("graph-title").value.trim();
    const nodeData = nodes.map(node => node.toObject());
    const linkData = links.map(link => link.toObject());
    console.log(graphTitle, nodeData, linkData);
    await saveGraph(graphTitle, nodeData, linkData);
    popup.classList.remove("open-popup");
}
graphSaver.addEventListener('click', () => {
    openPopup();
})
graphToFirestore.addEventListener('click', async () => {
    await closePopUp();
})
closePopup.addEventListener('click', () => {
    popup.classList.remove("open-popup");
})