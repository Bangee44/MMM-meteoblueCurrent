/* Module for MeteoBlue */

/* Magic Mirror
 * Module: MeteoBlue based on CurrentWeather
 * 
 * Written by Benjamin Angst http://www.beny.ch
 * Oringinal by Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 * 
 */
Module.register("meteoblueCurrent",{
    
	// Default module config.
	defaults: {
                city: "",
                lat: "",
                lon: "",
                asl: "",
                tz: "Europe/Zurich",
		apikey: "",
		units: config.units,
		updateInterval: 60 * 60 * 1000, // every 60 minutes
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		showPeriod: true,
		showPeriodUpper: false,
		showWindDirection: false,
		lang: config.language,

		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2500,
                
		apiBase: "http://my.meteoblue.com/feed/json_7day_3h_firstday",
		weatherEndpoint: "weather",

		iconTable: {                        
                        // meteoblue
                        "1": "wi-day-sunny",
			"2": "wi-day-cloudy",
			"3": "wi-day-cloudy",
			"4": "wi-day-cloudy",
                        "5": "wi-day-cloudy",
                        "6": "wi-day-cloudy",
                        "7": "wi-day-cloudy",
                        "8": "wi-day-cloudy",
			"9": "wi-day-cloudy",
			"10": "wi-day-storm-showers",
			"11": "wi-day-storm-showers",
                        "12": "wi-day-storm-showers",
			"13": "wi-day-haze",
                        "14": "wi-day-haze",
                        "15": "wi-day-haze",
                        "16": "wi-fog",
                        "17": "wi-day-fog",
                        "18": "wi-day-fog",
                        "19": "wi-day-cloudy",
                        "20": "wi-day-cloudy",
                        "21": "wi-day-cloudy",
			"22": "wi-cloudy",
			"23": "wi-showers",
			"24": "wi-snow",
                        "25": "wi-rain",
                        "26": "wi-snow-wind",
                        "27": "wi-day-storm-showers",
                        "28": "wi-day-snow-thunderstorm",
			"29": "wi-snow-wind",
			"30": "wi-thunderstorm",
			"31": "wi-day-rain-mix",
                        "32": "wi-day-snow-wind",
			"33": "wi-rain-wind",
                        "34": "wi-snow",
                        "35": "wi-rain-mix",
		},
	},    
    
    
	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define required scripts.
	getStyles: function() {
		return ["weather-icons.css", "meteoblue.css"];
	},

	// Define start sequence.
	start: function() {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.windSpeed = null;
		this.windDirection = null;
		this.sunriseSunsetTime = null;
		this.sunriseSunsetIcon = null;
		this.temperature = null;
		this.weatherType = null;

		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);

		this.updateTimer = null;

	},    
    
	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (this.config.apikey === "") {
			wrapper.innerHTML = "Please set the correct meteoblue <i>apikey</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (this.config.city === "") {
			wrapper.innerHTML = "Please set the meteoblue <i>city</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		if (!this.loaded) {
			wrapper.innerHTML = "Loading weather ...";
			wrapper.className = "dimmed light small";
			return wrapper;
		}

		var small = document.createElement("div");
		small.className = "normal medium";

		var windIcon = document.createElement("span");
		windIcon.className = "wi wi-strong-wind dimmed";
		small.appendChild(windIcon);
		
		var windSpeed = document.createElement("span");
		windSpeed.innerHTML = " " + this.windSpeed;
		small.appendChild(windSpeed);
	
		if (this.config.showWindDirection) {
			var windDirection = document.createElement("span");
			windDirection.innerHTML = " " + this.windDirection;
			small.appendChild(windDirection);
		}
		var spacer = document.createElement("span");
		spacer.innerHTML = "&nbsp;";
		small.appendChild(spacer);

		var sunriseSunsetIcon = document.createElement("span");
		sunriseSunsetIcon.className = "wi dimmed " + this.sunriseSunsetIcon;
		small.appendChild(sunriseSunsetIcon);

		var sunriseSunsetTime = document.createElement("span");
		sunriseSunsetTime.innerHTML = " " + this.sunriseSunsetTime;
		small.appendChild(sunriseSunsetTime);

		var large = document.createElement("div");
		large.className = "large light";

		var weatherIcon = document.createElement("span");
		weatherIcon.className = "wi weathericon " + this.weatherType;
		large.appendChild(weatherIcon);

		var temperature = document.createElement("span");
		temperature.className = "bright";
		temperature.innerHTML = " " + this.temperature + "&deg;";
		large.appendChild(temperature);

		wrapper.appendChild(small);
		wrapper.appendChild(large);
		return wrapper;
	},

	/* updateWeather(compliments)
	 * Requests new data from openweather.org.
	 * Calls processWeather on succesfull response.
	 */
	updateWeather: function() {
		var url = this.config.apiBase + this.getParams();
		var self = this;
		var retry = true;

		var weatherRequest = new XMLHttpRequest();
		weatherRequest.open("GET", url, true);
		weatherRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processWeather(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.config.appid = "";
					self.updateDom(self.config.animationSpeed);

					Log.error(self.name + ": Incorrect APPID.");
					retry = false;
				} else {
					Log.error(self.name + ": Could not load weather.");
				}

				if (retry) {
					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
				}
			}
		};
		weatherRequest.send();
	},

	/* getParams(compliments)
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	getParams: function() {
		var params = "?";
                params += "apikey=" + this.config.apikey;
		params += "&city=" + this.config.city;
		params += "&lat=" + this.config.lat;
		params += "&lon=" + this.config.lon;
                params += "&asl=" + this.config.asl;
                params += "&tz=" + this.config.tz;

		return params;
	},

	/* processWeather(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Weather information received form openweather.org.
	 */
	processWeather: function(data) {
		this.temperature = this.roundValue(data.current.temperature);
		//this.windSpeed = this.ms2Beaufort(this.roundValue(datacurrentwind.wind_speed));
                this.windSpeed = this.roundValue(data.current.wind_speed);
		//this.windDirection = this.deg2Cardinal(data.wind.deg);
                this.weatherType = this.config.iconTable[data.forecast[0].pictocode_day];
                
		var now = new Date();
		//var sunrise = new Date(data.sys.sunrise * 1000);
                var sunrise = moment(data.forecast[0].date + "T" + data.forecast[0].sunrise_time);
		//var sunset = new Date(data.sys.sunset * 1000);
                var sunset = moment(data.forecast[0].date + "T" + data.forecast[0].sunset_time);

		// The moment().format('h') method has a bug on the Raspberry Pi. 
		// So we need to generate the timestring manually.
		// See issue: https://github.com/MichMich/MagicMirror/issues/181
		var sunriseSunsetDateObject = (sunrise < now && sunset > now) ? sunset : sunrise;
		var timeString = moment(sunriseSunsetDateObject).format('HH:mm');
		if (this.config.timeFormat !== 24) {
			var hours = sunriseSunsetDateObject.getHours() % 12 || 12;
			if (this.config.showPeriod) {
				if (this.config.showPeriodUpper) {
					timeString = hours + moment(sunriseSunsetDateObject).format(':mm A');
				} else {
					timeString = hours + moment(sunriseSunsetDateObject).format(':mm a');
				}
			} else {
    				timeString = hours + moment(sunriseSunsetDateObject).format(':mm');
			}
		}

		this.sunriseSunsetTime = timeString;
		this.sunriseSunsetIcon = (sunrise < now && sunset > now) ? "wi-sunset" : "wi-sunrise";



		this.loaded = true;
		this.updateDom(this.config.animationSpeed);
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	 */
	scheduleUpdate: function(delay) {
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function() {
			self.updateWeather();
		}, nextLoad);
	},

	/* ms2Beaufort(ms)
	 * Converts m2 to beaufort (windspeed).
	 *
	 * argument ms number - Windspeed in m/s.
	 *
	 * return number - Windspeed in beaufort.
	 */
	ms2Beaufort: function(ms) {
		var kmh = ms * 60 * 60 / 1000;
		var speeds = [1, 5, 11, 19, 28, 38, 49, 61, 74, 88, 102, 117, 1000];
		for (var beaufort in speeds) {
			var speed = speeds[beaufort];
			if (speed > kmh) {
				return beaufort;
			}
		}
		return 12;
	},

	/* function(temperature)
	 * Rounds a temperature to 1 decimal.
	 *
	 * argument temperature number - Temperature.
	 *
	 * return number - Rounded Temperature.
	 */
	 
	deg2Cardinal: function(deg) {
                if (deg>11.25 && deg<33.75){
                        return "NNE";
                }else if (deg>33.75 && deg<56.25){
                        return "ENE";
                }else if (deg>56.25 && deg<78.75){
                        return "E";
                }else if (deg>78.75 && deg<101.25){
                        return "ESE";
                }else if (deg>101.25 && deg<123.75){
                        return "ESE";
                }else if (deg>123.75 && deg<146.25){
                        return "SE";
                }else if (deg>146.25 && deg<168.75){
                        return "SSE";
                }else if (deg>168.75 && deg<191.25){
                        return "S";
                }else if (deg>191.25 && deg<213.75){
                        return "SSW";
                }else if (deg>213.75 && deg<236.25){
                        return "SW";
                }else if (deg>236.25 && deg<258.75){
                        return "WSW";
                }else if (deg>258.75 && deg<281.25){
                        return "W";
                }else if (deg>281.25 && deg<303.75){
                        return "WNW";
                }else if (deg>303.75 && deg<326.25){
                        return "NW";
                }else if (deg>326.25 && deg<348.75){
                        return "NNW";
                }else{
                         return "N";
                }
	},

	 
	roundValue: function(temperature) {
		return parseFloat(temperature).toFixed(1);
	}
});
