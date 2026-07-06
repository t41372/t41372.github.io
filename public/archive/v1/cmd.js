const output = document.getElementById("cmd-output");

const commandList = ["print", "ls", "echo", "pwd", "cd", "help", "about", "clear",
    "neofetch", "whoami", "println-debug", "close-light", 
    "open-light", "background", "background 2", "background 1", "background 0",
    "cat", "cat neofetch.txt", "cat well.md", "cat coolFeatures.txt", "cat about.txt"];

// useless but implemented commands: sudo, 

const fileList = ["neofetch.txt", "well.md", "coolFeatures.txt", "about.txt"]

let commandLog = [];
let commandLogPointer = false;

let user_sig = "guest@DESKTOP";
let user_data = null;


startInfo();
whatsNew();


function startInfo()
{
    print('Hello! My name is Yi-Ting!' +
    '<br/>' +
    'Welcome to my <a class="cmd-link" href="https://en.wikipedia.org/wiki/Fake">fake</a> console<span id="hello_ver"></span>');

    print('<div class="ascii-art-fake-terminal"> ' + 
    '* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= *' + 
    '<br/>' +
    '| <span style="color: dodgerblue">███████╗░█████╗░██╗░░██╗███████╗</span> <span' + 
    '    style="color: rgb(0, 255, 0)">████████╗███████╗██████╗░███╗░░░███╗██╗███╗░░██╗░█████╗░██╗░░░░░</span> |' +
    '<br />' +
    '| <span style="color: dodgerblue">██╔════╝██╔══██╗██║░██╔╝██╔════╝</span> <span' +
    '    style="color: rgb(0, 255, 0)">╚══██╔══╝██╔════╝██╔══██╗████╗░████║██║████╗░██║██╔══██╗██║░░░░░</span> |' +
    '<br />' +
    '| <span style="color: dodgerblue">█████╗░░███████║█████═╝░█████╗░░</span> <span' +
    '    style="color: rgb(0, 255, 0)">░░░██║░░░█████╗░░██████╔╝██╔████╔██║██║██╔██╗██║███████║██║░░░░░</span> |' +
    '<br />' +
    '| <span style="color: dodgerblue">██╔══╝░░██╔══██║██╔═██╗░██╔══╝░░</span> <span' +
    '    style="color: rgb(0, 255, 0)">░░░██║░░░██╔══╝░░██╔══██╗██║╚██╔╝██║██║██║╚████║██╔══██║██║░░░░░</span> |' +
    '<br />' + 
    '| <span style="color: dodgerblue">██║░░░░░██║░░██║██║░╚██╗███████╗</span> <span' +
    '    style="color: rgb(0, 255, 0)">░░░██║░░░███████╗██║░░██║██║░╚═╝░██║██║██║░╚███║██║░░██║███████╗</span> |' +
    '<br />' +
    '| <span style="color: dodgerblue">╚═╝░░░░░╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝</span> <span' +
    '    style="color: rgb(0, 255, 0)">░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═╝░░░░░╚═╝╚═╝╚═╝░░╚══╝╚═╝░░╚═╝╚══════╝</span> |' +
    '<br />' +
    '* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= *' +
    '<br /> </div>');

    print('<span style="color:dodgerblue">Enter "help" to get the list of command available.</span>');

    print('<span style="color:red;">======================================</span>');


    /*
            <p class="cmd-text" id="hello">Hello! My name is Yi-Ting!
                <br />
                Welcome to my <a class="cmd-link" href="https://en.wikipedia.org/wiki/Fake">fake</a> console
            </p>

            <!--Start up logo-->
            <p class="cmd-text" style="font-size:0.32em">
                * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
                *<br />
                | <span style="color: dodgerblue">███████╗░█████╗░██╗░░██╗███████╗</span> <span
                    style="color: rgb(0, 255, 0)">████████╗███████╗██████╗░███╗░░░███╗██╗███╗░░██╗░█████╗░██╗░░░░░</span>
                |<br />
                | <span style="color: dodgerblue">██╔════╝██╔══██╗██║░██╔╝██╔════╝</span> <span
                    style="color: rgb(0, 255, 0)">╚══██╔══╝██╔════╝██╔══██╗████╗░████║██║████╗░██║██╔══██╗██║░░░░░</span>
                |<br />
                | <span style="color: dodgerblue">█████╗░░███████║█████═╝░█████╗░░</span> <span
                    style="color: rgb(0, 255, 0)">░░░██║░░░█████╗░░██████╔╝██╔████╔██║██║██╔██╗██║███████║██║░░░░░</span>
                |<br />
                | <span style="color: dodgerblue">██╔══╝░░██╔══██║██╔═██╗░██╔══╝░░</span> <span
                    style="color: rgb(0, 255, 0)">░░░██║░░░██╔══╝░░██╔══██╗██║╚██╔╝██║██║██║╚████║██╔══██║██║░░░░░</span>
                |<br />
                | <span style="color: dodgerblue">██║░░░░░██║░░██║██║░╚██╗███████╗</span> <span
                    style="color: rgb(0, 255, 0)">░░░██║░░░███████╗██║░░██║██║░╚═╝░██║██║██║░╚███║██║░░██║███████╗</span>
                |<br />
                | <span style="color: dodgerblue">╚═╝░░░░░╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝</span> <span
                    style="color: rgb(0, 255, 0)">░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═╝░░░░░╚═╝╚═╝╚═╝░░╚══╝╚═╝░░╚═╝╚══════╝</span>
                |<br />
                * =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
                *<br />
            </p>
            <p class="cmd-text" style="color:dodgerblue">Enter 'help' to get the list of command available.
            </p>

            <p class="cmd-text" style="color:red;">======================================
        </p>

    */
}

function whatsNew()
{   
    cat("coolFeatures.txt");
}


//record the index of last autocomplete index. 
//For example, if user is at "about" among ["apple", "about", "abort"], this value should be 1
//created to allow user to switch among autocomplete options with tabs
let lastAutocompleteIndex = false;
let lastAutocompleteArray = [];

function receiveCommand(event) {
    let keyCode = event.keyCode;
    switch(keyCode)
    {
        case 13: //pressed enter
            //get input
            let commandText = document.getElementById("console-text-entry").value;

            //clear the input line
            document.getElementById("console-text-entry").value = "";
            //push history command into the output pool
            let newNode = document.createElement("p");
            newNode.setAttribute("class", "cmd-text");
            newNode.innerHTML = '<span style="color:rgb(0, 255, 0)">' + user_sig + '</span>:'
                + '<span style="color:dodgerblue"> ~</span>$ ' + commandText;

            //append newNode
            output.appendChild(newNode);

            //push command text into log
            commandLog.push(commandText);

            //evaluate input
            commandEvaluation(commandText);
            //get focus on text field
            document.getElementById("console-text-entry").focus();
            //reset autocomplete index
            lastAutocompleteIndex = false;
            commandLogPointer = false;
            break;
        
        case 9: //pressed tab
            let autocompleteWord;
            if (lastAutocompleteIndex === false) {
                lastAutocompleteArray = autocomplete(document.getElementById("console-text-entry").value, commandList);
                autocompleteWord = lastAutocompleteArray[0];
                lastAutocompleteIndex = 0;
            } else {
                //tab switch mode on
                if (lastAutocompleteIndex == lastAutocompleteArray.length - 1)
                    lastAutocompleteIndex = -1;
                autocompleteWord = lastAutocompleteArray[++lastAutocompleteIndex];
            }
            //after finalized the autocomplete word, put it onto the text entry
            if(autocompleteWord != undefined)
            {
                document.getElementById("console-text-entry").value = autocompleteWord;
            }
            document.getElementById("console-text-entry").focus();
            event.preventDefault();
            commandLogPointer = false;
            break;

        case 38: //up arrow
            if(commandLogPointer === false)
            {
                commandLogPointer = commandLog.length;
            }
            if(commandLogPointer > 0)
            {
                document.getElementById("console-text-entry").value = commandLog[--commandLogPointer];
                document.getElementById("console-text-entry").focus();
            }

            break;

        case 40: //down arrow
            if(commandLogPointer === false)
                break;
            if(commandLogPointer < commandLog.length-1)
            {
                document.getElementById("console-text-entry").value = commandLog[++commandLogPointer];
                document.getElementById("console-text-entry").focus();
            }

            break;

        default:
            //reset autocomplete index
            lastAutocompleteIndex = false;
            commandLogPointer = false;
        
    }

}

//command is a string
function commandEvaluation(command) {
    console.log("received command: " + command);
    if (!command) return;

    command = command.split(" ");

    switch (command[0].toLowerCase()) {
        case 'print':
            command.shift();
            print(command)
            break;

        case 'echo':
            command.shift();
            print(command);
            break;
        
        case 'ls':
            ls();
            break;
        
        case 'cd':
            command.shift();
            cd(command);
            break;

        case 'cat':
            command.shift();
            cat(command);
            break;
        
        case 'pwd':
            pwd();
            break;
        
        case 'sudo':
            print("You are already the root user!");
            command.shift()
            commandEvaluation(command.join(" "));
            break;

        case 'help':
            help();
            break;

        case 'clear':
            clear();
            break;

        case 'about':
            about();
            break;

        case 'whoami':
            print("I'm <span style='color: dodgerblue'>Yi-Ting Chiu</span>, and you are <span style='color :dodgerblue; font-style:italic'>WHO YOU ARE!</span>")
            print("<span style='font-weight:bold; font-style:italic'>#BE_YOURSELF")
            break;

        case 'neofetch':
            neofetch();
            break;
            
        case 'println-debug':
            print("Congrats!! You found a fake command!!");
            break;
        
        case 'close-light':
            closeLight();
            break;
        
        case 'open-light':
            openLight();
            break;

        case 'background':
            
            command.shift()
            background(command);
            break;

        default:
            //user input does not match with any command
            // find the best match
            let bestMatch = stringSimilarity.findBestMatch(command[0], commandList).bestMatch;
            //print(JSON.stringify(bestMatch));
            if (bestMatch.rating >= 0.3) {
                print("Command '" + command + "' not found, did you mean:");
                print("- command '" + bestMatch.target + "'? (similarity: " + bestMatch.rating + ")");
            } else {
                print(`${command}: command not found`);
            }
            print("Enter 'help' to get the list of command available.")

    }


}

/**
 * get a incomplete string, and return a complete command
 */
function autocomplete(currentInput, targetList) {
    if (currentInput.length == 0)
        return [""];
    return targetList.filter(cmd => cmd.startsWith(currentInput));
}

//! ============ Commands in the Fake Terminal =============

function print(s) {
    if (Array.isArray(s)) {
        let cache = "";
        for (let index = 0; index < s.length; index++) {
            cache = cache + " " + s[index];
        }
        s = cache;
    }

    let newNode = document.createElement("p");
    newNode.setAttribute("class", "cmd-text");
    newNode.innerHTML = s;
    output.appendChild(newNode);
}

function printText(s) {
    if (Array.isArray(s)) {
        let cache = "";
        for (let index = 0; index < s.length; index++) {
            cache = cache + " " + s[index];
        }
        s = cache;
    }

    let newNode = document.createElement("p");
    newNode.setAttribute("class", "cmd-text");
    newNode.innerText = s;
    output.appendChild(newNode);
}


function help() {
    for (let index = 0; index < commandList.length; index++)
        print("- command '" + commandList[index] + "'");
}


function about() {

    cat("about.txt", function(content){
            content = content.replace("#version", version);
            content = content.replace("user_data.ip", user_data.ip);
            content = content.replace("user_data.hostname", user_data.hostname);
            content = content.replace("user_data.timezone_name", user_data.timezone_name);
            content = content.replace("(new Date).toUTCString()", (new Date).toUTCString());
            return content
        });

}


function clear() {
    output.innerHTML = "";
}


function closeLight()
{
    document.body.style = "background-color: black";
}

function openLight()
{
    document.body.style = "background-color: white";
}


let background_state = 0;
//change background: options are
// 1. starry night
function background(option)
{
    // console.log(option);
    // if(option.length == 0)
    // console.log(option);

    switch(option[0]){
        case '2':
            background_toParticles();
            break;
        case '1':
            background_toStarryNight();
            break;
        case '0':
            background_removeBackground();
            break;

        default:
            // print error message
            print("<span> * Command 'background 2' will change the background of the terminal to particles. <br/>" +
            " * Command 'background 1' will change the background of the terminal to starry night. <br/>" + 
            " * Command 'background 0' will change the background of the terminal to default (black). <br/><br/>" +
            "'background " + option[0] + "' is not defined.</span>");
    }

}

function background_toStarryNight()
{
    //remove background
    background_removeBackground();
    // document.body.innerHTML = '<div id="stars"></div><div id="stars2"></div><div id="stars3"></div>' + document.body.innerHTML;
    document.getElementById('star-container').hidden = '';

    document.head.innerHTML = '<link id="starry-night-css" href="./starryNight.css" type="text/css" rel="stylesheet">' + document.head.innerHTML;
    background_state = 1;
    print('background changed to <span style="color:dodgerblue">starry night</span>');
}

function background_removeBackground()
{
    // remove starry night
    if(background_state == 1)
    {
        //! issue: if the document has multiple 'starry-night-css', we can't delete the additional ones
        document.getElementById('star-container').hidden = true;
        if(document.getElementById('starry-night-css') != null)
            document.getElementById('starry-night-css').remove()
    }

    // remove particles
    if(background_state == 2)
    {
        if(document.getElementById('particlesEmbed') != null)
            document.getElementById('particlesEmbed').remove();
    }
    
    background_state = 0;
    print("background set to <span style='color:dodgerblue'>default</span>");
}

function background_toParticles()
{
    // remove background
    background_removeBackground();

    //document.write('<embed type="text/html" src="./particle-background.html" style="position: absolute; z-index: 0; width: 100%; height: 100%;">')
    let embd = document.createElement("embed")
    embd.id = "particlesEmbed"
    embd.type = "text/html" 
    embd.src = "./particle-background.html"
    embd.style = "position: absolute; z-index: -1; width: 100%; height: 100%;"
    // 	// Create element:
    // const particleDiv = document.createElement("canvas");
    // const particleAttri = document.createAttribute("id");
    // particleAttri.value = "particles-js";
    
    // particleDiv.setAttributeNode(particleAttri);

    // // Append to body:
    document.body.insertBefore(embd, document.getElementById("terminal"))
    // //document.body.innerHTML = particleDiv.innerHTML + document.body.innerHTML;
    background_state = 2;
    print('background changed to <span style="color:dodgerblue">particles</span>')
}


function ls()
{
    // print("<span style='color: dodgerblue'>you_know_this_is_fake.txt");
    // print("<span style='color: dodgerblue'>because_a_static_website_written_by_a_lazy_guy.txt</span>")
    // print("<span style='color: dodgerblue'>does_not_always_have_a_real_file_system.txt</span>")
    for(let i = 0; i < fileList.length; i++)
    {
        print(`<span style='color: dodgerblue'>${fileList[i]}</span>`);
    }

}

function cd(s)
{
    if(s == './' || s == '~' || s == '') {}
    else if(s == '..' || s == '../' || s == "/")
        print(`cd: permission denied: /`)
    else
        print(`cd: no such file or directory: ${s}`)
}

function pwd()
{
    print("/root");
}

// cat: concatenate files and print on the standard output
// postProcess: a function that takes in the content of the file and return the processed content
// it can be used to fill in real data into the cat result
// this commant can also take in a url and print the content of the url
function cat(fileName, postProcess = null)
{
    fileName = fileName.toString();

    // if the file name is not a url, convert it into local file path
    if( !(/(http:\/\/|https:\/\/)/.test(fileName)) )
    {
        // if the file name is a local file, get the file and print it
        fileName.replace(/(\.\/|~\/|\/root\/)/g, '');

        fileName = "./fs/" + fileName;
    }

    // get the neofetch file and print it
    var xhr = new XMLHttpRequest();
    // set request type and url
    xhr.open('GET', fileName, true);

    // define success callback
    xhr.onload = function() {
    if (xhr.status === 200) {
        // file content retrieved successfully
        let neofetchText = "<div style='white-space: pre'>" + xhr.responseText + "</div>"
        
        // fill in real data with postProcess function, if provided
        if(postProcess)
        {
            try {
                neofetchText = postProcess(neofetchText)
            } catch (error) {
                console.error("Failed to process data")
            }
        }

        print(neofetchText);
    } else {
        // failed
        print(`cat: ${fileName}: Permission denied. No such file or directory`);
        print('Execution Failed： I/O Error: ' + xhr.status);
    }
    };

    // send request
    xhr.send();
}


function neofetch()
{
    cat("neofetch.txt", function(neofetchText) {
        // this is the post process fuction in cat
        // replace the data tag with real data
        neofetchText = neofetchText.replace("user_sig", user_sig);
        neofetchText = neofetchText.replace("user_data.ip", user_data.ip);
        return neofetchText;
    });
}



