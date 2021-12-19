# fakeTerminal
A fake terminal website

https://t41372.github.io/fakeTerminal/

Current Version: v.0.11

<img src="https://user-images.githubusercontent.com/36402030/146664363-bf55a0a0-5eb7-4166-945e-ceef26b33297.png" height="350rem" width="350rem">


#### todo 

- [x] add more of my info to `about` commend
- [ ] show the start up info with some **delay**
- [x] `clear`
- [ ] fix the sizing on different device, especially the size of text-entry (it's too small)
- [ ] some more command like `ls`, `cd`, `help`

#### Current commends

- `get-command-list`
  - print all the command available
- `print`
  - print everything follow
- `about`
  - print some of my information along with some ascii arts
- `clear`
  - clear everything on the output
- `open-light`
  - turn the background color to white
- `close-light`
  - turn the background color to black
- 

#### Other functionality

- autocompletion
  - provide command autocompletion after pressing `tab`
  - if there are multiple commands match the typed prefix, user can switch among them with more `tabs`

- mistype command recommandation
  - recommand a similar command if user mistype a command

- get ip
  - fetch the ip of the user and put it behind `root_XX@`
  - for example, `root_US@127.0.0.1: ~$`

- command history
  - press `up` `down` can quickly switch among history commands


#### Used external code
- jQuery
- [string-similarity](https://www.npmjs.com/package/string-similarity)
