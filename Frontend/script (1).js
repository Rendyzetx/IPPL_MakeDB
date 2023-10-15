const bgAnimation = document.getElementById('bgAnimation');

const numberOfColorBoxes = 400;

for (let i = 0; i < numberOfColorBoxes; i++) {
    const colorBox = document.createElement('div');
    colorBox.classList.add('colorBox');

    const textSpan = document.createElement('span');
    textSpan.innerText = "MakeDB";

    colorBox.appendChild(textSpan);
    bgAnimation.append(colorBox);
}
window.onload = () => {
    fetch('http://localhost:3000/auth/check-login-status', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => {
            console.log('Response', response);
            return response.json();
        })
        .then(data => {
            console.log('Data', data);
            if (data.isLoggedIn) {
                window.location.href = 'http://127.0.0.1:8080/index2.html';
            }
        })
        .catch(error => console.error('Error:', error));
};
