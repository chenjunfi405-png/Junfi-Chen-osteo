import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, ContentManager } from './supabaseClient';
import { 
  Lock, Save, Edit3, Image as ImageIcon, Layout, Phone,
  FileText, Activity, MessageCircle, CreditCard, Calendar, X
} from 'lucide-react';

// Gestionnaire d'images Supabase
const ImageManager = {
  async saveImage(key, file) {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${key}.${fileExt}`;
      const filePath = fileName;

      const { data, error } = await supabase.storage
        .from('photo site osteo')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('photo site osteo')
        .getPublicUrl(filePath);

      console.log(`Image ${key} sauvegardée: ${publicUrl}`);
      return publicUrl;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'image:', error);
      throw error;
    }
  }
};

// Composants UI
const Button = ({ children, onClick, variant = 'primary', className = '', type = "button", disabled = false }) => {
  const baseStyle = "px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-teal-600 text-white hover:bg-teal-700 shadow-lg hover:shadow-teal-500/30",
    secondary: "bg-white text-teal-700 border border-teal-200 hover:bg-teal-50 shadow-sm",
    outline: "border-2 border-white text-white hover:bg-white hover:text-teal-700",
    danger: "bg-red-500 text-white hover:bg-red-600",
    dark: "bg-slate-800 text-white hover:bg-slate-700"
  };
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-slate-100 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeAdminSection, setActiveAdminSection] = useState('general');
  
  // États pour le contenu
  const [content, setContent] = useState({});
  const [localContent, setLocalContent] = useState({});
  const [symptoms, setSymptoms] = useState([]);
  const [expandedSymptom, setExpandedSymptom] = useState(null);
  const [newSymptomInput, setNewSymptomInput] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [newFaqQuestion, setNewFaqQuestion] = useState("");
  const [newPricingItem, setNewPricingItem] = useState({ name: "", price: "", duration: "", description: "" });
  const [newParcoursItem, setNewParcoursItem] = useState({ year: "", title: "", desc: "" });
  const [newBlogPost, setNewBlogPost] = useState({ title: "", tag: "", image: "", excerpt: "", link: "" });

  // Vérifier l'authentification et charger le contenu
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Charger le contenu depuis Supabase
      try {
        const savedContent = await ContentManager.loadContent();
        if (savedContent) {
          setContent(savedContent);
          setLocalContent(savedContent);
          
          // Charger les symptômes depuis le contenu
          if (savedContent.symptoms) {
            setSymptoms(savedContent.symptoms);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSave = async () => {
    try {
      // Ajouter les symptoms au contenu avant sauvegarde
      const contentToSave = { ...localContent, symptoms };
      await ContentManager.saveContent(contentToSave);
      setContent(contentToSave);
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
      const publicUrl = await ImageManager.saveImage(key, file);
      const updatedContent = { ...localContent, [key]: publicUrl };
      setLocalContent(updatedContent);
      setContent(updatedContent);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Edit3 className="text-teal-500" /> Tableau de bord Admin
          </h1>
          <div className="flex gap-4">
            <Button onClick={handleSave}>
              <Save size={18} /> Enregistrer
            </Button>
            <Button onClick={() => navigate('/')} variant="secondary">
              Voir le site
            </Button>
            <Button onClick={handleLogout} variant="danger">
              Déconnexion
            </Button>
          </div>
        </div>

        {/* Navigation Admin */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'general', label: 'Général', icon: Layout },
            { id: 'contact', label: 'Contact', icon: Phone },
            { id: 'images', label: 'Images', icon: ImageIcon },
            { id: 'blog', label: 'Blog', icon: FileText },
            { id: 'symptoms', label: 'Symptômes', icon: Activity },
            { id: 'faq', label: 'FAQ', icon: MessageCircle },
            { id: 'pricing', label: 'Tarifs', icon: CreditCard },
            { id: 'parcours', label: 'Parcours', icon: Calendar }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveAdminSection(id)}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeAdminSection === id
                  ? 'bg-teal-600 text-white shadow-lg'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <Card className="p-6">
          {/* Section Général */}
          {activeAdminSection === 'general' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Informations Générales</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Nom du Site</label>
                <input
                  type="text"
                  value={localContent.siteName || ''}
                  onChange={(e) => handleChange('siteName', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Nom du Praticien</label>
                <input
                  type="text"
                  value={localContent.practitionerName || ''}
                  onChange={(e) => handleChange('practitionerName', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Titre Professionnel</label>
                <input
                  type="text"
                  value={localContent.practitionerTitle || ''}
                  onChange={(e) => handleChange('practitionerTitle', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Titre Hero (Page Accueil)</label>
                <textarea
                  value={localContent.heroTitle || ''}
                  onChange={(e) => handleChange('heroTitle', e.target.value)}
                  rows={2}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Sous-titre Hero</label>
                <textarea
                  value={localContent.heroSubtitle || ''}
                  onChange={(e) => handleChange('heroSubtitle', e.target.value)}
                  rows={2}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Note Témoignages</label>
                <input
                  type="text"
                  value={localContent.testimonialRating || ''}
                  onChange={(e) => handleChange('testimonialRating', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Bannière d'Actualité (Vide = Masquée)</label>
                <input
                  type="text"
                  value={localContent.newsMessage || ''}
                  onChange={(e) => handleChange('newsMessage', e.target.value)}
                  placeholder="Ex: 🎉 Ouverture exceptionnelle ce samedi de 9h à 18h !"
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Le texte défilera en haut du site. Laissez vide pour masquer la bannière.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Texte À propos (Paragraphe 1)</label>
                <textarea
                  value={localContent.aboutText1 || ''}
                  onChange={(e) => handleChange('aboutText1', e.target.value)}
                  rows={3}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Texte À propos (Paragraphe 2)</label>
                <textarea
                  value={localContent.aboutText2 || ''}
                  onChange={(e) => handleChange('aboutText2', e.target.value)}
                  rows={3}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Section Contact */}
          {activeAdminSection === 'contact' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Coordonnées</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Téléphone</label>
                <input
                  type="text"
                  value={localContent.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={localContent.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Adresse</label>
                <input
                  type="text"
                  value={localContent.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Lien Google Maps</label>
                <input
                  type="url"
                  value={localContent.addressLink || ''}
                  onChange={(e) => handleChange('addressLink', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Lien Doctolib</label>
                <input
                  type="url"
                  value={localContent.doctolibLink || ''}
                  onChange={(e) => handleChange('doctolibLink', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-slate-300">Instagram (sans @)</label>
                <input
                  type="text"
                  value={localContent.instagramHandle || ''}
                  onChange={(e) => handleChange('instagramHandle', e.target.value)}
                  className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
          )}

          {/* Section Images */}
          {activeAdminSection === 'images' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Gestion des Images</h2>
              
              <ImageUploadField label="Logo" imageKey="logoImage" width="w-32" height="h-16" />
              <ImageUploadField label="Image Hero (Accueil)" imageKey="heroImage" width="w-48" height="h-32" />
              <ImageUploadField label="Photo Profil (À propos)" imageKey="profileImage" width="w-32" height="h-32" rounded="rounded-full" />
              <ImageUploadField label="Photo Cabinet" imageKey="cabinetImage" width="w-48" height="h-32" />
            </div>
          )}

          {/* Section Blog */}
          {activeAdminSection === 'blog' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText size={20}/> Gestion du Blog
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Gérez les articles affichés dans la section blog du site.
              </p>
              
              <div className="space-y-3">
                {localContent.blogPosts && localContent.blogPosts.length > 0 ? (
                  localContent.blogPosts.map((post, index) => (
                    <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800 space-y-3">
                      <div className="flex justify-between items-center mb-2">
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

          {/* Section Symptômes */}
          {activeAdminSection === 'symptoms' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Activity size={20}/> Gestion des Symptômes
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Cliquez sur chaque symptôme pour ajouter ou modifier les notes.
              </p>
              
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
                              const newNotes = { ...(localContent.symptomNotes || {}) };
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
                          value={(localContent.symptomNotes || {})[symptom] || ''}
                          onChange={(e) => handleChange('symptomNotes', { ...(localContent.symptomNotes || {}), [symptom]: e.target.value })}
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

          {/* Section FAQ */}
          {activeAdminSection === 'faq' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <MessageCircle size={20}/> Gestion des FAQ
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Gérez les questions et réponses affichées sur la page FAQ.
              </p>
              
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
                    setLocalContent(prev => ({
                      ...prev,
                      faqs: [...(prev.faqs || []), { question: newFaqQuestion, answer: '' }]
                    }));
                    setNewFaqQuestion('');
                  }}
                  className="w-full"
                >
                  Ajouter une question
                </Button>
              </div>
            </div>
          )}

          {/* Section Tarifs */}
          {activeAdminSection === 'pricing' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard size={20}/> Gestion des Tarifs & Durées
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Gérez les types de consultation, les tarifs et les durées.
              </p>
              
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
                  className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Tarif (€)"
                    value={newPricingItem.price}
                    onChange={(e) => setNewPricingItem(prev => ({ ...prev, price: e.target.value }))}
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
                    setLocalContent(prev => ({
                      ...prev,
                      pricing: [...(prev.pricing || []), { ...newPricingItem }]
                    }));
                    setNewPricingItem({ name: "", price: "", duration: "", description: "" });
                  }}
                  className="w-full"
                >
                  Ajouter cette consultation
                </Button>
              </div>
            </div>
          )}

          {/* Section Parcours */}
          {activeAdminSection === 'parcours' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Calendar size={20}/> Gestion du Parcours
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Gérez les étapes de votre parcours professionnel.
              </p>
              
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
                    setLocalContent(prev => ({
                      ...prev,
                      parcours: [...(prev.parcours || []), { ...newParcoursItem }]
                    }));
                    setNewParcoursItem({ year: "", title: "", desc: "" });
                  }}
                  className="w-full"
                >
                  Ajouter cette étape
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Admin;
