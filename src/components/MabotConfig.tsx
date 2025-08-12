import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getMabotConfig, setMabotConfig, isMabotConfigured } from "@/lib/config";
import { Settings, Save, Eye, EyeOff } from "lucide-react";

export const MabotConfig = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [config, setConfig] = useState({
    baseUrl: "",
    username: "",
    password: ""
  });

  useEffect(() => {
    if (isOpen) {
      const currentConfig = getMabotConfig();
      setConfig(currentConfig);
    }
  }, [isOpen]);

  const handleSave = () => {
    setMabotConfig(config);
    setIsOpen(false);
    // Force page reload to pick up new config
    window.location.reload();
  };

  const handleCancel = () => {
    const currentConfig = getMabotConfig();
    setConfig(currentConfig);
    setIsOpen(false);
  };

  const isConfigured = isMabotConfigured();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Settings className="h-4 w-4" />
        Mabot Config
        {isConfigured && (
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Mabot Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">Base URL</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="https://your-mabot-service.com"
                  value={config.baseUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Your username"
                  value={config.username}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={config.password}
                    onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancel
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>These values will be stored in your browser's localStorage.</p>
                <p>Environment variables take precedence over localStorage values.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}; 