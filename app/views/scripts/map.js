function initMap() {
    var mapDiv = document.getElementById('map');
    var map = new google.maps.Map(mapDiv, {
        center: {lat:40.442813, lng:-79.942958},
        zoom: 16
    })

    d3.tsv("latlngdata.tsv", latlngtype, function(error, data){
        if (error) throw error;

        for (var i = 0; i < data.length; i++) {
            var newLatLng = { lat: data[i].lat, lng: data[i].lng };
            var infowindow = new google.maps.InfoWindow({
                content: "doesn't matter now does it"
            });
            var marker = new google.maps.Marker({
                position: newLatLng,
                map: map,
                title: data[i].name + " - $" + data[i].cost
            });
            marker.addListener('click', function() {
                infowindow.setContent(this.title);
                infowindow.open(map, this);
            });
        }
    });
}

function latlngtype(d) {
    d.lat = +d.lat;
    d.lng = +d.lng;
    d.cost = +d.cost;
    return d;
}