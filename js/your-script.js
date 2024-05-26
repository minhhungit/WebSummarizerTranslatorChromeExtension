function takeChatScreenshot() {
    console.log('xx');
    const element = document.querySelector('.my-extension-modal');
    const shadowRoot = element.shadowRoot;

    const elementToCapture = shadowRoot.querySelector('.chat-messages');
    console.log(elementToCapture);

    // Scroll the element to the top
    elementToCapture.scrollTo(0, 0);
    
     // Get the dimensions of the scrollable area
    const width = elementToCapture.scrollWidth;
    const height = elementToCapture.scrollHeight;
    
    // Create a canvas with the same dimensions as the scrollable area
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Position the canvas off-screen
    canvas.style.position = 'fixed';
    canvas.style.top = '-10000px';
    canvas.style.left = '-10000px';
    document.body.appendChild(canvas);
    
    html2canvas(elementToCapture, {
        scrollX: 0,
        scrollY: 0,
        windowWidth: width,
        windowHeight: height,
        width: width,
        height: height
    }).then(function(canvas) {
        // Convert the canvas to a data URL representing the image
        const imgData = canvas.toDataURL('image/png');
                
        // Create a link element to trigger the download
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'screenshot.png'; // Specify the file name here
        
        // Append the link to the document body
        document.body.appendChild(link);
        
        // Trigger a click on the link to initiate the download
        link.click();
        
        // Remove the link and canvas from the document body
        document.body.removeChild(link);
    });

    console.log('yy');
}

takeChatScreenshot();