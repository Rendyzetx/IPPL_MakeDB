const chatInput  = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatbox = document.querySelector(".chatbox");

let userMessage;
const API_KEY = "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";
const inputInitHeight = chatInput.scrollHeight;

const createChatLi = (message, ClassName) => {
    //membuat chat <li> element message dan className yang diteruskan 
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", ClassName);
    let chatContent = ClassName === "outgoing" ? `<p></p>` : `<img src="images/chatbot.png" alt="MakeDB" class="iconbot"><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
}

const generateResponse = (incomingChatLi) => {
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = incomingChatLi.querySelector("p");

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model:  "gpt-3.5-turbo",
            message: [{role: "user", content: userMessage}]
        })
    }

    // Send POST request to API, get response
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        messageElement.textContent = data.choices[0].message.content;
    }).catch((error) => {
        messageElement.classList.add("error");
        messageElement.textContent = "Opps! Something went wrong. Please try again.";
    }).finally(() => chatbox.scrollTo(0, chatbox.scrollHeight));
}

const handleChat = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

    //append the user message to the chatbox
    chatbox.appendChild(createChatLi(userMessage, "outgoing"));
    chatbox.scrollTo(0, chatbox.scrollHeight);

    setTimeout(() => {
        const incomingChatLi = createChatLi("Thinking...", "incoming")
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        generateResponse(incomingChatLi);
    }, 600);
}

chatInput.addEventListener("input", () => {
    //Adjust the height of the input textarea based on its content
    chatInput.style.height = `${inputInitHeight}px`;
    chatInput.style.height = `${chatInput.scrollHeight}px`;
})  

chatInput.addEventListener("keydown", (e) => {
    //if Enter key is pressed without shift key and the window
    //width is greater than 800px, handle the chat
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800){
        e.preventDefault();
        handleChat();
    }
})  

sendChatBtn.addEventListener("click", handleChat);

      
//button download
let button = document.querySelector(".button");
button.addEventListener("click" , ()=> {
    button.classList.add("active")

    setTimeout(()=> {
        button.classList.remove("active") //remove active class after 6 second
        document.querySelector("i").classList.replace("bx-cloud-download", "bx-check-circle")
        document.querySelector(".button-text").innerText = "Completed";

    },2000) //1s = 100ms

})

//sidebar
const navBar = document.querySelector("nav"),
      menuBtns = document.querySelectorAll(".menu-icon");
    //   overlay = document.querySelector(".overlay");
    
      menuBtns.forEach(menuBtn => {
        menuBtn.addEventListener("click", () => {
            navBar.classList.toggle("open");
        });
      });

    //   overlay.addEventListener("click", () => {
    //     navBar.classList.remove("open");
    //   });