const chatInput  = document.querySelector(".chat-input textarea");
const sendChatBtn = document.querySelector(".chat-input span");
const chatbox = document.querySelector(".chatbox");
let userMessage;
const inputInitHeight = chatInput.scrollHeight;

let currentSql = '';

const generateResponse = async (incomingChatLi) => {
    const endpoint = 'http://localhost:3000/sql/generateSQL';
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                permintaanUser: userMessage
            })
        });
        
        const data = await response.json();
        incomingChatLi.querySelector("p").textContent = data.sql || 'Harus Sesuai Dengan Database. Contoh : Buatkan database {nama_database}';
        currentSql = data.sql;
        if (!data.sql || data.sql.startsWith('Error')) {
            currentSql = '';
        }
    } catch (error) {
        console.error('Error:', error);
        incomingChatLi.querySelector("p").textContent = 'Error generating response';
        currentSql = '';
    }
};

const createChatLi = (message, ClassName) => {
    const chatLi = document.createElement("li");
    chatLi.classList.add("chat", ClassName);
    chatLi.style.marginBottom = "20px";

    let chatContent = ClassName === "outgoing" ? `<p></p>` : `<img src="images/chatbot.png" alt="MakeDB" class="iconbot"><p></p>`;
    chatLi.innerHTML = chatContent;
    chatLi.querySelector("p").textContent = message;
    return chatLi;
}


const handleChat = () => {
    userMessage = chatInput.value.trim();
    if(!userMessage) return;
    chatInput.value = "";
    chatInput.style.height = `${inputInitHeight}px`;

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

      
// //button download
// let button = document.querySelector(".button");
// button.addEventListener("click" , ()=> {
//     button.classList.add("active")

//     setTimeout(()=> {
//         button.classList.remove("active") //remove active class after 6 second
//         document.querySelector("i").classList.replace("bx-cloud-download", "bx-check-circle")
//         document.querySelector(".button-text").innerText = "Completed";

//     },2000) //1s = 100ms

// })

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


const modifyBtn = document.getElementById('editSql');
modifyBtn.addEventListener('click', async () => {
    if (!currentSql || currentSql.startsWith("Error")) {
        alert("Tidak ada SQL yang valid untuk dimodifikasi.");
        return;
    }

    try {
        const modify = confirm("Apakah Anda ingin memodifikasi SQL ini?");
        if (!modify) return;

        const modificationRequest = prompt("Bagian mana yang ingin Anda rubah?");
        if (!modificationRequest) return;

        const incomingChatLi = createChatLi("Merubah...", "incoming");
        chatbox.appendChild(incomingChatLi);
        chatbox.scrollTo(0, chatbox.scrollHeight);
        const previousSql = currentSql;

        const response = await fetch('http://localhost:3000/sql/modifySQLWithMaxTokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                initialSql: previousSql,
                additionalInput: modificationRequest
            })
        });

        if (response.ok) {
            const data = await response.json();
            currentSql = data.sql;
            incomingChatLi.querySelector("p").textContent = currentSql;
        } else {
            alert('Terjadi kesalahan saat memodifikasi SQL.');
            incomingChatLi.querySelector("p").textContent = "Error modifying SQL";
        }
    } catch (error) {
        console.error('Error modifying SQL:', error);
    }
});

document.getElementById('downloadSql').addEventListener('click', async () => {
    try {
        const response = await fetch('http://localhost:3000/sql/getSQLResult');
        const data = await response.json();

        if (data.sql === "Tidak Ada SQL yang Dihasilkan") {
            alert("Tidak ada SQL yang tersedia untuk diunduh.");
            return;
        }

        const fileName = prompt("Masukkan nama file:", "nama_database");
        if (fileName === null) return;

        const blob = new Blob([data.sql], { type: 'text/sql' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.endsWith('.sql') ? fileName : `${fileName}.sql`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        console.error('Error fetching SQL:', error);
    }
});

const bgAnimation = document.getElementById('bgAnimation');

const numberOfColorBoxes = 400;

for (let i = 0; i < numberOfColorBoxes; i++) {
    const colorBox = document.createElement('div');
    colorBox.classList.add('colorBox');
    bgAnimation.append(colorBox)
}