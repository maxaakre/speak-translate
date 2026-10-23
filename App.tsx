import { StatusBar } from 'expo-status-bar';
import { realServices } from './src/services';
import { FaceToFaceScreen } from './src/ui/FaceToFaceScreen';

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <FaceToFaceScreen services={realServices} />
    </>
  );
}
