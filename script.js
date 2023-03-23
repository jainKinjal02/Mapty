'use strict';

// prettier-ignore


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
    date = new Date();
    id = (Date.now()+ '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
       
    }

    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}` ;
    }

    click(){
        this.clicks++;
    }
}

class Running extends Workout {
    type = 'running'
    constructor (coords, distance , duration, cadence) {
        super(coords, distance , duration) //properties which are common to parent's class
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace(){
        // min/km
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout {
    type = 'cycling';
    constructor (coords, distance , duration, elevationGain) {
        super(coords, distance , duration) //properties which are common to parent's class
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed (){
        this.speed = this.distance/(this.duration/ 60);
        return this.speed;
    }
}
const run1 = new Running([39, -12],5.2,24,178);
const cycling1 = new Cycling([39, -12],27,95,523);
console.log(run1 , cycling1);
//-------------------------------------------------------------------------------------------------------------------

//refactoring the code application architecture
class App{
    #map; //private instance properties
    #mapZoomLevel = 13;
    #mapEvent;
    #workouts = [];
    constructor(){ //called immediately when an object is created out of this class
        //get user's position
        this._getPosition();

        //get data from local storage
        this._getLocalStorage();

        form.addEventListener('submit',this._newWorkOut.bind(this));
        inputType.addEventListener('change',this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveToPopup.bind(this));
    }

    _getPosition(){
        if (navigator.geolocation){
            navigator.geolocation.getCurrentPosition(  this._loadMap.bind(this)//it is bind to this again so that wherever it was called it will reference this
                       , function(){
                alert('Could not get your position!!');
            });
        }
    }

    _loadMap(position) {
        const {latitude}  = position.coords; //object destructuring
        const {longitude} = position.coords; //object destructuring
        console.log(`https://www.google.com/maps/@${latitude},${longitude}`); //created a link to google maps using current location coords got from geolocation API
    
        const coords = [latitude, longitude];
        this.#map = L.map('map').setView(coords, this.#mapZoomLevel); // leaflet map function --use the ID of element which will be displaying the map which is 'map' only // L here is the namespace for leaflet library // coords is added in the setView function whicj will take current latitude and longitude
    
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map); // tileLayer gives different styles to maps
    
        //handling clicks on map
        this.#map.on('click', this._showForm.bind(this));

        this.#workouts.forEach(work =>{
            this._renderWorkoutMarker(work); // we are calling this function here instead of getlocalstorage because we cannot render the marker on load because first it should load the map first that's why is it called here in loadmap.so on load the workouts will be rendered only nd then asap map is loaded then markers will be rendered
        })

    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden'); // on click the class hidden will be removed and the form  will be displayed.
        inputDistance.focus(); // user clicks on map --it will get focused

    }

    _hideForm(){
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=>form.style.display = 'grid',1000);
    }

    _toggleElevationField() {
        //on changing running or cyclicng thee two input fields will toggle
            inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    
    }

    _newWorkOut(e) {
        // const validInputs = (...inputs) =>
        // inputs.every(inp => {
        //     console.log(inp);
        //     Number.isFinite(inp);
        // });
        const validInputs = (...inputs) => inputs.every(inp=>Number.isFinite(inp));
        // return true if all inputs are numbers
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);
         ///on pressing enter on any of the field in the form --form will be submitted and this event will be fired
            e.preventDefault();
            // get data from form
            const type = inputType.value;
            const distance = +inputDistance.value; //string is converted into number using + ahead of string.value
            const duration = +inputDuration.value;
            const {lat, lng} = this.#mapEvent.latlng;
            let workout;
            //check if data is valid

            //If workout running, create running object
            if(type === 'running'){
                const cadence = +inputCadence.value;
                if(!validInputs(distance,duration,cadence) || !allPositive(distance,duration,cadence)){
                    return alert('Inputs have to be positive numbers !!');
                }
                workout = new Running ([lat,lng],distance,duration,cadence);
            
                 //If workout cycling , create cycling object
            }

            if(type === 'cycling'){
                const elevation = +inputElevation.value;
                if(!validInputs(distance,duration,elevation) || !allPositive(distance,duration)){
                    return alert('Inputs have to be positive numbers !!');
                }
                workout = new Cycling([lat,lng],distance,duration,elevation);
               
            }

            this.#workouts.push(workout);
           

            //add new object to workout array

        //render workout on map as marker
        this._renderWorkoutMarker(workout);
       

        this._renderWorkout(workout);

        //hide form
        this._hideForm();

        //set local storage to all workouts
        this._setLocalStorage();

        console.log(this.#mapEvent);
            //clear input fields
            inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
        

        
    }
    _renderWorkoutMarker(workout){
        L.marker(workout.coords).addTo(this.#map) //marker on map
        .bindPopup(L.popup({maxWidth : 250 ,
                            minWidth : 150,
                            autoClose: false,
                            closeOnClick : false,
                            className : `${workout.type}-popup`} ,))
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`)
        .openPopup();  // adding eventListener to get the coord on click on the map // on is the function of leaflet library --it an eventListener // marker will be displayed at the place cicked on the map having all these in built properties in leaglet for markers

    }

    _renderWorkout(workout){
        let html = `
            <li class="workout workout--${workout.type}" data-id=${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
            <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
            </div>`

        if(workout.type === 'running'){
            html += `  <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        form.insertAdjacentHTML('afterend', html);
        }

        
        if(workout.type === 'cycling'){
            html += `  <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>` ;
        form.insertAdjacentHTML('afterend', html);
        }
    }
    
    //on clicking form workout lement , move to marker on map
    _moveToPopup(e) {
        const workoutEl = e.target.closest('.workout');
        console.log(workoutEl);
        console.log(workoutEl.dataset.id);

        if(!workoutEl) return;

        console.log(this.#workouts);
        const workout = this.#workouts.find(work => parseInt(work.id )=== parseInt(workoutEl.dataset.id));
        console.log(workout);
    this.#map.setView(workout.coords, this.#mapZoomLevel,{
    animate: true,
    pan: {
            duration: 1,
        }
    });
    //using the public interface
    //workout.click();
        
    }

    _setLocalStorage(){ //local storage API
        localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if(!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        })
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App();
// type app.reset() in console to reset the application
//app._getPosition();






