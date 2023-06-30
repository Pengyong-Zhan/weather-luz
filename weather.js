function getData(lat, lon) {
  const url = "https://api.openweathermap.org/data/3.0/"
  + "onecall?lat=" + lat + "&lon=" + lon + "&units=metric&"
  + "appid=" + apiKey;

  fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error("Request failed" + response.status);
    }
    return response.json();
  })
  .then(data => {
    populateHeader(data);
    lineChart(getHourlyTemp(data), getHour(data.current.dt));
    populateDailyWeather(data);
    populateHourlyWeatherDesc(data);
  })
  .catch(error => {
    console.error(error);
  });

  console.log(url);
}


getData("45.42", "-75.69")


function populateHeader(obj) {
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
  const min = date.getMinutes().toString().length == 2 ? date.getMinutes() : "0" + date.getMinutes()
  dayOfWeek.text(getDayOfWeek(date) + " " + date.getHours() + ":"+ min);

  const weatherDesc = $("#weatherDesc")
  const desc = obj.current.weather[0].description;
  const mainDesc = obj.current.weather[0].main;
  weatherDesc.text(capitalize(desc));

  const iconURL = getIcon(desc, mainDesc, date);
  const headerWeatherIcon = $("#headerWeatherIcon");
  headerWeatherIcon.attr("src",iconURL);
}


function getDayOfWeek(date) {
  const dayOfWeek = date.getDay();
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayOfWeekText = daysOfWeek[dayOfWeek];
  return dayOfWeekText
}


function getDayOfWeekInShort(date) {
  const dayOfWeek = date.getDay();
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayOfWeekText = daysOfWeek[dayOfWeek];
  return dayOfWeekText
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


function populateHourlyWeatherDesc(obj) {
  const hourlyWeatherDesc = $("#hourlyWeatherDesc");
  for (const hourlyData of obj.hourly.slice(0, 24)) {
    const img = $("<img>");
    img.attr("src", getIcon(hourlyData.weather[0].description, hourlyData.weather[0].main, getTimeStamp(hourlyData.dt)));
    img.css({
      width: "50px",
      height: "50px"
    })
    hourlyWeatherDesc.append(img);
  }  
}


function getHour(timeStamp) {
  const date = new Date(timeStamp * 1000);
  return date.getHours();
} 


function getMinute(timeStamp) {
  const date = new Date(timeStamp * 1000);
  return date.getMinutes();
} 


function getTimeStamp(timeStamp) {
  const date = new Date(timeStamp * 1000);
  return date;
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
            return this.value -24
          } else {
            return this.value 
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
        name: "Tempreature",
        data: tempData
    }]      
  });
}


function populateDailyWeather(obj) {
  const divOfAllDailyWeather = $("#dailyWeather");

  for (const dailyInfo of obj.daily) {
    const divDaily = $("<div>");
    divDaily.addClass("d-flex flex-column align-items-center");

    const dayOfWeek = $("<p>");
    const date = new Date(dailyInfo.dt * 1000);
    dayOfWeek.text(getDayOfWeekInShort(date));

    const icon = $("<img>");
    icon.attr("src", getIcon(dailyInfo.weather[0].main, dailyInfo.weather[0].description, getTimeStamp(dailyInfo.dt)))
    icon.css({
      width: "100px",
      heigh: "100px"
    })
    icon.css("margin-top", "-20px");

    const temp = $("<p>");
    temp.text(Math.round(dailyInfo.temp.min) + "°" + " - " + Math.round(dailyInfo.temp.max) + "°");

    divDaily.append(dayOfWeek);
    divDaily.append(icon);
    divDaily.append(temp);
    divOfAllDailyWeather.append(divDaily);
  }
}


function getIcon(desc, mainDesc, timeStamp) {
  const urlP1 = "https://openweathermap.org/img/wn/";
  const urlP3 = "@2x.png";
  let urlP2DayOrNight;

  const hour = parseInt(timeStamp.getHours());
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