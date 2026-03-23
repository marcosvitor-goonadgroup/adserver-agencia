import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AdServer from "./pages/AdServer";
import CampaignList from "./pages/CampaignList";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import VehicleDashboard from "./pages/VehicleDashboard";

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loadingUser } = useAuth();
  if (loadingUser) return (
    <div className="min-h-screen bg-[#f1f1f1] flex items-center justify-center">
      <p className="text-black/40 text-sm">Carregando...</p>
    </div>
  );
  if (!isAuthenticated) return <Redirect to="/login" />;
  return <Component />;
}

function Router() {
  const { isAuthenticated, loadingUser } = useAuth();

  return (
    <Switch>
      <Route path={"/login"}>
        {!loadingUser && isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route path={"/"}>
        <PrivateRoute component={CampaignList} />
      </Route>
      <Route path={"/dashboard/:id/:vehicle"}>
        <PrivateRoute component={VehicleDashboard} />
      </Route>
      <Route path={"/dashboard/:id"}>
        <PrivateRoute component={Home} />
      </Route>
      <Route path={"/adserver"}>
        <PrivateRoute component={AdServer} />
      </Route>
      <Route path={"/profile"}>
        <PrivateRoute component={Profile} />
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
