const output = document.getElementById("cmd-output");

const commandList = ["print", "get-command-list", "about", "clear", "println-debug", "close-light", "open-light"];

let commandLog = [];
let commandLogPointer = false;

let user_sig = "guest@DESKTOP";
let user_data = null;


startInfo();



function startInfo()
{
    print('Hello! My name is Yi-Ting!' +
    '<br/>' +
    'Welcome to my <a class="cmd-link" href="https://en.wikipedia.org/wiki/Fake">fake</a> console)');

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

    print("<span style='color:dodgerblue'>Enter 'get-command-list' to get the list of command available.</span>");

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
            <p class="cmd-text" style="color:dodgerblue">Enter 'get-command-list' to get the list of command available.
            </p>

            <p class="cmd-text" style="color:red;">======================================
        </p>

    */
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
                lastAutocompleteArray = autocomplete(document.getElementById("console-text-entry").value);
                autocompleteWord = lastAutocompleteArray[0];
                lastAutocompleteIndex = 0;
            } else {
                //tab switch mode on
                if (lastAutocompleteIndex == lastAutocompleteArray.length - 1)
                    lastAutocompleteIndex = -1;
                autocompleteWord = lastAutocompleteArray[++lastAutocompleteIndex];
            }
            //after finalized the autocomplete word, put it onto the text entry
            document.getElementById("console-text-entry").value = autocompleteWord;
            document.getElementById("console-text-entry").focus();
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

        case 'get-command-list':
            getCommandList();
            break;

        case 'clear':
            clear();
            break;

        case 'about':
            about();
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

        default:
            //user input does not match with any command
            // find the best match
            let bestMatch = stringSimilarity.findBestMatch(command[0], commandList).bestMatch;
            //print(JSON.stringify(bestMatch));
            if (bestMatch.rating >= 0.3) {
                print("Command '" + command + "' not found, did you mean:");
                print("- command '" + bestMatch.target + "'? (similarity: " + bestMatch.rating + ")");
            } else {
                print("Command '" + command + "' not found");
            }
            print("Enter 'get-command-list' to get the list of command available.")

    }


}

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


function getCommandList() {
    for (let index = 0; index < commandList.length; index++)
        print("- command '" + commandList[index] + "'");
}


function about() {
    let info = '<div class = "ascii-art-fake-terminal">' +
        '* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= *<br/>' +
        '| <span style="color: dodgerblue">███████╗░█████╗░██╗░░██╗███████╗</span> <span style="color: rgb(0, 255, 0)">████████╗███████╗██████╗░███╗░░░███╗██╗███╗░░██╗░█████╗░██╗░░░░░</span> |<br/>' +
        '| <span style="color: dodgerblue">██╔════╝██╔══██╗██║░██╔╝██╔════╝</span> <span style="color: rgb(0, 255, 0)">╚══██╔══╝██╔════╝██╔══██╗████╗░████║██║████╗░██║██╔══██╗██║░░░░░</span> |<br/>' +
        '| <span style="color: dodgerblue">█████╗░░███████║█████═╝░█████╗░░</span> <span style="color: rgb(0, 255, 0)">░░░██║░░░█████╗░░██████╔╝██╔████╔██║██║██╔██╗██║███████║██║░░░░░</span> |<br/>' +
        '| <span style="color: dodgerblue">██╔══╝░░██╔══██║██╔═██╗░██╔══╝░░</span> <span style="color: rgb(0, 255, 0)">░░░██║░░░██╔══╝░░██╔══██╗██║╚██╔╝██║██║██║╚████║██╔══██║██║░░░░░</span> |<br/>' +
        '| <span style="color: dodgerblue">██║░░░░░██║░░██║██║░╚██╗███████╗</span> <span style="color: rgb(0, 255, 0)">░░░██║░░░███████╗██║░░██║██║░╚═╝░██║██║██║░╚███║██║░░██║███████╗</span> |<br/>' +
        '| <span style="color: dodgerblue">╚═╝░░░░░╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝</span> <span style="color: rgb(0, 255, 0)">░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═╝░░░░░╚═╝╚═╝╚═╝░░╚══╝╚═╝░░╚═╝╚══════╝</span> |<br/>' +
        '* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= *<br/>' +
        "</div><br/><div class='ascii-art-yi-ting-chiu'>" +
        "* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- *<br/>" +
        "| '##:::'##'####::::::::'########'####'##::: ##:'######:::::'######:'##::::'##'####'##::::'##: |<br/>" +
        "| . ##:'##:. ##:::::::::... ##..:. ##::###:: ##'##... ##:::'##... ##:##:::: ##. ##::##:::: ##: |<br/>" +
        "| :. ####::: ##:::::::::::: ##:::: ##::####: ##:##:::..:::::##:::..::##:::: ##: ##::##:::: ##: |<br/>" +
        "| ::. ##:::: ##:'#######::: ##:::: ##::## ## ##:##::'####:::##:::::::#########: ##::##:::: ##: |<br/>" +
        "| ::: ##:::: ##:........::: ##:::: ##::##. ####:##::: ##::::##:::::::##.... ##: ##::##:::: ##: |<br/>" +
        "| ::: ##:::: ##:::::::::::: ##:::: ##::##:. ###:##::: ##::::##::: ##:##:::: ##: ##::##:::: ##: |<br/>" +
        "| ::: ##:::'####::::::::::: ##:::'####:##::. ##. ######::::. ######::##:::: ##'####. #######:: |<br/>" +
        "| :::..::::....::::::::::::..::::....:..::::..::......::::::......::..:::::..:....::.......::: |<br/>" +
        "* =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- *<br/>" +
        "</div><br/>" +
        "<span style='color: dodgerblue'>Fake</span> <span style='color: rgb(0, 255, 0)'>Terminal</span> " + version +
        " <a class='cmd-link' href='https://github.com/t41372/fakeTerminal' style='color:red'>" + "GitHub Repo </a><br/>" +
        "*========================*<br/>" +
        "* GitHub: <a class='cmd-link' href='https://github.com/t41372'>t41372</a>.........*<br/>" +
        "* LinkedIn: <a class='cmd-link' href='https://www.linkedin.com/in/yi-ting-chiu/'>yi-ting-chiu</a> *<br/>" +
        "*========================*<br/>" +
        "<br/>" +
        //user data
        "* " + user_data.ip + "<br/>" +
        "* " + user_data.hostname + "<br/>" +
        "* " + user_data.timezone_name + ", " +
        (new Date).toUTCString();

//{"ip":"220.134.67.69","isp":"Chunghwa Telecom Co., Ltd.","org":"Chunghwa Telecom Co. Ltd.","hostname":"220-134-67-69.hinet-ip.hinet.net","latitude":25.0331,"longitude":121.545,"postal_code":"","city":"Poxin","country_code":"TW","country_name":"Taiwan","continent_code":"AS","continent_name":"Asia","region":"Taiwan","district":"Taipei City","timezone_name":"Asia/Taipei","connection_type":"Corporate","asn_number":3462,"asn_org":"Chunghwa Telecom Co., Ltd.","asn":"AS3462 - Chunghwa Telecom Co., Ltd.","currency_code":"TWD","currency_name":"New Taiwan Dollar","success":true,"premium":false}

    print(info);
}


function clear() {
    output.innerHTML = "";
}

/**
 * get a incomplete string, and return a complete command
 */
function autocomplete(currentInput) {
    if (currentInput.length == 0)
        return [""];
    return commandList.filter(cmd => cmd.startsWith(currentInput));
}

function closeLight()
{
    document.body.style = "background-color: black";
}

function openLight()
{
    document.body.style = "background-color: white";
}


