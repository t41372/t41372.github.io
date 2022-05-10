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




// ------ Typing Effects ------

//to determine if my name need to be in the next line to make sure the glitching effect works fine
const screenTooNarrowBr = (document.body.scrollWidth <= 396) ? '　<br/>' : ' ';

const helloHeading =
    new TypeIt("#hello-title", {
        speed: 120,
        startDelay: 800
    })
        .type('Hello!', {delay: 300})
        .type('<label id="hello-hand" style="color: grey">./wave.gif</label>', {speed: 20, delay: 50})
        .exec(() => {
            document.getElementById('hello-hand').innerHTML 
            = '<img src="https://raw.githubusercontent.com/MartinHeinz/MartinHeinz/master/wave.gif" width="30px" height="30px">';
        }, {delay: 500})
        .type("<br/>This is" + screenTooNarrowBr + "<span id='myName' data-text='Yi-Ting Chiu'>Yi-Ting Chiu</span>", {delay: 1000})
        .type("<span style='color:burlywood'>.</span>", {delay: 900})
        .exec(() => formatNode('hello-title', 
        'Hello!' + 
        '<img src="https://raw.githubusercontent.com/MartinHeinz/MartinHeinz/master/wave.gif" width="30px" height="30px">'+
        '<br/>This is' + screenTooNarrowBr + '<span id="myName" data-text="Yi-Ting Chiu">Yi-Ting Chiu</span><span style="color:burlywood">.</span>'))
        
        //add the glitching effect
        .exec(() => { // select my name with blue background
            document.getElementById('myName').style.backgroundColor = "dodgerblue";
        }, {delay: 800})
        .exec(() => constructHello_RGBGlitching(), {delay: 800}) // start the glitching effect
        .exec(() => { //unselect
            document.getElementById('myName').style.backgroundColor = "transparent";
        }, {delay: 1000}) //selection animation end -----

        .exec(() => buildBuildWith())
        .go();


function constructHello_RGBGlitching()
{
    document.getElementById("myName").className = "text-glitch";
}

let buildWith;

//type text "A dude who build fun stuff with"
function buildBuildWith() {
    helloHeading.destroy();

    buildWith =
        new TypeIt("#build-with", {
            speed: 80,
        }).type("A weird guy", {delay: 1000})
            .delete(9, {delay: 500})
            .type("person", {delay: 500})
            .type(" who build <span id ='fun' class='funText'>fun stuff</span> <br/>with ", {delay: 500})
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
            }) // end of font iteration animation of 'fun stuff'
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
            .type("<span style='color: dodgerblue'>C++</span>", {delay: 1200, speed: 120})
            .delete()
            .type("<span style='color: dodgerblue'>C#</span>", {delay: 800, speed: 120})
            .delete()
            .type("<span style='color: dodgerblue'>Unity</span>", {delay: 800, speed: 100})
            .delete()
            .type("<span style='color: dodgerblue'>Brain</span>", {delay: 1200})

            .exec(() => { // change 'fun stuff' font logic
                if (fontIterationIndex >= fontList.length)
                    fontIterationIndex = 0;

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
                document.getElementById('fun-1').style.fontFamily = fontList[fontIterationIndex++];
            }, {delay: 2000})
            .exec(() => {
                document.getElementById('fun-1').style.backgroundColor = "transparent";
                document.getElementById('fun-1').style.animation = '';
            }, {delay: 1200}) // end of the iteration animation of 'fun stuff'

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
    document.getElementById(id).innerHTML = innerHTML;
}


//