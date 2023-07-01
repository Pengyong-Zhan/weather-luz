function getLatLonOfCity(city) {
  const url = "https://api.openweathermap.org/geo/1.0/direct?q="
  + city + "&limit=1&appid=aaa1c1a411f7f2a242211e43a6f2e6a1";

  fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error("Request failed" + response.status);
    }
    return response.json();
  })
  .then(data => {
    coord = [];
    const lat = Math.round(data[0].lat, 2);
    const lon = Math.round(data[0].lon, 2);
    getData(lat, lon)
  })
  .catch(error => {
    console.error(error);
  });

}

$("#searchCity").click(function() {
  getLatLonOfCity($("#cityName").val());
})