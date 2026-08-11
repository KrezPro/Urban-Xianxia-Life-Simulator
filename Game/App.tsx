import { registerRootComponent } from 'expo';
import App from './src/App';

// Регистрируем компонент принудительно, чтобы Expo точно подхватил наш src/App.tsx
registerRootComponent(App);

export default App;