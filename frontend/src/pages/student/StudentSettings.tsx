// AFTER - Refactored StudentSettings.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, User, Bell, Palette, Save, GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { storage } from "@/lib/storage";
import { createToastHelpers } from "@/lib/toast-utils";
import { fadeInUp } from "@/lib/animations";

interface StudentProfile {
  name: string;
  email: string;
  studentId: string;
  program: string;
  year: string;
  avatar: string;
}

interface StudentPreferences {
  emailNotifications: boolean;
  gradeAlerts: boolean;
  deadlineReminders: boolean;
  studyTips: boolean;
  darkMode: boolean;
  language: string;
  timezone: string;
}

const StudentSettings = () => {
  const { toast } = useToast();
  const toasts = createToastHelpers(toast);
  
  const [profile, setProfile] = useState<StudentProfile>({
    name: "Alex Chen",
    email: "alex.chen@student.edu",
    studentId: "STU-2024-001",
    program: "Computer Science",
    year: "3rd Year",
    avatar: ""
  });

  const [preferences, setPreferences] = useState<StudentPreferences>({
    emailNotifications: true,
    gradeAlerts: true,
    deadlineReminders: true,
    studyTips: false,
    darkMode: false,
    language: "en",
    timezone: "UTC"
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load saved data on mount using storage utility
  useEffect(() => {
    const savedPreferences = storage.get<StudentPreferences>('student_preferences');
    if (savedPreferences) setPreferences(savedPreferences);

    const savedProfile = storage.get<StudentProfile>('student_profile');
    if (savedProfile) setProfile(savedProfile);
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      storage.set('student_profile', profile);
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
      storage.set('student_preferences', preferences);
      toasts.success('Preferences Saved', 'Your preferences have been saved successfully.');
    } catch (error) {
      toasts.saveFailed();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout role="student">
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
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
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
                    <LoadingButton variant="outline" size="sm" isLoading={false}>
                      Change Avatar
                    </LoadingButton>
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
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={profile.studentId}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program">Program</Label>
                    <Input
                      id="program"
                      value={profile.program}
                      onChange={(e) => setProfile({ ...profile, program: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select
                      value={profile.year}
                      onValueChange={(value) => setProfile({ ...profile, year: value })}
                    >
                      <SelectTrigger id="year">
                        <SelectValue placeholder="Select year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st Year">1st Year</SelectItem>
                        <SelectItem value="2nd Year">2nd Year</SelectItem>
                        <SelectItem value="3rd Year">3rd Year</SelectItem>
                        <SelectItem value="4th Year">4th Year</SelectItem>
                        <SelectItem value="Graduate">Graduate</SelectItem>
                      </SelectContent>
                    </Select>
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

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your learning experience and display settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable dark theme for the interface
                      </p>
                    </div>
                    <Switch
                      checked={preferences.darkMode}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, darkMode: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => 
                        setPreferences({ ...preferences, language: value })
                      }
                    >
                      <SelectTrigger id="language" className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => 
                        setPreferences({ ...preferences, timezone: value })
                      }
                    >
                      <SelectTrigger id="timezone" className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="EST">Eastern (EST)</SelectItem>
                        <SelectItem value="PST">Pacific (PST)</SelectItem>
                        <SelectItem value="GMT">GMT</SelectItem>
                        <SelectItem value="CET">Central European (CET)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <LoadingButton
                    onClick={handleSavePreferences}
                    isLoading={isSaving}
                    loadingText="Saving..."
                    icon={Save}
                  >
                    Save Preferences
                  </LoadingButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Choose how and when you want to be notified.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your assessments
                      </p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, emailNotifications: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Grade Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified when your grades are available
                      </p>
                    </div>
                    <Switch
                      checked={preferences.gradeAlerts}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, gradeAlerts: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Deadline Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive reminders before assessment deadlines
                      </p>
                    </div>
                    <Switch
                      checked={preferences.deadlineReminders}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, deadlineReminders: checked })
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Study Tips</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive personalized study recommendations
                      </p>
                    </div>
                    <Switch
                      checked={preferences.studyTips}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, studyTips: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <LoadingButton
                    onClick={handleSavePreferences}
                    isLoading={isSaving}
                    loadingText="Saving..."
                    icon={Save}
                  >
                    Save Notifications
                  </LoadingButton>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default StudentSettings;
