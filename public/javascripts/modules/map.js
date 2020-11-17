import axios from 'axios';
import { $ } from './bling';
const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 10,
};

function loadPlaces(map, lat = 43.2, lng = -79.8) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`).then((res) => {
    const places = res.data;
    if (!places.length) {
      alert('No hay tiendas aca');
      return;
    }

    // tendremos un zoom que cubra todos nuestros markers con el bounds
    const bounds = new google.maps.latLngBounds();
    // creamos la pantalla de info que saldra sobre cada marker
    const infoWindow = new google.maps.InfoWindow();

    const markers = places.map((place) => {
      const [placeLng, placeLat] = place.location.coordinates;
      const position = { lat: placeLat, lng: placeLng };
      // extendemos el mapa para que cubra cada punto
      bounds.extend(position);
      // ponemos un marker en el mapa
      const marker = new google.maps.Marker({
        map: map,
        position: position,
      });
      // le mandamos info al marker que pusimos
      marker.place = place;
      return marker;
    });
    // cuando alguien clikee el marker, mostraremos los detalles
    markers.forEach((marker) =>
      marker.addListener('click', function () {
        const html = `
        <div class="popup">
          <a href="/store/${this.place.slug}">
            <img src="/uploads/${this.place.photo || 'store.png'}" alt="${
          this.place.name
        }">
            <p>${this.place.name} - ${this.place.location.address}</p>
          </a>
      `;
        infoWindow.setContent(html);
        infoWindow.open(map, this); //el this, es para saber en que parte del dom saldra el infoWindow. this se refiere a este marker
      })
    );

    // hacemos zoom para que veamos los markers de forma perfecta
    map.setCenter(bouns.getCenter());
    map.fitBounds(bounds);
  });
}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  // creamos el mapa de google
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
  // conectmos el input pa que google busque en el mapa la locacion que le digamos
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(
      map,
      place.geometry.location.lat(),
      place.geometry.location.lng()
    );
  });
}

export default makeMap;
