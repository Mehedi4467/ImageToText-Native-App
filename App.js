// import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { View, Text, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { FontAwesome } from '@expo/vector-icons';
export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const cameraRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const { uri } = await cameraRef.current.takePictureAsync();
      setLoading("Taking Image..")
      uploadImage(uri);
    }
  };

  const toggleFlash = () => {
    if (flashMode === Camera.Constants.FlashMode.off) {
      setFlashMode(Camera.Constants.FlashMode.on);
    } else if (flashMode === Camera.Constants.FlashMode.on) {
      setFlashMode(Camera.Constants.FlashMode.torch);
    } else {
      setFlashMode(Camera.Constants.FlashMode.off);
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
      setLoading(false)
    }
  };

  const processImage = async (imageUrl) => {
    setLoading("Image Analyzing Completed..");
    setIsCameraOn(false);
    setLoading(false)
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
              <Text style={{ color: 'white' }}>{ loading}</Text>
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
                <TouchableOpacity onPress={() => setIsCameraOn(false)}>
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

        </Camera> : <View style={styles.container}>
          <TouchableOpacity onPress={() => setIsCameraOn(true)} style={styles.button}>
            <Text style={{ color: 'white' }}>Take a Photo</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
  },
});