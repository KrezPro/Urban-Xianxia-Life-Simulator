import { registerRootComponent } from 'expo';
import App from './src/App';

// Жестко перехватываем точку входа, чтобы Expo не искал дефолтные файлы
registerRootComponent(App);

export default App;