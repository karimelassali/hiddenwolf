export function quotes(){
    const mysteriousQuotes = [
        "Shadows whisper truths only the brave dare uncover.",
        "Tonight, the moon watches silently… but does it see you?",
        "Trust dissolves in the fog of suspicion.",
        "Every friendly smile hides a secret blade.",
        "In this village, darkness wears many faces.",
        "Listen closely—sometimes silence screams the loudest.",
        "A single wrong vote can cost you everything.",
        "When the lanterns dim, the real hunt begins.",
        "Beware the wolf in villager’s clothing.",
        "Even the loyal may betray when fear takes hold.",
        "Deception is the deadliest game of all.",
        "Footsteps at midnight leave no forgiveness.",
        "Not every heart that beats is what it seems.",
        "Courage falters when trust is shattered.",
        "The howls you hear may come from within.",
        "Bloodlines mean little when claws are sharpened.",
        "One eye opens in the dark, but whose is it?",
        "Truth is a candle in the storm of lies.",
        "Gaze into the shadows, and be wary of what stares back.",
        "A wolf’s secret thrives in the quietest corners."
      ];
      
      const randomIndex = Math.floor(Math.random() * mysteriousQuotes.length);
      const randomQuote = mysteriousQuotes[randomIndex];
      console.log('hello im')
      
      return    randomQuote;

}