// Applique le thème avant le premier rendu (évite le flash blanc en mode sombre).
// Fichier externe plutôt qu'un <script> inline : compatible avec la CSP stricte du serveur.
try {
  var t = localStorage.getItem('theme');
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
} catch (e) { /* stockage indisponible : thème clair */ }
