window.restaurants;
window.idbStore;
window.dbExists;
var map
var markers = []

var deferredPrompt;

window.addEventListener('beforeinstallprompt', function (e) {
  console.log('beforeinstallprompt Event fired');
  e.preventDefault();

  // Stash the event so it can be triggered later.
  deferredPrompt = e;

  return false; Î
});

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  window.dbExists = true;
  var request = window.indexedDB.open("MyDatabase");
  request.onupgradeneeded = function (e) {
    e.target.transaction.abort();
    window.dbExists = false;
  }
  fetchNeighborhoods();
  fetchCuisines();
  createIndexedDb()
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');
  const imageSrc = DBHelper.imageUrlForRestaurant(restaurant);
  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = "Restaurant " + restaurant.name;
  image.srcset = [`${imageSrc}-320px.jpg 320w,${imageSrc}-480px.jpg 480w,${imageSrc}-600px.jpg 600w`]
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}

/* 
* Register Service worker
*/
registerServiceWorker = () => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('./sw.js', {
      scope: '/'
    }).then(function (reg) {
      // console.log('Service Worker registered');
      reg.addEventListener('updatefound', function () {
        reg.installing.addEventListener('statechange', function () {
          if (this.state === 'installed') {

          }
        })
      })
    }).catch(function () {
      // console.log("Service worker registration failed");
    })
  }
}

registerServiceWorker();


var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

createIndexedDb = () => {
  var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;

  // Open (or create) the database
  var open = indexedDB.open("MyDatabase", 1);

  // Create the schema
  open.onupgradeneeded = function () {
    var db = open.result;
    window.idbStore = db.createObjectStore("MyObjectStore", { keyPath: "id" });
    var index = window.idbStore.createIndex("IdIndex", "id");
  };

  open.onsuccess = function () {
    // Start a new transaction
    var db = open.result;
    var tx = db.transaction("MyObjectStore", "readwrite");
    window.idbStore = tx.objectStore("MyObjectStore");
    var index = window.idbStore.index("IdIndex");

    window.restaurants.map(function (restaurant) {
      window.idbStore.put({ id: restaurant.id, data: { restaurant } });

    })
    // Add some data
    // store.put({ id: 67890, name: { first: "Bob", last: "Smith" }, age: 35 });

    // Query the data
    // var getJohn = store.get(12345);
    // var getBob = index.get(["Smith", "Bob"]);

    // getJohn.onsuccess = function () {
    //   console.log(getJohn.result.name.first);  // => "John"
    // };

    // getBob.onsuccess = function () {
    //   console.log(getBob.result.name.first);   // => "Bob"
    // };

    // Close the db when the transaction is done
    tx.oncomplete = function () {
      db.close();
    };
  }
}

