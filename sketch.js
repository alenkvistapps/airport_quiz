let airportData;
const key = 'pk.eyJ1IjoiYWxlbmt2aXN0YXBwcyIsImEiOiJjazVwMmQ4dTEwYnU1M21xajV5NzNzcHE1In0.hhJMZLqOggCML-JIj_ldiQ';

const WIDTH = 600;
const HEIGHT = 700;

const options = {
  lat: 63,
  lng: 17,
  zoom: 4,
  width: WIDTH,
  height: HEIGHT,
  scale: 1,
  pitch: 0,
  style: 'light-v10'
};

const mappa = new Mappa('Mapbox', key);
const myMap = mappa.staticMap(options);
let canvas;

let data = [];
let current;
let gameover = false;
let score = -1;
let counter = 0;
let lastClicked;
let mapMoved = false;
const MAX_QUESTIONS = 10;
const MAX_CLICK_RANGE = 40;
const CLICK_ERROR = 1;

// TODO
// No scroll
// No zoom
// Show and upload best highscore of last 7 days and 30 days
// Publish on a webpage



function preload() {
  airportData = loadTable('airports.csv', 'header');
  mapImage = loadImage(myMap.imgUrl);
}

function setup() {
  canvas = createCanvas(WIDTH, HEIGHT);
  

  for (let row of airportData.rows) {
    let name = row.get('airport_name');
    let id = row.get('airport_icao');
    let lat = row.get('lat');
    let long = row.get('long');
    let size = row.get('size');
    let score = -1;
    let pix = myMap.latLngToPixel(lat, long);
    let nPix = { 
      x: 0,
      y: 0
    };
    data.push({
      name,
      id,
      lat,
      long,
      size,
      score,
      pix,
      nPix
    });
  }

  getNewCurrent();
}

function draw() {
  clear();
  image(mapImage, 0, 0);
  let greyColor = color(0, 0, 0);
  greyColor.setAlpha(100);
  fill(0, 0, 0);
  stroke(greyColor);
  textSize(20);
  if (gameover) {
    text("Game Over", width / 2, 20);
    text("Score: " + score + " / " + MAX_QUESTIONS, width / 2, 50);
  } else {
    if (current) {
      text(counter + ": Find " + current.id, width / 2, 20);
    }
  }
  textSize(12);
  for (let airport of data) {
    if (airport.score != -1) {
      const pix = airport.pix;
      let nPix = airport.nPix;
      fill(200, 200, 200);
      line(pix.x, pix.y, nPix.x, nPix.y);
      ellipse(pix.x, pix.y, 10);
      fill(0, 0, 0);
      ellipse(nPix.x, nPix.y, 10);
      text(airport.name + ", " + airport.id + ": " + airport.score,
        pix.x + 10, pix.y);
    }
  }
  if (lastClicked) {
    fill(255,0,125);
    noStroke();
    text(lastClicked.name + ", " + lastClicked.id + ": " + lastClicked.score, lastClicked.pix.x + 10, lastClicked.pix.y);
  }
}

function getNewCurrent() {
  counter++;
  let tempData = [];
  for (let airport of data) {
    if (airport.score == -1) {
      tempData.push(airport);
    }
  }
  if (counter <= MAX_QUESTIONS) {
    current = random(tempData);
    //current = data[35]; // Test of range
  } else {
    gameOver();
  }
}

function restartGame() {
  gameover = false;
  counter = 0;
  lastClicked = undefined;
  for (let airport of data) {
    airport.score = -1;
    airport.nLat = 0;
    airport.nLng = 0;
  }
  getNewCurrent();
}

function gameOver() {
  score = 0;
  for (let airport of data) {
    if (airport.score >= 0) {
      score += airport.score;
    }
  }
  score = round(score * 100) / 100;
  gameover = true;
}

function touchMoved() {
  mapMoved = true;
  console.log('Moved');
}

function touchEnded() {
  if (mapMoved) {
    mapMoved = false;
    return;
  }
  if (!current || gameover) {
    restartGame();
    return;
  }
  current.nPix.x = mouseX;
  current.nPix.y = mouseY;

  let a = mouseX - current.pix.x;
  let b = mouseY - current.pix.y;
  let c = sqrt(a * a + b * b); 
  let dist = c;
  console.log(current.name + ": " + dist);
  dist -= CLICK_ERROR;
  if (dist <= MAX_CLICK_RANGE) {
    let tempScore = 1 - dist / MAX_CLICK_RANGE;
    current.score = round(tempScore * 100) / 100;
    if (current.score > 1) {
      current.score = 1;
    }
  } else {
    current.score = 0;
  }
  lastClicked = {
    name: current.name,
    id: current.id,
    score: current.score,
    pix: current.pix
  };
  getNewCurrent();
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180)
}
