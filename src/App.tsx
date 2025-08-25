import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import YouTubeCreator from "@/pages/youtube-creator";
import KeywordAnalysis from "@/pages/keyword-analysis";
import ContentPlanner from "@/pages/content-planner";
import AppIdeas from "@/pages/app-ideas";
import AIChatbot from "@/pages/ai-chatbot";
import LearningPlatform from "@/pages/learning-platform";
import Community from "@/pages/community";
import InvoiceSystem from "@/pages/invoice-system";
import PersonalizationEngine from "@/pages/personalization";
import VoiceControl from "@/pages/voice-control";
import SubscriptionPlans from "@/pages/subscription-plans";
import Billing from "@/pages/billing";
import Analytics from "@/pages/analytics";
import Notifications from "@/pages/notifications";
import DashboardAdvanced from "@/pages/dashboard-advanced";
import TrendAnalysis from "@/pages/trend-analysis";
import SecurityCenter from "@/pages/security-center";
import SystemStatus from "@/pages/system-status";
import GeneralAILab from "@/pages/general-ai-lab";
import AIPlatformHub from "@/pages/ai-platform-hub";
import SystemMonitoring from "@/pages/system-monitoring";
import AITestingCenter from "@/pages/ai-testing-center";
import AIEcosystem from "@/pages/ai-ecosystem";
import MultimediaStudio from "@/pages/multimedia-studio";
import BusinessIntelligence from "@/pages/business-intelligence";
import Demo from "@/pages/demo";
import UtilitiesHub from "@/pages/utilities-hub";
import TikTokCreator from "@/pages/tiktok-creator";
import ShopeeMonitor from "@/pages/shopee-monitor";
import AIAssistant from "@/pages/ai-assistant";
import AIPlatformIntegration from "@/pages/ai-platform-integration";
import ProfileSettings from "@/pages/profile-settings";
import CalendarContacts from "@/pages/calendar-contacts";
import MusicEntertainment from "@/pages/music-entertainment";
import PronunciationGuide from "@/pages/pronunciation-guide";
import VoiceControlAdvanced from "@/pages/voice-control-advanced";
import AIMemoryHub from "@/pages/ai-memory-hub";
import APIIntegrationDashboard from "@/pages/api-integration-dashboard";
import AnalyticsDashboard from "@/pages/analytics-dashboard";
import ContentAutomation from "@/pages/content-automation";
import VoiceControlEnhanced from "@/pages/voice-control-enhanced";
import EcommerceHub from "@/pages/ecommerce-hub";
import AIPlatformIntegrationHub from "@/pages/ai-platform-integration-hub";
import AICodeAssistant from "@/pages/ai-code-assistant";
import SmartDocumentProcessing from "@/pages/smart-document-processing";
import VideoImageAIStudio from "@/pages/video-image-ai-studio";
import BusinessIntelligenceCRM from "@/pages/business-intelligence-crm";
import LandingPage from "@/pages/LandingPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/app" component={UtilitiesHub} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/api-integration" component={APIIntegrationDashboard} />
      <Route path="/youtube" component={YouTubeCreator} />
      <Route path="/tiktok" component={TikTokCreator} />
      <Route path="/shopee" component={ShopeeMonitor} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/ai-platform-integration" component={AIPlatformIntegration} />
      <Route path="/profile-settings" component={ProfileSettings} />
      <Route path="/calendar-contacts" component={CalendarContacts} />
      <Route path="/music-entertainment" component={MusicEntertainment} />
      <Route path="/pronunciation-guide" component={PronunciationGuide} />
      <Route path="/voice-control-advanced" component={VoiceControlAdvanced} />
      <Route path="/ai-memory-hub" component={AIMemoryHub} />
      <Route path="/keywords" component={KeywordAnalysis} />
      <Route path="/planner" component={ContentPlanner} />
      <Route path="/app-ideas" component={AppIdeas} />
      <Route path="/chat" component={AIChatbot} />
      <Route path="/learn" component={LearningPlatform} />
      <Route path="/community" component={Community} />
      <Route path="/invoices" component={InvoiceSystem} />
      <Route path="/personalization" component={PersonalizationEngine} />
      <Route path="/voice-control" component={VoiceControl} />
      <Route path="/pricing" component={SubscriptionPlans} />
      <Route path="/billing" component={Billing} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/analytics-dashboard" component={AnalyticsDashboard} />
      <Route path="/content-automation" component={ContentAutomation} />
      <Route path="/voice-control-enhanced" component={VoiceControlEnhanced} />
      <Route path="/ecommerce-hub" component={EcommerceHub} />
      <Route path="/ai-platform-integration-hub" component={AIPlatformIntegrationHub} />
      <Route path="/ai-code-assistant" component={AICodeAssistant} />
      <Route path="/smart-document-processing" component={SmartDocumentProcessing} />
      <Route path="/video-image-ai-studio" component={VideoImageAIStudio} />
      <Route path="/business-intelligence-crm" component={BusinessIntelligenceCRM} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/dashboard-advanced" component={DashboardAdvanced} />
      <Route path="/trend-analysis" component={TrendAnalysis} />
      <Route path="/security-center" component={SecurityCenter} />
      <Route path="/system-status" component={SystemStatus} />
      <Route path="/general-ai-lab" component={GeneralAILab} />
      <Route path="/ai-platform-hub" component={AIPlatformHub} />
      <Route path="/system-monitoring" component={SystemMonitoring} />
      <Route path="/ai-testing-center" component={AITestingCenter} />
      <Route path="/ai-ecosystem" component={AIEcosystem} />
      <Route path="/multimedia-studio" component={MultimediaStudio} />
      <Route path="/business-intelligence" component={BusinessIntelligence} />
      <Route path="/demo" component={Demo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
