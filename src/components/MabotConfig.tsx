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
        Configuración de Mabot
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
                Configuración de Mabot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="baseUrl">URL Base</Label>
                <Input
                  id="baseUrl"
                  type="url"
                  placeholder="https://tu-servicio-mabot.com"
                  value={config.baseUrl}
                  onChange={(e) => setConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Tu nombre de usuario"
                  value={config.username}
                  onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contraseña"
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
                  Guardar
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                <p>Estos valores se almacenarán en el localStorage de tu navegador.</p>
                <p>Las variables de entorno tienen prioridad sobre los valores del localStorage.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}; 