// import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { FontAwesome } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [buttonColor, setButtonColor] = useState('Copy');

  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);



  const toggleFlash = () => {
    if (flashMode === Camera.Constants.FlashMode.off) {
      setFlashMode(Camera.Constants.FlashMode.on);
    } else if (flashMode === Camera.Constants.FlashMode.on) {
      setFlashMode(Camera.Constants.FlashMode.torch);
    } else {
      setFlashMode(Camera.Constants.FlashMode.off);
    }
  };


  const takePicture = async () => {
    if (cameraRef.current) {
      const { uri } = await cameraRef.current.takePictureAsync();
      setLoading("Taking Image..")
      uploadImage(uri);
    }
  };

  const uploadImage = async (uri) => {
    setLoading("Please wait..")
    const apiKey = 'dfb8cdf4f5f626de0ca257d14b336a91';
    const apiUrl = `https://api.imgbb.com/1/upload?key=${apiKey}`;

    const formData = new FormData();
    formData.append('image', {
      uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    });

    try {
      setLoading("Saving Image..")
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      const responseData = await response.json();
      if (responseData.data.url) {
        setLoading("Image Save Successfully..")
        processImage(responseData.data.url)
      }

    } catch (error) {
      console.error('Upload error:', error);
      setLoading(false);
      setResultText("Something went wrong please try again");
      setIsCameraOn(false);
    }
  };



  const MAX_RETRY_COUNT = 4;
  let retryCount = 0;

  async function processImage(imageUrl) {
    setLoading("Analyzing your image...");

    while (retryCount < MAX_RETRY_COUNT) {
      try {
        const apiUrl = `https://img-to-text-backend.vercel.app/api/v1/text-translate?token=28wfa255g1aher5y112235awg5542525kjwaglkkphlfj2921hgl&url=${imageUrl}`;
        const response = await fetch(apiUrl, {
          method: 'GET',
        });
        if (response.ok) {
          const responseData = await response.json();
          setResultText(responseData?.inlineSentence);
          setIsCameraOn(false);
          break;
        } else {
          console.log(`HTTP Error: ${response.status}`);
        }
      } catch (error) {
        console.log('Error:', error);
        setResultText("Something went wrong please try again");
        setIsCameraOn(false);
        setLoading(false);
      }
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
    }
    if (retryCount === MAX_RETRY_COUNT) {
      console.log('Max retries reached. Request failed.');
    }

    setLoading(false);
  }




  const copyText = () => {
    Clipboard.setString(resultText);
    setButtonColor('Copyed');
    setTimeout(() => {
      setButtonColor('Copy');
    }, 5000);
  };

  return (
    <View style={{ flex: 1 }}>
      {
        isCameraOn ? <Camera
          style={{ flex: 1 }}
          type={Camera.Constants.Type.back}
          flashMode={flashMode}
          ref={cameraRef}
        >
          <View style={{ flex: 1, backgroundColor: 'transparent' }}></View>

          {
            loading ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="white" />
              <Text style={{ color: 'white' }}>{loading}</Text>
            </View> : <View
              style={{
                flex: 0.2,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingHorizontal: '10%'
              }}>
                <TouchableOpacity onPress={() => {
                  setResultText('');
                  setIsCameraOn(false);
                }}>
                  <View style={{ marginTop: 20 }}>
                    <FontAwesome name="times" size={30} color="red" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={takePicture}>
                  <View
                    style={{
                      borderWidth: 2,
                      borderRadius: 50,
                      borderColor: 'white',
                      width: 60,
                      height: 60,
                      backgroundColor: 'white',
                    }}
                  ></View>
                </TouchableOpacity>
                <TouchableOpacity onPress={toggleFlash}>
                  <View style={{ marginTop: 20 }}>
                    <FontAwesome name="lightbulb-o" size={30} color="yellow" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          }

        </Camera> :

          <View style={styles.container}>
            <Text style={styles.title}>Bangla OCR</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={() => setIsCameraOn(true)} style={styles.button}>
                <Text style={{ color: 'white' }}>Take a Photo</Text>
              </TouchableOpacity>
            </View>
            {
              resultText &&
              <View>
                <View style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <TouchableOpacity onPress={copyText} style={[styles.copyButton, { backgroundColor: 'blue', marginRight: '200px' }]}>
                    <Text style={{ color: 'white', }}>{buttonColor}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.resultBox} >
                  <Text>{resultText}</Text>
                </View>
              </View>

            }

          </View>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    marginTop: 100,
    fontSize: 50
  },
  resultBox: {
    marginBottom: 150,
    borderWidth: 1,
    borderColor: 'black',
    padding: 10,
    width: '90%',
    height: 200,
    marginRight: 10,
    marginLeft: 10,

  },
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
  copyButton: {

    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5,
    right: 11,


  },
});
