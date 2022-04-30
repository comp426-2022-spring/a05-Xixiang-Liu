// Focus div based on nav button click

// Flip one coin and show coin image to match result when button clicked

// Flip multiple coins and show coin images in table as well as summary results
// Enter number and press button to activate coin flip series

// Guess a flip by clicking either heads or tails button

// Flip one coin and show coin image to match result when button clicked
// Button coin flip element in div#single
const coin = document.getElementById("coin")
// Add event listener for coin button in div#single
coin.addEventListener("click", flipCoin)
// Set up an asynchronous function so that it will await a response.
async function flipCoin() {
// Build up the endpoint URL
    const endpoint = "app/flip/"
// DOM knows what the URI is so that we don't have to hard code it.
    const url = document.baseURI+endpoint
// This sends a GET request to the API endpoint and waits for a response
    await fetch(url)
// This receives the response as JSON
  		    .then(function(response) {
    		    return response.json();
  		      })
// This processes the JSON into DOM calls that replace the existing corresponding elements in index.html 
			    .then(function(result) {
				    console.log(result);
				    document.getElementById("result").innerHTML = result.flip;
				    document.getElementById("quarter").setAttribute("src", "assets/img/"+result.flip+".png");
				  });
  };
// Flip multiple coins and show coin images in table as well as summary results
// Enter number and press button to activate coin flip series
// The flip many coins form in div#multi 
const coins = document.getElementById("coins")
// Add event listener for coins form in div#multi
coins.addEventListener("submit", flipCoins)
// Create the submit handler that will run when the submit button ("Flip 'em!) is pressed.
async function flipCoins(event) {
// Because we are using an event, we need to remove the default browser event, which is a reload.
	event.preventDefault();
// Build up the endpoint URL
	const endpoint = "app/flip/coins/"
	const url = document.baseURI+endpoint
// This extracts the data object from the form so we can run it through the FormData API
	const formEvent = event.currentTarget
// Give the data to FormData and wait for a response or log an error to console.
	try {
		const formData = new FormData(formEvent);
// Hand the form data off to the function that is actually going to interact with the API.
		const flips = await sendFlips({ url, formData });
// Process the response and manipulate some elements in div#multi.
		console.log(flips);
// Present the summary information.
		document.getElementById("heads").innerHTML = "Heads: "+flips.summary.heads;
		document.getElementById("tails").innerHTML = "Tails: "+flips.summary.tails;
// This calls a function what will make a list of coin images based on the array of coin flip results.
// See below for coinList() function.
    document.getElementById("coinlist").innerHTML = coinList(flips.raw);
	} catch (error) {
		console.log(error);
	}
}
// Guess a coin flip by making a selection and pressing the button.
// This uses a form in div#guesscoin with a selector to input the value to be sent to the API.
const call = document.getElementById("call")
// Add event listener for coins form in div#guesscoin
call.addEventListener("submit", flipCall)
// Create the submit handler (just like before for div#multi.
async function flipCall(event) {
// Prevent the default reload on event.
	event.preventDefault();
// Build the url string.
	const endpoint = "app/flip/call/"
	const url = document.baseURI+endpoint
// Extract the data from the form.
	const formEvent = event.currentTarget
// Give the data to FormData and wait for a response or log an error to console.
	try {
		const formData = new FormData(formEvent); 
// Hand the form data off to the function that is actually going to interact with the API.
		const results = await sendFlips({ url, formData });
// Process the results.
		console.log(results);
// Present the text results
		document.getElementById("choice").innerHTML = "Guess: "+results.call;
		document.getElementById("actual").innerHTML = "Actual: "+results.flip;
		document.getElementById("results").innerHTML = "Result: "+results.result;
// Assemble a list containing images corresponding to the game results
    document.getElementById("coingame").innerHTML = '<li><img src="assets/img/'+results.call+'.png" class="bigcoin" id="callcoin"></li><li><img src="assets/img/'+results.flip+'.png" class="bigcoin"></li><li><img src="assets/img/'+results.result+'.png" class="bigcoin"></li>';
	} catch (error) {
		console.log(error);
	}
}
// Create a data sender to sent POST request objects from FormData to send to the API using fetch()
async function sendFlips({ url, formData }) {
// Extract the form data from the FormData object
	const plainFormData = Object.fromEntries(formData.entries());
// Turn the FormData into JSON
	const formDataJson = JSON.stringify(plainFormData);
// Show the console what is going to be sent in the API message body
	console.log(formDataJson);
// Set up the request object for fetch()
	const options = {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json"
		},
		body: formDataJson
	};
// Send the request and wait for the response
	const response = await fetch(url, options);
// Pass the response back to the event handler
	return response.json()
}

// Navigation Buttons
// This is EXTREMELY rudimentary, but shows you what is happening very clearly when each button is pressed.
// Each time you press one of the nav buttons, it sets its class to "active", and all the others to "".
// It also sets the corresponding div to "active" and all the others to "inactive".
// These are what is called in "onclick=" for each button.
function homeNav() {
  document.getElementById("homenav").className = "active";
  document.getElementById("home").className = "active";
  document.getElementById("singlenav").className = "";
  document.getElementById("single").className = "inactive";
  document.getElementById("multinav").className = "";
  document.getElementById("multi").className = "inactive";
  document.getElementById("guessnav").className = "";
  document.getElementById("guesscoin").className = "inactive";
}
function singleNav() {
  document.getElementById("homenav").className = "";
  document.getElementById("home").className = "inactive";
  document.getElementById("singlenav").className = "active";
  document.getElementById("single").className = "active";
  document.getElementById("multinav").className = "";
  document.getElementById("multi").className = "inactive";
  document.getElementById("guessnav").className = "";
  document.getElementById("guesscoin").className = "inactive";
}
function multiNav() {
  document.getElementById("homenav").className = "";
  document.getElementById("home").className = "inactive";
  document.getElementById("singlenav").className = "";
  document.getElementById("single").className = "inactive";
  document.getElementById("multinav").className = "active";
  document.getElementById("multi").className = "active";
  document.getElementById("guessnav").className = "";
  document.getElementById("guesscoin").className = "inactive";
}
function guessNav() {
  document.getElementById("homenav").className = "";
  document.getElementById("home").className = "inactive";
  document.getElementById("singlenav").className = "";
  document.getElementById("single").className = "inactive";
  document.getElementById("multinav").className = "";
  document.getElementById("multi").className = "inactive";
  document.getElementById("guessnav").className = "active";
  document.getElementById("guesscoin").className = "active";
} 
// Make a list of coin images
// This function takes an array of coin flip results and turns them into list elements with corresponding images.
// This allows the DOM call above to put the list in the appropriate place and show a coin for each of the flips sent back from the server.
function coinList(array) {
  let text = "";
  let arrayLength = array.length
  for (let i = 0; i < arrayLength; i++) {
    text += '<li><img src="assets/img/'+array[i]+'.png" class="bigcoin"></li>';
  }
  return text
}