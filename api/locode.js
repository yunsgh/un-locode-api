// api/locode.js

// Importation de la base de données JSON (elle sera lue par Vercel)
const locodeData = require('../data.json'); 

// Cache de la base de recherche construite
let searchMap = null;

// Construit une map pour la recherche rapide (code -> data)
function buildSearchMap() {
    const map = {};
    for (const item of locodeData) {
        // La clé principale de recherche est le code complet (FRMRS)
        map[item.code] = item;
        
        // La clé secondaire est le nom, mis en minuscule
        map[item.name.toLowerCase()] = item; 
    }
    return map;
}

// Nettoyage v3 (pour le nom de la ville)
function cleanQuery(text) {
    if (!text) return "";
    let cleaned = text.toLowerCase();
    cleaned = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Gestion des accents
    return cleaned.trim();
}

module.exports = (req, res) => {
    // Initialise le cache une seule fois par instance Vercel
    if (!searchMap) {
        searchMap = buildSearchMap();
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*'); 

    const { code, country, city } = req.query; // Récupère les 3 paramètres possibles
    let results = [];
    const maxResults = 50; 

    // 1. Recherche prioritaire par CODE (la plus rapide et précise)
    if (code) {
        const key = code.toUpperCase().replace(/\s/g, ''); // Nettoie le code (enlève espace)
        const item = searchMap[key];
        
        if (item) {
            results.push(item);
        } else {
             // 2. Recherche par Pays et Ville
        }
    } else if (country || city) {
        
        const cleanCountry = country ? country.toUpperCase() : null;
        const cleanCity = city ? cleanQuery(city) : null;

        // On boucle sur la base de données complète pour le filtre
        for (const item of locodeData) {
            
            let matchesCountry = cleanCountry ? item.country_code === cleanCountry : true;
            let matchesCity = cleanCity ? cleanQuery(item.name).includes(cleanCity) : true;
            
            if (matchesCountry && matchesCity) {
                results.push(item);
            }
            if (results.length >= maxResults) break; // Limite les résultats pour éviter le timeout
        }
    } else {
        res.status(400).json({
            success: false,
            error: "Veuillez fournir un paramètre de recherche: 'code' (ex: FRMRS), ou 'country' et 'city'."
        });
        return;
    }

    // 3. Renvoie les résultats
    if (results.length > 0) {
        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        });
    } else {
        res.status(404).json({
            success: false,
            error: "Aucun UN/LOCODE trouvé correspondant à votre recherche."
        });
    }
};
