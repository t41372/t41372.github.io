
var terminalOpened = false;

/**
 * Close the upper page and show the terminal
 */
function switchToTerminal()
{
    terminalOpened = true;
    document.getElementById("upper-container").style.display = 'none';
    //cancel blur
    document.getElementById("terminal").style.filter = 'blur(0)';
    document.getElementById("terminal-switcher").innerText = "Go to front page";
    document.getElementById("terminal-switcher").onclick = Function("switchToUpperPage()");
    //change button color
    document.getElementById("terminal-switcher").style.backgroundColor = "rgb(0,255,0)";

}

/**
 * Open the upper page
 */
 function switchToUpperPage()
 {
     terminalOpened = false;
    //add blur back
    document.getElementById("terminal").style.filter = 'blur(2px)';
    document.getElementById("upper-container").style.display = 'block';
    document.getElementById("terminal-switcher").innerText = "Go to Terminal";
    document.getElementById("terminal-switcher").onclick = Function("switchToTerminal()");
    //change the button color back
    document.getElementById("terminal-switcher").style.backgroundColor = "white";
 }



const helloHeading = 
new TypeIt(".upper-heading", {
    speed: 120,
    startDelay: 800})
    .type("Hello!", {delay:500})
    .type("<br/>This is Yi-Ting Chiu", {delay:1000})
    .type("<span style='color:burlywood'>.</span>", {delay: 1000})
    .exec(() => buildBuildWith())
  .go();

var buildWith;
function buildBuildWith()
{
    helloHeading.destroy();

    buildWith = 
    new TypeIt("#build-with", {
        speed: 80,
    }).type("A strange dude", {delay:1000})
    .delete(12, {delay:500})
    .type("dude", {delay:500})
    .type(" who build <span style='background-color: dodgerblue; color: white'>fun</span> stuff with ")
    .exec(() => buildWordTyping())
    .go();
    
}

var message = ["<span style='color:red'>Come on! Do it!</span>", 
            "<span style='color:dodgerblue'>and you can talk to me then!!</span>", 
            "<span style='color:dodgerblue'>Just go click 'Go to Terminal'</span>",
            "<span style='color:dodgerblue'>Do you know this terminal is actually interactable?</span>",
            "Hello!"]

var buildWithDestroyed = false;
var technology;
function buildWordTyping()
{
    document.getElementById('build-with-technology').innerHTML = "";

    //technology.reset();
    if(!terminalOpened && message.length > 0) print(message.pop());

    if(!buildWithDestroyed){
        buildWith.destroy();
        buildWithDestroyed = true;
    }

    
    technology = 
    new TypeIt("#build-with-technology", {
        speed: 80,
        startDelay: 800
    }).type("<span style='color: dodgerblue'>Java</span>", {delay: 1200, speed: 120})
    .delete()
    .type("<span style='color: dodgerblue'>C#</span>", {delay: 800, speed: 120})
    .delete()
    .type("<span style='color: dodgerblue'>Unity</span>", {delay: 800, speed: 100})
    .delete()
    .type("<span style='color: dodgerblue'>Brain</span>", {delay: 1200})
    .delete()
    .type("<span style='color: dodgerblue'>HTML</span>", {delay: 800, speed: 120})
    .delete()
    .type("<span style='color: dodgerblue'>CSS</span>", {delay: 1200})
    .delete()
    .type("<span style='color: dodgerblue'>JavaScript</span>", {delay: 800, speed:120})
    .delete()
    .type("<span style='color: dodgerblue'>WinForm</span>", {delay: 500})
    .delete()
    .type("<span style='color: dodgerblue'>JavaFX</span>", {delay: 800})
    .delete()
    .type("<span style='color: dodgerblue'>AWS</span>", {delay: 500})
    .delete()
    .type("<span style='color: dodgerblue'>Brain</span>", {delay: 1200})
    .delete()
    .exec(() => buildWordTyping())
    .go();

    //word.destroy();
    //buildWordTyping();

}




