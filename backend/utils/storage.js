// In-memory storage for demo (replace with MongoDB in production)
const users = new Map();
const rooms = new Map();
const messages = [];

// Sample interests for demo
const INTERESTS = [
  'Basketball',
  'Football',
  'Soccer',
  'Baseball',
  'Tennis',
  'Golf',
  'Hockey',
  'Cricket',
  'Volleyball',
  'Swimming',
  'Cycling',
  'Athletics',
  'Gymnastics',
  'Wrestling',
  'Judo',
  'Taekwondo',
  'Fencing',
  'Archery',
  'Shooting',
  'Rowing',
  'Canoeing',
  'Weightlifting',
  'Badminton',
  'Table Tennis',
  'Rugby Sevens',
  'Handball',
  'Water Polo',
  'Triathlon',
  'Skateboarding',
  'Sport Climbing',
  'Surfing',
  'Breaking',
  'MMA',
  'Boxing',
  'Esports'
];

const SPORTS = INTERESTS;

export { users, rooms, messages, INTERESTS, SPORTS };
