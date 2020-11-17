function autoComplete(input, latInput, lngInput) {
  if(!input) return // si no hay direccion, no ejecutemos esto
  const dropdown = new google.maps.places.Autocomplete(input);

 dropdown.addListener('place_changed', () => {
   try {
     const place = dropdown.getPlace();
     latInput.value = place.geometry.location.lat();
     lngInput.value = place.geometry.location.lng();
   } catch (error) {
     console.log(`no hay problemas, solo un pequeno error ${error}`);
   }
  })

  // si dan enter en la direccion, no hacer submit en el form
  // ese on, es la forma de decir addEventListener usando bling (ahorrando sintaxis)
  input.on('keydown', (e) => {
    if (e.keyCode === 13) e.preventDefault();
  })
}

export default autoComplete;