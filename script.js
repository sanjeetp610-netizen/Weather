"use strict";

/* =====================================
   1. API CONFIGURATION
===================================== */

// Get a key from:
// https://home.openweathermap.org/api_keys

const API_KEY = "09a19819736b989d8b054c8cb1a084f3";

const WEATHER_API =
    "https://api.openweathermap.org/data/2.5/weather";


/* =====================================
   2. DOM ELEMENTS
===================================== */

const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

const weatherSection = document.getElementById("weatherSection");
const emptyState = document.getElementById("emptyState");
const loading = document.getElementById("loading");
const errorMessage = document.getElementById("errorMessage");

const cityName = document.getElementById("cityName");
const countryName = document.getElementById("countryName");
const temperature = document.getElementById("temperature");
const weatherDescription = document.getElementById("weatherDescription");
const weatherIcon = document.getElementById("weatherIcon");

const feelsLike = document.getElementById("feelsLike");
const feelsLikeCard = document.getElementById("feelsLikeCard");

const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");
const cloudCover = document.getElementById("cloudCover");

const dateElement = document.getElementById("date");
const timeElement = document.getElementById("time");

const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");


/* =====================================
   3. SAFE LOCAL STORAGE
===================================== */

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        return value === null
            ? fallback
            : value;
    } catch (error) {
        console.warn("Local storage is unavailable.");
        return fallback;
    }
}


function writeStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn("Could not save data.");
    }
}


function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn("Could not remove saved data.");
    }
}


function readHistory() {
    try {
        const history = JSON.parse(
            readStorage("weatherHistory", "[]")
        );

        return Array.isArray(history)
            ? history.filter(item => typeof item === "string")
            : [];
    } catch (error) {
        return [];
    }
}


/* =====================================
   4. DARK / LIGHT MODE
===================================== */

function applyTheme(theme) {
    const isLight = theme === "light";

    document.body.classList.toggle(
        "light-mode",
        isLight
    );

    themeIcon.textContent = isLight
        ? "🌙"
        : "☀️";

    themeLabel.textContent = isLight
        ? "Dark mode"
        : "Light mode";

    themeToggle.setAttribute(
        "aria-label",
        isLight
            ? "Switch to dark mode"
            : "Switch to light mode"
    );

    writeStorage(
        "weatherTheme",
        isLight ? "light" : "dark"
    );
}


themeToggle.addEventListener("click", function () {
    const isLight = document.body.classList.contains("light-mode");

    applyTheme(isLight ? "dark" : "light");
});


const savedTheme = readStorage("weatherTheme", "dark");

applyTheme(
    savedTheme === "light"
        ? "light"
        : "dark"
);


/* =====================================
   5. EVENT LISTENERS
===================================== */

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
    searchWeather();
});


locationBtn.addEventListener("click", getCurrentLocation);


clearHistoryBtn.addEventListener("click", clearHistory);


document.querySelectorAll(".suggestion-btn").forEach(button => {
    button.addEventListener("click", function () {
        cityInput.value = button.dataset.city;
        searchWeather();
    });
});


/* =====================================
   6. SEARCH WEATHER
===================================== */

async function searchWeather() {
    const city = cityInput.value.trim();

    if (!city) {
        displayError("Please enter a city name.");
        cityInput.focus();
        return;
    }

    if (API_KEY === "YOUR_NEW_OPENWEATHER_API_KEY" || !API_KEY.trim()) {
        displayError(
            "Please add your OpenWeather API key in script.js."
        );
        return;
    }

    const url =
        `${WEATHER_API}?q=${encodeURIComponent(city)}` +
        `&appid=${encodeURIComponent(API_KEY)}&units=metric`;

    await getWeatherData(url);
}


/* =====================================
   7. GET WEATHER DATA
===================================== */

async function getWeatherData(url) {
    showLoading();
    hideError();

    searchBtn.disabled = true;
    locationBtn.disabled = true;

    try {
        const response = await fetch(url);

        let data;

        try {
            data = await response.json();
        } catch (error) {
            throw new Error(
                "The server returned an unreadable response."
            );
        }

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error(
                    "Invalid or inactive API key. Check your OpenWeather account."
                );
            }

            if (response.status === 404) {
                throw new Error(
                    "City not found. Check the spelling and try again."
                );
            }

            if (response.status === 429) {
                throw new Error(
                    "Too many requests. Please wait and try again."
                );
            }

            throw new Error(
                data.message || `Weather request failed (${response.status}).`
            );
        }

        if (
            !data.main ||
            !data.weather ||
            !data.weather[0] ||
            !data.sys
        ) {
            throw new Error(
                "The weather data is incomplete. Please try again."
            );
        }

        displayWeather(data);

        saveSearchHistory(data.name);

        cityInput.value = data.name;

    } catch (error) {
        console.error("Weather request error:", error);

        weatherSection.classList.add("hidden");
        emptyState.classList.add("hidden");

        if (error instanceof TypeError) {
            displayError(
                "Unable to connect to the weather service. Check your internet connection and try again."
            );
        } else {
            displayError(
                error.message || "Something went wrong. Please try again."
            );
        }

    } finally {
        hideLoading();

        searchBtn.disabled = false;
        locationBtn.disabled = false;
    }
}


/* =====================================
   8. DISPLAY WEATHER
===================================== */

function displayWeather(data) {
    weatherSection.classList.remove("hidden");
    emptyState.classList.add("hidden");

    cityName.textContent = data.name;

    countryName.textContent = data.sys.country
        ? `Country code: ${data.sys.country}`
        : "Country unavailable";

    temperature.textContent = Math.round(
        data.main.temp
    );

    feelsLike.textContent =
        `${Math.round(data.main.feels_like)}°C`;

    feelsLikeCard.textContent = Math.round(
        data.main.feels_like
    );

    weatherDescription.textContent =
        data.weather[0].description;

    weatherIcon.textContent = getWeatherIcon(
        data.weather[0].main
    );

    humidity.textContent =
        data.main.humidity;

    windSpeed.textContent =
        (data.wind?.speed * 3.6).toFixed(1);

    pressure.textContent =
        data.main.pressure;

    visibility.textContent =
        typeof data.visibility === "number"
            ? (data.visibility / 1000).toFixed(1)
            : "--";

    cloudCover.textContent =
        typeof data.clouds?.all === "number"
            ? data.clouds.all
            : "--";

    updateDateTime(data.timezone || 0);

    // Do not override the selected dark/light theme.
}


/* =====================================
   9. WEATHER ICONS
===================================== */

function getWeatherIcon(condition) {
    const icons = {
        Clear: "☀️",
        Clouds: "☁️",
        Rain: "🌧️",
        Drizzle: "🌦️",
        Thunderstorm: "⛈️",
        Snow: "❄️",
        Mist: "🌫️",
        Smoke: "🌫️",
        Haze: "🌫️",
        Dust: "🌫️",
        Fog: "🌫️",
        Sand: "🌫️",
        Ash: "🌋",
        Squall: "💨",
        Tornado: "🌪️"
    };

    return icons[condition] || "🌤️";
}


/* =====================================
   10. LOCAL DATE AND TIME
===================================== */

function updateDateTime(timezoneOffset) {
    const utcMilliseconds =
        Date.now() +
        new Date().getTimezoneOffset() * 60000;

    const cityDate = new Date(
        utcMilliseconds + timezoneOffset * 1000
    );

    const dateOptions = {
        weekday: "long",
        month: "long",
        day: "numeric",
        timeZone: "UTC"
    };

    const timeOptions = {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
    };

    dateElement.textContent =
        cityDate.toLocaleDateString("en-US", dateOptions);

    timeElement.textContent =
        cityDate.toLocaleTimeString("en-US", timeOptions);
}


/* =====================================
   11. LOADING
===================================== */

function showLoading() {
    loading.classList.remove("hidden");
    weatherSection.classList.add("hidden");
    emptyState.classList.add("hidden");
}


function hideLoading() {
    loading.classList.add("hidden");
}


/* =====================================
   12. ERROR HANDLING
===================================== */

function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}


function hideError() {
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
}


/* =====================================
   13. SEARCH HISTORY
===================================== */

function saveSearchHistory(city) {
    let history = readHistory();

    history = history.filter(
        item => item.toLowerCase() !== city.toLowerCase()
    );

    history.unshift(city);

    history = history.slice(0, 6);

    writeStorage(
        "weatherHistory",
        JSON.stringify(history)
    );

    displayHistory();
}


function displayHistory() {
    const history = readHistory();

    historyList.replaceChildren();

    if (history.length === 0) {
        const message = document.createElement("p");

        message.className = "no-history";
        message.textContent = "No recent searches yet.";

        historyList.appendChild(message);

        return;
    }

    history.forEach(city => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "history-item";
        button.textContent = `📍 ${city}`;

        button.addEventListener("click", function () {
            cityInput.value = city;
            searchWeather();
        });

        historyList.appendChild(button);
    });
}


/* =====================================
   14. CLEAR HISTORY
===================================== */

function clearHistory() {
    removeStorage("weatherHistory");
    displayHistory();
}


/* =====================================
   15. CURRENT LOCATION
===================================== */

function getCurrentLocation() {
    hideError();

    if (
        API_KEY === "YOUR_NEW_OPENWEATHER_API_KEY" ||
        !API_KEY.trim()
    ) {
        displayError(
            "Please add your OpenWeather API key in script.js."
        );
        return;
    }

    if (!navigator.geolocation) {
        displayError(
            "Geolocation is not supported by your browser."
        );
        return;
    }

    showLoading();

    locationBtn.disabled = true;
    searchBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        async function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const url =
                `${WEATHER_API}?lat=${latitude}&lon=${longitude}` +
                `&appid=${encodeURIComponent(API_KEY)}&units=metric`;

            await getWeatherData(url);
        },

        function (error) {
            hideLoading();

            weatherSection.classList.add("hidden");
            emptyState.classList.remove("hidden");

            locationBtn.disabled = false;
            searchBtn.disabled = false;

            if (error.code === error.PERMISSION_DENIED) {
                displayError(
                    "Location permission was denied. Allow location access or search for a city instead."
                );
            } else if (error.code === error.TIMEOUT) {
                displayError(
                    "Your location request timed out. Please try again."
                );
            } else {
                displayError(
                    "Unable to determine your location. Try searching for a city."
                );
            }
        },

        {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}


/* =====================================
   16. INITIAL LOAD
===================================== */

displayHistory();
