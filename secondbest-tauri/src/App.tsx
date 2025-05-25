import { useState } from 'react';
import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import GamePage from './pages/GamePage';
import './App.css';

type Page = 'home' | 'settings' | 'game';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const navigateToHome = () => setCurrentPage('home');
  const navigateToSettings = () => setCurrentPage('settings');
  const navigateToGame = () => setCurrentPage('game');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            onStartClick={navigateToGame}
            onSettingsClick={navigateToSettings}
          />
        );
      case 'settings':
        return <SettingsPage onHomeClick={navigateToHome} />;
      case 'game':
        return <GamePage onHomeClick={navigateToHome} />;
      default:
        return (
          <HomePage
            onStartClick={navigateToGame}
            onSettingsClick={navigateToSettings}
          />
        );
    }
  };

  return <div className="app">{renderCurrentPage()}</div>;
}

export default App;
