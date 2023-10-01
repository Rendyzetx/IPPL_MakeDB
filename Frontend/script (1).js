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

