

const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
//Theme toggler Elements
const themeToggler = document.getElementById('theme-toggler');
const body = document.body;
//Render the graph
/*var width = window.innerWidth/2;
var height = window.innerHeight/4;

var links = [{source: "Wikipedia", target: "Coding"}];
var nodes = {};
var current = "Wikipedia";

var svg = d3.select('#graph').append('svg')
    .attr('width', width)
    .attr('height', height);

/*var force = d3.forceSimulation()
            .nodes(Object.values(nodes))
            .on('tick', tick)
            .links(links)
            .linkDistance(100)
            .start();
            

function dragMove(element) {
    // Logic to update the position of the dragged element
    // Example:
    d3.select(element)
        .attr("cx", event.x)
        .attr("cy", event.y);
}

links.forEach(function(link) {
    link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
    link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
});

var force = d3.forceSimulation(Object.values(nodes))
                .force("link", d3.forceLink(links).distance(100))
                //.force("center", d3.forceCenter(width / 2, height / 2))
                .on("tick", tick);

var drag = d3.drag().on('drag', function() {
    dragMove(this)
});

var link = svg.selectAll('.link').data(links).enter().append('line').attr('class', 'link').attr("stroke", "blue").attr("stroke-width", 2);

var node = svg.selectAll('.node').data(force.nodes()).enter().append('circle').attr('class', 'node').attr('r', width = 10);

function tick(e) {
    node.attr('cx', function(d) {return d.x; })
        .attr('cy', function(d) {return d.y; })
        .call(drag);
    
    link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; })
}
function updateGraph() {
    console.log(links);
    links.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
        link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });



    link = svg.selectAll('.link').data(links).enter().append('line').attr('class', 'link').attr("stroke", "blue").attr("stroke-width", 2);

    node = svg.selectAll('.node').data(force.nodes()).enter().append('circle').attr('class', 'node').attr('r', width = 10);

    force.nodes(Object.values(nodes));
    force.force("link").links(links);
    force.alpha(1).restart();

}*/
var pageChangedforBot = false;
const Engine = Matter.Engine;
const World = Matter.World;
const Bodies = Matter.Bodies;
const Body = Matter.Body;
const Mouse = Matter.Mouse;
var inPan = false;
const controls = {
  view: {x: 0, y: 0, zoom: 1},
  viewPos: { prevX: null,  prevY: null,  isDragging: false },
}
var mouseConstraint;
var engine;
var darkon = false;


var links = [];
var nodes = [];
var current;

function loadFromStorage() {
    let curGraph = JSON.parse(sessionStorage.getItem('curGraph'));
    console.log("Check");
    if (curGraph) {
        console.log("RUNN");
        for (var i = 0; i < curGraph.nodes.length; i++) {
            var no = curGraph.nodes[i];
            nodes.push(new Node(no.name, no.shape, no.fixed, no.info, no.x, no.y));
        }
        for (var j = 0; j < curGraph.links.length; j++) {
            var li = curGraph.links[j];
            console.log(li);
            links.push(new Link(getNode(li.body1), getNode(li.body2), li.length))
        }
        current = nodes[0];
    }
}

//---------------DRAW GRAPH--------------------
function setup() {
    
    var canvas = createCanvas(window.innerWidth/2, window.innerHeight);
    canvas.parent("#graph");
    //canvas.mouseWheel(e => Controls.zoom(controls).worldZoom(e))
    engine = Engine.create({ gravity: { y: 0 } });
	world = engine.world;
    var mouse = Mouse.create(canvas.elt);
    mouse.pixelRatio = pixelDensity();
    mouseConstraint = Matter.MouseConstraint.create(engine, {
        // Optional options
        mouse:mouse,  
        constraint: {
          stiffness: 0.2,
          render: {
            visible: false
          }
        }
      });
    World.add(world, mouseConstraint)
    Engine.run(engine);
    loadFromStorage();
}

function draw() {
    rectMode(CENTER);
    background(100);
    translate(controls.view.x, controls.view.y);
    scale(Math.max(controls.view.zoom, 0.001))
    world.gravity.y = 0;
    Engine.update(engine);
    for (var i = 0; i < links.length; i++) {
        links[i].display();
    }

    for (var j = 0; j < nodes.length; j++) {
        if (current != nodes[j]) {
            nodes[j].active = false;
        } else {
            nodes[j].active = true;
        }
        nodes[j].display();
    }
}
function mousePressed() {
    var inEmpty = true;
    for (var i = 0; i < nodes.length; i++) {
            if (dist(mouseX, mouseY, nodes[i].body.position.x, nodes[i].body.position.y) < nodes[i].r) {
                inEmpty = false;
                current = nodes[i];
                updatePage(current.name, true);
            }
    }
    if (inEmpty == true) {
        inPan = true;
        //Controls.move(controls).mousePressed()
    }
}
function mouseDragged() {
    if (inPan) {
        //Controls.move(controls).mouseDragged()
    }
}

function mouseReleased() {
    if (inPan) {
        //Controls.move(controls).mouseReleased()
        inPan = false;
    }
}

//----------------WIKI_CALL AND DISPLAY RESULTS----------------------
//Calls api to fetch wikipedia pages
async function searchWikipedia(query) {
    const encodedQuery = encodeURIComponent(query);
    //const endpoint = `https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&origin=*&srlimit=10&srsearch=${encodedQuery}`;
    const endpoint = `https://en.wikipedia.org/w/api.php?action=parse&format=json&page=${query}&prop=text&formatversion=2&origin=*`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
        throw new Error('Failed to fetch search results from wikipedia API.');
    }

    const json = await response.json();
    return json;
}

//Checks if page is already present in nodes array
function checkInNode(name) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].name === name) {
            current = nodes[i];
            return true;
        }
    }
    return false;
}

function getNode(name) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].name === name) {
            return nodes[i];
        }
    }
    console.log('not found');
    return "";
}

//Displays the results found by updating the page
function displayResults(result, clicked=false) {
    // Remove loading spinner
    searchResults.innerHTML='';

    const url = `https://en.wikipedia.org/?curid=${result.pageid}`;
    const titleLink = `<a href="${url}" target="_blank" rel="noopener">${result.title} </a>`;
    const urlLink = `<a href="${url} class="result-link" target="_blank" rel=noopener">${url} </a>`;
    if (current != null) {
        if (!clicked) {
            var temp = current;
            console.log("NODE! + LINK!");
            current = new Node(result.title, "circle", false , result.title);
            if (!checkInNode(result.title)) {
                nodes.push(current);
            }
            links.push(new Link(temp, current, 100));
        }
    } else {
        current = new Node(result.title, "circle", true, result.title);
        if (!checkInNode(result.title)) {
            nodes.push(current);
        }
    }
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.innerHTML = `
    <h3 class="result-title">${titleLink}</h3>
    ${urlLink}
    ${result.text}
    `;
    searchResults.appendChild(resultItem);
    pageChangedforBot = true;
}

//Listens for submission of search
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    current = null;
    const query = searchInput.value.trim();
    updatePage(query);
});

//Updates the searchResults based on link clicked or user submission
async function updatePage(query, clicked=false) {
    if (!query) {
        searchResults.innerHTML ="<p>Please enter a valid search term.</p>";
        return;
    }
    searchResults.innerHTML = "<div class='spinner'>Loading ... </div>";

    try {
        const results = await searchWikipedia(query);
        displayResults(results.parse, clicked);
    } catch (error) {
        console.error(error);
        searchResults.innerHTML = `<p> An error occurred while searching. Please try again later. </p>`;
    }
}

//Update the page whenever a link is clicked
$(document).on('click', 'a', function(event) {
    const href = $(this).attr('href');
    if (href.indexOf("wiki") != -1) {
        event.preventDefault();
        updatePage(href.split('/wiki/')[1]);
    }
});

//--------------DOM STUFF--------------------
//Collapse and expand the graph
var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = document.getElementById('graph');
    if (content.style.display === "block") {
    content.style.display = "none";
    } else {
    content.style.display = "block";
    }
});
}

// Event Listener for the theme toggler
themeToggler.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    darkon = !darkon;
    if (body.classList.contains('dark-theme')) {
        themeToggler.textContent = "Dark";
        themeToggler.style.background = "#fff";
        themeToggler.style.color = "#333";
    } else {
        themeToggler.textContent = "Light";
        themeToggler.style.border = '2px solid #ccc';
        themeToggler.style.color = "#333";

    }
})

const toggleBtn = document.getElementById("chatbotToggle");
const chatbot = document.getElementById("chatbot");

toggleBtn.addEventListener("click", () => {
  chatbot.classList.add("open");
  toggleBtn.style.display = "none";
});

const closeBtn = document.createElement("button");
closeBtn.textContent = "×";
closeBtn.style.cssText = `
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 22px;
  color: white;
  cursor: pointer;
`;
chatbot.prepend(closeBtn);

closeBtn.addEventListener("click", () => {
  chatbot.classList.remove("open");
  setTimeout(() => {
    toggleBtn.style.display = "flex";
  }, 300);
});