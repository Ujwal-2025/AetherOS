import { Audio } from 'expo-av';

export async function playSuccessSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      // We will use a default system sound or a bundled asset. 
      // For simplicity, we can load a remote generic success sound or require a local asset.
      // Since we don't have a local asset, let's use a reliable remote one for the prototype.
      { uri: 'https://cdn.freesound.org/previews/511/511484_6890478-lq.mp3' },
      { shouldPlay: true }
    );
    
    // Unload the sound from memory once it finishes playing
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error('Failed to play sound', error);
  }
}
