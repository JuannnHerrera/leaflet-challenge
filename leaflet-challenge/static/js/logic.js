// Initialize the map
var map = L.map('map').setView([37.7749, -122.4194], 5);

// Add base layers
var streetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data: &copy; <a href="https://www.opentopomap.org/copyright">OpenTopoMap</a> contributors'
});

// Layers for earthquakes and tectonic plates
var earthquakesLayer = new L.LayerGroup();
var tectonicPlatesLayer = new L.LayerGroup();

// Function to update the top 5 legend
function updateTop5Legend(top5Earthquakes) {
  var legend = document.getElementById('top5-list');
  legend.innerHTML = '';  // Clear any existing list items

  top5Earthquakes.forEach(earthquake => {
    var li = document.createElement('li');
    li.innerHTML = `${earthquake.properties.place} (M ${earthquake.properties.mag})`;
    li.addEventListener('click', function() {
      var coords = earthquake.geometry.coordinates;
      map.setView([coords[1], coords[0]], 8);

      // Remove 'selected' class from all items
      var items = document.querySelectorAll('#top5-legend li');
      items.forEach(item => item.classList.remove('selected'));

      // Add 'selected' class to clicked item
      li.classList.add('selected');
    });
    legend.appendChild(li);
  });
}

// Fetch and plot earthquake data
fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson')
  .then(response => response.json())
  .then(data => {
    var top5Earthquakes = data.features.sort((a, b) => b.properties.mag - a.properties.mag).slice(0, 5);
    updateTop5Legend(top5Earthquakes);

    data.features.forEach(feature => {
      var coords = feature.geometry.coordinates;
      var lat = coords[1];
      var lng = coords[0];
      var depth = coords[2];
      var magnitude = feature.properties.mag;

      var color = depth > 90 ? '#FF0000' :
                  depth > 70 ? '#FF4500' :
                  depth > 50 ? '#FF8C00' :
                  depth > 30 ? '#FFA500' :
                  depth > 10 ? '#FFD700' : '#ADFF2F';

      var marker = L.circleMarker([lat, lng], {
        radius: magnitude * 3,
        fillColor: color,
        color: '#000',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      }).addTo(earthquakesLayer);

      marker.bindPopup(`<h3>${feature.properties.place}</h3><hr><p>${new Date(feature.properties.time)}</p><p>Magnitude: ${magnitude}</p><p>Depth: ${depth}</p>`);
    });
  }).then(() => {
    earthquakesLayer.addTo(map);
  });

// Fetch and plot tectonic plates data
fetch('https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json')
  .then(response => response.json())
  .then(data => {
    L.geoJSON(data, {
      style: function() {
        return { color: "orange", weight: 2 };
      }
    }).addTo(tectonicPlatesLayer);
  }).then(() => {
    tectonicPlatesLayer.addTo(map);
  });

// Add the legend
var legend = L.control({ position: 'bottomleft' });

legend.onAdd = function (map) {
  var div = L.DomUtil.create('div', 'info legend');
  var grades = [-10, 10, 30, 50, 70, 90];
  var colors = ['#ADFF2F', '#FFD700', '#FFA500', '#FF8C00', '#FF4500', '#FF0000'];

  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
      '<i style="background:' + colors[i] + '"></i> ' +
      grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
  }

  return div;
};

legend.addTo(map);

// Add baseMaps and overlayMaps for layer control
var baseMaps = {
  "Street Map": streetMap,
  "Topographic Map": topoMap
};

var overlayMaps = {
  "Earthquakes": earthquakesLayer,
  "Tectonic Plates": tectonicPlatesLayer
};

L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);
