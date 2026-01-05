import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Music } from 'lucide-react';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // First, authenticate with Jellyfin to validate credentials
      // Then the login function will create a user in Supabase if they don't exist
      await login(username, password);

      // If email was provided, we could update it in the database here
      // For now, login already creates the user with a placeholder email

      navigate('/');
    } catch (err) {
      setError('Error al registrarse. Verifica que tu cuenta de Jellyfin existe y las credenciales son correctas.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-white/20 p-4 rounded-full mb-4">
            <Music className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Crear Cuenta</h1>
          <p className="text-purple-200 text-center">Regístrate con tus credenciales de Jellyfin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
              Usuario de Jellyfin
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              placeholder="Tu usuario de Jellyfin"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              placeholder="Tu contraseña de Jellyfin"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
              Email (opcional)
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              placeholder="tu@email.com"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-purple-200">
              Se usará para las notificaciones de suscripción
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-purple-200 text-sm">
            ¿Ya tienes una cuenta?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-white font-semibold hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>

        <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <p className="text-blue-100 text-xs text-center">
            <strong>Nota:</strong> Necesitas una cuenta activa en el servidor Jellyfin (jelly.muusica.com) para registrarte.
          </p>
        </div>
      </div>
    </div>
  );
};
