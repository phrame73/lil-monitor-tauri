import "./App.css";
import { MemoryDisplay } from "./components/MemoryDisplay";

function App() {
  return (
    <main className="container">
      <h1>System Monitor</h1>
      <MemoryDisplay />
    </main>
  );
}

export default App;