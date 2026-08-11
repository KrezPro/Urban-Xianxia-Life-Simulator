import { registerRootComponent } from 'expo';
import App from './src/App';

// Перехватываем точку входа, чтобы Expo не пытался рендерить дефолтный шаблон
registerRootComponent(App);

export default App;