// Nostos, the practical guide (client request, 6 November 2026): a private working page for Maria,
// "a super practical, down-to-earth, real-life guide" to Athena's teaching. Not linked from the Nostos
// menu, not in the sitemap, noindex.
// NEW WORDING, proposed, all of it. Every step is drawn from the practices, stages, distinctions and
// lines in src/data/nostos/ (themselves drawn from 27 of Athena's talks, for Athena to review), and
// each `src` names the talk it comes from: [YouTube id, time if known]. The seven phases, the order,
// the times of day, the minutes, the sample day and the 30 days are an arrangement made for this
// draft, not Athena's own.

export type Src = [talk: string, t?: string];

export interface Step {
  name: string;
  how: string;
  why?: string;
  src?: Src;
}

/** Short names for the talks, for the source links */
export const talkShort: Record<string, string> = {
  '7YJYJLeJgUY': 'The Hidden Non-Duality',
  '1OBymLpYfTo': 'Plato and Non-Duality',
  UkAPRIOoiRw: 'The Art of Living',
  drptI20Rf5k: 'Chitheads podcast',
  'woq9ebR-Mqg': 'Know Thyself',
  DLOnGNrH3NQ: 'On the Harvard lectures',
  MW2u5olwgFc: 'The Second Birth of the Soul',
  'yQ_GUqR-29k': 'Eros as a Path of Awakening',
  Y70BLhDGLf8: 'Abstaining from Politics',
  '-mTgsVQO72E': 'Eros and Eudaimonia, Part A',
  QgYveGlAEhw: 'From Darkness to Light',
  COON0DK5OEU: 'What Is a Hellene?',
  'XKLuMi-UjLc': 'Apollo: the Five Steps',
  fqvKm4KHiJs: 'From Living to Living Well',
  WN2AHLV3COA: 'Pythagoras, First Lesson',
  ax4J8WPxq_c: 'What Awakening Is Not',
  '4uxz_yy9DLI': 'Love and Paideia, Part 2',
  zfeWFBTNZIo: 'The Cave: Introduction',
  G9I6oc0TnxI: 'The Odyssey Today',
  cRTJ00zjo1M: 'I Respect the Shame I Feel',
  '-Rmboz-OmJQ': 'The Archetype of Ares',
  cae0P7g3uFw: 'The Second Birth of Man',
  'DOdU0po-ehY': 'The Senses and Aroma',
  CxNdDf0M9IY: 'Ever-Living Fire, Part A',
  HY9w_6CSzm8: 'Ever-Living Fire, Part B',
  AAWZRTOINyA: 'The Cave of Ignorance',
  xLQXoDX7i94: 'Vox interview',
};

export const intro = {
  eyebrow: 'Nostos · a private draft',
  title: 'Living it',
  sub: 'A down-to-earth guide to Athena’s teaching',
  lead: 'Athena teaches a great deal of knowledge, and keeps saying it is not enough: it has to become how you live. This page takes that at its word, and turns the teaching into things you can do on an ordinary Tuesday.',
  line: { text: 'Awakening that does not become life is incomplete awakening.', src: ['-Rmboz-OmJQ', '1:28:21'] as Src },
  note: 'A working draft, not for publication. Everything here comes from the 173 practices and 90 sets of stages already gathered in Nostos from 27 of Athena’s talks, and each step links to the talk it comes from. The seven phases, the order, the times of day, the minutes and the sample day are an arrangement made for this draft, not Athena’s own, and Athena has not seen any of it.',
};

/* ------------------------------------------------------------------------------------------------ */

export const words = {
  title: 'The big words, on a Tuesday',
  intro: 'Most of Athena’s key words are older than our ideas of them. Here is what each one asks of you in practice.',
  items: [
    {
      greek: 'παιδεία',
      latin: 'paideia',
      means: 'Not schooling. Schooling fills you with information; paideia turns the eye of the soul from outside to inside, and changes the way you see. “Know thyself” is its shortest road.',
      tuesday: 'The moment you notice you are reacting, and look at the reaction instead of at whatever set it off.',
      src: ['xLQXoDX7i94', '8:52'],
    },
    {
      greek: 'γνῶθι σαυτόν',
      latin: 'know thyself',
      means: 'Two stages. First, know your preferences, personality, body, desires, feelings and thoughts. Then know that which knows them: the observer itself. You are not what you have.',
      tuesday: 'When you are irritated, asking not only “why am I annoyed?” but “who is watching the annoyance?”',
      src: ['UkAPRIOoiRw', '12:53'],
    },
    {
      greek: 'εὐδαιμονία',
      latin: 'eudaimonia',
      means: 'Not luck and not a good mood. Luck turns on fortune’s wheel; eudaimonia is a stable fullness that holds whatever happens. Athena notes it is what we now call awakening or enlightenment.',
      tuesday: 'The car horn still makes you jump. You just don’t spend the next hour being thrown about by it.',
      src: ['QgYveGlAEhw', '16:29'],
    },
    {
      greek: 'κάθαρσις',
      latin: 'catharsis',
      means: 'Cleaning, and mostly by taking away. Truth is reached by subtraction: the views, habits and passions that make you suffer are washed out, and what was always there shows through.',
      tuesday: 'Saying no to the third glass, the late-night scrolling or the old argument, and noticing how much lighter it feels.',
      src: ['XKLuMi-UjLc'],
    },
    {
      greek: 'ἦθος · ἀρετή',
      latin: 'ethos · virtue',
      means: 'Ethics, Athena says, does not mean morality: it means habits of energy. Virtue is the easy flow of the soul, and non-virtue is whatever blocks that flow.',
      tuesday: 'Treating a sulk not as a sin but as a blockage, and asking what would let it move again.',
      src: ['drptI20Rf5k', '39:04'],
    },
    {
      greek: 'ἔρως',
      latin: 'eros',
      means: 'The force that moves the whole path. Not attachment and not control: to love means “I am the ally of your freedom”. It widens from one person to a city to the whole.',
      tuesday: 'Being glad, after the first pang, when someone you love takes the chance that will take them away from you three days a week.',
      src: ['xLQXoDX7i94', '24:57'],
    },
    {
      greek: 'λόγος',
      latin: 'logos',
      means: 'Not thinking. Logos is the one in you that observes what you live, the energy of consciousness itself.',
      tuesday: 'The part of you that can see you are about to send that email in anger, while you are still angry.',
      src: ['WN2AHLV3COA'],
    },
    {
      greek: 'ἀπορία',
      latin: 'aporia',
      means: 'Not knowing, on purpose. Starting from “I know that I do not know” opens the pores; renouncing knowledge is the beginning of knowledge.',
      tuesday: 'Going into a conversation with a real question instead of a position.',
      src: ['zfeWFBTNZIo'],
    },
    {
      greek: 'ἐξαίφνης',
      latin: 'suddenly',
      means: 'Awakening cannot be scheduled. You ripen, and it comes in its own hour, often through a shock or a great love that shakes a boxed-in life awake.',
      tuesday: 'Keeping up the practice without checking whether it is “working”.',
      src: ['cae0P7g3uFw', '1:08:08'],
    },
    {
      greek: 'ἐμμένεια',
      latin: 'immanence',
      means: 'Remaining in. First the One is sought beyond everything; then it is recognised in everything, the tax office included. The journey ends with a return, not a fairy tale.',
      tuesday: 'Silently greeting “my dear One” in the person who has just pushed in front of you.',
      src: ['MW2u5olwgFc'],
    },
  ] as { greek: string; latin: string; means: string; tuesday: string; src: Src }[],
};

/* ------------------------------------------------------------------------------------------------ */

export interface Phase {
  id: string;
  greek: string;
  name: string;
  tagline: string;
  feels: string[];
  do: Step[];
  watch: string[];
  shift: string;
  ladders: { ladder: string; rung: string; src: Src }[];
}

export const phases = {
  title: 'Seven phases of the way up, and back',
  intro: [
    'Athena describes the ascent in many ladders: the Cave, the second birth of the soul, Apollo’s five names, the ladder of virtues, the stages of Pythagorean paideia. They don’t line up one to one, but they tell the same story, and here they are laid side by side as seven phases.',
    'Two of Athena’s warnings belong at the start. The phases are not a timetable: the decisive step comes “suddenly”, and nobody can schedule it. And they are not a ranking: as long as someone is checking which step they are on, that someone is still the one who has not arrived. Read them as a map of where you might be, never as a scoreboard.',
  ],
  items: [
    {
      id: 'itch',
      greek: 'φαίνεται',
      name: 'The itch',
      tagline: 'Something in you says: this can’t be all.',
      feels: [
        'You are fed up, and the thought “this can’t be all” keeps coming back.',
        'A loss, an illness, a break-up or a great love has knocked something loose.',
        'You catch yourself searching: books, podcasts, videos at one in the morning.',
        'The adolescent questions are back: who am I, why am I here, what is all this for?',
      ],
      do: [
        { name: 'Read the pain as an alarm clock', how: 'When pain, loss or grief arrives, pause before you fix anything, and ask what condition it is calling you to change.', why: 'Pain in becoming is the soul’s wake-up call out of sleep.', src: ['MW2u5olwgFc'] },
        { name: 'Take the exhaustion seriously', how: 'Treat being fed up as the push to start looking for what is true, not as a mood to cure with a holiday.', why: 'Pain is the perfect motive to lead us to truth.', src: ['UkAPRIOoiRw', '24:48'] },
        { name: 'Keep the adolescent questions', how: 'Write them on the first page of a notebook (who am I, why am I here, what is existence for?) and don’t rush to answer them.', why: 'These questions start the path that leads to self-knowledge.', src: ['woq9ebR-Mqg'] },
        { name: 'Admit that you don’t know', how: 'Say it honestly, and let it make you ask, as the restless prisoner asks whether things are really as he was told.', why: 'Asking opens the pores, and Apollo begins to reveal himself.', src: ['XKLuMi-UjLc'] },
        { name: 'Leave the door open', how: 'Truly want change, and leave a little room for eros.', why: 'Even the universe respects free will: wanting is what turns the wheels.', src: ['cRTJ00zjo1M'] },
      ],
      watch: [
        'Curing the itch with a purchase, a trip or a new relationship, and calling it solved.',
        'Banging on the cave wall: looking for the way out in your circumstances. Banging only takes you deeper; the way out is inward.',
      ],
      shift: 'The search stops being a mood and becomes a decision.',
      ladders: [
        { ladder: 'The Cave', rung: 'Chained deep inside, facing the wall of shadows', src: ['zfeWFBTNZIo', '1:09:29'] },
        { ladder: 'Apollo', rung: 'Πύθιος: the beginner, the restless prisoner who starts to ask', src: ['XKLuMi-UjLc', '1:28:03'] },
        { ladder: 'How awakening unfolds', rung: 'Searching, even on the internet', src: ['XKLuMi-UjLc', '1:47:24'] },
      ],
    },
    {
      id: 'turn',
      greek: 'μεταστροφή',
      name: 'The turn',
      tagline: 'You decide to look inward, and you choose a way to do it.',
      feels: [
        'You have said, out loud or on paper: “I want to know myself.”',
        'You have found a teaching that speaks to you, and perhaps a few people who want the same thing.',
        'Everything is new and slightly dizzying: what you took for real looks less certain.',
      ],
      do: [
        { name: 'Decide to know yourself', how: 'Say “I want to know myself”, and give your inner world the attention you would give a loved one’s heart.', why: 'The desire to know is the first step of knowledge.', src: ['fqvKm4KHiJs', '32:02'] },
        { name: 'Write your intention', how: 'Ask why you are here and what you truly want from this. Write it in the notebook, date it, and plan to re-read it in a year.', why: 'To see whether your motive has been transformed, fulfilled, or has vanished.', src: ['zfeWFBTNZIo'] },
        { name: 'Start from not knowing', how: 'Begin with “I know that I do not know”, and empty out what school, the news and habit taught you as truth.', why: 'Truth, like death, is subtractive.', src: ['MW2u5olwgFc'] },
        { name: 'Dig deep in one place', how: 'Choose one path and one teaching, and commit to study and practice over time.', why: 'You will not find the alchemist’s gold by digging one-metre holes here and there, as social media tempts us to.', src: ['AAWZRTOINyA'] },
        { name: 'Look in your own root first', how: 'Before running East, study the tradition you started from, and look for the practices hidden in its texts.', why: 'Everything you seek is where you started.', src: ['drptI20Rf5k'] },
        { name: 'Choose helpers well', how: 'Look for a teacher or guide whose motive is pure and who has walked the path. Then still do the inner work yourself.', why: 'No one can lead you on a road they have not crossed, and no one can walk it for you.', src: ['cRTJ00zjo1M'] },
        { name: 'One minute of gratitude', how: 'Before each study session, pause for a minute and recognise three things: your ripened wish to be free, your access to a teaching, and the companions who share it.', why: 'Tradition calls this meeting a rare and blessed conjuncture; gratitude is the key that opens the path.', src: ['zfeWFBTNZIo', '1:07'] },
      ],
      watch: [
        'Spiritual shopping: a retreat here, a course there, never staying long enough for anything to grow.',
        'Turning the new truth into a banner and preaching it at dinner.',
      ],
      shift: 'The teaching stops being interesting information and becomes something you do.',
      ladders: [
        { ladder: 'The Cave', rung: 'Freed and turned around, confused about what is real', src: ['zfeWFBTNZIo', '1:09:29'] },
        { ladder: 'The second birth', rung: 'Conception', src: ['MW2u5olwgFc', '58:08'] },
        { ladder: 'Pythagorean paideia', rung: 'Train ὀρθὸς λόγος: clarity, observation, telling true from false', src: ['WN2AHLV3COA', '1:07:02'] },
      ],
    },
    {
      id: 'cleaning',
      greek: 'κάθαρσις',
      name: 'The cleaning',
      tagline: 'The long middle: watching yourself, and washing out what makes you suffer.',
      feels: [
        'You start to notice your thoughts, moods and reflexes as they happen, and it is not always flattering.',
        'Old habits and passions come up exactly when you are trying hardest. Athena says this is how it goes: they surface to be cleansed.',
        'Some days it is “extremely therapeutic”. Some days it feels like going to war.',
      ],
      do: [
        { name: 'Observe yourself through the day', how: 'Ask: what am I desiring, what am I feeling, what quality did that emotion just have? Catch the daydream: where did this thought start, and where is it going?', why: 'This stage restores the soul’s free flow.', src: ['fqvKm4KHiJs'] },
        { name: 'Before, during, after', how: 'Before an act, look at your motive and your energy. During it, keep watching them. Afterwards, review them.', why: 'A Pythagorean practice that purifies the passions and steers action to the good.', src: ['woq9ebR-Mqg'] },
        { name: 'Say «No», then plant a «Yes»', how: 'Name one old state that tosses you about and refuse it. Then ask what you will build in its place, and tend it: water, prune, be patient.', why: 'A No not accompanied by a Yes is lame, and stays locked to what it opposes.', src: ['COON0DK5OEU', '16:41'] },
        { name: 'Replant a habit', how: 'With a clear intention, stop expressing one trait that does not help you, and sow a good habit where it was.', why: 'You move from passive observer to active maker of your character.', src: ['fqvKm4KHiJs'] },
        { name: 'Dry the passions', how: 'Notice fear, anger, jealousy and envy as wet, sticky states. Turn inward, and cultivate the virtue on the other side of each.', why: 'Heraclitus: the dry soul is wisest and best.', src: ['CxNdDf0M9IY'] },
        { name: 'Purify the senses', how: 'With each contact ask: what am I receiving, what satisfies me, what do I lose? Move towards what benefits and away from what harms.', why: 'The senses are a path of purification, not something to escape.', src: ['DOdU0po-ehY'] },
        { name: 'Purity before power', how: 'Lay a base of virtue before you chase energy, intensity or influence, and then put that force at the service of wisdom, never of passing passions.', why: 'Without purity the vital fire becomes Plato’s black horse.', src: ['-Rmboz-OmJQ'] },
      ],
      watch: [
        'Self-flagellation. Respect your shame instead: “I’m human, I erred, I deceived myself here. What can I learn?” Then adjust and move on.',
        'Rushing to theory. Athena’s ladder of virtues puts purification before theory, because knowledge without virtue is dangerous.',
      ],
      shift: 'Watching yourself stops being an effort and becomes the background of the day. Virtue starts to feel less like discipline and more like ease.',
      ladders: [
        { ladder: 'The Cave', rung: 'Dragged up the rough, steep ascent, eyes burning', src: ['zfeWFBTNZIo', '1:09:29'] },
        { ladder: 'Apollo', rung: 'ἀπολούων: the washing, which starts with the will to change', src: ['XKLuMi-UjLc', '1:28:03'] },
        { ladder: 'The ladder of virtues', rung: 'Ethical, then cathartic virtues', src: ['woq9ebR-Mqg', '57:45'] },
        { ladder: 'Self-knowledge', rung: 'Observe continuously; become the maker of your character', src: ['fqvKm4KHiJs', '32:02'] },
      ],
    },
    {
      id: 'night',
      greek: 'κυοφορία',
      name: 'The long night',
      tagline: 'Something new is growing in you, and it needs protecting.',
      feels: [
        'You are unsure what is real, and people close to you may think you have gone a little mad.',
        'Signs and coincidences: a book falls open at the right page, a stranger says the very thing you needed.',
        'Rock-bottom moments. In the Cave, the darkest night comes nearest the exit.',
      ],
      do: [
        { name: 'Protect what is growing', how: 'Stay quiet, humble and close to yourself. Take only pure “food”, on every level. Avoid quarrels and shadow-boxing with people still bound, and don’t be discouraged if you are called mad.', why: 'The embryo of awakening is vulnerable and must be hidden from what mocks it.', src: ['MW2u5olwgFc'] },
        { name: 'Find the “I am”', how: 'Close eyes, ears and mouth to the outside, and attend to what stays stable while everything changes: the same “I am” at five, at twenty and at a hundred. Stay there.', why: 'This is the apprenticeship that carries the second birth to term.', src: ['cae0P7g3uFw'] },
        { name: 'Go down with the hero’s torch', how: 'In the dark season, look for your monsters and passions. Trace their roots in events, family and ancestors. Look at them face to face, without fear, wishing for them to change.', why: 'Simply facing what you find begins the alchemy of catharsis.', src: ['QgYveGlAEhw', '2:06:49'] },
        { name: 'Light or nothing', how: 'At rock bottom, don’t quit. Stay at the height of your soul.', why: 'You are reborn in a way no one could have staged: trauma becomes θαῦμα, wonder.', src: ['QgYveGlAEhw'] },
        { name: 'In the labour', how: 'Surrender, don’t fear, push, and have a good midwife: a teacher or a helper.', why: 'Then the birth into light can happen at its ripe hour.', src: ['MW2u5olwgFc'] },
        { name: 'Keep on going', how: 'When the path is hard, don’t stop.', why: 'Athena’s advice to her younger self: you will find the way.', src: ['1OBymLpYfTo'] },
      ],
      watch: [
        'Forcing it. Keep practising without scheduling the result: its hour cannot be programmed.',
        'Getting lost in the dark. Athena calls depression a kind of deep rest, the soul’s cry to be freed, and in the same breath says to seek help so you don’t get lost there. That can mean a doctor or a therapist.',
      ],
      shift: 'Not something you do. The birth comes “suddenly”, when it is ripe.',
      ladders: [
        { ladder: 'The second birth', rung: 'Gestation, then labour and birth', src: ['MW2u5olwgFc', '48:12'] },
        { ladder: 'The Cave', rung: 'Approaching the exit, dazzled: the longest night', src: ['MW2u5olwgFc', '1:07:44'] },
        { ladder: 'Apollo', rung: 'Δήλιος: truth declared through signs, like birth pangs', src: ['XKLuMi-UjLc', '1:28:03'] },
      ],
    },
    {
      id: 'glimpses',
      greek: 'Φαναῖος',
      name: 'Glimpses',
      tagline: 'The veil opens for an instant, and closes again.',
      feels: [
        'Moments of unity: in meditation, in nature, in love, sometimes in the middle of the washing-up.',
        'Afterwards, ordinary life can feel flat, and you want the moment back.',
      ],
      do: [
        { name: 'Rest after an opening', how: 'Stay with it a while. Let yourself be nourished and strengthened before you act on it.', why: 'Like a newborn’s first forty days, new consciousness needs strengthening.', src: ['MW2u5olwgFc'] },
        { name: 'Enjoy it without mistaking it', how: 'Welcome visions, energy or an opening heart as steps, and don’t confuse them with awakening.', why: 'Awakening is not an experience; it is a witness.', src: ['ax4J8WPxq_c', '4:13'] },
        { name: 'The apophatic test', how: 'When you think “this is it”, pause and ask: am I still seeing or understanding something? If so, keep going: you have not reached Ithaca yet.', why: 'The One is no “something”, so any object, even God or light, is not yet it.', src: ['ax4J8WPxq_c'] },
        { name: 'Choose one direction', how: 'Drop wanting to do everything. Keep one target, like the archer whose will has stopped changing.', why: 'At the archer’s step the will stops wavering.', src: ['XKLuMi-UjLc'] },
        { name: 'Steady the flashes', how: 'Don’t chase the “wow” moments. Build a philosophical, virtuous and musical way of life around them, and hold it with a steady will.', why: '“It is raining awakenings”; what matters is a stable way of life.', src: ['XKLuMi-UjLc'] },
      ],
      watch: [
        'Collecting experiences. Energy, astral or out-of-body experiences are stages, not goals.',
        'Saying “I am awakened”. Athena takes that sentence as a sign that the road continues.',
      ],
      shift: 'The glimpses stop being events and start being the ground you stand on.',
      ladders: [
        { ladder: 'Apollo', rung: 'Φαναῖος: direct glimpses; then ἀεὶ βάλλων, the archer’s steady will', src: ['XKLuMi-UjLc', '1:28:03'] },
        { ladder: 'The Cave', rung: 'Seeing by night, by the stars', src: ['zfeWFBTNZIo', '1:09:29'] },
        { ladder: 'How awakening unfolds', rung: 'Small tastes of unity', src: ['XKLuMi-UjLc', '1:47:24'] },
      ],
    },
    {
      id: 'settling',
      greek: 'εὐδαιμονία',
      name: 'Settling',
      tagline: 'Not learning something new: recognising what you already are.',
      feels: [
        'Less drama. Things still happen and you still feel them, but they move the surface, not the depth.',
        'Athena names three marks that do show: a universal, impersonal love; εὐθυμία, a childlike cheer that sees life as divine play; and indifference to goals that serve only the ego.',
      ],
      do: [
        { name: 'Know the knower', how: 'Turn awareness back on itself. Where am I? What am I? Who thinks? Notice that you find no person or thing, only boundlessness, freedom, timelessness and peace. Repeat it.', why: 'Athena calls it easy and doable now; repeated, it may open the exit of the cave.', src: ['UkAPRIOoiRw'] },
        { name: 'Dis-identify', how: 'Tell yourself: I have thoughts, emotions, desires and a body. Recall how much your body has changed while the “I” stayed. Rest as the one who is aware of them.', why: 'You are not what you have.', src: ['UkAPRIOoiRw'] },
        { name: 'Find your mast', how: 'When something throws you up and down, notice how far, and come back to your inner axis.', why: 'Eudaimonia is staying at your mast while fortune’s wheel turns.', src: ['cRTJ00zjo1M'] },
        { name: 'Don’t stop at knowledge', how: 'If you know the high ideas and the numbers, keep going until you unite with the source, and be ready to let the knowledge go.', why: 'The Good is beyond knowledge; whoever stops to know it is stuck a stage before.', src: ['AAWZRTOINyA'] },
      ],
      watch: [
        'Staying in the car. Knowledge is the vehicle that takes you to the foot of the mountain, and some people never get out and walk.',
        'Mistaking calm for not caring. Ἀπάθεια is steadiness, not indifference: you simply stop investing your happiness in what others do or don’t do.',
      ],
      shift: 'There is nowhere further up to go. The only direction left is back.',
      ladders: [
        { ladder: 'The Cave', rung: 'Seeing by day, then the sun itself, the Good', src: ['zfeWFBTNZIo', '1:09:29'] },
        { ladder: 'Apollo', rung: 'Ἰσμήνιος: “we know” and “we are”', src: ['XKLuMi-UjLc', '1:28:03'] },
        { ladder: 'The second birth', rung: 'Nourished and strengthened, then beholding the Sun of the Good', src: ['MW2u5olwgFc', '48:12'] },
      ],
    },
    {
      id: 'return',
      greek: 'ἐμμένεια',
      name: 'The return',
      tagline: 'Back into the cave, to work, family and the tax office, and seeing the One there.',
      feels: [
        'You are back in ordinary life, doing ordinary things, and they are no longer ordinary.',
        'You can no longer work only for yourself.',
      ],
      do: [
        { name: 'Go back after the opening', how: 'Return to work, loved ones and admin, and practise seeing the One and the fire there.', why: 'Initiation is complete only with immanence.', src: ['HY9w_6CSzm8'] },
        { name: 'Play the role, don’t become it', how: 'Keep your duties, even strict or serious ones. Play them consciously, with the inner lightness of the eternal child.', why: 'You play the role; you are not the role.', src: ['ax4J8WPxq_c', '30:20'] },
        { name: 'After every insight, work', how: 'Ask which channel suits your soul (art, science, care, law, solidarity), and express the insight there.', why: 'Awakening must be embodied, personally and politically.', src: ['WN2AHLV3COA'] },
        { name: 'Re-centre your goals', how: 'Keep your aims, but take yourself out of the middle of them and put the whole there. Work for the benefit, freedom and awakening of all beings.', why: 'Ego-goals serve someone who does not exist.', src: ['ax4J8WPxq_c'] },
        { name: 'Live for the common good', how: 'On waking, ask what you will do for the whole, not only your own circle. Gather with others in dialogue and philosophy.', why: 'The last step is “not I, but we”.', src: ['XKLuMi-UjLc'] },
      ],
      watch: [
        'Staying above. Living in the experience of freedom and avoiding daily life; seeing the cave as “the others over there” is still dualism.',
        'Using “all is one” as an excuse, either for nihilism (nothing matters) or for hedonism (anything goes). The ancients answered both with virtue.',
      ],
      shift: 'The circle closes, and opens again: “Every end of mine is my beginning.”',
      ladders: [
        { ladder: 'The Cave', rung: 'Going back down, out of compassion', src: ['zfeWFBTNZIo', '1:09:29'] },
        { ladder: 'Apollo', rung: 'ὁμοπολῶν, the music that joins the poles; then Λεσχηνόριος, philosophy shared', src: ['XKLuMi-UjLc', '1:28:03'] },
        { ladder: 'Philosophy’s two movements', rung: 'First ὑπέρβασις, beyond; then ἐμμένεια, within', src: ['MW2u5olwgFc', '1:41:49'] },
      ],
    },
  ] as Phase[],
};

/* ------------------------------------------------------------------------------------------------ */

export const habits = {
  title: 'Daily habits',
  intro: 'A menu, not a regime. Every habit here is one of Athena’s practices, set at the time of day it suits; the minutes are only suggestions. Start with two or three and add slowly. Athena’s own rule for any teaching is to take one key home and live it.',
  introSrc: ['CxNdDf0M9IY'] as Src,
  groups: [
    {
      id: 'morning',
      label: 'Morning',
      items: [
        { name: 'Look at the light', how: 'Before the phone, open the curtains or step outside and look at the morning light for a minute (at the light, never straight into the sun).', why: 'Athena counts waking up and looking at the sun among the ways to make yourself lovable: eros is woken by beauty.', src: ['COON0DK5OEU'] },
        { name: 'One question for the day', how: 'Before you get up: what will I do today for the whole, not only for my own circle?', why: 'The last step of the path is “not I, but we”, and it can be practised from the first.', src: ['XKLuMi-UjLc'] },
        { name: 'Sit', how: '10 to 20 minutes, with one of the meditations below. Stay with the same one for a few weeks before you try another.', why: 'Paideia trains the inner seeing that everyone has and few use.', src: ['zfeWFBTNZIo'] },
        { name: 'Stand up', how: 'When you finish, get up and do something with it. Athena adds Ares, the working force, to every meditation.', why: 'Meditation alone works on mind and feeling; awakening that does not become life is incomplete.', src: ['-Rmboz-OmJQ', '1:28:21'] },
        { name: 'One line of intention', how: 'Write a single line in the notebook: what you mean to do today, and in what spirit.', why: 'Intention shapes your position, and your position shapes what you can see.', src: ['CxNdDf0M9IY', '10:01'] },
        { name: 'One page', how: 'A page of a primary text, read slowly. Before it, a minute of gratitude; after it, the Socratic question: ποία χρεία, what use is this, what does it change in how I live?', why: 'Socrates disliked idle philosophising: knowledge must serve life.', src: ['zfeWFBTNZIo'] },
      ] as Step[],
    },
    {
      id: 'day',
      label: 'Through the day',
      items: [
        { name: 'Name how your mind is working', how: 'Whenever you remember: “now I am functioning this way, now that way”. Anxious, planning, comparing, enjoying.', why: 'Bringing it from unconscious to conscious is walking towards the cave’s exit.', src: ['zfeWFBTNZIo'] },
        { name: 'Catch your conjectures', how: 'When you read a mood into a frown or a silence, pause and ask whether the meaning came from them or from what you carry.', why: 'Conjecture works from our own shadows and projections: the lowest level of the cave.', src: ['AAWZRTOINyA'] },
        { name: '“My dear One”', how: 'At the tax office, in traffic, in a heated meeting: silently greet the One there, and tell yourself, “one more game”.', why: 'Immanence means recognising the One in everything, including what annoys us.', src: ['MW2u5olwgFc'] },
        { name: 'Watch your yeses and noes', how: 'Notice each small yes and no as you give it.', why: 'Their sum sets your course, as Heracles chose at the crossroads.', src: ['COON0DK5OEU'] },
        { name: 'Guard what goes in', how: 'Choose the music, the sounds, the scents and the images you take in, instead of taking what comes. Prefer flowers, herbs and incense to synthetic perfume.', why: 'Listening, Athena says, is the most important spiritual act: sound flows straight into the soul and shapes character.', src: ['7YJYJLeJgUY'] },
        { name: 'Ask a craving what it wants', how: 'When a desire pulls, ask what fullness it is really after (rest, company, recognition), and look for that fullness within.', why: 'Behind every desire the soul is seeking the Good.', src: ['DOdU0po-ehY'] },
        { name: 'Love in four registers', how: 'A good word to everyone, a good thought about everyone, a feeling of love towards everyone, and help in action wherever you can.', why: 'This is the natural ethics of someone who sees consciousness as common.', src: ['-mTgsVQO72E'] },
        { name: 'Let go of being right', how: 'When you catch yourself wanting to be proved right, remember you have probably lost justice already, and aim for balance instead.', why: '“Where I want to find my rights, I have probably lost justice.”', src: ['HY9w_6CSzm8', '55:33'] },
        { name: 'Die a little', how: 'Once a day, pick one identification (a role, a label, a belief, an image of your body), let it go for a moment, and ask: what am I beyond what I seem to be?', why: 'Philosophy is a practice of dying, and Socrates means daily.', src: ['MW2u5olwgFc'] },
      ] as Step[],
    },
    {
      id: 'evening',
      label: 'Evening',
      items: [
        { name: 'The Ares audit', how: 'Two questions in the notebook. Where did my vital energy go in these 24 hours? Whom, or what, did my warrior serve?', why: 'Ares is our working force, and we must know what we give it to.', src: ['-Rmboz-OmJQ'] },
        { name: 'Review the day', how: 'Run back through it. What was I desiring, what was I feeling, what mood did I carry around all day? No verdicts, only seeing.', why: 'Observation, Athena says, is “extremely therapeutic”.', src: ['fqvKm4KHiJs'] },
        { name: 'Respect your shame', how: 'If something went wrong: “I’m human, I erred, I deceived myself here. What can I learn?” Adjust, and let it go.', why: 'Shame is justice regulating itself in us; the danger is feeling nothing.', src: ['cRTJ00zjo1M'] },
        { name: 'Close with thanks', how: 'End the day with gratitude, and pair your effort with openness to grace, as the old proverb says: with Athena (the goddess), move your hand too.', why: 'Thanksgiving activates grace, the factor no one can calculate.', src: ['fqvKm4KHiJs'] },
      ] as Step[],
    },
    {
      id: 'week',
      label: 'Every week',
      items: [
        { name: 'An evening alone', how: 'A few hours without phone or television. Let what you have pushed down come up, and listen to your conscience.', why: 'It isn’t loneliness we flee but conscience: alone, without distraction, it starts to speak.', src: ['cRTJ00zjo1M'] },
        { name: 'A real conversation', how: 'Meet in person with people who share the wish. Read together, and ask together.', why: '“We are a lesche”: a place where people talk philosophy for the common good.', src: ['XKLuMi-UjLc', '1:53:18'] },
        { name: 'Poetry next to philosophy', how: 'Read a poem alongside the week’s philosophy.', why: 'Analysis alone will not do it; poetry comes closest to the ineffable.', src: ['1OBymLpYfTo'] },
        { name: 'Open one Greek word', how: 'Take one word (ἐλευθερία, εὐδαιμονία, ἔρως), unpack its parts and roots, and draw out the teaching folded into it.', why: 'Following Proclus, the meaning can be reached through the word itself.', src: ['drptI20Rf5k'] },
        { name: 'Beauty on purpose', how: 'Walk among old stones or by the sea, listen to harmonious music, read the ancients. Take none of it for granted.', why: 'Eros is woken by the beautiful.', src: ['COON0DK5OEU'] },
        { name: 'One act at your own scale', how: 'Something for your street, your village or your community: show up where people reason together.', why: 'Abstaining from politics is itself a political stance.', src: ['Y70BLhDGLf8', '4:07'] },
      ] as Step[],
    },
    {
      id: 'year',
      label: 'Through the year',
      items: [
        { name: 'The four turnings', how: 'Mark the solstices and equinoxes. Sow intentions at the equinoxes; treat the solstices as gates.', why: 'Re-attuning to nature’s rhythm pulls you out of the cave, and like the gym, no one can do it for you.', src: ['QgYveGlAEhw', '22:55'] },
        { name: 'The winter descent', how: 'In the darkest weeks, turn inward. Face your monsters, trace their roots, uproot them and sow virtues in their place.', why: 'Descent is the condition of the inner birth: the inner sun is born.', src: ['QgYveGlAEhw', '2:06:49'] },
        { name: 'Use the festivals', how: 'Ask what archetype Christmas or Easter carries, and what it says about your soul. People are softer and more open on festive days: use that for inner work.', why: 'Every great festival encodes an archetype of the soul’s journey.', src: ['MW2u5olwgFc', '0:28'] },
        { name: 'Re-read the notebook', how: 'Once a year, re-read the intention you wrote at the start.', why: 'To see whether it has been transformed, fulfilled, or has vanished.', src: ['zfeWFBTNZIo'] },
        { name: 'One whole book', how: 'The Republic, cover to cover. In three years, three times; only then argue about it.', why: 'It is an ark of knowledge that rewards full immersion.', src: ['7YJYJLeJgUY'] },
      ] as Step[],
    },
  ],
};

export const meditations = {
  title: 'The meditations, step by step',
  intro: 'Five of Athena’s practices for the morning sit, from the simplest. The minutes are suggestions.',
  items: [
    {
      name: 'Eyes open, eyes closed',
      mins: 'about 5 minutes · to begin with',
      steps: [
        'Open your eyes and note what is there: “something, something, many somethings”.',
        'Close them, and ask: is there “something” here, or a boundless expanse?',
        'Expect darkness at first. With training, Athena says, it becomes luminous.',
      ],
      src: ['zfeWFBTNZIo'] as Src,
    },
    {
      name: 'Ὄν, a chant to start',
      mins: '2 minutes · before any of the others',
      steps: ['Chant “on”, slowly.', 'Feel the N vibrate on the palate.', 'Rest in the vibration when the sound stops.'],
      src: ['7YJYJLeJgUY'] as Src,
    },
    {
      name: 'Know the knower',
      mins: '10 minutes',
      steps: [
        'Turn your awareness back on itself.',
        'Ask, slowly: Where am I? What am I? What am I made of? Who thinks?',
        'Try to become aware of the awareness you are.',
        'Notice that you find no person and no thing: only boundlessness, freedom, timelessness and peace.',
        'Stay there. Repeat it daily.',
      ],
      src: ['UkAPRIOoiRw'] as Src,
    },
    {
      name: 'Into emptiness',
      mins: '10 to 15 minutes',
      steps: [
        'Sit, and don’t fill the meditation with pictures (a beach, a light, the kitchen).',
        'Each time content comes, let it go, and move towards purity of mind.',
        'Rest as mind resting in itself, without content.',
      ],
      src: ['XKLuMi-UjLc'] as Src,
    },
    {
      name: 'The ether meditation',
      mins: '20 minutes · the fullest',
      steps: [
        'Eyes open: look at the objects in the room and how they stand to you.',
        'Shift your attention from the objects to the space they sit in. Notice the body relax, the heart open, the gaze widen.',
        'Close your eyes, find the breath, and feel the space inside.',
        'Place one short thought or image at the centre of the mind’s screen, and breathe with it.',
        'Shift attention from that thought to the space it appears in, which is there before it and after it.',
        'Recognise its qualities: vast, open, softly alive, luminous, timeless. Recognise it as the “I” that sees and hears.',
        'Feel that space through the neck, the heart, the hands, the belly, the back, the legs, the soles: the space breathes the body.',
        'Let body, awareness and space merge into the present: the inner and the outer space are one.',
        'Open your eyes, and keep the recognition as the forms start to move again.',
      ],
      src: ['7YJYJLeJgUY'] as Src,
    },
  ],
};

/* ------------------------------------------------------------------------------------------------ */

export const day = {
  title: 'A day on the path',
  intro: [
    'Athena warns against picturing the awakened by their habits: no aura, diet, vocabulary or lifestyle marks them out, and anyone who calls themselves awakened is still on the road. So this is not a portrait of an enlightened person.',
    'It is an ordinary weekday, with a job, a partner and a bad commute, lived with the practices on this page. The day is invented; every move in it is Athena’s.',
  ],
  introSrc: ['ax4J8WPxq_c'] as Src,
  items: [
    { time: '06:45', text: 'You wake before the alarm and go to the window before you touch the phone. Grey light over the roofs. A minute of looking. One question before the day starts: what will I do today for the whole, and not only for me?', uses: ['Look at the light', 'One question for the day'] },
    { time: '07:00', text: 'Twenty minutes of the ether meditation. Your mind writes three emails during it. Each time, you notice the email, and then the space the email appears in. Then you get up. You don’t skip that part.', uses: ['The ether meditation', 'Stand up'] },
    { time: '07:25', text: 'One line in the notebook: “Listen more than I talk at the eleven o’clock meeting.”', uses: ['One line of intention'] },
    { time: '07:35', text: 'Coffee, and one page of the Phaedo. One sentence stays with you, and you ask it: what use are you to me today?', uses: ['One page'] },
    { time: '08:20', text: 'Someone cuts across two lanes in front of you. Your hand is already on the horn. Instead: “my dear One”, and under your breath, “one more game”. It doesn’t feel saintly. It just works better than the horn.', uses: ['“My dear One”'] },
    { time: '09:30', text: 'Your manager answers your good morning with a short nod, and the story starts by itself: the report must have been bad. You catch it. Is that their mood, or yours? You don’t know, and you let it stay not known.', uses: ['Catch your conjectures'] },
    { time: '11:00', text: 'The meeting. A colleague says something you think is plainly wrong, and you feel the heat rise: you want to be right. You notice the heat, and what it is protecting (your competence, your years in the job). You ask a question instead of making a point, and before arguing, you ask what each of you means by “quality”.', uses: ['Let go of being right', 'Define before you discuss'] },
    { time: '13:00', text: 'Lunch, away from the desk. You eat slowly enough to taste it, and ask the senses’ question: what am I receiving, what satisfies me, what am I losing?', uses: ['Purify the senses'] },
    { time: '15:30', text: 'The slump. Your thumb is already opening an app. You stop and ask what the craving is actually after: rest, company, a small win? It is rest. Five minutes with your eyes closed does more than twenty of scrolling.', uses: ['Ask a craving what it wants', 'Eyes open, eyes closed'] },
    { time: '17:00', text: 'A request for one more project, on top of three. Your centre is wisdom, but your boundaries are red: you say no, kindly and clearly, and say what you can do instead. A no with a yes beside it.', uses: ['Red boundaries', 'Say «No», then plant a «Yes»'] },
    { time: '18:30', text: 'Your mother rings, and the old conversation begins, the one that always ends badly. You make room for it instead of fighting it, and wonder why it matters so much to your mother. It still doesn’t end well. It ends less badly.', uses: ['Accept in order to act', 'Love in four registers'] },
    { time: '19:30', text: 'Cooking, to music you chose rather than whatever the algorithm served. Your partner has been offered a job that means travelling three days a week. Your first feeling is loss. Your second, slower one: to love means “I am the ally of your freedom”. You ask what they want.', uses: ['Guard what goes in', 'Be the ally of their freedom'] },
    { time: '21:30', text: 'Ten minutes with the notebook. Where did my energy go today? Mostly into worrying about the report, which, it turns out, was fine. What did I desire, what did I feel? One thing to own: snapping at the waiter. “I’m human, I erred.” Next time, slower.', uses: ['The Ares audit', 'Review the day', 'Respect your shame'] },
    { time: '22:15', text: 'Three things you are grateful for, and the light goes off. Nothing about the day was special, and that is the point.', uses: ['Close with thanks'] },
  ],
  after: 'Notice what didn’t happen: no visions, no special clothes, no stepping back from the world. The three marks Athena does name are quieter than that: a love that doesn’t pick favourites, a childlike cheer that sees the whole thing as play, and a loosening grip on goals that serve only you.',
  afterSrc: ['ax4J8WPxq_c', '27:27'] as Src,
};

/* ------------------------------------------------------------------------------------------------ */

export const hard = {
  title: 'When life hits',
  intro: 'Athena’s teaching is at its most practical in the hard moments. This is what it says to do in some of them.',
  care: 'None of this replaces medical or psychological care. Athena herself, speaking of depression, says to seek help so you don’t get lost there.',
  items: [
    {
      when: 'When you lose someone or something',
      steps: [
        'Pause before you fix anything.',
        'Ask what condition the pain is calling you to change.',
        'Let it push you out of the state you were in. Athena compares psychic pain to training: it hurts, and it leads to no pain.',
      ],
      line: { text: 'Your sun was never in danger.', src: ['QgYveGlAEhw', '2:11:49'] as Src },
      src: ['MW2u5olwgFc'] as Src,
    },
    {
      when: 'When the floor gives way',
      steps: [
        'Treat the shock as ἐξαίφνης, the sudden event, and ask what it is waking in you.',
        'Remember that every situation has an exit of freedom.',
        'See the crisis as a cut between past and future, and watch for the new ideas hatching in it.',
        'If outer things close down overnight, ask where the basis of your well-being really is.',
      ],
      line: { text: 'Transformations always follow a crisis.', src: ['fqvKm4KHiJs', '8:44'] as Src },
      src: ['cRTJ00zjo1M'] as Src,
    },
    {
      when: 'When you are low for a long time',
      steps: [
        'Consider it as the soul’s cry to be freed: a mask that has stuck, asking to come off.',
        'Allow it to be deep rest, rather than a failure.',
        'Seek help, so you don’t get lost there: a friend, a teacher, a doctor, a therapist.',
      ],
      src: ['cRTJ00zjo1M'] as Src,
    },
    {
      when: 'When someone wrongs you',
      steps: [
        'Don’t become indignant, and don’t fight them.',
        'Make room for it. Light it with understanding: why did it happen, why did they do it? Put yourself in their place.',
        'Embrace it with love and stop fighting it, because as long as we fight something we hold it close.',
        'Then decide with discernment what to do, even if that means leaving.',
      ],
      src: ['xLQXoDX7i94', '31:11'] as Src,
    },
    {
      when: 'When someone comes at you',
      steps: [
        'Don’t shout and don’t hit. Let your bearing carry the force.',
        'Keep wisdom at your centre, and set clear boundaries at your edges.',
        'Name the people who protect you: they are your ἕρκος, your fence. The greater the treasure, the higher the walls.',
      ],
      line: { text: 'Our centre is wisdom, but our boundaries must be red.', src: ['-Rmboz-OmJQ', '1:04:53'] as Src },
      src: ['-Rmboz-OmJQ'] as Src,
    },
    {
      when: 'When you have got it wrong',
      steps: [
        'Say: I’m human, I erred, I deceived myself here.',
        'Ask what you can learn, adjust, and move on.',
        'Be glad you feel the shame at all: it is justice regulating itself in you. Feeling nothing is the real danger.',
      ],
      src: ['cRTJ00zjo1M'] as Src,
    },
    {
      when: 'When something shakes you, or sweeps you up',
      steps: [
        'Notice it.',
        'Recall that only the soul’s motions are moved, never its essence: calm is uncovered, not built.',
        'Try the ἔστω, “let it be”: as a working hypothesis, assume this is perfect and just, that you are partway up the mountain and can’t see all its folds, and that it may bring good things. Say “let it be”, and let go.',
      ],
      src: ['UkAPRIOoiRw'] as Src,
    },
    {
      when: 'When you are fed up with everything',
      steps: [
        'Read the exhaustion as a signal: “this can’t be all” is the push to look for what is true.',
        'Stop looking for the exit in your circumstances, and turn the attention inward.',
      ],
      line: { text: 'You are the gate that leads to your freedom.', src: ['UkAPRIOoiRw', '12:44'] as Src },
      src: ['UkAPRIOoiRw'] as Src,
    },
    {
      when: 'When you disagree',
      steps: [
        'Before you discuss, define: what do each of you mean by the word you are fighting over?',
        'Don’t avoid the conflict. Look for the union of the opposites in front of you.',
      ],
      line: { text: 'Disagreement is the beginning of agreement.', src: ['xLQXoDX7i94', '21:28'] as Src },
      src: ['XKLuMi-UjLc'] as Src,
    },
    {
      when: 'When you are afraid of dying',
      steps: [
        'Prepare in peacetime: cultivate courage and clarity now, the way you clear snow you know will fall.',
        'Face each cowardice, anger and rage while you are alive, with meditation, hymns and inner work, so the passage holds nothing to fear.',
      ],
      line: { text: 'There is no death: only sleep, dream and awakening.', src: ['cae0P7g3uFw', '40:51'] as Src },
      src: ['-Rmboz-OmJQ'] as Src,
    },
  ],
};

/* ------------------------------------------------------------------------------------------------ */

export const love = {
  title: 'Love, and the people close to you',
  intro: 'For Athena, eros is the engine of the whole path, and the quality of your love shows in a set order: first in how you treat yourself, then your partner, then your colleagues and everyone else, then society.',
  introSrc: ['yQ_GUqR-29k', '9:51'] as Src,
  items: [
    { name: 'Start with yourself', how: 'Treat yourself with sacredness, and train daily in love and kindness towards yourself. Then notice how it changes the respect you have for the people you love, and theirs for you.', why: 'As we treat our partners within, so we treat our partners without.', src: ['yQ_GUqR-29k'] },
    { name: 'Be the ally of their freedom', how: 'When you love someone, ask: am I the ally of their freedom? When you hear yourself think “you will do what I want”, call it what it is, control. Then help their freedom actively, as far as you can.', why: 'To love means: I am the ally of your freedom.', src: ['xLQXoDX7i94', '24:57'] },
    { name: 'Define before you discuss', how: 'Before talking about love, ask what it is. Notice whether you mean attachment, jealousy or criticism, and go back to the word’s roots.', why: 'Otherwise one word covers opposite states.', src: ['xLQXoDX7i94', '20:31'] },
    { name: 'Know eros instead of avoiding it', how: 'Get to know desire truly and from within, under a teaching that gives you tools and criteria. Don’t make it the one part of you left out of the path.', why: 'Then eros lifts you instead of burning you.', src: ['yQ_GUqR-29k'] },
    { name: 'Count everyone’s well-being', how: 'Notice whose well-being you count, and treat other people’s as equal to your own.', why: 'If we are one being, selective openness makes no sense.', src: ['1OBymLpYfTo'] },
    { name: 'Let love widen', how: 'Love a partner and a family; then the values, institutions and laws of your city; then the universe.', why: 'Diotima’s ladder: eros grows from the private to the political to the cosmic.', src: ['-mTgsVQO72E', '4:21'] },
    { name: 'Meet everyone with reverence', how: 'Approach every being with reverence, and with a gaze that remembers that Being is common to you both.', why: 'It changes how your own inner energy moves.', src: ['yQ_GUqR-29k'] },
  ] as Step[],
  line: { text: 'They say love blinds; I think love un-blinds you.', src: ['COON0DK5OEU', '38:03'] as Src },
};

export const work = {
  title: 'Work, and the world',
  intro: 'Athena is clear that awakening has to be lived, personally and politically. This is what that means from nine to five, and beyond.',
  introSrc: ['WN2AHLV3COA'] as Src,
  items: [
    { name: 'Find your own work', how: 'Come to your centre and ask what you love to do. Two signs: do I burn with zeal for it, and doing it, do I lose the sense of time? Follow that, leaving money aside for the question.', why: 'Every soul is born to fulfil its own work.', src: ['xLQXoDX7i94', '18:58'] },
    { name: 'Turn βίος into ζωή', how: 'Ask what you love to do, what inspires you, and how you can benefit society, and follow your deep heartbeat rather than routine.', why: 'Life becomes conscious when it follows love and understanding rather than instinct and habit.', src: ['cRTJ00zjo1M', '8:07'] },
    { name: 'Govern yourself first', how: 'Practise self-mastery before you try to run anything outside you: a team, a family, a project.', why: 'The first polity we must learn to govern is our soul.', src: ['fqvKm4KHiJs', '38:18'] },
    { name: 'Play the role, don’t become it', how: 'Be the manager, the employee, the expert, fully, and remember who is playing.', why: 'We play a unique role and make an ethos, but we are the one playing, not the role.', src: ['HY9w_6CSzm8'] },
    { name: 'Speak simply', how: 'Prefer plain words to academic ones, in meetings as in philosophy.', why: 'Simplicity is the easiest road to truth.', src: ['COON0DK5OEU'] },
    { name: 'Take political responsibility', how: 'Notice when you say “I’m not political”. Remember that politics includes how you judge and think, and act at your own scale: your town, your village, your community.', why: 'Abstaining is itself a political stance.', src: ['Y70BLhDGLf8'] },
    { name: 'Don’t shrink into your small circle', how: 'Feel responsible for the whole earth, as Kazantzakis did.', why: 'The ancient ἰδιώτης, the idiot, is the one who forgets he is one with all.', src: ['COON0DK5OEU'] },
    { name: 'If you teach or raise children', how: 'Light your own light first, and shine it on them rather than filling them with information.', why: 'As the sun wakes sight in the eye, a teacher wakes what is already known within.', src: ['AAWZRTOINyA'] },
  ] as Step[],
  line: { text: 'What changes in the world? Nothing. In us? Everything.', src: ['XKLuMi-UjLc', '6:49'] as Src },
};

/* ------------------------------------------------------------------------------------------------ */

export const traps = {
  title: 'Watch out for',
  intro: 'Athena spends a good deal of time on the ways the path goes wrong, including for sincere people. These are the ones that come back most often.',
  groups: [
    {
      label: 'For the seeker',
      items: [
        { trap: 'Collecting instead of digesting.', instead: 'Information is not knowledge: knowledge must be conceived, carried and born in you. Take one idea and give it time.', src: ['cRTJ00zjo1M'] },
        { trap: 'Digging one-metre holes.', instead: 'One path, one teaching, over years.', src: ['AAWZRTOINyA'] },
        { trap: 'The “if… then” bargain.', instead: '“After one more book, course, trip or initiation, then…” is postponement. The only right moment is now; even spiritual methods can become the last obstacle.', src: ['ax4J8WPxq_c'] },
        { trap: 'Mistaking a strong opinion for truth.', instead: 'When you defend a view fiercely, notice the emotion in it, and ask what identity of yours it protects.', src: ['AAWZRTOINyA'] },
      ],
    },
    {
      label: 'For the meditator',
      items: [
        { trap: 'Taking experiences for awakening.', instead: 'Every experience happens inside the finite; awakening is a witnessing of the infinite.', src: ['ax4J8WPxq_c'] },
        { trap: 'Filling meditation with pictures.', instead: 'Go towards purity of mind by removing content, not adding it.', src: ['XKLuMi-UjLc'] },
        { trap: 'Meditating and never standing up.', instead: 'Add Ares: turn the insight into work and action.', src: ['-Rmboz-OmJQ'] },
        { trap: 'Running from the senses.', instead: 'The task is to purify the senses, not reject them: use them as allies.', src: ['DOdU0po-ehY'] },
      ],
    },
    {
      label: 'With other people',
      items: [
        { trap: 'Blaming the puppeteers.', instead: 'Ask where the cave is. If it is inside you, there is no one outside to accuse.', src: ['zfeWFBTNZIo'] },
        { trap: 'Loving as control.', instead: '“You will do what I want” is not love. Be the ally of their freedom.', src: ['xLQXoDX7i94', '24:57'] },
        { trap: 'Shadow-boxing with people who aren’t ready.', instead: 'Protect what is growing in you; don’t quarrel to be understood.', src: ['MW2u5olwgFc'] },
        { trap: 'Being alone together.', instead: 'We mistake being connected for being with one another. Choose real presence.', src: ['cRTJ00zjo1M'] },
        { trap: 'Helpers who haven’t walked the road.', instead: 'Choose a guide whose motive is pure and who has crossed the path themselves.', src: ['cRTJ00zjo1M'] },
      ],
    },
    {
      label: 'For the “awakened”',
      items: [
        { trap: 'The checklist of the awakened.', instead: 'Stop judging yourself or others by aura, diet, speech or lifestyle. Awakening has no outward traits.', src: ['ax4J8WPxq_c'] },
        { trap: '“I am the awakened one.”', instead: 'Any awakened identity throws the light into a new shadow. Take the sentence as a sign that the road continues.', src: ['AAWZRTOINyA'] },
        { trap: 'Power before purity.', instead: 'Vital force without virtue becomes the black horse. Purity first, then force, and the force in service.', src: ['-Rmboz-OmJQ'] },
        { trap: 'Staying above.', instead: 'Go back into the cave, until you see that all of it is the Good, even the illusion.', src: ['AAWZRTOINyA'] },
      ],
    },
  ] as { label: string; items: { trap: string; instead: string; src: Src }[] }[],
};

/* ------------------------------------------------------------------------------------------------ */

export const start = {
  title: 'Your first thirty days',
  intro: 'If all of this is too much, start here: one new habit a week, each one kept as you add the next.',
  weeks: [
    { label: 'Week 1', name: 'Begin', items: ['Buy a notebook. On the first page, the adolescent questions; on the second, your intention, dated.', 'One minute of gratitude each morning.', 'Eyes open, eyes closed: five minutes a day.'] },
    { label: 'Week 2', name: 'Watch', items: ['Add the evening review: what did I desire, what did I feel, what mood did I carry?', 'During the day, whenever you remember, name how your mind is working.'] },
    { label: 'Week 3', name: 'Subtract', items: ['Choose one old habit. Say «No» to it, and plant one «Yes» in its place.', 'Greet “my dear One” in every irritation.'] },
    { label: 'Week 4', name: 'Widen', items: ['The Ares audit, every night.', 'One evening alone, without the phone.', 'One real conversation about something that matters.', 'One act for someone outside your own circle.'] },
  ],
  after: 'On day thirty, re-read what you wrote on day one. Keep what took root. Then go deeper rather than wider: one key, lived.',
};

export const closing = {
  line: { text: 'Follow love, and love will set you free.', src: ['xLQXoDX7i94', '20:03'] as Src },
};
