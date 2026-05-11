export const applyJamaicanSpeechPatterns = (text: string): string => {
  // Apply Jamaican Patois-influenced transformations
  let result = text;
  
  // Common Jamaican speech patterns
  // Replace "th" with "d" at beginning of words (this -> dis, that -> dat)
  result = result.replace(/\bth([aeiou])/g, 'd$1');
  
  // Replace "th" with "t" at end of words (with -> wit, breath -> bret)
  result = result.replace(/th\b/g, 't');
  
  // Replace "ing" with "in" at end of words (running -> runnin, going -> goin)
  result = result.replace(/ing\b/g, 'in');
  
  // Replace "you" with "yu" (informal)
  result = result.replace(/\byou\b/g, 'yu');
  
  // Replace "your" with "yuh"
  result = result.replace(/\byour\b/g, 'yuh');
  
  // Replace "to" with "tu" (informal)
  result = result.replace(/\bto\b/g, 'tu');
  
  // Replace "the" with "di" (informal)
  result = result.replace(/\bthe\b/g, 'di');
  
  // Replace "I am" with "mi" (I am -> mi)
  result = result.replace(/\bI am\b/g, 'mi');
  
  // Replace "I have" with "mi hav"
  result = result.replace(/\bI have\b/g, 'mi hav');
  
  // Replace "I will" with "mi wi"
  result = result.replace(/\bI will\b/g, 'mi wi');
  
  // Replace "we are" with "wi de"
  result = result.replace(/\bwe are\b/g, 'wi de');
  
  // Add Jamaican interjections occasionally
  if (Math.random() > 0.7) { // 30% chance to add an interjection
    const interjections = ['yes mi bredrin', 'respect', 'bless up', 'jah know', 'one love'];
    const randomInterjection = interjections[Math.floor(Math.random() * interjections.length)];
    result = `${randomInterjection}, ${result}`;
  }
  
  return result;
};

export const speakAgentVoice = (text: string, isMuted: boolean = false) => {
  if (isMuted || !('speechSynthesis' in window)) return;
  
  // Clean text for speech (remove markdown)
  let cleanText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
                     .replace(/[*_#`~>]/g, '') // Remove MD chars
                     .trim();
 
  if (!cleanText) return;

  // Apply Jamaican Patois-influenced speech patterns
  cleanText = applyJamaicanSpeechPatterns(cleanText);

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Try to find a voice that works best with the Jamaican persona text
    const voices = window.speechSynthesis.getVoices();
    
    // Preference order: Look for a natural-sounding voice that handles
    // rhythmic/soulful speech patterns well. On Windows, "Microsoft Mark"
    // (US) or "Microsoft David" are common, but we prioritize voices that
    // have a warm, resonant quality fitting the Jamaican persona.
    let selectedVoice = voices.find(v => 
      v.name.toLowerCase().includes('mark') && v.lang.startsWith('en')
    ) || voices.find(v => 
      v.name.toLowerCase().includes('david') && v.lang.startsWith('en')
    ) || voices.find(v => 
      v.name.toLowerCase().includes('hazel') && v.lang.startsWith('en')
    ) || voices.find(v => 
      v.name.toLowerCase().includes('zira') && v.lang.startsWith('en')
    ) || voices.find(v => 
      v.lang.startsWith('en') && v.localService
    ) || voices.find(v => 
      v.lang.startsWith('en')
    );
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Tune pitch and rate for Jamaican speech rhythm
    utterance.rate = 0.85;       // Slower for Jamaican rhythm and clarity
    utterance.pitch = 1.2;       // Higher pitch for warmer Jamaican tone
    utterance.volume = 1.0;
    
    window.speechSynthesis.cancel(); // Stop current speech
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn("[VoiceService] Speech synthesis failed:", e);
  }
};
