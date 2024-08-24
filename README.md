# Hand Drawing Whiteboard

Exploration into novel methods of interacting with your computer! This project makes use of on-device ML to track hands in your webcam. Try it out here: https://floating-hands-whiteboard.vercel.app/.

https://github.com/user-attachments/assets/05b91c36-c556-4b11-ba4a-0af0822647e7

## Project Setup

You can run this project by running the following:

```
npm install
npm start
```

## Methods

This project leverages [Google's MediaPipe](https://ai.google.dev/edge/mediapipe/solutions/guide). We use a trained classification model on top of the simple thresholding techniques. The classifier can be customized through a notebook found in this [example](https://ai.google.dev/edge/mediapipe/solutions/customization/gesture_recognizer).

Other solutions for gesture recognition could be through [K-Means](https://en.wikipedia.org/wiki/K-means_clustering) like in this [blog post](https://deividasmaciejauskas.substack.com/p/classification-for-hand-pose-gestures?r=2813h6&utm_campaign=post&utm_medium=web&triedRedirect=true).

## Contributing

Feel free to contribute to the project through a pull request if you have new features in mind!
