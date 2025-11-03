import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function TestConnection() {
  const { register, login } = useAuth();
  const { toast } = useToast();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [testUsername, setTestUsername] = useState('testuser');

  const handleTestRegister = async () => {
    try {
      const success = await register(testUsername, testEmail, testPassword);
      if (success) {
        toast({
          title: '✅ Registro exitoso',
          description: 'Usuario creado en el backend',
        });
      } else {
        toast({
          title: '❌ Error en registro',
          description: 'No se pudo crear el usuario',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Error de conexión',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    }
  };

  const handleTestLogin = async () => {
    try {
      const success = await login(testEmail, testPassword);
      if (success) {
        toast({
          title: '✅ Login exitoso',
          description: 'Autenticación correcta con el backend',
        });
      } else {
        toast({
          title: '❌ Error en login',
          description: 'Credenciales incorrectas',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Error de conexión',
        description: `Error: ${error}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Prueba de Integración Backend-Frontend</CardTitle>
            <CardDescription>
              Prueba la conexión con el backend en Render
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Test Register */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">1. Probar Registro</h3>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={testUsername}
                  onChange={(e) => setTestUsername(e.target.value)}
                  placeholder="testuser"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="password123"
                />
              </div>
              <Button onClick={handleTestRegister} className="w-full">
                Probar Registro
              </Button>
            </div>

            {/* Test Login */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold">2. Probar Login</h3>
              <p className="text-sm text-muted-foreground">
                Usa las mismas credenciales del registro
              </p>
              <Button onClick={handleTestLogin} className="w-full">
                Probar Login
              </Button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">📋 Instrucciones:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Primero haz clic en "Probar Registro"</li>
                <li>Si sale ✅, el usuario se creó en el backend</li>
                <li>Luego haz clic en "Probar Login"</li>
                <li>Si sale ✅, la autenticación funciona</li>
                <li>Revisa la consola del navegador para más detalles</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}