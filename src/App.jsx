import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Calendar, MapPin, Phone, Mail, Clock, 
  ChevronRight, ChevronDown, Star, User, Heart, Activity, 
  Baby, CheckCircle, Search, FileText, Moon, Sun, 
  MessageCircle, ArrowRight, ShieldCheck, CreditCard,
  Lock, Save, Edit3, Image as ImageIcon, Layout, Instagram
} from 'lucide-react';
import { supabase, BUCKET_NAME, ContentManager } from './supabaseClient';
import { ProtectedRoute } from './ProtectedRoute';
import Login from './Login';
import Admin from './Admin';

// --- Gestionnaire des images avec Supabase Storage ---
const ImageManager = {
  // Sauvegarder une image dans Supabase Storage
  async saveImage(key, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}.${fileExt}`;
      const filePath = fileName;

      // Uploader l'image vers Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Remplacer si existe déjà
        });

      if (error) throw error;

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      console.log(`Image ${key} sauvegardée: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'image:', error);
      throw error;
    }
  }
};

// --- Données Statiques (Services, Symptômes etc.) ---

const SERVICES = [
  { id: 'baby', title: 'Nourrissons', icon: Baby, desc: 'Troubles digestifs, sommeil, plagiocéphalie.' },
  { id: 'child', title: 'Enfants & Ados', icon: User, desc: 'Croissance, posture, orthodontie, sport.' },
  { id: 'adult', title: 'Adultes', icon: User, desc: 'Douleurs de dos, stress, migraines, troubles digestifs.' },
  { id: 'pregnant', title: 'Femmes Enceintes', icon: Heart, desc: 'Préparation accouchement, douleurs bassin et du dos.' },
  { id: 'senior', title: 'Seniors', icon: Activity, desc: 'Mobilité, arthrose, confort de vie.' },
  { id: 'sport', title: 'Sportifs', icon: Activity, desc: 'Préparation, récupération, blessures.' },
];

const DEFAULT_SYMPTOMS = [
  "Lombalgies", "Sciatiques", "Cervicalgies", "Migraines", "Dorsalgies", 
  "Tendinites", "Entorses", "Troubles de la mâchoire (ATM)", "Reflux (RGO)", 
  "Constipation", "Stress", "Fatigue chronique", "Sinusites", "Otites", "Vertiges"
];

const REVIEWS = [
  { id: 1, name: "Sophie M.", text: "Une approche très douce qui a réglé mes maux de dos en deux séances. Je recommande vivement !", rating: 5 },
  { id: 2, name: "Marc D.", text: "Excellent ostéopathe pour les sportifs. Il a tout de suite compris ma blessure.", rating: 5 },
  { id: 3, name: "Julie L.", text: "Très pédagogue, il prend le temps d'expliquer. Mon bébé dort beaucoup mieux depuis.", rating: 5 },
];

// --- Composant AdminView Séparé ---
const AdminViewComponent = ({
  isAdminAuthenticated,
  activeAdminSection,
  setActiveAdminSection,
  content,
  setContent,
  symptoms,
  setSymptoms,
  expandedSymptom,
  setExpandedSymptom,
  newSymptomInput,
  setNewSymptomInput,
  newPricingItem,
  setNewPricingItem,
  expandedFaq,
  setExpandedFaq,
  newFaqQuestion,
  setNewFaqQuestion,
  newParcoursItem,
  setNewParcoursItem,
  setIsAdminAuthenticated,
  Card,
  Button
}) => {
  const [passwordInput, setPasswordInput] = useState("");
  const [localContent, setLocalContent] = useState(content);
  const [newBlogPost, setNewBlogPost] = useState({ title: "", tag: "", image: "", excerpt: "", link: "" });

  // Synchroniser localContent avec content au chargement initial
  useEffect(() => {
    setLocalContent(content);
  }, []); // Seulement au montage

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "admin123") {
      setIsAdminAuthenticated(true);
    } else {
      alert("Mot de passe incorrect");
    }
  };

  const handleLogout = () => {
    setIsAdminAuthenticated(false);
  };

  const handleSave = async () => {
    try {
      // Sauvegarder dans Supabase
      await ContentManager.saveContent(localContent);
      
      // Mettre à jour l'état local
      setContent(localContent);
      
      alert("Modifications enregistrées avec succès dans Supabase !");
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert("Erreur lors de la sauvegarde. Vérifiez la console.");
    }
  };

  const handleChange = (key, value) => {
    setLocalContent(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = async (key, file) => {
    try {
      // Uploader l'image vers Supabase Storage
      const publicUrl = await ImageManager.saveImage(key, file);
      
      // Mettre à jour le contenu avec l'URL publique
      const updatedContent = { ...localContent, [key]: publicUrl };
      setLocalContent(updatedContent);
      setContent(updatedContent);
      
      // Sauvegarder automatiquement dans Supabase
      await ContentManager.saveContent(updatedContent);
      
      console.log(`Image ${key} téléchargée et sauvegardée: ${publicUrl}`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      alert('Erreur lors du téléchargement de l\'image');
    }
  };

  const handleBlogImageUpload = (index, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      handleBlogPostChange(index, 'image', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleNewBlogImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewBlogPost(prev => ({ ...prev, image: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleBlogPostChange = (index, key, value) => {
    setLocalContent(prev => {
      const posts = prev.blogPosts ? [...prev.blogPosts] : [];
      posts[index] = { ...posts[index], [key]: value };
      return { ...prev, blogPosts: posts };
    });
  };

  const handleAddBlogPost = () => {
    if (!newBlogPost.title.trim()) {
      alert('Le titre est requis');
      return;
    }
    setLocalContent(prev => {
      const posts = prev.blogPosts ? [...prev.blogPosts] : [];
      posts.push({ ...newBlogPost });
      return { ...prev, blogPosts: posts };
    });
    setNewBlogPost({ title: "", tag: "", image: "", excerpt: "", link: "" });
  };

  const handleRemoveBlogPost = (index) => {
    setLocalContent(prev => {
      const posts = prev.blogPosts ? [...prev.blogPosts] : [];
      posts.splice(index, 1);
      return { ...prev, blogPosts: posts };
    });
  };

  const ImageUploadField = ({ label, imageKey, width = 'w-20', height = 'h-12', rounded = 'rounded' }) => (
    <div>
      <label className="block text-sm font-medium mb-2 dark:text-slate-300">{label}</label>
      <div className="flex gap-4 items-center">
        <div className={`${width} ${height} bg-slate-100 dark:bg-slate-700 ${rounded} overflow-hidden flex-shrink-0`}>
          <img src={localContent[imageKey]} alt="Preview" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-teal-300 dark:border-teal-600 rounded-lg cursor-pointer hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors">
            <div className="flex flex-col items-center gap-1">
              <ImageIcon size={20} className="text-teal-600 dark:text-teal-400" />
              <span className="text-sm text-teal-600 dark:text-teal-400 font-medium">Cliquez pour ajouter</span>
            </div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageUpload(imageKey, e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4">
        <Card className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-teal-100 p-4 rounded-full">
              <Lock className="text-teal-600 w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Espace Administrateur</h2>
          <p className="text-slate-500 mb-6">Connectez-vous pour modifier le contenu du site.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Mot de passe" 
              className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <Button type="submit" className="w-full">Se connecter</Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 px-4 min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Edit3 className="text-teal-500"/> Tableau de bord Admin
          </h1>
          <div className="flex gap-4">
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save size={20} /> Enregistrer les changements
            </Button>
            <Button onClick={handleLogout} variant="danger">
              Déconnexion
            </Button>
          </div>
        </div>

        <div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Admin */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
            <button 
              type="button"
              onClick={() => setActiveAdminSection('general')}
              className={`w-full text-left p-4 rounded-xl font-medium transition-colors ${activeAdminSection === 'general' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            >
              Général & Textes
            </button>
            <button 
              type="button"
              onClick={() => setActiveAdminSection('contact')}
              className={`w-full text-left p-4 rounded-xl font-medium transition-colors ${activeAdminSection === 'contact' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            >
              Coordonnées
            </button>
            <button 
              type="button"
              onClick={() => setActiveAdminSection('images')}
              className={`w-full text-left p-4 rounded-xl font-medium transition-colors ${activeAdminSection === 'images' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            >
              Médiathèque
            </button>
            <button 
              type="button"
              onClick={() => setActiveAdminSection('blog')}
              className={`w-full text-left p-4 rounded-xl font-medium transition-colors ${activeAdminSection === 'blog' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            >
              Blog
            </button>
            <button 
              type="button"
              onClick={() => setActiveAdminSection('symptoms')}
              className={`w-full text-left p-4 rounded-xl font-medium transition-colors ${activeAdminSection === 'symptoms' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            >
              Symptômes
            </button>
            <button 
              type="button"
              onClick={() => setActiveAdminSection('faq')}
              className={`w-full text-left p-4 rounded-xl font-medium transition-colors ${activeAdminSection === 'faq' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            >
              FAQ
            </button>
            <button 
              type="button"
              onClick={() => setActiveAdminSection('pricing')}
              className={`w-full text-left p-4 rounded-xl font-medium transition-colors ${activeAdminSection === 'pricing' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            >
              Tarifs & Durées
            </button>
            <button 
              type="button"
              onClick={() => setActiveAdminSection('parcours')}
              className={`w-full text-left p-4 rounded-xl font-medium transition-colors ${activeAdminSection === 'parcours' ? 'bg-teal-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'}`}
            >
              Mon Parcours
            </button>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Card>
              {activeAdminSection === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Layout size={20}/> Identité du Site</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nom du Cabinet</label>
                      <input type="text" value={localContent.siteName} onChange={(e) => handleChange('siteName', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nom du Praticien</label>
                      <input type="text" value={localContent.practitionerName} onChange={(e) => handleChange('practitionerName', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Titre Principal (Hero)</label>
                    <input type="text" value={localContent.heroTitle} onChange={(e) => handleChange('heroTitle', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Sous-titre (Hero)</label>
                    <textarea value={localContent.heroSubtitle} onChange={(e) => handleChange('heroSubtitle', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white h-20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Note d'avis (ex: 4.9/5 (120 avis))</label>
                    <input type="text" value={localContent.testimonialRating} onChange={(e) => handleChange('testimonialRating', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Message d'actualité (vide = masqué)</label>
                    <input type="text" value={localContent.newsMessage} onChange={(e) => handleChange('newsMessage', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Ex: 🎉 Nouveaux créneaux disponibles pour les urgences!" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">⚠️ N'oubliez pas de cliquer sur "Enregistrer les changements" pour afficher la bannière sur le site</p>
                  </div>
                  <div>
                     <label className="block text-sm font-medium mb-1 dark:text-slate-300">Texte "À Propos" (Paragraphe 1)</label>
                     <textarea value={localContent.aboutText1} onChange={(e) => handleChange('aboutText1', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white h-32" />
                  </div>
                </div>
              )}

              {activeAdminSection === 'contact' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Phone size={20}/> Contact & Liens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Téléphone</label>
                      <input type="text" value={localContent.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Email</label>
                      <input type="email" value={localContent.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Adresse Complète</label>
                      <input type="text" value={localContent.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Lien Doctolib</label>
                      <input type="text" value={localContent.doctolibLink} onChange={(e) => handleChange('doctolibLink', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-1 dark:text-slate-300">Instagram (@handle sans @)</label>
                      <input type="text" value={localContent.instagramHandle} onChange={(e) => handleChange('instagramHandle', e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
                    </div>
                  </div>
                </div>
              )}

              {activeAdminSection === 'images' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><ImageIcon size={20}/> Gestion des Images</h3>
                  <ImageUploadField label="Logo du Cabinet" imageKey="logoImage" width="w-12" height="h-12" rounded="rounded" />
                  <ImageUploadField label="Image d'accueil (Hero)" imageKey="heroImage" width="w-20" height="h-12" rounded="rounded" />
                  <ImageUploadField label="Photo de Profil" imageKey="profileImage" width="w-12" height="h-12" rounded="rounded-full" />
                  <ImageUploadField label="Photo du Cabinet" imageKey="cabinetImage" width="w-20" height="h-12" rounded="rounded" />
                </div>
              )}

              {activeAdminSection === 'blog' && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText size={20}/> Gestion du Blog</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Ajoutez, éditez ou supprimez les articles affichés sur la page Blog.</p>

                  <div className="space-y-4">
                    {localContent.blogPosts && localContent.blogPosts.length > 0 ? (
                      localContent.blogPosts.map((post, index) => (
                        <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-800">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Article {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBlogPost(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Titre</label>
                              <input
                                type="text"
                                value={post.title}
                                onChange={(e) => handleBlogPostChange(index, 'title', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tag / Catégorie</label>
                              <input
                                type="text"
                                value={post.tag}
                                onChange={(e) => handleBlogPostChange(index, 'tag', e.target.value)}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium dark:text-slate-300">Image</label>
                            <input
                              type="text"
                              value={post.image}
                              onChange={(e) => handleBlogPostChange(index, 'image', e.target.value)}
                              className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              placeholder="URL (optionnel si vous chargez un fichier)"
                            />
                            <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-teal-300 dark:border-teal-600 rounded-lg cursor-pointer hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors text-sm text-teal-700 dark:text-teal-300">
                              Importer une image
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) handleBlogImageUpload(index, e.target.files[0]);
                                }}
                              />
                            </label>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Extrait</label>
                            <textarea
                              value={post.excerpt}
                              onChange={(e) => handleBlogPostChange(index, 'excerpt', e.target.value)}
                              className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white h-24"
                              placeholder="Résumé court de l'article"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Lien externe</label>
                            <input
                              type="text"
                              value={post.link || ''}
                              onChange={(e) => handleBlogPostChange(index, 'link', e.target.value)}
                              className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              placeholder="https://votre-lien.com"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Aucun article pour le moment.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 space-y-3">
                    <h4 className="font-semibold text-slate-800 dark:text-white">Ajouter un article</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Titre"
                        value={newBlogPost.title}
                        onChange={(e) => setNewBlogPost(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Tag / Catégorie"
                        value={newBlogPost.tag}
                        onChange={(e) => setNewBlogPost(prev => ({ ...prev, tag: e.target.value }))}
                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Image (URL)"
                      value={newBlogPost.image}
                      onChange={(e) => setNewBlogPost(prev => ({ ...prev, image: e.target.value }))}
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-teal-300 dark:border-teal-700 rounded-lg cursor-pointer hover:bg-teal-50 dark:hover:bg-slate-700 transition-colors text-sm text-teal-700 dark:text-teal-300">
                      Importer une image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) handleNewBlogImageUpload(e.target.files[0]);
                        }}
                      />
                    </label>
                    <textarea
                      placeholder="Extrait"
                      value={newBlogPost.excerpt}
                      onChange={(e) => setNewBlogPost(prev => ({ ...prev, excerpt: e.target.value }))}
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white h-20"
                    />
                    <input
                      type="text"
                      placeholder="Lien externe"
                      value={newBlogPost.link}
                      onChange={(e) => setNewBlogPost(prev => ({ ...prev, link: e.target.value }))}
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <Button onClick={handleAddBlogPost} className="w-full">Ajouter l'article</Button>
                  </div>
                </div>
              )}

              {activeAdminSection === 'symptoms' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><FileText size={20}/> Gestion des Symptômes</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Cliquez sur chaque symptôme pour ajouter ou modifier les notes. Vous pouvez aussi ajouter ou supprimer des symptômes.</p>
                  
                  {/* Ajouter un nouveau symptôme */}
                  <div className="mb-6 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-700">
                    <label className="block text-sm font-medium mb-2 dark:text-slate-300">Ajouter un nouveau symptôme</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Nom du symptôme..."
                        value={newSymptomInput}
                        onChange={(e) => setNewSymptomInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newSymptomInput.trim()) {
                            const newSymptom = newSymptomInput.trim();
                            if (!symptoms.includes(newSymptom)) {
                              setSymptoms([...symptoms, newSymptom]);
                              handleChange('symptomNotes', { ...localContent.symptomNotes, [newSymptom]: '' });
                              setNewSymptomInput('');
                            } else {
                              alert('Ce symptôme existe déjà.');
                            }
                          }
                        }}
                        className="flex-1 p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                      <Button 
                        onClick={() => {
                          const newSymptom = newSymptomInput.trim();
                          if (newSymptom && !symptoms.includes(newSymptom)) {
                            setSymptoms([...symptoms, newSymptom]);
                            handleChange('symptomNotes', { ...localContent.symptomNotes, [newSymptom]: '' });
                            setNewSymptomInput('');
                          } else if (symptoms.includes(newSymptom)) {
                            alert('Ce symptôme existe déjà.');
                          }
                        }}
                        className="py-2 px-4"
                      >
                        Ajouter
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {symptoms.map((symptom) => (
                      <div key={symptom} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                        <button 
                          type="button"
                          onClick={() => setExpandedSymptom(expandedSymptom === symptom ? null : symptom)}
                          className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="font-medium text-slate-800 dark:text-slate-200">{symptom}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-teal-600 dark:text-teal-400">
                              {expandedSymptom === symptom ? '−' : '+'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${symptom}" ?`)) {
                                  setSymptoms(symptoms.filter(s => s !== symptom));
                                  const newNotes = { ...localContent.symptomNotes };
                                  delete newNotes[symptom];
                                  handleChange('symptomNotes', newNotes);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-2 rounded transition-colors"
                              title="Supprimer ce symptôme"
                            >
                              <X size={16}/>
                            </button>
                          </div>
                        </button>
                        
                        {expandedSymptom === symptom && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                            <textarea 
                              placeholder={`Notes pour ${symptom}...`}
                              value={localContent.symptomNotes[symptom] || ''}
                              onChange={(e) => handleChange('symptomNotes', { ...localContent.symptomNotes, [symptom]: e.target.value })}
                              className="w-full p-3 rounded-lg border border-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none"
                              rows="4"
                            />
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Ajoutez des notes ou des détails pour ce symptôme.</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeAdminSection === 'reviews' && (
                <div>Test</div>
              )}

              {activeAdminSection === 'pricing' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><CreditCard size={20}/> Gestion des Tarifs & Durées</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Gérez les types de consultation, les tarifs et les durées.</p>
                  
                  <div className="space-y-3">
                    {(localContent.pricing || []).length > 0 ? (
                      (localContent.pricing || []).map((item, index) => (
                        <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 space-y-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Type {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer ce type de consultation ?')) {
                                  setLocalContent(prev => ({
                                    ...prev,
                                    pricing: prev.pricing.filter((_, i) => i !== index)
                                  }));
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Nom de la consultation</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const updated = [...localContent.pricing];
                                updated[index].name = e.target.value;
                                setLocalContent(prev => ({ ...prev, pricing: updated }));
                              }}
                              className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tarif (€)</label>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const updated = [...localContent.pricing];
                                  updated[index].price = e.target.value;
                                  setLocalContent(prev => ({ ...prev, pricing: updated }));
                                }}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Durée (ex: 45-60)</label>
                              <input
                                type="text"
                                value={item.duration}
                                onChange={(e) => {
                                  const updated = [...localContent.pricing];
                                  updated[index].duration = e.target.value;
                                  setLocalContent(prev => ({ ...prev, pricing: updated }));
                                }}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="45-60"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Description</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => {
                                const updated = [...localContent.pricing];
                                updated[index].description = e.target.value;
                                setLocalContent(prev => ({ ...prev, pricing: updated }));
                              }}
                              className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              placeholder="Durée : 45 min - 1h"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Aucun type de consultation configuré.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 space-y-3 mt-6">
                    <h4 className="font-semibold text-slate-800 dark:text-white">Ajouter une consultation</h4>
                    <input
                      type="text"
                      placeholder="Nom de la consultation"
                      value={newPricingItem.name}
                      onChange={(e) => setNewPricingItem(prev => ({ ...prev, name: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Tarif (€)"
                        value={newPricingItem.price}
                        onChange={(e) => setNewPricingItem(prev => ({ ...prev, price: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Durée (45-60)"
                        value={newPricingItem.duration}
                        onChange={(e) => setNewPricingItem(prev => ({ ...prev, duration: e.target.value }))}
                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Description"
                      value={newPricingItem.description}
                      onChange={(e) => setNewPricingItem(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        if (!newPricingItem.name.trim() || !newPricingItem.price.trim()) {
                          alert('Nom et tarif sont requis');
                          return;
                        }
                        const updatedContent = {
                          ...localContent,
                          pricing: [...(localContent.pricing || []), { ...newPricingItem }]
                        };
                        setLocalContent(updatedContent);
                        setContent(updatedContent);
                        // Sauvegarder immédiatement
                        const contentWithoutImages = { ...updatedContent };
                        delete contentWithoutImages.logoImage;
                        delete contentWithoutImages.heroImage;
                        delete contentWithoutImages.profileImage;
                        delete contentWithoutImages.cabinetImage;
                        localStorage.setItem('osteoSiteContent', JSON.stringify(contentWithoutImages));
                        setNewPricingItem({ name: "", price: "", duration: "", description: "" });
                      }}
                      className="w-full"
                    >
                      Ajouter cette consultation
                    </Button>
                  </div>
                </div>
              )}

              {activeAdminSection === 'parcours' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar size={20}/> Gestion du Parcours</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Gérez les étapes de votre parcours professionnel affichées sur la page "À Propos".</p>
                  
                  <div className="space-y-3">
                    {(localContent.parcours || []).length > 0 ? (
                      (localContent.parcours || []).map((item, index) => (
                        <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 space-y-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">Étape {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) {
                                  setLocalContent(prev => ({
                                    ...prev,
                                    parcours: prev.parcours.filter((_, i) => i !== index)
                                  }));
                                }
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-3">
                            <div>
                              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Année</label>
                              <input
                                type="text"
                                value={item.year}
                                onChange={(e) => {
                                  const updated = [...localContent.parcours];
                                  updated[index].year = e.target.value;
                                  setLocalContent(prev => ({ ...prev, parcours: updated }));
                                }}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                placeholder="2025"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="block text-sm font-medium mb-1 dark:text-slate-300">Titre</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const updated = [...localContent.parcours];
                                  updated[index].title = e.target.value;
                                  setLocalContent(prev => ({ ...prev, parcours: updated }));
                                }}
                                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Description</label>
                            <textarea
                              value={item.desc}
                              onChange={(e) => {
                                const updated = [...localContent.parcours];
                                updated[index].desc = e.target.value;
                                setLocalContent(prev => ({ ...prev, parcours: updated }));
                              }}
                              className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none"
                              rows="2"
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Aucune étape de parcours configurée.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 space-y-3 mt-6">
                    <h4 className="font-semibold text-slate-800 dark:text-white">Ajouter une étape</h4>
                    <div className="grid grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Année (2025)"
                        value={newParcoursItem.year}
                        onChange={(e) => setNewParcoursItem(prev => ({ ...prev, year: e.target.value }))}
                        className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Titre de l'étape"
                        value={newParcoursItem.title}
                        onChange={(e) => setNewParcoursItem(prev => ({ ...prev, title: e.target.value }))}
                        className="col-span-3 w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                    <textarea
                      placeholder="Description"
                      value={newParcoursItem.desc}
                      onChange={(e) => setNewParcoursItem(prev => ({ ...prev, desc: e.target.value }))}
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none"
                      rows="2"
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        if (!newParcoursItem.year.trim() || !newParcoursItem.title.trim()) {
                          alert('Année et titre sont requis');
                          return;
                        }
                        const updatedContent = {
                          ...localContent,
                          parcours: [...(localContent.parcours || []), { ...newParcoursItem }]
                        };
                        setLocalContent(updatedContent);
                        setContent(updatedContent);
                        // Sauvegarder immédiatement
                        const contentWithoutImages = { ...updatedContent };
                        delete contentWithoutImages.logoImage;
                        delete contentWithoutImages.heroImage;
                        delete contentWithoutImages.profileImage;
                        delete contentWithoutImages.cabinetImage;
                        localStorage.setItem('osteoSiteContent', JSON.stringify(contentWithoutImages));
                        setNewParcoursItem({ year: "", title: "", desc: "" });
                      }}
                      className="w-full"
                    >
                      Ajouter cette étape
                    </Button>
                  </div>
                </div>
              )}

              {activeAdminSection === 'faq' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><MessageCircle size={20}/> Gestion des FAQ</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Gérez les questions et réponses affichées sur la page FAQ.</p>
                  
                  <div className="space-y-2">
                    {localContent.faqs && localContent.faqs.length > 0 ? (
                      localContent.faqs.map((faq, index) => (
                        <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                          <button 
                            type="button"
                            onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-left">{faq.question}</span>
                            <div className="flex items-center gap-3">
                              <span className={`text-teal-600 dark:text-teal-400 transition-transform ${expandedFaq === index ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
                                    setLocalContent(prev => ({
                                      ...prev,
                                      faqs: prev.faqs.filter((_, i) => i !== index)
                                    }));
                                    setLocalContent(prev => ({
                                      ...prev,
                                      faqs: prev.faqs.filter((_, i) => i !== index)
                                    }));
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 text-sm"
                              >
                                Supprimer
                              </button>
                            </div>
                          </button>
                          
                          {expandedFaq === index && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 space-y-3">
                              <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Question</label>
                                <input
                                  type="text"
                                  value={faq.question}
                                  onChange={(e) => {
                                    const updated = [...localContent.faqs];
                                    updated[index].question = e.target.value;
                                    setLocalContent(prev => ({ ...prev, faqs: updated }));
                                  }}
                                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Réponse</label>
                                <textarea
                                  value={faq.answer}
                                  onChange={(e) => {
                                    const updated = [...localContent.faqs];
                                    updated[index].answer = e.target.value;
                                    setLocalContent(prev => ({ ...prev, faqs: updated }));
                                  }}
                                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white h-24"
                                  placeholder="Votre réponse..."
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">Aucune question pour le moment.</p>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20 space-y-3 mt-6">
                    <h4 className="font-semibold text-slate-800 dark:text-white">Ajouter une nouvelle question</h4>
                    <input
                      type="text"
                      placeholder="Question"
                      value={newFaqQuestion}
                      onChange={(e) => setNewFaqQuestion(e.target.value)}
                      className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    />
                    <Button 
                      type="button"
                      onClick={() => {
                        if (!newFaqQuestion.trim()) {
                          alert('La question est requise');
                          return;
                        }
                        const updatedContent = {
                          ...localContent,
                          faqs: [...(localContent.faqs || []), { question: newFaqQuestion, answer: '' }]
                        };
                        setLocalContent(updatedContent);
                        setContent(updatedContent);
                        // Sauvegarder immédiatement
                        const contentWithoutImages = { ...updatedContent };
                        delete contentWithoutImages.logoImage;
                        delete contentWithoutImages.heroImage;
                        delete contentWithoutImages.profileImage;
                        delete contentWithoutImages.cabinetImage;
                        localStorage.setItem('osteoSiteContent', JSON.stringify(contentWithoutImages));
                        setNewFaqQuestion('');
                      }}
                      className="w-full"
                    >
                      Ajouter une question
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

// --- Composants UI ---

const Button = ({ children, onClick, variant = 'primary', className = '', type = "button" }) => {
  const baseStyle = "px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30",
    secondary: "bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 shadow-sm",
    outline: "border-2 border-white text-white hover:bg-white hover:text-teal-700",
    danger: "bg-red-500 text-white hover:bg-red-600",
    dark: "bg-slate-800 text-white hover:bg-slate-700"
  };
  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}
>
      {children}
    </button>
  );
};

const SectionTitle = ({ title, subtitle }) => (
  <div className="text-center mb-12">
    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-4">{title}</h2>
    <div className="w-20 h-1 bg-teal-500 mx-auto rounded-full mb-4"></div>
    {subtitle && <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">{subtitle}</p>}
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

const ContactForm = () => {
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    motif: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const confirmAndSend = async () => {
    setIsSending(true);
    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_e4f7j9k',
          template_id: 'template_abc123',
          user_id: 'your_emailjs_user_id',
          template_params: {
            to_email: 'chenjunfi.osteopa@gmail.com',
            from_name: `${formData.prenom} ${formData.nom}`,
            from_email: formData.email,
            phone: formData.telephone,
            motif: formData.motif
          }
        })
      });

      if (response.ok) {
        setSendStatus('success');
        setFormData({ prenom: '', nom: '', email: '', telephone: '', motif: '' });
        setTimeout(() => {
          setSendStatus(null);
          setShowConfirmation(false);
        }, 3000);
      } else {
        setSendStatus('error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSendStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <input 
          type="text" 
          name="prenom"
          placeholder="Prénom" 
          value={formData.prenom}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
        />
        <input 
          type="text" 
          name="nom"
          placeholder="Nom" 
          value={formData.nom}
          onChange={handleChange}
          className="w-full p-3 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
        />
      </div>
      <input 
        type="email" 
        name="email"
        placeholder="Email" 
        value={formData.email}
        onChange={handleChange}
        className="w-full p-3 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
      />
      <input 
        type="tel" 
        name="telephone"
        placeholder="Téléphone" 
        value={formData.telephone}
        onChange={handleChange}
        className="w-full p-3 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
      />
      <textarea 
        name="motif"
        placeholder="Motif de consultation" 
        rows="4" 
        value={formData.motif}
        onChange={handleChange}
        className="w-full p-3 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none"
      ></textarea>
      
      {!showConfirmation ? (
        <Button type="submit" className="w-full justify-center">Envoyer la demande</Button>
      ) : (
        <div className="space-y-3 p-4 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-200 dark:border-teal-700">
          <div className="flex items-center gap-3 text-teal-700 dark:text-teal-400">
            <CheckCircle size={24} />
            <span className="font-medium">Confirmez-vous l'envoi de votre demande ?</span>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={confirmAndSend}
              disabled={isSending}
              className="flex-1 justify-center"
            >
              {isSending ? 'Envoi en cours...' : 'Confirmer'}
            </Button>
            <Button 
              onClick={() => setShowConfirmation(false)}
              variant="secondary"
              className="flex-1 justify-center"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}
      
      {sendStatus === 'success' && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 flex items-center gap-2">
          <CheckCircle size={20} />
          <span>Demande envoyée avec succès ! Nous vous répondrons rapidement.</span>
        </div>
      )}
      {sendStatus === 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400">
          Une erreur s'est produite lors de l'envoi. Veuillez réessayer.
        </div>
      )}
      
      <p className="text-xs text-center text-slate-400">Ce formulaire envoie votre demande directement à notre email.</p>
    </form>
  );
};

// --- Application Principale ---

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Données par défaut
  const defaultContent = {
    // General
    siteName: "OsteoParis13",
    practitionerName: "Junfi Chen",
    practitionerTitle: "Ostéopathe D.O. agréé",
    
    // Contact
    phone: "06 22 04 28 93",
    email: "chenjunfi.osteopathe@gmail.com",
    address: "155 Boulevard Vincent Auriol, 75013 Paris",
    addressLink: "https://maps.app.goo.gl/pbhiiCF12V96ZgvZ7?g_st=ipc",
    doctolibLink: "https://www.doctolib.fr/osteopathe/paris/junfi-chen",
    instagramHandle: "jchen.osteo",
    
    // Images
    logoImage: "https://mtxctobgjluwkytrtlha.supabase.co/storage/v1/object/public/photo%20site%20osteo/Design%20sans%20titre.jpg",
    heroImage: "https://mtxctobgjluwkytrtlha.supabase.co/storage/v1/object/public/photo%20site%20osteo/DSC_2420.jpg",
    profileImage: "https://mtxctobgjluwkytrtlha.supabase.co/storage/v1/object/public/photo%20site%20osteo/1141764273087_.pic_hd.jpg",
    cabinetImage: "https://mtxctobgjluwkytrtlha.supabase.co/storage/v1/object/public/photo%20site%20osteo/DSC_2467.jpg",
    
    // Textes Accueil
    heroTitle: "Soulager durablement vos douleurs grâce à une approche douce et personnalisée.",
    heroSubtitle: "Écoute, expertise et douceur pour améliorer votre quotidien.",
    testimonialRating: "4.9/5 (120 avis)",
    newsMessage: "", // Bannière d'actualité (vide = masquée)
    
    // Textes A propos
    aboutText1: "Passionné par le fonctionnement du corps humain, j'ai suivi une formation sur 6 ans à l'École Holistéa avec une thérapie manuelle douce. Mon approche se veut globale, cherchant à identifier la cause des symptômes plutôt que de traiter seulement les conséquences.",
    aboutText2: "Je pratique une ostéopathie fonctionnelle avec une approche tissulaire douce et certaines techniques structurelles, en m'adaptant toujours au patient, qu'il s'agisse d'un nouveau-né ou d'un sportif de haut niveau.",
    
    // Notes des Symptômes
    symptomNotes: {
      "Lombalgies": "",
      "Sciatiques": "",
      "Cervicalgies": "",
      "Migraines": "",
      "Dorsalgies": "",
      "Tendinites": "",
      "Entorses": "",
      "Troubles de la mâchoire (ATM)": "",
      "Reflux (RGO)": "",
      "Constipation": "",
      "Stress": "",
      "Fatigue chronique": "",
      "Sinusites": "",
      "Otites": "",
      "Vertiges": ""
    },

    // Articles de blog
    blogPosts: [
      {
        title: "Télétravail : 5 étirements pour le dos",
        tag: "Ergonomie",
        image: "https://images.unsplash.com/photo-1593642632823-8f78566777ed?auto=format&fit=crop&w=400&q=80",
        excerpt: "Étirements simples pour soulager le dos après une journée devant l'ordinateur.",
        link: "https://example.com/teletravail-etirements"
      },
      {
        title: "Quand consulter pour bébé ?",
        tag: "Pédiatrie",
        image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80",
        excerpt: "Les signes qui peuvent nécessiter un avis ostéopathique pour les nourrissons et jeunes enfants.",
        link: "https://example.com/consultation-bebe"
      },
      {
        title: "L'ostéopathie contre le stress",
        tag: "Bien-être",
        image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80",
        excerpt: "Comment l'ostéopathie peut aider à réguler le stress et les tensions musculaires.",
        link: "https://example.com/osteopathie-stress"
      }
    ],

    // Questions fréquemment posées
    faqs: [
      { question: "Combien de séances sont nécessaires ?", answer: "Cela dépend de votre condition. Généralement, quelques séances suffisent, mais un suivi à long terme peut être recommandé dans certains cas." },
      { question: "L'ostéopathie est-elle remboursée ?", answer: "Non par la Sécurité Sociale, mais la plupart des mutuelles proposent un remboursement partiel ou total." },
      { question: "Puis-je consulter enceinte ?", answer: "Oui, l'ostéopathie pendant la grossesse est très bénéfique pour soulager les douleurs et préparer l'accouchement." }
    ],

    // Tarifs et durées
    pricing: [
      { name: "Consultation Adulte", price: "65", duration: "45-60", description: "Durée : 45 min - 1h" },
      { name: "Nourrisson / Enfant (-12 ans) / Étudiant", price: "55", duration: "45-60", description: "Durée : 45 min - 1h" }
    ],

    // Parcours professionnel
    parcours: [
      { year: "2025", title: "Ouverture du Cabinet", desc: "Installation au cœur du 13ème arrondissement." },
      { year: "2025", title: "Diplôme d'Ostéopathe D.O.", desc: "Sortie de promotion avec mention." },
      { year: "2025", title: "Formation Pédiatrie", desc: "Spécialisation dans la prise en charge des enfants, adultes, sportifs, futur maman, sénior." },
      { year: "2025", title: "Formation Ostéo du Sport", desc: "Participation aux évènementiels sportifs." }
    ]
  };

  // --- État du Contenu (Administrable) avec Supabase ---
  const [content, setContent] = useState(defaultContent);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Charger le contenu depuis Supabase au démarrage
  useEffect(() => {
    const loadContent = async () => {
      try {
        // Charger depuis Supabase
        const savedContent = await ContentManager.loadContent();
        
        if (savedContent) {
          // Fusionner avec defaultContent pour avoir les valeurs par défaut si certaines clés manquent
          const mergedContent = { ...defaultContent, ...savedContent };
          setContent(mergedContent);
          console.log('Contenu chargé depuis Supabase');
        } else {
          // Pas de contenu dans Supabase, utiliser defaultContent
          setContent(defaultContent);
          console.log('Aucun contenu dans Supabase, utilisation des valeurs par défaut');
        }
      } catch (error) {
        console.error('Erreur lors du chargement depuis Supabase:', error);
        setContent(defaultContent);
      } finally {
        setImagesLoaded(true);
      }
    };
    
    loadContent();
  }, []);
  
  const [expandedSymptom, setExpandedSymptom] = useState(null);
  const [symptoms, setSymptoms] = useState(DEFAULT_SYMPTOMS);
  const [newSymptomInput, setNewSymptomInput] = useState("");
  const [activeAdminSection, setActiveAdminSection] = useState('general');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newPricingItem, setNewPricingItem] = useState({ name: "", price: "", duration: "", description: "" });
  const [newParcoursItem, setNewParcoursItem] = useState({ year: "", title: "", desc: "" });

  // Gestion du scroll - optimisée pour éviter les refresh excessifs
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Gestion du mode sombre
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const navTo = (page) => {
    setActiveTab(page);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  const NavLink = ({ page, label }) => (
    <button 
      type="button"
      onClick={() => navTo(page)}
      className={`text-lg font-medium transition-colors ${activeTab === page ? 'text-teal-600 dark:text-teal-400' : 'text-slate-600 dark:text-slate-300 hover:text-teal-500'}`}
    >
      {label}
    </button>
  );

  // --- Vue Administrateur ---
  // --- Vues (Pages) ---

  const HomeView = () => (
    <div>
      {/* Bannière d'actualité */}
      {content.newsMessage && content.newsMessage.trim() !== "" && (
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 py-3 overflow-hidden">
          <div className="relative flex">
            <div className="animate-marquee whitespace-nowrap flex items-center">
              <span className="text-white font-medium text-sm md:text-base mx-8">
                {content.newsMessage}
              </span>
              <span className="text-white font-medium text-sm md:text-base mx-8">
                {content.newsMessage}
              </span>
            </div>
            <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex items-center">
              <span className="text-white font-medium text-sm md:text-base mx-8">
                {content.newsMessage}
              </span>
              <span className="text-white font-medium text-sm md:text-base mx-8">
                {content.newsMessage}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Hero Section */}
      <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
        {content.heroImage && (
          <div className="absolute inset-0 z-0 will-change-transform">
            <img 
              key={content.heroImage}
              src={content.heroImage} 
              alt="Cabinet Ostéopathie" 
              className="w-full h-full object-cover filter brightness-50"
              loading="eager"
              decoding="sync"
              style={{ will_change: 'transform' }}
            />
          </div>
        )}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
          <span className="inline-block py-1 px-3 rounded-full bg-teal-500/30 border border-teal-400/50 backdrop-blur-md text-teal-100 text-sm font-semibold mb-6">
            Centre pluridisciplinaire à Paris 13ème
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {content.heroTitle}
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-slate-200 font-light">
            {content.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navTo('contact')}>Prendre rendez-vous</Button>
            <Button variant="outline" onClick={() => window.open(content.addressLink, '_blank')}>Découvrir le cabinet</Button>
          </div>
          
          <div className="mt-12 flex justify-center gap-8 text-sm md:text-base opacity-90">
             <div className="flex items-center gap-2">
               <MapPin size={18} className="text-teal-400"/> Paris 13ème
             </div>
             <div className="flex items-center gap-2">
               <Star size={18} className="text-yellow-400"/> {content.testimonialRating}
             </div>
          </div>
        </div>
      </div>

      {/* Expertise Rapide */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900 px-4">
        <div className="max-w-6xl mx-auto">
          <SectionTitle title="Expertises" subtitle="Une prise en charge adaptée à chaque étape de la vie." />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((service) => (
              <Card key={service.id} className="cursor-pointer hover:-translate-y-2" onClick={() => navTo('patients')}>
                <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 mb-4">
                  <service.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{service.title}</h3>
                <p className="text-slate-600 dark:text-slate-400">{service.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi nous choisir + Avis */}
      <section className="py-20 px-4 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-6">Pourquoi choisir notre cabinet ?</h2>
            <ul className="space-y-4">
              {[
                "Prise en charge globale et personnalisée",
                "Techniques douces et structurelles adaptées",
                "Disponibilité pour les soins à domicile",
                "Suivi post-séance et conseils exercices"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CheckCircle className="text-teal-500" size={20} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 p-6 bg-teal-50 dark:bg-slate-700 rounded-xl border border-teal-100 dark:border-slate-600">
              <div className="flex gap-1 mb-2">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="italic text-slate-600 dark:text-slate-300 mb-4">"{REVIEWS[0].text}"</p>
              <p className="font-bold text-slate-800 dark:text-white text-sm">- {REVIEWS[0].name}</p>
            </div>
          </div>
          <div className="relative h-80 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
             {content.cabinetImage && <img key={content.cabinetImage} src={content.cabinetImage} alt="Cabinet" className="w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/30 to-transparent flex items-end p-8">
              <div className="text-white">
                <p className="font-bold text-lg">Cabinet Moderne</p>
                <p className="text-sm opacity-80">Un espace dédié à votre bien-être</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  const AboutView = () => (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-12 items-start mb-16">
          <div className="w-full md:w-1/3">
            {content.profileImage && (
              <img 
                key={content.profileImage}
                src={content.profileImage} 
                alt="Portrait Ostéopathe" 
                className="rounded-2xl shadow-xl w-full object-cover aspect-[3/4]"
              />
            )}
          </div>
          <div className="w-full md:w-2/3">
            <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">{content.practitionerName}</h1>
            <p className="text-teal-600 font-semibold mb-6 text-xl">{content.practitionerTitle}</p>
            <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {content.aboutText1}
            </p>
            <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
              {content.aboutText2}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">Diplômé Holistéa</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Formation d'excellence sur 6 ans</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <h3 className="font-bold text-slate-800 dark:text-white mb-1">Formation pédiatrique et Handicap</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Centre spécialisé à Barcelone</p>
              </div>
            </div>
          </div>
        </div>

        <SectionTitle title="Mon Parcours" />
        <div className="relative border-l-4 border-teal-200 dark:border-teal-900 ml-4 md:ml-0 space-y-12">
          {content.parcours.map((item, index) => (
            <div key={index} className="relative pl-8 md:pl-12">
              <div className="absolute -left-[10px] top-0 w-6 h-6 bg-teal-500 rounded-full border-4 border-white dark:border-slate-900"></div>
              <span className="text-sm font-bold text-teal-600 mb-1 block">{item.year}</span>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{item.title}</h3>
              <p className="text-slate-600 dark:text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const PatientsView = () => (
    <div className="pt-24 pb-20 px-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <SectionTitle title="Pour qui ?" subtitle="L'ostéopathie s'adresse à tous, à chaque étape de la vie." />
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SERVICES.map((s) => (
          <Card key={s.id} className="h-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-teal-100 dark:bg-teal-900 p-3 rounded-full text-teal-600 dark:text-teal-300">
                <s.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{s.title}</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{s.desc}</p>
            <ul className="space-y-2 mb-6">
              <li className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2">
                <ChevronRight size={16} className="text-teal-500 mt-1 min-w-[16px]" /> 
                Exemple de motif de consultation adapté à cette catégorie.
              </li>
              <li className="text-sm text-slate-500 dark:text-slate-400 flex items-start gap-2">
                 <ChevronRight size={16} className="text-teal-500 mt-1 min-w-[16px]" /> 
                 Approche spécifique et sécurisée.
              </li>
            </ul>
            <Button variant="secondary" className="w-full text-sm py-2" onClick={() => navTo('contact')}>Prendre RDV</Button>
          </Card>
        ))}
      </div>
    </div>
  );

  const SymptomsView = () => {
    const [expandedSymptoms, setExpandedSymptoms] = useState({});
    const filteredSymptoms = symptoms.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const toggleSymptom = (sym) => {
      setExpandedSymptoms(prev => ({
        ...prev,
        [sym]: !prev[sym]
      }));
    };

    return (
      <div className="pt-24 pb-20 px-4 min-h-screen">
        <SectionTitle title="Motifs de Consultation" subtitle="Quelles douleurs peuvent être soulagées ?" />
        <div className="max-w-4xl mx-auto">
          <div className="relative mb-12">
            <input 
              type="text" 
              placeholder="Rechercher une douleur (ex: dos, migraine...)" 
              className="w-full p-4 pl-12 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg focus:ring-2 focus:ring-teal-500 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-500 dark:placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-4 top-4 text-slate-400 dark:text-slate-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredSymptoms.length > 0 ? (
              filteredSymptoms.map((sym, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button 
                    onClick={() => toggleSymptom(sym)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="font-medium text-slate-700 dark:text-slate-200 text-left">{sym}</span>
                    <span className={`text-teal-600 dark:text-teal-400 text-lg transition-transform ${expandedSymptoms[sym] ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {expandedSymptoms[sym] && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                      {content.symptomNotes[sym] ? (
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{content.symptomNotes[sym]}</p>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 italic">Aucune note pour ce symptôme.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="col-span-1 md:col-span-2 text-center text-slate-500 dark:text-slate-400">Aucun résultat trouvé. N'hésitez pas à nous contacter directement.</p>
            )}
          </div>
          
          <div className="mt-12 bg-teal-50 dark:bg-slate-800/50 p-6 rounded-2xl text-center">
            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Vous avez un doute ?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">Tous les motifs ne sont pas listés. Contactez le cabinet pour un avis.</p>
            <Button onClick={() => navTo('contact')}>Contact & Questions</Button>
          </div>
        </div>
      </div>
    );
  };

  const PricingView = () => (
    <div className="pt-24 pb-20 px-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <SectionTitle title="Tarifs & Remboursements" />
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {content.pricing.map((item, idx) => (
            <Card key={idx} className="text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-blue-400"></div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-4">{item.name}</h3>
              <div className="text-4xl font-bold text-teal-600 my-6">{item.price}€</div>
              <ul className="text-slate-600 dark:text-slate-400 space-y-3 mb-8 text-left pl-8">
                <li className="flex items-center gap-2"><Clock size={16}/> Durée : {item.duration}</li>
                {item.description && <li className="flex items-center gap-2"><FileText size={16}/> {item.description}</li>}
                <li className="flex items-center gap-2"><CreditCard size={16}/> Virement bancaire, Chèque, Espèces</li>
              </ul>
              <Button className="w-full" onClick={() => navTo('contact')}>Prendre RDV</Button>
            </Card>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="text-teal-500"/> Mutuelles
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            L'ostéopathie n'est pas remboursée par la Sécurité Sociale, mais la majorité des mutuelles prennent en charge tout ou partie des séances.
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {["SwissLife", "Harmonie Mutuelle", "MGEN", "Allianz", "AXA", "Génération", "Alan", "Mercer"].map((m, i) => (
              <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                {m}
              </span>
            ))}
            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm italic">+ bien d'autres</span>
          </div>
          <button className="text-teal-600 hover:text-teal-700 underline font-medium">
            Renseignez-vous auprès de votre mutuelle.
          </button>
        </div>
      </div>
    </div>
  );

  const ContactView = () => (
    <div className="pt-24 pb-20 px-4">
      <SectionTitle title="Prendre Rendez-vous & Accès" />
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Colonne Info */}
        <div className="space-y-8">
          <Card>
            <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white">Coordonnées</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <MapPin className="text-teal-500 mt-1" />
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">Cabinet d'Ostéopathie</p>
                  <p className="text-slate-600 dark:text-slate-400">{content.address}</p>
                  <p className="text-sm text-slate-500 mt-1">Métro : Nationale (L6) - Place d'Italie (L5)</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="text-teal-500" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">{content.phone}</p>
              </div>
              <div className="flex items-center gap-4">
                <Mail className="text-teal-500" />
                <p className="text-slate-600 dark:text-slate-400">{content.email}</p>
              </div>
              <div className="flex items-center gap-4">
                <Instagram className="text-teal-500" />
                <a href={`https://www.instagram.com/${content.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors font-medium">@{content.instagramHandle}</a>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
              <h4 className="font-bold mb-4 text-slate-800 dark:text-white">Horaires d'ouverture</h4>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex justify-between"><span>Lundi - Jeudi - Samedi</span> <span>09:00 - 20:00</span></li>
                <li className="flex justify-between"><span>Mardi - Mercredi à domicile </span> <span>10:00 - 19:00</span></li>
                <li className="flex justify-between text-red-500"><span>Dimanche</span> <span>Fermé </span></li>
              </ul>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-teal-700 border-none text-white dark:from-teal-600 dark:to-teal-800">
            <h3 className="text-xl font-bold mb-2">Soins au cabinet et à domicile sur Doctolib</h3>
            <p className="mb-4 opacity-90">Dos bloqué ? Torticolis ? Créneaux disponibles.</p>
            <Button onClick={() => window.open('https://www.doctolib.fr/osteopathe/paris/junfi-chen', '_blank')} variant="outline" className="w-full justify-center"> Tout renseignement sur Doctolib</Button>
          </Card>
        </div>

        {/* Colonne Formulaire / Map */}
        <div className="space-y-8">
          <div className="bg-slate-100 dark:bg-slate-800 w-full h-64 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner">
            {/* Simulation iframe map */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2626.353930584992!2d2.3588823763320135!3d48.83238730253629!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e6711cef2f2b91%3A0xee5b61a37c7831c4!2sCHEN%20Junfi%20-%20Ost%C3%A9opathe%20D.O!5e0!3m2!1sfr!2sfr!4v1765055707124!5m2!1sfr!2sfr"
              width="100%" 
              height="100%" 
              style={{border:0}} 
              allowFullScreen="" 
              loading="lazy"
              title="Google Maps"
            />
          </div>

          <Card>
            <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Demande de RDV</h3>
            <ContactForm />
          </Card>
        </div>
      </div>
    </div>
  );

  const BlogView = () => (
    <div className="pt-24 pb-20 px-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <SectionTitle title="Conseils & Actualités" subtitle="Articles pour prendre soin de votre santé au quotidien." />
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {content.blogPosts && content.blogPosts.length > 0 ? (
          content.blogPosts.map((article, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer group">
              <div className="h-48 overflow-hidden">
                 <img src={article.image} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6">
                {article.tag && <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">{article.tag}</span>}
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-2 mb-3 group-hover:text-teal-600 transition-colors">{article.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{article.excerpt || "Découvrez nos conseils pratiques pour votre bien-être."}</p>
                {article.link ? (
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 font-medium flex items-center gap-1 text-sm hover:text-teal-700"
                  >
                    Lire l'article <ArrowRight size={14}/>
                  </a>
                ) : (
                  <span className="text-teal-600 font-medium flex items-center gap-1 text-sm">Lire l'article <ArrowRight size={14}/></span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-1 md:col-span-3 text-center text-slate-500 dark:text-slate-400">Aucun article publié pour le moment.</p>
        )}
      </div>
    </div>
  );

  const FaqView = () => {
    const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);
    const [formData, setFormData] = useState({ question: '', email: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmitQuestion = (e) => {
      e.preventDefault();
      if (!formData.question.trim() || !formData.email.trim()) {
        alert('Veuillez remplir tous les champs');
        return;
      }
      // Pour une vraie app, tu enverrais ça à un backend
      // Ici on affiche juste un message de confirmation
      setSubmitted(true);
      setTimeout(() => {
        setFormData({ question: '', email: '' });
        setSubmitted(false);
      }, 3000);
    };

    return (
      <div className="pt-24 pb-20 px-4 min-h-screen">
        <SectionTitle title="Questions Fréquemment Posées" subtitle="Trouvez les réponses à vos questions." />
        <div className="max-w-4xl mx-auto">
          {/* FAQ List */}
          <div className="space-y-3 mb-12">
            {content.faqs && content.faqs.length > 0 ? (
              content.faqs.map((faq, idx) => (
                <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-left">{faq.question}</span>
                    <span className={`text-teal-600 dark:text-teal-400 text-lg transition-transform ${expandedFaqIndex === idx ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  {expandedFaqIndex === idx && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400">Aucune question disponible.</p>
            )}
          </div>

          {/* Ask a Question Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-100 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Vous ne trouvez pas votre réponse ?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Posez votre question ci-dessous, nous vous répondrons au plus tôt.</p>
            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Votre question</label>
                <textarea
                  value={formData.question}
                  onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Écrivez votre question..."
                  className="w-full p-3 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 h-24 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Votre email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="votre.email@example.com"
                  className="w-full p-3 rounded-lg border border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              {!submitted ? (
                <Button type="submit" className="w-full">Envoyer ma question</Button>
              ) : (
                <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 flex items-center gap-2">
                  <CheckCircle size={20} />
                  <span>Merci ! Nous avons bien reçu votre question.</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  };

  // --- Layout Principal ---

  // Composant de la page publique
  const PublicSite = () => (
    <div className="min-h-screen font-sans text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* Navbar Fixed */}
      <nav
        className={`fixed w-full z-[90] py-4 transition-all duration-500 ease-out ${scrolled ? 'bg-transparent shadow-none' : 'bg-white/95 dark:bg-slate-900/95 shadow-lg'} relative nav-glass ${scrolled ? 'nav-glass-scrolled' : ''}`}
        style={{ contain: 'none', overflow: 'visible', pointerEvents: 'auto' }}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navTo('home')}>
             {content.logoImage ? (
               <img key={content.logoImage} src={content.logoImage} alt="Logo" className="w-8 h-8 rounded object-cover" />
             ) : (
               <Activity size={32} className="text-teal-500" />
             )}
             <div className={`font-bold text-2xl tracking-tight transition-colors duration-500 ease-out ${scrolled ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
               {content.siteName}
             </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            <div className={`flex gap-6 transition-colors duration-500 ease-out ${scrolled ? 'text-white/80 hover:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
              <button onClick={() => navTo('home')} className="hover:text-teal-500 transition-colors">Accueil</button>
              <button onClick={() => navTo('about')} className="hover:text-teal-500 transition-colors">À propos</button>
              <button onClick={() => navTo('patients')} className="hover:text-teal-500 transition-colors">Pour qui ?</button>
              <button onClick={() => navTo('symptoms')} className="hover:text-teal-500 transition-colors">Motifs</button>
              <button onClick={() => navTo('pricing')} className="hover:text-teal-500 transition-colors">Tarifs</button>
              <button onClick={() => navTo('blog')} className="hover:text-teal-500 transition-colors">Blog</button>
            </div>
            
            
            <Button 
              onClick={() => setDarkMode(!darkMode)} 
              variant="dark"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              {darkMode ? "Mode clair" : "Mode nuit"}
            </Button>
            <Button onClick={() => navTo('contact')} className="shadow-none scale-90">Prendre RDV</Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-4">
            <button type="button" onClick={() => setDarkMode(!darkMode)}>
               {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className={`${scrolled ? 'text-white' : 'text-slate-600'}`} />}
            </button>
            <button type="button" onClick={() => setIsMenuOpen(!isMenuOpen)} className={`transition-colors duration-500 ease-out ${scrolled ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden absolute right-4 top-full mt-3 z-[95] w-64 pointer-events-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex flex-col gap-4">
              <NavLink page="home" label="Accueil" />
              <NavLink page="about" label="À propos" />
              <NavLink page="patients" label="Pour qui ?" />
              <NavLink page="symptoms" label="Motifs de consultation" />
              <NavLink page="pricing" label="Tarifs" />
              <NavLink page="blog" label="Blog" />
              <NavLink page="contact" label="Contact & Accès" />
              <Button onClick={() => navTo('contact')} className="w-full mt-2">Prendre Rendez-vous</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Router */}
      <main className="min-h-screen">
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'about' && <AboutView />}
        {activeTab === 'patients' && <PatientsView />}
        {activeTab === 'symptoms' && <SymptomsView />}
        {activeTab === 'pricing' && <PricingView />}
        {activeTab === 'contact' && <ContactView />}
        {activeTab === 'blog' && <BlogView />}
        {activeTab === 'faq' && <FaqView />}
      </main>

      {/* Footer Modern */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4 text-white">
              <Activity className="text-teal-500"/>
              <span className="font-bold text-2xl">{content.siteName}</span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Votre santé est notre priorité. Une approche ostéopathique moderne, bienveillante et adaptée à tous.
            </p>
            <div className="flex gap-4">
              {/* Fake Social Icons */}
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-500 transition-colors cursor-pointer">CH</div>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-500 transition-colors cursor-pointer">IG</div>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-teal-500 transition-colors cursor-pointer">LN</div>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Liens Rapides</h4>
            <ul className="space-y-2 text-sm">
              <li onClick={() => navTo('about')} className="cursor-pointer hover:text-teal-400">L'ostéopathe</li>
              <li onClick={() => navTo('patients')} className="cursor-pointer hover:text-teal-400">Pour qui ?</li>
              <li onClick={() => navTo('faq')} className="cursor-pointer hover:text-teal-400">Questions fréquentes</li>
              <li onClick={() => navTo('blog')} className="cursor-pointer hover:text-teal-400">Blog santé</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4">Informations</h4>
            <ul className="space-y-2 text-sm">
              <li>Mentions Légales</li>
              <li>Politique de confidentialité</li>
              <li>Plan du site</li>
              <li>Honoraires</li>
              
            </ul>
          </div>

          <div>
             <h4 className="text-white font-bold mb-4">Urgence & Contact</h4>
             <p className="text-sm mb-2">{content.address}</p>
             <p className="text-sm mb-4">{content.phone}</p>
             <Button variant="primary" className="text-sm py-2 px-4" onClick={() => navTo('contact')}>Prendre RDV en ligne</Button>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs text-slate-500">
          &copy; 2024 Cabinet d'Ostéopathie Moderne. Tous droits réservés.
        </div>
      </footer>

      {/* Chatbot Flottant */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
          >
            <MessageCircle size={28} />
          </button>
        )}
        
        {isChatOpen && (
          <div className="bg-white dark:bg-slate-800 w-80 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-fade-in-up">
            <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
              <span className="font-bold">Assistant Cabinet</span>
              <button onClick={() => setIsChatOpen(false)}><X size={18}/></button>
            </div>
            <div className="p-4 h-64 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900">
               <div className="bg-white dark:bg-slate-800 p-3 rounded-tr-lg rounded-bl-lg rounded-br-lg shadow-sm text-sm text-slate-600 dark:text-slate-300">
                 Bonjour ! Je suis l'assistant virtuel. Comment puis-je vous aider aujourd'hui ?
               </div>
               <div className="bg-white dark:bg-slate-800 p-3 rounded-tr-lg rounded-bl-lg rounded-br-lg shadow-sm text-sm text-slate-600 dark:text-slate-300">
                 Vous cherchez un créneau d'urgence ou des infos sur les tarifs ?
               </div>
            </div>
            <div className="p-3 border-t dark:border-slate-700 bg-white dark:bg-slate-800">
               <input type="text" placeholder="Écrivez votre message..." className="w-full text-sm p-2 bg-slate-100 dark:bg-slate-700 rounded-lg outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500" />
            </div>
          </div>
        )}
      </div>

    </div>
  );

  // Return principal avec routing
  return (
    <Routes>
      <Route path="/" element={<PublicSite />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/tableau-secret-admin"
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}