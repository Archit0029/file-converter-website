// Firebase config (replace with your real one from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyBowr8Vco-qwwB59sNh__ujqXDVkq-vcGc",
  authDomain: "ab-file-converter.firebaseapp.com",
  projectId: "ab-file-converter",
  storageBucket: "ab-file-converter.firebasestorage.app",
  messagingSenderId: "407503692071",
  appId: "1:407503692071:web:4a3711f184cfe8b2938902",
  measurementId: "G-L0XKHFL20H"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      alert("Logged in as " + result.user.email);
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('convert-section').style.display = 'block';
    })
    .catch(err => alert("Login failed: " + err.message));
}

async function uploadAndConvert() {
  const fileInput = document.getElementById("file-upload");
  const format = document.getElementById("format").value;

  if (!fileInput.files.length) {
    alert("Please select a file.");
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);
  formData.append("format", format);

  try {
    const response = await fetch("https://ab-file-converter-backend.onrender.com/convert", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      alert("Conversion failed: " + error.error);
      return;
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "converted." + format;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (err) {
    alert("Error: " + err.message);
  }
}
