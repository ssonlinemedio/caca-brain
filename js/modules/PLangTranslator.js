// js/modules/PLangTranslator.js
class PLangTranslator {
  constructor() {
    this.vowels = ['a', 'e', 'i', 'o', 'u'];
    this.specialCases = {
      'que': 'quepe',
      'qui': 'quipi',
      'gue': 'guepe',
      'gui': 'guipi',
      'ca': 'capa',
      'co': 'copo',
      'cu': 'cupu',
      'mi': 'mipi',
      'ti': 'tipi',
      'si': 'sipi',
      'de': 'depe',
      'se': 'sepe',
      'me': 'mepe',
    };
    
    // Frases comunes pre-traducidas para rendimiento
    this.cachedTranslations = new Map();
  }

  translate(text) {
    if (!text || text.trim() === '') return '...';
    
    // Verificar cache
    if (this.cachedTranslations.has(text)) {
      return this.cachedTranslations.get(text);
    }
    
    const words = text.split(' ');
    const translatedWords = words.map(word => this.translateWord(word));
    const result = translatedWords.join(' ');
    
    // Guardar en cache (máx 100)
    if (this.cachedTranslations.size < 100) {
      this.cachedTranslations.set(text, result);
    }
    
    return result;
  }

  translateWord(word) {
    const punctuation = word.match(/[.,!?;:]/g) || [];
    const cleanWord = word.replace(/[.,!?;:]/g, '');
    
    if (cleanWord.length === 0) return word;
    if (cleanWord.length === 1) return cleanWord + this.addPunctuation(punctuation);
    
    // Casos especiales
    const lowerWord = cleanWord.toLowerCase();
    if (this.specialCases[lowerWord]) {
      return this.specialCases[lowerWord] + this.addPunctuation(punctuation);
    }
    
    // Si la palabra tiene acento, mantenerlo
    const syllables = this.splitIntoSyllables(cleanWord);
    
    const translated = syllables.map(syllable => {
      const lastVowel = this.getLastVowel(syllable);
      if (lastVowel) {
        return syllable + 'p' + lastVowel;
      }
      return syllable;
    }).join('');
    
    // Mantener mayúsculas iniciales
    const result = this.preserveCase(cleanWord, translated);
    return result + this.addPunctuation(punctuation);
  }

  splitIntoSyllables(word) {
    const vowels = 'aeiouáéíóú';
    const syllables = [];
    let currentSyllable = '';
    
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      currentSyllable += char;
      
      // Si es vocal y la siguiente es consonante o fin de palabra
      if (vowels.includes(char.toLowerCase())) {
        const nextChar = word[i + 1];
        if (!nextChar || !vowels.includes(nextChar.toLowerCase())) {
          syllables.push(currentSyllable);
          currentSyllable = '';
        }
      }
    }
    
    if (currentSyllable) syllables.push(currentSyllable);
    return syllables.length > 0 ? syllables : [word];
  }

  getLastVowel(syllable) {
    const vowels = 'aeiouáéíóú';
    for (let i = syllable.length - 1; i >= 0; i--) {
      if (vowels.includes(syllable[i].toLowerCase())) {
        return syllable[i].toLowerCase();
      }
    }
    return null;
  }

  preserveCase(original, translated) {
    if (original.length === 0) return translated;
    
    // Si original es mayúscula, convertir traducción a mayúscula
    if (original === original.toUpperCase()) {
      return translated.toUpperCase();
    }
    
    // Si primera letra es mayúscula
    if (original[0] === original[0].toUpperCase()) {
      return translated.charAt(0).toUpperCase() + translated.slice(1);
    }
    
    return translated;
  }

  addPunctuation(punctuation) {
    return punctuation.join('');
  }

  translateMessage(message) {
    const translated = this.translate(message);
    const emojis = ['💩', '🎮', '🔥', '🤪', '🚀', '💀', '⚡', '🌟', '💫', '✨'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    return `${translated} ${randomEmoji}`;
  }

  // Traducción inversa (para debugging)
  reverseTranslate(pLangText) {
    const cleanText = pLangText.replace(/[^a-zA-ZáéíóúñÑ\s]/g, '');
    const pattern = /([a-záéíóúñ]+?)p([aeiou])/gi;
    return cleanText.replace(pattern, (match, syllable, vowel) => {
      return syllable;
    });
  }

  // Generar mensaje random en P-Lang
  generateRandomMessage() {
    const templates = [
      '¡Hola, campeón!',
      '¡Qué bien te ves hoy!',
      'El absurdo te hace más fuerte',
      'Eres un pro de la caca mental',
      '¡Dale caña a ese cerebro!',
      'La vida es un juego, juega bien',
      'No pares de crear caca mental',
      'Eres la leyenda de la estupidez',
      '¡Logro desbloqueado!',
      'Sube el nivel de tu absurdez',
      'El meta cambia, tú también',
      '¡GG WP! Bien jugado',
      'Tu CACA COMPA te quiere',
      'Sigue así, campeón de la caca',
      'El absurdo es el nuevo tryhard',
      'Eres el protagonista de esta partida',
      '¡La caca mental es el nuevo meta!',
      '¿Y si los plátanos tuvieran miedo a los monos?',
      'El silencio tiene olor a violetas',
      'Los calcetines desaparecen al otro lado del universo',
    ];
    
    const message = templates[Math.floor(Math.random() * templates.length)];
    return this.translateMessage(message);
  }
}

export default PLangTranslator;