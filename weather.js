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


////code in original searchCity.js////
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
    const lat = Math.round(data[0].lat, 2);
    const lon = Math.round(data[0].lon, 2);
    const country = data[0].country;
    const timeZone = moment.tz.zonesForCountry(country)[0];
    getData(lat, lon, timeZone)
  })
  .catch(error => {
    console.error(error);
  });

}


$("#searchCity").click(function() {
  getLatLonOfCity($("#cityName").val());
})


////code in original weather.js////
function getData(lat, lon, timeZone) {
  const url = "https://api.openweathermap.org/data/3.0/"
  + "onecall?lat=" + lat + "&lon=" + lon + "&units=metric&"
  + "appid=aaa1c1a411f7f2a242211e43a6f2e6a1";

  fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error("Request failed" + response.status);
    }
    return response.json();
  })
  .then(data => {
    populateHeader(data, timeZone);
    lineChart(getHourlyTemp(data), Number(getHourPart(getFormattedDate(getTimeStamp(data.current.dt), timeZone))));
    populateDailyWeather(data, timeZone);
    populateHourlyWeatherDesc(data, timeZone);
  })
  .catch(error => {
    console.error(error);
  });

  console.log(url);
}


getData("45.42", "-75.69", "America/Toronto");


/*callback functions defined in getData()*/
function populateHeader(obj, timeZone) {
  const temp = $("#temp");
  temp.text(`${Math.round(obj.current.temp)}°C`);

  const feelsLike= $("#feelsLike");
  feelsLike.text(`Feels Like: ${Math.round(obj.current["feels_like"])}°C`);

  const humidity = $("#humidity");
  humidity.text(`Humidity: ${obj.current.humidity}%`)

  const windSpeed = $("#windSpeed");
  windSpeed.text(`Wind: ${Math.round(obj.current.wind_speed)} km/h`)

  const weatherInCity = $("#weatherInCity");
  weatherInCity.text(`Weather in ${$("#cityName").val().charAt(0).toUpperCase() + $("#cityName").val().slice(1) || "Ottawa"}`)
  
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