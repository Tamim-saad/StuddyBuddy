import { AppRouter } from "./router";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { NotificationProvider } from "./context/NotificationContext";
import { PomodoroProvider } from "./context/PomodoroContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { StickynotesDisplay } from './components/stickynotes/StickynotesDisplay';
import { SavedStickynotes } from "./components/stickynotes/SavedStickynotes";
import { SavedQuiz } from "./components/quizz/SavedQuiz";
import GlobalPomodoroTimer from "./components/GlobalPomodoroTimer";

function App() {
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <NotificationProvider>
          <PomodoroProvider>
            <AppRouter />
            <GlobalPomodoroTimer />
          </PomodoroProvider>
        </NotificationProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
