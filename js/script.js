    const URL = "https://teachablemachine.withgoogle.com/models/9grlf8bkd/";

    let model, webcam, labelContainer, maxPredictions;

    // Load the image model and setup the webcam
    async function init() {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        // Convenience function to setup a webcam
        const flip = true; // whether to flip the webcam
        webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
        await webcam.setup(); // request access to the webcam
        await webcam.play();
        window.requestAnimationFrame(loop);

        // append elements to the DOM
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) { // and class labels
            labelContainer.appendChild(document.createElement("div"));
        }
    }

    async function loop() {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }

    // run the webcam image through the image model
    async function predict() {
        // predict can take in an image, video or canvas html element
        const prediction = await model.predict(webcam.canvas);
      
        let highestConfidence = 0;
        let highestClass = "";
        for (let i = 0; i < maxPredictions; i++) {
          // Find class with highest probability
          if (prediction[i].probability > highestConfidence) {
            highestConfidence = prediction[i].probability;
            highestClass = prediction[i].className;
          }
        }
      
        // Flag to track if prediction has been spoken
        let hasSpoken = false;
      
        // Only display and speak class name if highest confidence is above 95% and not already spoken
        if (highestConfidence > 0.95) { // Check only for high confidence
            labelContainer.innerHTML = highestClass;
            speakText(highestClass); // Debounced speech synthesis
            hasSpoken = true; // Set flag after speaking (even if timeout is used)
          } else {
            labelContainer.innerHTML = "Please Bring The Item Closer";
            hasSpoken = false; // Reset flag for low confidence
          }
        }


        let timeoutId = null; // Variable to store the timeout ID

        function speakText(text) {
          if (timeoutId) {
            clearTimeout(timeoutId); // Clear any existing timeout
          }
          timeoutId = setTimeout(() => {
            const speech = new SpeechSynthesisUtterance();
            speech.text = text;
            if (window.speechSynthesis) {
              window.speechSynthesis.speak(speech);
            } else {
              console.log("Speech Synthesis not supported by your browser.");
            }
          }, 100);
        }


        const flipCameraButton = document.getElementById("flip-camera");

        flipCameraButton.addEventListener("click", async () => {
          try {
            // Stop the current webcam stream
            await webcam.stop();
        
            // Check if 'facingMode' property exists (modern browsers)
            if (webcam.facingMode) {
              webcam.facingMode = webcam.facingMode === "user" ? "environment" : "user";
            } else {
              // Fallback for older browsers: Reverse logic based on 'flip' property
              webcam.flip = !webcam.flip;
            }
        
            // Restart webcam stream with the flipped configuration
            await webcam.setup();
            await webcam.play();
            console.log("Camera Flipped");
          } catch (error) {
            // Handle error: Likely no other camera found
            console.error("Error flipping camera:", error);
            alert("No secondary camera detected. Reload and start camera again.");
          }
        });