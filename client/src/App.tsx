import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Tableside from "./pages/Tableside";
import Admin from "./pages/Admin";
import LunchLearn from "./pages/LunchLearn";
import Resources from "./pages/Resources";
import HealthCoaching from "./pages/HealthCoaching";
import Safety from "./pages/Safety";
import MensHealth from "./pages/MensHealth";
import Announcements from "./pages/Announcements";

function Router() {
  return (
    <Switch>
      {/* Hub home — the single QR code destination */}
      <Route path="/" component={Home} />

      {/* Wellness section pages */}
      <Route path="/tableside" component={Tableside} />
      <Route path="/lunch-learn" component={LunchLearn} />
      <Route path="/resources" component={Resources} />
      <Route path="/health-coaching" component={HealthCoaching} />
      <Route path="/safety" component={Safety} />
      <Route path="/mens-health" component={MensHealth} />
      <Route path="/announcements" component={Announcements} />

      {/* Admin panel — owner only */}
      <Route path="/admin" component={Admin} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
