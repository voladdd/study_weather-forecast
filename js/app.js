
//#region API request & searchbar
let citysId = fetch("assets/city.list.json").then(res => res.json()).then(data => citysId = data);
let cityForecast; //have all data about city
let cityForecastSorted;
const key = "fbee5ec8ad672d62864a6d2e2b0fdb5a"; 

let showedCitysList = document.getElementById("findedCitysList").querySelectorAll('button');

function findSimiliarityCity(){
    const text = document.getElementById("inputCityName").value;
    text.length == 0 ? ChangeElementVisible("findedCitysList",false) : ChangeElementVisible("findedCitysList",true);
    const citys = findSimiliarName(citysId, text);
    showedCitysList.forEach((item, index) => {
        if (citys.length > index) {
            item.textContent = citys[index].name;
            item.id = `${citys[index].id}`;
        };
    });
}

function findSimiliarName(object,findName){
    let b = object.filter(el => el.name.toUpperCase().includes(findName.toUpperCase(),0)).slice(0,6);
    let a = object.filter(el => el.name.toUpperCase() == findName.toUpperCase());
    return b.concat(a);
}

function showCityInfo(clicked_id){
    fetch(`https://api.openweathermap.org/data/2.5/forecast?id=${clicked_id}&cnt5=&appid=${key}`)
    .then(res => res.json())
    .then(function(obj){
        cityForecast = obj;
        displayAllData();
    });
}

function displayAllData(){
    ChangeElementVisible("findedCitysList",false);
    ChangeElementVisible("weekDayList",true);
    ChangeElementVisible("partsOfDayList",true);

    const data = GetCityInfo(cityForecast);
    cityForecastSorted = data;
    const weekDays = data["weekDays"];

    chooseCurrent.dayWeek = weekDays[0]["name"];
    chooseCurrent.dayPart = weekDays[0]["dayParts"][0]["name"];

    let weekDaysList = document.getElementById("weekDayList").querySelectorAll('button');
    let weekDaysImg = document.getElementById("weekDayList").querySelectorAll('img');
    document.getElementById("inputCityName").value = data["name"];

    //initialize weekDays
    for (let i = 0; i < weekDaysList.length; i++){
        weekDaysList[i].textContent = (weekDays[i]["name"]).slice(0,3).toUpperCase();
        weekDaysList[i].id = weekDays[i]["name"];
        weekDaysImg[i].src = `assets/icons/${GetWeather(weekDays[i]["dayParts"], "Day")["icon"]}.png`;
    }
    //Set start settings
    let startDay = 0;
    if (!CheckIsExistPartOnDay(
        weekDays[0]["dayParts"],
        GetCurrentPartOfDay(data["hours"][0])
    )){
        startDay = 1;
    }

    ChangeSelectedDay(weekDaysList[startDay].id);
    ChangeSelectedPartOfDay(GetCurrentPartOfDay(data["hours"][0]));
    ShowOnlySelectableParts(cityForecastSorted,startDay);
    DisplayWeather();
}

//#endregion

//#region Days classes usage

let chooseCurrent = {
    dayWeek: null,
    dayWeekIndex: null,
    dayPartName: null,
    dayPart: null
};

/**
 * 
 * @param {list} dayParts Parts of day Evening,Morning etc
 * @param {string} dayPartName Selected part of the day
 * @returns Selected part if finded, else 0 part
 */
function GetWeather(dayParts, dayPartName) {
    let result = dayParts[0];
    for (let i = 0; i < dayParts.length; i++){
        if (dayParts[i]["name"] == dayPartName){
            result = dayParts[i];
            break;
        }
    }
    return result;
}

/**
 * Get info from JSON file and sort it for our purposes
 */
function GetCityInfo(forecast){
    if (forecast != undefined){

        let infoCity = forecast["city"];
        let infoDaysParts = forecast["list"];

        let uniqueDayPartKeys = [];
        let uniqueDayParts = [];
        //Sorting by DAY & DAYPART
        for (let i = 0; i < infoDaysParts.length; i++){

            let weather = infoDaysParts[i]["weather"];
            let fullDate = infoDaysParts[i]["dt_txt"];
            let date = fullDate.split(" ")[0];
            let time = fullDate.split(" ")[1].split(":")
            let dateKey = `${date} ${GetCurrentPartOfDay(time[0])}`;

            if (!uniqueDayPartKeys.includes(dateKey)){
                uniqueDayPartKeys.push(dateKey);

                const dayPart = AddDayPart(
                    date,
                    GetCurrentPartOfDay(time[0]),
                    weather[0]["description"],
                    infoDaysParts[i]["main"]["feels_like"],
                    weather[0]["icon"]);
                uniqueDayParts.push(dayPart);
            }
        }

        let weekDays = [];
        let uniqueDateKeys = [];
        let nextWeekDays = GetNextWeekDays(GetCurrentDayWeek(true),7);
        let weekDayNumber = 0;
        //Sorting by DAYS
        for (let i = 0; i < uniqueDayParts.length; i++){
            let part =  uniqueDayParts[i];
            let uniqueDate = part["date"];
            if (!uniqueDateKeys.includes(uniqueDate)){
                uniqueDateKeys.push(uniqueDate);

                let dayParts = [];
                dayParts.push(part);
                for (let x = i + 1; x < uniqueDayParts.length; x++){
                    if (uniqueDayParts[x]["date"] === uniqueDayParts[x - 1]["date"]){
                        dayParts.push(uniqueDayParts[x]);
                    }
                    else {
                        break;
                    }
                }

                const weekDay = AddWeekDay(
                    nextWeekDays[weekDayNumber], //Monday
                    uniqueDate,
                    dayParts //Morn Evening Night Day
                );
                weekDays.push(weekDay);
                weekDayNumber++;
            }
        }

        return AddCity(infoCity.name, GetCurrentTime(infoCity.timezone), weekDays)
    }
}

function AddCity(name,hours,weekDays){
    const city = Object.freeze({
        name: name, 
        hours: hours, 
        weekDays: weekDays
    });
    return city;
}

function AddWeekDay(name,date,dayParts){
    const weekDay = Object.freeze({
        name: name, 
        date:date, 
        dayParts: dayParts
    });
    return weekDay;
}

function AddDayPart(date,name,weather,temperature,icon){
    const dayPart = Object.freeze({
        date: date,
        name: name,
        weather: weather,
        temperature: temperature,
        icon: icon

    });
    return dayPart;
}

function CheckIsExistPartOnDay(day,part){
    let exist = false;
    for (let p of day){
        if (p["name"] == part){
            exist = true;
            break
        }
    }
    return exist;
}

//#endregion

//#region working with Front
function ChangeElementVisible(id,visible){
    let element = document.getElementById(id);
    visible == true ? element.style.display = "flex" : element.style.display = "none";
}

function ChangeSelectedDay(id){
    chooseCurrent.dayWeek = id;
    //Change color of selected
    let weekDaysList = document.getElementById("weekDayList").querySelectorAll('button');
    for (let i = 0; i < weekDaysList.length; i++){
        if (weekDaysList[i].id == id){
            weekDaysList[i].style.color = "#FFF500";
            chooseCurrent.dayWeekIndex = i;
            ShowOnlySelectableParts(cityForecastSorted,i);
            DisplayWeather();
        }
        else {
            weekDaysList[i].style.color = "#FBFBFB";
        } 
    }
}

function ShowOnlySelectableParts(data,weekDay){
    let dayParts = data["weekDays"][weekDay]["dayParts"];
    let dayPartsList = document.getElementById("partsOfDayList").querySelectorAll('button');
    
    for (let i = 0; i < dayPartsList.length; i++){

        let finded = false;
        for (let part of dayParts){
            if (part["name"] == dayPartsList[i].id){
                finded = true;
                break;
            }
        }

        if (finded) dayPartsList[i].style.visibility  = 'visible';  
        else{
            dayPartsList[i].style.visibility  = 'hidden';
        } 
    }
}

function ChangeSelectedPartOfDay(id){
    chooseCurrent.dayPart = id;
    //Change color of selected
    let dayPartsList = document.getElementById("partsOfDayList").querySelectorAll('button');
    for (let i = 0; i < dayPartsList.length; i++){
        if (dayPartsList[i].id == id){
            chooseCurrent.dayPartName = id;
            dayPartsList[i].style.color = "#FFF500";
            DisplayWeather();
        } 
        else {
            dayPartsList[i].style.color = "#FBFBFB";
        }
    }
}

function CheckIsChooseInitialized(){
    return !(chooseCurrent.dayWeek == null || 
    chooseCurrent.dayPart == null ||
    chooseCurrent.dayPartName == null ||
    chooseCurrent.dayWeekIndex == null)
}

var draw = SVG().addTo('body').size('100%', '100%');
var rect = draw.rect('100%', '100%', {id: 'dynamicBg'}).attr({ fill: '#000000' });
var wzr = draw.svg('') 

function DynamicBackground(dayPart){
    if (dayPart == "Night") rect.animate(2000, 200, 'now').attr({ fill: '#09233b' })
    else if (dayPart == "Morning") rect.animate(2000, 200, 'now').attr({ fill: '#7d9497' })
    else if (dayPart == "Day") rect.animate(2000, 200, 'now').attr({ fill: '#adad70' })
    else if (dayPart == "Evening") rect.animate(2000, 200, 'now').attr({ fill: '#0d355b' })
}

function DisplayWeather(){
    let table = document.getElementById("weatherShow");
    if (CheckIsExistPartOnDay(cityForecastSorted["weekDays"][chooseCurrent.dayWeekIndex]["dayParts"],chooseCurrent.dayPart)
    && CheckIsChooseInitialized()){

        let temperature = document.getElementById("temperatureShow");
        let description = document.getElementById("descShow");
        let preview = document.getElementById("bigPreview");

        let dayData = (cityForecastSorted["weekDays"][chooseCurrent.dayWeekIndex]["dayParts"])
        .filter(item => item.name == `${chooseCurrent.dayPartName}`)[0];

        temperature.textContent = `${Math.round(dayData["temperature"] - 273.15)}°C`;
        description.textContent = `${dayData["weather"].toUpperCase()}`

        let newPreview = `assets/icons/${dayData["icon"]}.png`;
        if (newPreview != preview.getAttribute('src')){
            const inter = 600;
            $('#bigPreview').fadeOut(inter);
            setTimeout(function(){
                preview.src = newPreview;
                $('#bigPreview').fadeIn(inter);
            },inter);
        }

        DynamicBackground(chooseCurrent.dayPartName);
        table.style.display = "flex";
    }
    else table.style.display = "none";
}

//#endregion

//#region Working with dates
let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
let partOfDay = ['Morning','Day','Evening','Night'];

/**
 * Return day,night and etc...
 * @param {number} hours in 24 hours
 */
function GetCurrentPartOfDay(hours){
    if (hours >= 0 && hours < 6) return partOfDay[3];
    else if (hours >= 6 && hours < 12) return partOfDay[0];
    else if (hours >= 12 && hours < 18) return partOfDay[1];
    else if (hours >= 18 && hours < 24) return partOfDay[2];
}

/**
 * Return pair hours:minutes in current timezone
 * @param {number} timezone UTC between time in seconds  
 */
function GetCurrentTime(timezone){
    let date = new Date();
    let diff = timezone / 3600;
    let hoursUTC = date.getUTCHours();
    let minutesUTC = date.getUTCMinutes();
    return [(hoursUTC + diff) % 24, minutesUTC];
}

/**
 * @param {boolean} numberFormat return number or string
 * @returns 
 */
function GetCurrentDayWeek(numberFormat){
    let date = new Date();
    if (numberFormat) return date.getDay() 
    else return days[date.getDay()] ;
}

/**
 * @param {number} currentDay Number of weekday
 * @param {number} daysCount The count of nextdays
 */
function GetNextWeekDays(currentDay,daysCount){
    let nextDays = [];
    let posistion = currentDay;
    let count = 0;
    while (count < daysCount){
        nextDays.push(days[posistion]);
        posistion += 1;
        count += 1;
        if (posistion + 1 == 7) posistion = 0;
    }
    return nextDays;
}
//#endregion
