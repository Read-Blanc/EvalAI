// AFTER - Refactored Settings.tsx (Lecturer)
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon, User, Bell, Palette,
  Server, CheckCircle2, XCircle, Save, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { gradingApi } from "@/services/gradingApi";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { storage } from "@/lib/storage";
import { createToastHelpers } from "@/lib/toast-utils";
import { fadeInUp } from "@/lib/animations";

interface UserProfile {
  name: string;
  email: string;
  department: string;
  title: string;
  avatar: string;
}

interface Preferences {
  emailNotifications: boolean;
  gradingAlerts: boolean;
  weeklyReports: boolean;
  darkMode: boolean;
  language: string;
  autoSaveInterval: number;
}

interface ApiConfig {
  baseUrl: string;
  timeout: number;
}

const Settings = () => {
  const { toast } = useToast();
  const toasts = createToastHelpers(toast);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: "Dr. Sarah Johnson",
    email: "s.johnson@university.edu",
    department: "Computer Science",
    title: "Associate Professor",
    avatar: ""
  });

  const [preferences, setPreferences] = useState<Preferences>({
    emailNotifications: true,
    gradingAlerts: true,
    weeklyReports: false,
    darkMode: false,
    language: "en",
    autoSaveInterval: 30
  });

  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    baseUrl: storage.get('grading_api_url') || "http://localhost:8000",
    timeout: 30
  });
  
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSaving, setIsSaving] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const savedUrl = storage.get<string>('grading_api_url');
    if (savedUrl) {
      setApiConfig(prev => ({ ...prev, baseUrl: savedUrl }));
      gradingApi.setBaseUrl(savedUrl);
    }

    const savedPreferences = storage.get<Preferences>('user_preferences');
    if (savedPreferences) setPreferences(savedPreferences);

    const savedProfile = storage.get<UserProfile>('user_profile');
    if (savedProfile) setProfile(savedProfile);
  }, []);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus("idle");
    
    try {
      gradingApi.setBaseUrl(apiConfig.baseUrl);
      const isHealthy = await gradingApi.healthCheck();
      
      if (isHealthy) {
        setConnectionStatus("success");
        toasts.success('Connection Successful', 'Successfully connected to the grading API.');
      } else {
        setConnectionStatus("error");
        toasts.error('Connection Failed', 'Could not connect to the grading API. Please check the URL.');
      }
    } catch (error) {
      setConnectionStatus("error");
      toasts.error('Connection Error', 'Failed to connect. Please verify the URL and ensure the server is running.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveApiConfig = async () => {
    setIsSaving(true);
    try {
      storage.set('grading_api_url', apiConfig.baseUrl);
      gradingApi.setBaseUrl(apiConfig.baseUrl);
      toasts.success('API Configuration Saved', 'Your API settings have been saved successfully.');
    } catch (error) {
      toasts.saveFailed();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      storage.set('user_profile', profile);
      toasts.saveSuccess();
    } catch (error) {
      toasts.saveFailed();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      storage.set('user_preferences', preferences);
      toasts.success('Preferences Saved', 'Your preferences have been saved successfully.');
    } catch (error) {
      toasts.saveFailed();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role="lecturer">
      <motion.div {...fadeInUp} className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and academic details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">
                      {profile.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max 2MB.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <LoadingButton
                    onClick={handleSaveProfile}
                    isLoading={isSaving}
                    loadingText="Saving..."
                    icon={Save}
                  >
                    Save Profile
                  </LoadingButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Configuration Tab */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure the connection to your Python grading backend.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-url">Grading API Base URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="api-url"
                        placeholder="http://localhost:8000"
                        value={apiConfig.baseUrl}
                        onChange={(e) => setApiConfig({ ...apiConfig, baseUrl: e.target.value })}
                        className="flex-1"
                      />
                      <LoadingButton
                        variant="outline"
                        onClick={handleTestConnection}
                        isLoading={isTestingConnection}
                        loadingText="Testing..."
                        icon={RefreshCw}
                      >
                        Test
                      </LoadingButton>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The base URL of your Python grading API (e.g., http://localhost:8000)
                    </p>
                  </div>

                  {connectionStatus !== "idle" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        connectionStatus === "success" 
                          ? "bg-green-500/10 text-green-600 dark:text-green-400" 
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {connectionStatus === "success" ? (
                        <>
                          <CheckCircle2 className="h-5 w-5" />
                          <span>Connection successful! API is reachable.</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5" />
                          <span>Connection failed. Please check the URL and server status.</span>
                        </>
                      )}
                    </motion.div>
                  )}

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="timeout">Request Timeout (seconds)</Label>
                    <Select
                      value={apiConfig.timeout.toString()}
                      onValueChange={(value) => 
                        setApiConfig({ ...apiConfig, timeout: parseInt(value) })
                      }
                    >
                      <SelectTrigger id="timeout" className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 seconds</SelectItem>
                        <SelectItem value="30">30 seconds</SelectItem>
                        <SelectItem value="60">60 seconds</SelectItem>
                        <SelectItem value="120">120 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <h4 className="font-medium text-sm">Expected API Endpoints</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li><code className="bg-muted px-1 rounded">POST /api/grade</code> - Grade single answer</li>
                      <li><code className="bg-muted px-1 rounded">POST /api/grade/batch</code> - Batch grading</li>
                      <li><code className="bg-muted px-1 rounded">POST /api/feedback/regenerate</code> - Regenerate feedback</li>
                      <li><code className="bg-muted px-1 rounded">GET /health</code> - Health check</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end">
                  <LoadingButton
                    onClick={handleSaveApiConfig}
                    isLoading={isSaving}
                    loadingText="Saving..."
                    icon={Save}
                  >
                    Save API Settings
                  </LoadingButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs similar to StudentSettings... */}
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default Settings;