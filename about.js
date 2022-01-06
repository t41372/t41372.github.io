
say("Hello! I'm Yi-Ting Chiu!!</br>A Freshman Majoring in Computer Science in Arizona State University, Barrett, The Honors College!!")



function say(msg)
{
    const helloText =
        new TypeIt("#text-in-box", {
            speed: 80,
            startDelay: 800,
            lifelike: true,
            cursor: false
        })
            .type(msg, {delay: 200})
            .go();
}





