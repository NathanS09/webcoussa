import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated, updateRecord, getCurrentUser } from '../../api';
import { clubConfig } from '../../config/clubConfig';
import { Lock, KeyRound, CheckCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // États de navigation
  const [step, setStep] = useState<'login' | 'new-password'>('login');
  
  // Formulaire Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Formulaire Nouveau Mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Si déjà connecté et pas en train de changer de MDP, on redirige
  React.useEffect(() => {
    if (isAuthenticated() && step === 'login') {
      // Petite vérif de sécurité : si on est déjà auth, est-ce une première co ?
      const user = getCurrentUser();
      if (user?.first_connection) {
        setStep('new-password');
      } else {
        navigate('/admin/dashboard');
      }
    }
  }, [navigate, step]);

  // 1. GESTION DE LA CONNEXION
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const authData = await login(email, password);
      
      // VÉRIFICATION DU FLAG "PREMIÈRE CONNEXION"
      if (authData.record.first_connection) {
        setStep('new-password');
        toast("Bienvenue ! Veuillez définir votre mot de passe personnel.", { icon: '👋' });
      } else {
        navigate('/admin/dashboard');
        toast.success("Connexion réussie");
      }
    } catch (err) {
      console.error(err);
      toast.error('Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Le mot de passe doit faire au moins 8 caractères");
    if (newPassword !== confirmPass) return toast.error("Les mots de passe ne correspondent pas");

    setLoading(true);
    try {
      const user = getCurrentUser();
      if (!user) throw new Error("Utilisateur non trouvé");

      // 1. On met à jour le mot de passe (L'ancien token meurt ici)
      await updateRecord('users', user.id, {
        oldPassword: password,
        password: newPassword,
        passwordConfirm: confirmPass,
        first_connection: false
      });

      // 2. CRUCIAL : On se reconnecte immédiatement avec le NOUVEAU mot de passe
      // Cela permet de récupérer un nouveau token valide sans déconnecter l'utilisateur
      await login(user.email, newPassword);

      toast.success("Mot de passe mis à jour !");
      
      // 3. Maintenant on peut aller au dashboard avec le nouveau token
      navigate('/admin/dashboard');
      
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
};

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <img
          className="mx-auto h-24 w-auto object-contain"
          src={clubConfig.identity.logoUrl}
          alt={clubConfig.identity.name}
        />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-primary">
          Espace Dirigeant
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'login' ? 'Connexion à l\'administration' : 'Première connexion : Sécurisez votre compte'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          
          {/* --- FORMULAIRE 1 : LOGIN CLASSIQUE --- */}
          {step === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? 'Vérification...' : 'Se connecter'} <Lock className="ml-2 h-4 w-4" />
              </button>
            </form>
          )}

          {/* --- FORMULAIRE 2 : NOUVEAU MOT DE PASSE --- */}
          {step === 'new-password' && (
            <form className="space-y-6" onSubmit={handleChangePassword}>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <KeyRound className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Veuillez choisir un mot de passe personnel.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="8 caractères minimum"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm ${
                    confirmPass && newPassword !== confirmPass ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {confirmPass && newPassword === confirmPass && (
                    <p className="text-xs text-green-600 mt-1 flex items-center"><CheckCircle size={12} className="mr-1"/> Correspondance OK</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer mon mot de passe'} <Save className="ml-2 h-4 w-4" />
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
