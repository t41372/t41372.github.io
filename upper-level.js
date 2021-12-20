const fontList = ["PlayfairDisplay-Italic", "CascadiaMonoPL-BoldItalic",
        "PlayfairDisplay-BlackItalic", "PlayfairDisplay-ExtraBold", 
        "Cascadia-Code", "PlayfairDisplay-Italic", 
        "PlayfairDisplay-Italic", "Roboto-ThinItalic", 
        "Cascadia-Code", "Roboto-Bold"
        ];


let terminalOpened = false;

//message appears in the terminal
const message = ["<span style='color:red'>Come on! Do it!</span>",
    "<span style='color:dodgerblue'>and you can talk to me then!!</span>",
    "<span style='color:dodgerblue'>Just go click 'Go to Terminal'</span>",
    "<span style='color:dodgerblue'>Do you know this terminal is actually interactable?</span>",
    "Hello!"];

/**
 * Close the upper page and show the terminal
 */
function switchToTerminal() {
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
function switchToUpperPage() {
    terminalOpened = false;
    //add blur back
    document.getElementById("terminal").style.filter = 'blur(2px)';
    document.getElementById("upper-container").style.display = 'block';
    document.getElementById("terminal-switcher").innerText = "Go to Terminal";
    document.getElementById("terminal-switcher").onclick = Function("switchToTerminal()");
    //change the button color back
    document.getElementById("terminal-switcher").style.backgroundColor = "white";
}


function randomizeFontEffect(targetID) {
    let text = document.getElementById(targetID);

}


// ------ Typing Effects ------

const helloHeading =
    new TypeIt("#hello-title", {
        speed: 120,
        startDelay: 800
    })
        .type('Hello!', {delay: 500})
        .type("<br/>This is Yi-Ting Chiu", {delay: 1000})
        .type("<span style='color:burlywood'>.</span>", {delay: 900})
        .exec(() => formatNode('hello-title', 'Hello!<br/>This is Yi-Ting Chiu<span style="color:burlywood">.</span>'))
        .exec(() => buildBuildWith())
        .go();


let buildWith;

//type text "A dude who build fun stuff with"
function buildBuildWith() {
    helloHeading.destroy();

    buildWith =
        new TypeIt("#build-with", {
            speed: 80,
        }).type("A strange dude", {delay: 1000})
            .delete(12, {delay: 500})
            .type("dude", {delay: 500})
            .type(" who build <span id ='fun' class='funText'>fun stuff</span> with ", {delay: 500})
            // trigger font iteration animation to 'fun stuff'
            .exec(() => {
                document.getElementById('fun').style.backgroundColor = "dodgerblue";
                document.getElementById('fun').style.animation = 'font-iteration 1s linear';
            }, {delay: 500})
            .exec(() => {
                document.getElementById('fun').id = 'fun-1';
                ;
            }, {delay: 1000})
            .exec(() => {
                document.getElementById('fun-1').style.backgroundColor = "transparent";
                document.getElementById('fun-1').style.animation = '';
            }) // end of the iteration animation of 'fun stuff'
            .exec(() => buildWordTyping())
            .go();

}


let buildWithDestroyed = false;
let technology;
let fontIterationIndex = 0;

//typing text "Java, C# ...."
function buildWordTyping() {
    document.getElementById('build-with-technology').innerHTML = "";

    //technology.reset();
    if (!terminalOpened && message.length > 0) print(message.pop());

    if (!buildWithDestroyed) {
        buildWith.destroy();
        buildWithDestroyed = true;
    }


    technology =
        new TypeIt("#build-with-technology", {
            speed: 80,
            startDelay: 800,
            lifelike: true
        })
            .type("<span style='color: dodgerblue'>Java</span>", {delay: 1200, speed: 120})
            .delete()
            .type("<span style='color: dodgerblue'>C#</span>", {delay: 800, speed: 120})
            .delete()
            .type("<span style='color: dodgerblue'>Unity</span>", {delay: 800, speed: 100})
            .delete()
            .type("<span style='color: dodgerblue'>Brain</span>", {delay: 1200})

            .exec(() => { // change 'fun stuff' font logic
                if (fontIterationIndex >= fontList.length)
                    fontIterationIndex = 0;

                console.log("List = " + fontList);
                document.getElementById('fun-1').style.backgroundColor = "dodgerblue";
                document.getElementById('fun-1').style.fontFamily = fontList[fontIterationIndex++];

            }, {delay: 500})
            .exec(() => {
                document.getElementById('fun-1').style.backgroundColor = "transparent";
                document.getElementById('fun-1').style.animation = '';
            }, {delay: 1000}) //change 'fun stuff' font logic end -----

            .delete()
            .type("<span style='color: dodgerblue'>HTML</span>", {delay: 800, speed: 120})
            .delete()
            .type("<span style='color: dodgerblue'>CSS</span>", {delay: 1200})
            .delete()
            .type("<span style='color: dodgerblue'>JavaScript</span>", {delay: 800, speed: 120})

            .exec(() => { // change 'fun stuff' font logic
                if (fontIterationIndex >= fontList.length)
                    fontIterationIndex = 0;

                console.log("List = " + fontList);
                document.getElementById('fun-1').style.backgroundColor = "dodgerblue";
                document.getElementById('fun-1').style.fontFamily = fontList[fontIterationIndex++];

            }, {delay: 500})
            .exec(() => {
                document.getElementById('fun-1').style.backgroundColor = "transparent";
                document.getElementById('fun-1').style.animation = '';
            }, {delay: 1000}) //change 'fun stuff' font logic end -----

            .delete()
            .type("<span style='color: dodgerblue'>WinForm</span>", {delay: 500})
            .delete()
            .type("<span style='color: dodgerblue'>JavaFX</span>", {delay: 800})
            .delete()
            .type("<span style='color: dodgerblue'>AWS</span>", {delay: 500})
            .delete()
            .type("<span style='color: dodgerblue'>Brain</span>", {delay: 1200})
            
            // trigger font iteration animation to 'fun stuff'
            .exec(() => {
                document.getElementById('fun-1').style.backgroundColor = "dodgerblue";
                document.getElementById('fun-1').style.animation = 'font-iteration 1s linear';
            }, {delay: 1500})
            .exec(() => {
                document.getElementById('fun-1').style.backgroundColor = "transparent";
                document.getElementById('fun-1').style.animation = '';
            }, {delay: 1000}) // end of the iteration animation of 'fun stuff'

            .delete()
            .exec(() => buildWordTyping())
            .go();

    //word.destroy();
    //buildWordTyping();

}

// utilities for typing effects

//format the node. Because the TypeIt will make the node strange, and 
// inappropriate for browser translation tool, we need to format it after used it
function formatNode(id, innerHTML) {
    console.log("the inner html is: " + document.getElementById(id).innerHTML)
    document.getElementById(id).innerHTML = innerHTML;
}


//