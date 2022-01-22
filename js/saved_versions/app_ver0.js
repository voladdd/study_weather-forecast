//the weather in kalvin

// const { async } = require("regenerator-runtime");
// const WeekDay = require("es-abstract/5/WeekDay");

// var draw = SVG().addTo('body').size(1000, 1000)
// var rect = draw.rect(1000, 1000).attr({ fill: '#f06' })
// rect.animate(2000, 1000, 'now').attr({ fill: '#fb3' })

//#region API request & searchbar
let citysId = fetch("assets/city.list.json").then(res => res.json()).then(data => citysId = data);
let cityForecast;
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

function ChangeElementVisible(id,visible){
    let element = document.getElementById(id);
    visible == true ? element.style.display = "flex" : element.style.display = "none";
}

function findSimiliarName(object,findName){
    let b = object.filter(el => el.name.toUpperCase().includes(findName.toUpperCase(),0)).slice(0,6);
    let a = object.filter(el => el.name.toUpperCase() == findName.toUpperCase());
    return b.concat(a);
}

function showCityInfo(clicked_id){
    // fetch(`http://api.openweathermap.org/data/2.5/forecast?id=${clicked_id}&cnt5=&appid=${key}`).then(res => res.json()).then(data => cityForecast = data);
    fetch(`http://api.openweathermap.org/data/2.5/forecast?id=${clicked_id}&cnt5=&appid=${key}`)
    .then(res => res.json())
    .then(function(obj){
        cityForecast = obj;
        console.log(GetCityInfo(cityForecast));
    });

}



//#endregion


//#region Days classes usage

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
        let nextWeekDays = GetNextWeekDays(GetCurrentDayWeek(true) - 1,6);
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
        hours:hours, 
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



// const dp = AddDayPart("Evening","Cold","32","9D");
// const ddp = AddWeekDay("Monday","31.05.21",[dp]);

//#endregion

//#region Working with dates
let days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
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
    return [hoursUTC + diff, minutesUTC];
}

/**
 * @param {boolean} numberFormat return number or string
 * @returns 
 */
function GetCurrentDayWeek(numberFormat){
    let date = new Date();
    if (numberFormat) return date.getDay() 
    else return days[date.getDay() - 1] ;
}

/**
 * @param {number} currentDay Number of weekday
 * @param {number} daysCount The count of nextdays
 */
function GetNextWeekDays(currentDay,daysCount){
    let nextDays = [];
    let posistion = currentDay - 1;
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