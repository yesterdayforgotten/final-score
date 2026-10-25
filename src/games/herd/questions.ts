/**
 * Original questions written for this app. Each has lots of "obvious" answers, so the herd has
 * to guess which one everyone else will pick.
 */
export const QUESTIONS: string[] = [
  'Name a fruit that is yellow.',
  'What is the best pizza topping?',
  'Name a famous wizard.',
  'What animal makes the best pet?',
  'Name something you find at the beach.',
  'What is the best day of the week?',
  'Name a superhero.',
  'What colour is the best colour?',
  'Name a breakfast food.',
  'What is the scariest animal?',
  'Name a board game.',
  'What do you put on toast?',
  'Name a vegetable people hate.',
  'What is the best season?',
  'Name a famous scientist.',
  'Name something that is cold.',
  'What is the best ice cream flavour?',
  'Name a musical instrument.',
  'What is the best number between 1 and 10?',
  'Name a cartoon character.',
  'Name something you take on a picnic.',
  'What is the most annoying sound?',
  'Name a planet.',
  'What is the best holiday?',
  'Name a farm animal.',
  'Name a sport played with a ball.',
  'What do you dip fries in?',
  'Name something that is round.',
  'What is the best kind of sandwich?',
  'Name a famous painter.',
  'Name a type of tree.',
  'What is the best candy bar?',
  'Name something you do on a rainy day.',
  'Name a country in Europe.',
  'What is the best movie snack?',
  'Name a bird that cannot fly.',
  'Name something with wheels.',
  'What is the best thing to drink in the morning?',
  'Name a famous ship.',
  'Name a shape.',
  'What is the best dog breed?',
  'Name something you find in a kitchen drawer.',
  'Name a fairy tale.',
  'What is the worst chore?',
  'Name a dessert.',
  'Name a famous tower.',
  'What is the best topping for a baked potato?',
  'Name something that is sticky.',
  'Name a vehicle that flies.',
  'What is the best camping food?',
  'Name a citrus fruit.',
  'Name a famous mouse.',
  'What is the best colour for a car?',
  'Name something you plant in a garden.',
  'Name an animal with stripes.',
  'What is the best soup?',
  'Name something you wear on your head.',
  'Name a type of cheese.',
  'What is the best video game ever?',
  'Name a dinosaur.',
  'Name something that makes you sneeze.',
  'What is the best flavour of chips?',
  'Name a famous detective.',
  'Name a sea creature.',
  'What is the best way to cook an egg?',
  'Name something that is purple.',
  'Name a kind of nut.',
  'What is the best amusement park ride?',
  'Name a famous bear.',
  'Name something you find in a bathroom.',
  'What is the best cereal?',
  'Name a month with 31 days.',
  'Name a famous duo.',
  'What is the best breakfast cereal mascot?',
  'Name something that is hot.',
  'Name an insect.',
  'What is the best thing about summer?',
  'Name a famous clock or watch.',
  'Name a type of pasta.',
  'What is the best kind of cookie?',
  'Name something that glows in the dark.',
  'Name a famous landmark in the USA.',
  'What is the best berry?',
  'Name something with a tail.',
  'Name a kind of bread.',
  'What is the best way to relax?',
  'Name a famous monster.',
  'Name something you bring on a road trip.',
  'What is the best salad dressing?',
  'Name a jungle animal.',
  'Name something that is soft.',
  'What is the best pie?',
  'Name a famous princess.',
  'Name a winter sport.',
  'What is the best spice?',
  'Name something that is green.',
  'Name a famous robot.',
  'What is the best thing to do at a sleepover?',
  'Name a type of shoe.',
  'Name an animal that lives in the ocean but is not a fish.',
  'What is the best taco filling?',
  'Name something you collect.',
  'Name a famous pirate.',
  'What is the best kind of weather?',
  'Name a kitchen appliance.',
  'Name a famous dog.',
  'What is the best thing to put in a smoothie?',
  'Name something people are afraid of.',
  'Name a card game.',
  'What is the best time of day?',
  'Name a famous castle.',
  'Name something that melts.',
  'What is the best drink at a party?',
  'Name a reptile.',
  'Name a famous cat.',
  'What is the best way to eat a potato?',
  'Name something with buttons.',
  'Name a capital city.',
  'What is the best part of a birthday party?',
  'Name a famous villain.',
  'Name a kind of flower.',
  'What is the best sound in the world?',
  'Name something you find in a toolbox.',
  'Name a famous racing car or driver.',
  'What is the best pancake topping?',
  'Name a mythical creature.',
  'Name something that is orange.',
  'What is the best animal to ride?',
  'Name a famous king.',
  'Name something that bounces.',
  'What is the best snack at a sports game?',
  'Name a famous bridge.',
  'Name an animal that hops.',
  'What is the best job in the world?',
  'Name something you do before bed.',
  'Name a famous queen.',
  'What is the best flavour of jelly bean?',
  'Name something you see at a circus.',
  'Name an Olympic sport.',
  'What is the best thing to find in your pocket?',
  'Name a famous horse.',
  'Name something that is shiny.',
  'What is the best emoji?',
  'Name a famous toy.',
  'Name something you find at a playground.',
  'What is the best food for a party?',
  'Name a famous ghost.',
  'Name something people put on a hot dog.',
  'What is the best superpower?',
  'Name a famous elephant.',
  'Name something that comes in a pair.',
  'What is the best smell?',
];

const USED_KEY = 'fs.herd.used';

function loadUsed(): number[] {
  try {
    const v = JSON.parse(localStorage.getItem(USED_KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function saveUsed(used: number[]) {
  try {
    localStorage.setItem(USED_KEY, JSON.stringify(used));
  } catch {
    /* private mode */
  }
}

/** A random question this phone hasn't shown yet; starts over once they've all been used. */
export function nextQuestion(skip?: string | null): string {
  let used = loadUsed();
  let fresh = QUESTIONS.map((_, i) => i).filter((i) => !used.includes(i) && QUESTIONS[i] !== skip);
  if (!fresh.length) {
    used = [];
    fresh = QUESTIONS.map((_, i) => i).filter((i) => QUESTIONS[i] !== skip);
  }
  const pick = fresh[Math.floor(Math.random() * fresh.length)];
  saveUsed([...used, pick]);
  return QUESTIONS[pick];
}
