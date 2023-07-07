const moment = require('moment-timezone');


////functions defined////
function getFormattedDate(date, timeZone) {
  const options = { timeZone: timeZone, hour12: false};
  return date.toLocaleString("en-US", options);
}


function getWeekDay(date, timeZone) {
  return date.toLocaleDateString('en-US', { weekday: 'long', timeZone: timeZone });
}


function getHourPart(formattedDate) {
  const hour = formattedDate.split(", ")[1].split(":")[0];
  return hour;
}


function capitalize(str) {
  return str.replace(/\b\w/g, match => match.toUpperCase());
}


function getHourlyTemp(obj) {
  let temp = [];
  for (const HourlyData of obj.hourly) {
    temp.push(Math.round(HourlyData.temp));
  }
  return temp.slice(0,24);
} 


function getTimeStamp(timeStamp) {
  const date = new Date(timeStamp * 1000);
  return date;
} 


function timeDiffLessThan10Mins(timeStamp1, timeStamp2) {
  let diff = Math.abs(timeStamp1 - timeStamp2);
  let diffInMin = diff / (1000 * 60);
  return diffInMin < 10;
}


const apiKey = "aaa1c1a411f7f2a242211e43a6f2e6a1";


////code in original searchCity.js////
function searchCityWeather(city) {
  getLatLon(city)
  .then(coords =>{
    const lat = coords[0];
    const lon = coords[1];

    if (lat) {
      localStorage.setItem('lat', lat);
      localStorage.setItem('lon', lon);
    }

    getData(lat, lon);
  })
}


$("#searchCity").click(function() {
  searchCityWeather($("#cityName").val());  
})


////GeoLocation////
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(getLatLonByPosition);
  } 
}


function getLatLonByPosition(position) {
  const lat = Number(position.coords.latitude.toFixed(4));
  const lon = Number(position.coords.longitude.toFixed(4));
  localStorage.setItem('lat', lat);
  localStorage.setItem('lon', lon);
  getData(lat, lon);
}


if (localStorage.getItem('lat')) {
  const lat = localStorage.getItem('lat');
  const lon = localStorage.getItem('lon');
  getData(lat, lon);
} else {
  getData("45.4215", "-75.6972");
  setTimeout(function() {
    getLocation();
  }, 3000);   
}


////code in original weather.js////
function getData(lat, lon) {
  const coords = lat + "" + lon;
  if (localStorage.getItem(coords)) {
    const LocalData = JSON.parse(localStorage.getItem(coords));
    const now = new Date();
    const dateofLocalData = new Date(LocalData[2]);
    const data = LocalData[1]

    if (coords == LocalData[0] && timeDiffLessThan10Mins(dateofLocalData, now)) {
      getCityName(lat, lon);
      const timeZone = data.timezone;
      
      populateHeader(data, timeZone);
      lineChart(getHourlyTemp(data), Number(getHourPart(getFormattedDate(getTimeStamp(data.current.dt), timeZone))));
      populateDailyWeather(data, timeZone);
      populateHourlyWeatherDesc(data, timeZone);
    } else {
      getAndProcessDataViaAPI(lat, lon)
    }
  } else {
    getAndProcessDataViaAPI(lat, lon)
  }
  
}


/*callback functions defined in getData() and getAndProcessDataViaAPI()*/
function getAndProcessDataViaAPI(lat, lon) {
  getCurrentWeather(lat, lon)
    .then(data => {
      let latLon = [];
      latLon.push(lat + "" + lon);
      latLon.push(data);
      latLon.push(new Date());
      localStorage.setItem(lat + "" + lon, JSON.stringify(latLon));
      
      getCityName(lat, lon);
      const timeZone = data.timezone;
      
      populateHeader(data, timeZone);
      lineChart(getHourlyTemp(data), Number(getHourPart(getFormattedDate(getTimeStamp(data.current.dt), timeZone))));
      populateDailyWeather(data, timeZone);
      populateHourlyWeatherDesc(data, timeZone);
    })
}


function populateHeader(obj, timeZone) {
  const temp = $("#temp");
  temp.text(`${Math.round(obj.current.temp)}°C`);

  const feelsLike= $("#feelsLike");
  feelsLike.text(`Feels Like: ${Math.round(obj.current["feels_like"])}°C`);

  const humidity = $("#humidity");
  humidity.text(`Humidity: ${obj.current.humidity}%`)

  const windSpeed = $("#windSpeed");
  windSpeed.text(`Wind: ${Math.round(obj.current.wind_speed)} km/h`)

  const date = new Date(obj.current.dt * 1000);
  const dayOfWeek = $("#dayOfWeek");
  dayOfWeek.text(getWeekDay(date, timeZone) + " " + getFormattedDate(date, timeZone));

  const weatherDesc = $("#weatherDesc")
  const desc = obj.current.weather[0].description;
  const mainDesc = obj.current.weather[0].main;
  weatherDesc.text(capitalize(desc));

  const iconURL = getIcon(desc, mainDesc, date, timeZone);
  const headerWeatherIcon = $("#headerWeatherIcon");
  headerWeatherIcon.attr("src",iconURL);
}


function populateHourlyWeatherDesc(obj, timeZone) {
  const hourlyWeatherDesc = $("#hourlyWeatherDesc");
  hourlyWeatherDesc.empty();

  for (const hourlyData of obj.hourly.slice(0, 24)) {
    const img = $("<img>");
    img.attr("src", getIcon(hourlyData.weather[0].description, hourlyData.weather[0].main, getTimeStamp(hourlyData.dt), timeZone));
    img.attr("title", hourlyData.weather[0].description);
    img.attr("alt", hourlyData.weather[0].description);
    img.css({
      width: "50px",
      height: "50px"
    })
    hourlyWeatherDesc.append(img);
  }  
}


function lineChart(tempData, hour) {
  Highcharts.chart("lineChartTemp", {
    chart: {
      type: "areaspline",
      height: 300,
    },
    title: {
        text: null,
    },
    legend: {
      enabled: false
    },
    xAxis: {
      tickInterval: 1,
      tickLength: 5,
      labels: {
        formatter: function () {
          if (this.value > 24) {
            return this.value - 24;
          } else {
            return this.value;
          }
        }
      }
    },
    yAxis: {
        title: {
            text: null
        },
        labels: {
          enabled: false,
        },
        gridLineWidth: 0
    },
    tooltip: {
      enabled: false
    },
    credits: {
        enabled: false
    },
    plotOptions: {
        series: {
            pointStart: hour,
            pointInterval: 1,
            dataLabels: {
              enabled: true, 
              format: "{point.y}"
            }
        },
        areaspline: {
            fillOpacity: 0.2
        }
    },
    series: [{ 
        name: "Temperature",
        data: tempData
    }]      
  });
}


function populateDailyWeather(obj, timeZone) {
  const divOfAllDailyWeather = $("#dailyWeather");
  divOfAllDailyWeather.empty();

  for (const dailyInfo of obj.daily) {
    const divDaily = $("<div>");
    divDaily.addClass("d-flex flex-column align-items-center");

    const dayOfWeek = $("<p>");
    const date = new Date(dailyInfo.dt * 1000);
    dayOfWeek.text(getWeekDay(date, timeZone));

    const icon = $("<img>");
    icon.attr("src", getIcon(dailyInfo.weather[0].main, dailyInfo.weather[0].description, getTimeStamp(dailyInfo.dt), timeZone));
    icon.attr("title", dailyInfo.weather[0].description);
    icon.attr("alt", dailyInfo.weather[0].description);
    icon.css({
      width: "100px",
      heigh: "100px",
      "margin-top": "-20px"
    });

    const temp = $("<p>");
    temp.text(Math.round(dailyInfo.temp.min) + "°" + " - " + Math.round(dailyInfo.temp.max) + "°");

    divDaily.append(dayOfWeek);
    divDaily.append(icon);
    divDaily.append(temp);
    divOfAllDailyWeather.append(divDaily);
  }
}


function getIcon(desc, mainDesc, date, timeZone) {
  const urlP1 = "https://openweathermap.org/img/wn/";
  const urlP3 = "@2x.png";
  let urlP2DayOrNight;

  const hour = getHourPart(getFormattedDate(date, timeZone));
  switch (true) {
    case (hour >= 19 && hour <= 24):
    case (hour >= 0 && hour <= 4):
      urlP2DayOrNight = "n";
      break;  
    default:
      urlP2DayOrNight = "d";
      break;
  }

  const weatherMappings = {
    "clear sky": "01",
    "few clouds": "02",
    "scattered clouds": "03",
    "broken clouds": "04",
    "shower rain": "09",
    "light intensity shower rain": "09",
    "heavy intensity shower rain": "09",
    "ragged shower rain": "09",
    "freezing rain": "13",
    "light rain": "10",
    "moderate rain": "10",
    "heavy intensity rain": "10",
    "very heavy rain": "10",
    "extreme rain": "10",
    "thunderstorm": "11",
    "Snow": "13",
    "Drizzle": "09",
    "mist": "50",
    "smoke": "50",
    "haze": "50",
    "sand/dust whirls": "50",
    "fog": "50",
    "sand": "50",
    "dust": "50",
    "volcanic ash": "50",
    "squalls": "50",
    "tornado": "50",
    "few clouds: 11-25%": "02",
    "scattered clouds: 25-50%": "03",
    "broken clouds: 51-84%": "04",
    "overcast clouds: 85-100%": "04",
  };
  
  const defaultUrlP2 = "03";  
  const urlP2 = weatherMappings[desc] || weatherMappings[mainDesc] || defaultUrlP2;
  const url = urlP1 + urlP2 + urlP2DayOrNight + urlP3;
  return url;  
}


function getCityName(lat, lon) {
  const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=2&appid=${apiKey}`;

  fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error("Request failed" + response.status);
    }
    return response.json();
  })
  .then(data => {
    let cityName = data[0].name;
    cityName = (cityName === "(Old) Ottawa") ? "Ottawa" : cityName;

    const weatherInCity = $("#weatherInCity");
    weatherInCity.text(`Weather in ${cityName.charAt(0).toUpperCase() + cityName.slice(1)}`);
  })
  .catch(error => {
    console.error(error);
  });
}


////map chart////
const hcKeys = {
  "null": "ca-5682",
  "Vancouver": "ca-bc",
  "Iqaluit": "ca-nu",
  "Yellowknife": "ca-nt",
  "Edmonton": "ca-ab",
  "St. John's": "ca-nl",
  "Regina": "ca-sk",
  "Winnipeg": "ca-mb",
  "Montreal": "ca-qc",
  "Ottawa": "ca-on",
  "Fredericton": "ca-nb",
  "Halifax": "ca-ns",
  "Charlottetown": "ca-pe",
  "Whitehorse": "ca-yt"
}

let dataForMapChart = [];

const cities = ["Vancouver", "Iqaluit", "Yellowknife", "Edmonton", "St. John's", "Regina", "Winnipeg", "Montreal", "Ottawa", "Fredericton", "Halifax", "Charlottetown", "Whitehorse"];
//const cities = ["Vancouver", "Iqaluit", "Yellowknife"]
let i = cities.length -1;

while (i >= 0) {
  const city = cities[i];  
  const hckey = hcKeys[city];
  let pair = [];
  pair.push(hckey);

  getLatLon(city)
    .then(coords => {
      const lat = coords[0];
      const lon = coords[1];

      getCurrentTemp(lat, lon)
        .then(currentTemp => {
          pair.push(currentTemp);
          dataForMapChart.push(pair);  
          chartInCallBack(dataForMapChart);
        })
    })
  i--;
}


async function getLatLon(city) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const [data] = await response.json()
    const coords = [data.lat.toFixed(4), data.lon.toFixed(4)];
    return coords;
  } catch (error) {
    console.error('Error fetching coords data:', error);
    throw error;
  }
}


async function getCurrentTemp(lat, lon) {  
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json()
    return data.current.temp
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }

}


async function getCurrentWeather(lat, lon) {  
  const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }

}

function chartInCallBack(dataForMapChart) {
  const url = "https://code.highcharts.com/mapdata/countries/ca/ca-all.topo.json"; 
  fetch(url)
    .then(response => response.json()
    )
    .then(geojson => {
      createMapChart("mapChart", geojson, dataForMapChart);
    })
    .catch(error => {
      console.error(error);
    });
}


function createMapChart(id, geoJSON, data) {
  Highcharts.mapChart(id,{
    chart: {
      map: geoJSON,
      height: 700
    },
    title: {
        text: 'Current Temperatures in Major Cities Across Canadian Provinces',
        margin: 50
    },
    mapNavigation: {
      enabled: true,
      buttonOptions: {
        verticalAlign: 'top',
        align: 'right',
        x: -10
      }
    },
    colorAxis: {
      minColor: "#E2F3FF",
      maxColor: "#2CAFFE"
    },
    series: [{
      data: data,
      name: 'Temperature',
      states: {
        hover: {
          color: '#e6ebf5'
        }
      },
      dataLabels: {
        enabled: true,
          format: '{point.name}'
      }
    }]      
  });
}