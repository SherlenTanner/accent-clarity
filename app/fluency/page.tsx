'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

// ── TYPES ─────────────────────────────────────────────────────────────
type VisToken = [string, string?, string?]
interface VisDiagram { tokens: VisToken[]; caption: string }
interface Practice {
  name: string; desc: string; vis: VisDiagram
  examples: string[]; words: [string, string][]
  exampleWords?: [string, string][]; record: string[]; video?: string
}
interface Topic { id: string; symbol: string; name: string; desc: string; tags: string[]; practices: Practice[] }

// ── DATA ──────────────────────────────────────────────────────────────
const TOPICS: Topic[] = [
  {
    id: 'linking', symbol: '∿', name: 'Linking Sounds',
    desc: 'Words flow together in natural speech. Learning to link them is what makes your English sound fluid rather than word-by-word.',
    tags: ['📰 News & Daily Life', '⚡ High Priority'],
    practices: [
      { name: 'Consonant + Vowel — Basic', desc: 'The final consonant slides into the opening vowel of the next word — no gap.',
        vis: { tokens: [['She tur', ''], ['ned i', 'link', 'n→i'], ['t o', 'link', 't→o'], ['ff before leaving.', '']], caption: 'Two links: "n" slides into "i" (turned it), and "t" slides into "o" (it off).' },
        examples: ['Turn it off before you leave.', 'She picked up an apple from the table.', 'The bus arrived on time.', 'He came in early and made a cup of coffee.', 'We looked at each other and laughed.'],
        words: [['turn it', 'Daily'], ['pick up', 'Daily'], ['came in', 'Daily'], ['look at', 'Daily'], ['get up', 'Daily'], ['put on', 'Daily']],
        record: ['turn it off', 'look at it', 'pick up a bag', 'came in early', 'get up and go'] },
      { name: 'Consonant + Vowel — News', desc: 'Practice linking in real news-style sentences read aloud.',
        vis: { tokens: [['Officials announ', ''], ['ced i', 'link', 'd→i'], ['t early on Thursday.', '']], caption: '"announced it" links — the d flows into i: announ·sit.' },
        examples: ['The president arrived in a motorcade.', 'Officials announced an emergency alert.', 'A record amount of rain fell overnight.', 'The report came out earlier than expected.', 'Analysts pointed at a drop in consumer confidence.'],
        words: [['arrived in', 'News'], ['amount of', 'News'], ['fell on', 'News'], ['based on', 'News'], ['went in', 'News'], ['set up', 'Daily']],
        record: ['arrived in office', 'based on evidence', 'amount of rain', 'set up an alert', 'went in early'] },
      { name: 'Consonant + Vowel — Sentences', desc: 'Full sentences with multiple linking points from start to finish.',
        vis: { tokens: [['She ra', ''], ['n ou', 'link', 'n→ou'], ['t of time a', ''], ['t th', 'link', 't→ə'], ['e end.', '']], caption: 'Two linking points: "ran out" and "at the" — both cross word boundaries smoothly.' },
        examples: ['She ran out of time at the end of the exam.', 'He woke up and immediately checked his phone.', 'The team came in under budget this year.', 'She picked up an idea from a colleague at work.', 'He turned it over and looked at it again.'],
        words: [['ran out', 'Daily'], ['woke up', 'Daily'], ['came in', 'Daily'], ['end of', 'Daily'], ['checked in', 'Daily'], ['cut off', 'Daily']],
        record: ['ran out of time', 'woke up early', 'came in under budget', 'end of the day', 'checked in at noon'] },
      { name: 'Consonant + Consonant — Basic', desc: 'Hold the first consonant, release into the second — no extra vowel.',
        vis: { tokens: [['She loo', ''], ['ked b', 'link', 'kt→b'], ['ack and smiled.', '']], caption: '"looked back" — hold the k, release into b. No "uh" between them.' },
        examples: ['The black cat sat on the step.', 'She looked back and smiled.', 'He left town last night.', 'They walked fast and barely stopped to rest.', 'The cold drink felt good after the long walk.'],
        words: [['black cat', 'Daily'], ['looked back', 'Daily'], ['left town', 'Daily'], ['last night', 'Daily'], ['hot day', 'Daily'], ['stopped by', 'Daily']],
        record: ['looked back', 'left town last night', 'black coffee', 'stopped by the store', 'hot day'] },
      { name: 'Consonant + Consonant — News', desc: 'News delivery often has dense consonant clusters.',
        vis: { tokens: [['Budge', ''], ['t cu', 'link', 't→k'], ['ts too', ''], ['k effe', 'link', 'k→e'], ['ct this week.', '']], caption: '"Budget cuts" and "took effect" — two C+C links in one headline.' },
        examples: ['The next flight departs at midnight.', 'Budget cuts took effect this week.', 'A cold front moved through the region.', 'The task force met Tuesday to discuss the draft bill.', 'Record heat hit parts of the country last month.'],
        words: [['next flight', 'News'], ['budget cuts', 'News'], ['cold front', 'News'], ['last week', 'News'], ['big deal', 'News'], ['direct link', 'News']],
        record: ['next flight departs', 'budget cuts took effect', 'cold front moved through', 'last week', 'direct link'] },
      { name: 'Consonant + Consonant — Sentences', desc: 'Linking through full sentences with natural C+C transitions.',
        vis: { tokens: [['She wal', ''], ['ked str', 'link', 'kt→st'], ['aight past the bookstore.', '']], caption: '"walked straight" — k holds, releases into str. One smooth movement.' },
        examples: ['She walked straight past the bookstore without stopping.', 'The old door kept sticking every winter.', 'He grabbed both bags and called a cab.', 'They stepped back and looked at the finished wall.', 'She packed light but still brought both coats.'],
        words: [['walked straight', 'Daily'], ['kept sticking', 'Daily'], ['both bags', 'Daily'], ['called back', 'Daily'], ['last step', 'Daily'], ['hard times', 'Daily']],
        record: ['walked straight past', 'kept sticking shut', 'grabbed both bags', 'called a cab', 'last step forward'] },
      { name: 'Vowel + Vowel Linking', desc: 'When a word ends in a vowel and the next starts with one, a soft glide connects them.',
        vis: { tokens: [['Go '], ['a', 'link', 'o→a'], ['head and ord', ''], ['e', 'link', 'd→e'], ['r whatever you want.', '']], caption: '"Go ahead" — a soft /w/ glide. "order" — d into e, no break.' },
        examples: ['She saw a movie about animals.', 'Go ahead and order whatever you want.', 'The two of us stayed up all night.', 'She knew exactly what the answer was.', 'He drew a rough outline on the board.'],
        words: [['saw a', 'Daily'], ['go ahead', 'Daily'], ['two of', 'Daily'], ['she ate', 'Daily'], ['who is', 'Daily'], ['free entry', 'Daily']],
        record: ['saw a movie', 'go ahead and order', 'two of us', 'she ate early', 'who asked you'] },
      { name: 'Linking Across 3-Word Phrases', desc: 'Practice linking through short three-word chunks as one unit of sound.',
        vis: { tokens: [['Al', ''], ['l o', 'link', 'l→ə'], ['f u', 'link', 'v→ʌ'], ['s agreed on a plan.', '']], caption: '"all of us" — two links across three words, spoken as one breath unit.' },
        examples: ['All of us agreed on a plan.', 'Some of it was missing from the report.', 'Most of it came out of nowhere.', 'A lot of it ended up in the trash.', 'The rest of us stayed out of it.'],
        words: [['all of it', 'Daily'], ['some of us', 'Daily'], ['out of town', 'Daily'], ['end of it', 'Daily'], ['most of them', 'Daily'], ['part of it', 'Daily']],
        record: ['all of us agreed', 'some of it was wrong', 'out of nowhere', 'most of them left', 'end of the road'] },
      { name: 'Linking in Questions', desc: 'Questions rely on linking to sound smooth and natural.',
        vis: { tokens: [['What ', ''], ['are you', 'link', 't→ar'], [' doing ', ''], ['after', 'link', 'ŋ→a'], [' work?', '']], caption: '"What are" links across the t→a boundary. "doing after" also connects.' },
        examples: ['What are you doing after work?', 'Is it okay if I open the window?', 'Did anyone else notice that?', 'Where are you planning to eat after this?', 'How is everything going at the new place?'],
        words: [['what are', 'Daily'], ['is it', 'Daily'], ['did anyone', 'Daily'], ['how about', 'Daily'], ['where are', 'Daily'], ['who else', 'Daily']],
        record: ['what are you doing', 'is it okay', 'did anyone notice', 'how about after lunch', 'where are you going'] },
      { name: 'Linking in Commands & Instructions', desc: 'Clear linking in instructions so nothing sounds clipped or choppy.',
        vis: { tokens: [['Turn', ''], ['it off', 'link', 'n→it'], [' and ', ''], ['plug', ''], ['it in', 'link', 'g→it'], [' again.', '']], caption: '"turn it" and "plug it" — same C+V link, two times in one instruction.' },
        examples: ['Open it up and read through the first page.', 'Turn it off and plug it in again.', 'Fill it out and hand it back when you are done.', 'Pick it up and put it on the shelf.', 'Write it out and check it over before you send it.'],
        words: [['open it', 'Daily'], ['turn it off', 'Daily'], ['fill it out', 'Daily'], ['hand it back', 'Daily'], ['bring it in', 'Daily'], ['pass it on', 'Daily']],
        record: ['open it up', 'turn it off and on', 'fill it out', 'hand it back to me', 'bring it in now'] },
      { name: 'Linking in Numbers & Amounts', desc: 'Numbers, prices, and quantities are linking hotspots.',
        vis: { tokens: [['Three', ''], ['out of', 'link', 'e→au'], [' four people agreed.', '']], caption: '"three out of" — three words linked across two boundaries.' },
        examples: ['It costs about a hundred and eighty dollars.', 'Three out of four people agreed.', 'She bought two of each item on the list.', 'About a third of us showed up early.', 'He works about eight or nine hours a day on average.'],
        words: [['two of', 'Daily'], ['three out', 'Daily'], ['one and', 'Daily'], ['four of', 'Daily'], ['six eggs', 'Daily'], ['half of', 'Daily']],
        record: ['a hundred and eighty', 'three out of four', 'two of each', 'half of the group', 'four of them came'] },
      { name: 'Linking in Full Sentences — Everyday', desc: 'Full everyday sentences with multiple linking points throughout.',
        vis: { tokens: [['I need', ''], ['to', 'weak'], [' pick', ''], ['up a', 'link', 'k→ʌ'], [' few things ', ''], ['at the', 'link', 't→ðə'], [' store.', '']], caption: '"to" reduces; "pick up a" and "at the" both link across word boundaries.' },
        examples: ['I need to pick up a few things at the store on my way home.', 'He ended up eating alone at a small café on the corner.', 'She asked if any of us wanted to come over on Saturday.', 'We ended up agreeing on a plan after about an hour of talking.', 'I found out about it only after it had already happened.'],
        words: [['pick up', 'Daily'], ['ended up', 'Daily'], ['asked if', 'Daily'], ['on my way', 'Daily'], ['a few of', 'Daily'], ['come over', 'Daily']],
        record: ['pick up a few things', 'ended up eating alone', 'asked if anyone was coming', 'on my way home', 'a few of us went'] },
      { name: 'Linking in Full Sentences — News', desc: 'News-register sentences with multiple linking opportunities.',
        vis: { tokens: [['A', ''], ['number of', 'link', 'r→əv'], [' issues ', ''], ['are', ''], ['under', 'link', 'r→ʌ'], [' investigation.', '']], caption: '"number of" and "under investigation" — both use C+V linking.' },
        examples: ['Officials said a number of issues are under investigation.', 'Analysts expect a drop in oil prices over the next quarter.', 'A series of aftershocks struck overnight after the initial quake.', 'A panel of experts weighed in on a range of available options.', 'The number of applicants exceeded all expectations by a large amount.'],
        words: [['a number of', 'News'], ['over the', 'News'], ['a series of', 'News'], ['said it', 'News'], ['expect a', 'News'], ['under a', 'News']],
        record: ['a number of issues', 'expect a drop', 'a series of aftershocks', 'over the next month', 'under investigation'] },
      { name: 'Linking in Fast Natural Speech', desc: 'At natural speed, linking becomes blending. Train both ear and mouth.',
        vis: { tokens: [['I was', ''], ['going to', 'link', 'ŋ→tə'], [' ask', ''], ['about it', 'link', 'k→ə'], [' earlier.', '']], caption: '"going to" and "ask about it" — two linking clusters in casual fast speech.' },
        examples: ['I was going to ask about it earlier but I forgot.', 'Did you end up going or did something come up?', 'They said it was okay but I am not so sure about it.', 'She was going to call but I think something came up.', 'I kind of ended up agreeing even though I had my doubts.'],
        words: [['going to', 'Daily'], ['end up', 'Daily'], ['not so', 'Daily'], ['ask about', 'Daily'], ['come up', 'Daily'], ['sure about', 'Daily']],
        record: ['going to ask about it', 'end up going', 'not so sure', 'something came up', 'ask about it later'] },
      { name: 'Mixed Linking — Fluency Challenge', desc: 'All linking types together. One smooth uninterrupted flow.',
        vis: { tokens: [['She', ''], ['came in', 'link', 'm→in'], [' early and ', ''], ['set up', 'link', 't→ʌp'], [' all the ', ''], ['equipment', 'link', 't→ɪ'], [' alone.', '']], caption: 'Three linking points in one sentence — C+V, C+V, C+V. All natural.' },
        examples: ['The event opened up a whole new area of discussion about urban planning.', 'She came in early and set up all the equipment before anyone else arrived.', 'By the end of it all, everyone agreed it had been a long but interesting day.', 'He picked up on it right away and asked about it before anyone else did.', 'We all ended up laughing about it even though it had seemed awful at first.'],
        words: [['opened up', 'Daily'], ['came in', 'Daily'], ['end of it', 'Daily'], ['set up', 'Daily'], ['all of us', 'Daily'], ['agreed on', 'Daily']],
        record: ['opened up a discussion', 'came in early and set up', 'by the end of it all', 'everyone agreed it was', 'a long but interesting day'] },
    ],
  },
  {
    id: 'weak', symbol: 'ə', name: 'Weak Sounds',
    desc: 'The schwa /ə/ is the most common sound in English. Reducing unstressed syllables gives your speech its natural rhythm.',
    tags: ['📰 News & Daily Life', '⚡ High Priority'],
    practices: [
      { name: 'The Schwa /ə/ — Isolated', desc: 'Get comfortable with the sound itself. Jaw relaxed, tongue flat, lips neutral.',
        vis: { tokens: [['A', 'weak'], [' banana. ', ''], ['A', 'weak'], [' problem. ', ''], ['A', 'weak'], [' computer.', '']], caption: '"A" before every noun is always /ə/ — never the full letter name "ay".' },
        examples: ['Say "uh" softly — that is the schwa.', 'A banana. A computer. A problem.', 'About. Around. Ago. Ahead.', 'The sofa is comfortable. The agenda is ready.', 'She is aware of the situation. He is alone.'],
        words: [['a', 'Function'], ['about', 'Prefix'], ['around', 'Prefix'], ['ago', 'Suffix'], ['ahead', 'Prefix'], ['away', 'Prefix']],
        record: ['a banana', 'about an hour', 'around the corner', 'two days ago', 'ahead of schedule', 'away from home'] },
      { name: 'Schwa in One-Syllable Function Words', desc: 'The smallest, most frequent words reduce to schwa in connected speech.',
        vis: { tokens: [['I went ', ''], ['to', 'weak'], [' ', ''], ['the', 'weak'], [' store ', ''], ['and', 'weak'], [' got ', ''], ['a', 'weak'], [' few things.', '']], caption: 'Every highlighted word reduces to /ə/ or close to it in natural speech.' },
        examples: ['I went to the store and got a few things.', 'She talked to him about the problem.', 'We came from a small town in the south.', 'He spoke to the manager and asked for a refund.', 'They drove to the coast and stayed for a week.'],
        words: [['to', '→ tə'], ['the', '→ ðə'], ['a', '→ ə'], ['and', '→ ən'], ['of', '→ əv'], ['for', '→ fə']],
        record: ['went to the store', 'a few things', 'talked to him', 'and got a coffee', 'from a small town'] },
      { name: 'Schwa in Two-Syllable Words', desc: 'One syllable is always stronger. The other reduces.',
        vis: { tokens: [['The ', ''], ['prob', ''], ['lem', 'weak'], [' was ', ''], ['sim', ''], ['ple', 'weak'], [' enough.', '']], caption: 'The unstressed syllable in each word reduces: prob·LƏM, SIM·plə.' },
        examples: ['The problem was simple enough.', 'It happened again on Saturday.', 'We needed a moment to think.', 'The garden was open to the public on weekends.', 'Common sense is not always common practice.'],
        words: [['problem', 'prob·ləm'], ['moment', 'mow·mənt'], ['garden', 'gar·dən'], ['happen', 'hap·ən'], ['open', 'oh·pən'], ['common', 'com·ən']],
        record: ['the problem is simple', 'it happened again', 'just a moment', 'the garden is open', 'common enough', 'open the window'] },
      { name: 'Schwa in Three-Syllable Words', desc: 'Longer words have one main stress and at least one or two schwas.',
        vis: { tokens: [['cam', ''], ['er', 'weak'], ['a', 'weak'], [' caught ', ''], ['ev', ''], ['ery', 'weak'], ['thing.', '']], caption: 'CAM·ər·ə — two schwas, one stress. Same pattern in memory, family, company.' },
        examples: ['The camera caught everything on tape.', 'Her memory of that event is vivid.', 'A family of four moved in next door.', 'The company released a statement about the incident.', 'The history of the building was fascinating.'],
        words: [['camera', 'cam·ər·ə'], ['memory', 'mem·ər·ee'], ['family', 'fam·ə·lee'], ['company', 'cump·ə·nee'], ['history', 'his·tə·ree'], ['energy', 'en·ər·jee']],
        record: ['the camera caught it', 'her memory of it', 'a family of four', 'the company said', 'a long history', 'a lot of energy'] },
      { name: 'Weak "to" — tə', desc: '"To" almost always reduces to /tə/ in normal speech.',
        vis: { tokens: [['I need ', ''], ['to', 'weak'], [' talk ', ''], ['to', 'weak'], [' you ', ''], ['about', 'weak'], [' something.', '']], caption: '"to" appears twice — both reduce to /tə/. "About" also weakens to /əbout/.' },
        examples: ['I need to talk to you about something.', 'She went to the market to pick up groceries.', 'He tried to call but nobody answered.', 'We have to leave in ten minutes to catch the train.', 'She wants to apply to three different programs.'],
        words: [['to you', '→ tə·you'], ['to the', '→ tə·ðə'], ['going to', '→ tə'], ['need to', '→ tə'], ['want to', '→ tə'], ['have to', '→ tə']],
        record: ['need to talk to you', 'went to the market', 'tried to call', 'going to be late', 'want to know more'] },
      { name: 'Weak "for" — fə', desc: '"For" reduces to /fə/ unless it ends a sentence or carries emphasis.',
        vis: { tokens: [['She asked ', ''], ['for', 'weak'], [' ', ''], ['a', 'weak'], [' glass ', ''], ['of', 'weak'], [' water.', '']], caption: '"for", "a", and "of" all reduce in the same sentence — three schwas in a row.' },
        examples: ['We waited for a long time at the gate.', 'She asked for a glass of water.', 'This is good news for everyone involved.', 'He applied for a position at the new office downtown.', 'They stayed for a few days and then left for the coast.'],
        words: [['for a', '→ fər·ə'], ['for the', '→ fər·ðə'], ['wait for', '→ fər'], ['ask for', '→ fər'], ['ready for', '→ fər'], ['time for', '→ fər']],
        record: ['waited for a long time', 'asked for water', 'good for everyone', 'ready for the news', 'time for a break'] },
      { name: 'Weak "of" — əv', desc: '"Of" is one of the most reduced words in English — it nearly disappears.',
        vis: { tokens: [['A lot ', ''], ['of', 'weak'], [' people showed up ', ''], ['to', 'weak'], [' ', ''], ['the', 'weak'], [' event.', '']], caption: '"of", "to", and "the" all reduce together — the sentence has a clear rhythmic pulse.' },
        examples: ['A lot of people showed up to the event.', 'Most of the time we just talked.', 'The top of the building was covered in fog.', 'She took care of all of the details herself.', 'Out of all of the options, this one made the most sense.'],
        words: [['a lot of', 'Daily'], ['most of', 'Daily'], ['top of', 'Daily'], ['kind of', 'Daily'], ['out of', 'Daily'], ['instead of', 'Daily']],
        record: ['a lot of people', 'most of the time', 'top of the building', 'kind of interesting', 'out of nowhere'] },
      { name: 'Weak "and" — ən', desc: '"And" in fast speech reduces to just /ən/ — sometimes even shorter.',
        vis: { tokens: [['She bought bread ', ''], ['and', 'weak'], [' butter ', ''], ['at', 'weak'], [' ', ''], ['the', 'weak'], [' market.', '']], caption: '"and", "at", "the" — all three reduce. The content words bread, butter carry the rhythm.' },
        examples: ['She bought bread and butter at the market.', 'He sat down and started reading.', 'It was hot and humid all week.', 'They packed up and left early the next morning.', 'She smiled and nodded and said she understood.'],
        words: [['bread and', 'Daily'], ['and butter', 'Daily'], ['sat and', 'Daily'], ['hot and', 'Daily'], ['up and', 'Daily'], ['come and', 'Daily']],
        record: ['bread and butter', 'sat down and read', 'hot and humid', 'up and running', 'come and see'] },
      { name: 'Weak "a / an" — ə / ən', desc: 'The article "a" is almost always a schwa in connected speech.',
        vis: { tokens: [['She found ', ''], ['a', 'weak'], [' wallet on ', ''], ['a', 'weak'], [' bench in ', ''], ['a', 'weak'], [' park.', '']], caption: 'Three instances of "a" — all three reduce to /ə/. Never "ay wallet".' },
        examples: ['She found a wallet on a bench in a park.', 'He had a sandwich and an iced coffee.', 'It was a great day for a walk in the city.', 'There was a long line at a small café near a bookstore.', 'She took a deep breath and made an important decision.'],
        words: [['a wallet', '→ ə'], ['a bench', '→ ə'], ['an apple', '→ ən'], ['a great', '→ ə'], ['a walk', '→ ə'], ['an idea', '→ ən']],
        record: ['found a wallet', 'a sandwich and an iced coffee', 'a great day for a walk', 'an interesting idea', 'a long time ago'] },
      { name: 'Weak "from" — frəm', desc: '"From" reduces heavily and blends with surrounding words.',
        vis: { tokens: [['She just got back ', ''], ['from', 'weak'], [' ', ''], ['a', 'weak'], [' trip abroad.', '']], caption: '"from a" — both reduce and nearly fuse together: /frəm·ə/.' },
        examples: ['She just got back from a trip abroad.', 'The package arrived from overseas this morning.', 'He learned a lot from the experience.', 'She moved here from a small city on the coast.', 'The news came from a reliable source in the region.'],
        words: [['from a', 'Daily'], ['from the', 'Daily'], ['back from', 'Daily'], ['from here', 'Daily'], ['from work', 'Daily'], ['away from', 'Daily']],
        record: ['back from a trip', 'arrived from overseas', 'learned from the experience', 'from here to there', 'away from it all'] },
      { name: 'Weak "at" and "as" — ət / əz', desc: 'Both reduce fully in unstressed positions.',
        vis: { tokens: [['She works ', ''], ['at', 'weak'], [' ', ''], ['a', 'weak'], [' coffee shop ', ''], ['on', 'weak'], [' weekends.', '']], caption: '"at", "a", "on" — all function words reduce. Content words work, coffee, weekends stay strong.' },
        examples: ['She works at a coffee shop on weekends.', 'He arrived at the airport just in time.', 'As far as I know, nothing has changed.', 'She left at a quarter past eight and arrived at the office early.', 'As soon as he got there, things started to improve.'],
        words: [['at a', '→ ət·ə'], ['at the', '→ ət·ðə'], ['as far', '→ əz'], ['as well', '→ əz'], ['at work', '→ ət'], ['at home', '→ ət']],
        record: ['works at a coffee shop', 'arrived at the airport', 'as far as I know', 'at home and at work', 'as well as before'] },
      { name: 'Schwa in Everyday Sentences', desc: 'Full real-life sentences — find and produce every schwa naturally.',
        vis: { tokens: [['The weather today is supposed ', ''], ['to', 'weak'], [' be better ', ''], ['than', 'weak'], [' yesterday.', '']], caption: '"to" and "than" both reduce mid-sentence. "supposed" has a schwa in its second syllable too.' },
        examples: ['The weather today is supposed to be better than yesterday.', 'A friend of mine mentioned it to me last week.', 'There are a couple of things I need to take care of today.', 'She was supposed to call but I think she got held up at work.', 'A lot of the feedback we got was more positive than expected.'],
        words: [['supposed to', 'Daily'], ['a friend of', 'Daily'], ['couple of', 'Daily'], ['better than', 'Daily'], ['take care of', 'Daily'], ['last week', 'Daily']],
        record: ['supposed to be better', 'a friend of mine', 'a couple of things', 'take care of it', 'mentioned it to me'] },
      { name: 'Schwa in News Sentences', desc: 'News language is full of schwas — every unstressed syllable in formal speech reduces.',
        vis: { tokens: [['The government announced ', ''], ['a', 'weak'], [' series ', ''], ['of', 'weak'], [' measures ', ''], ['to', 'weak'], [' address inflation.', '']], caption: '"a", "of", "to" all reduce even in formal news register.' },
        examples: ['The government announced a series of measures to address inflation.', 'A number of residents were asked to evacuate the area.', 'Officials from several countries met to discuss the proposal.', 'The committee called for a review of the current policy on housing.', 'A spokesperson confirmed that a decision would be made within a matter of days.'],
        words: [['a series of', 'News'], ['a number of', 'News'], ['officials from', 'News'], ['several of', 'News'], ['address the', 'News'], ['of measures', 'News']],
        record: ['a series of measures', 'a number of residents', 'officials from several countries', 'to address inflation', 'discuss the proposal'] },
      { name: 'Identifying Weak Sounds in Fast Speech', desc: 'Listen for what disappears — comprehension and awareness practice.',
        vis: { tokens: [['I kind ', ''], ['of', 'weak'], [' thought it was ', ''], ['going to', 'link', 'ŋ→tə'], [' be different ', ''], ['than', 'weak'], [' what it ended up being.', '']], caption: '"of", "than" reduce; "going to" links — all in one casual sentence.' },
        examples: ['I kind of thought it was going to be different than what it ended up being.', 'A lot of them had no idea what was going on at the time.', 'Some of us were told to wait for a bit before heading in.', 'Most of what she said was going to be covered in the report anyway.', 'A couple of us had no idea it was supposed to be a surprise.'],
        words: [['kind of', 'Daily'], ['going to', 'Daily'], ['a lot of', 'Daily'], ['no idea', 'Daily'], ['some of', 'Daily'], ['heading in', 'Daily']],
        record: ['kind of thought it would', 'going to be different', 'a lot of them', 'no idea what was happening', 'some of us waited'] },
      { name: 'Mixed Weak Sounds — Fluency Challenge', desc: 'All weak sound types in one flow — strong syllables strong, weak syllables light.',
        vis: { tokens: [['A lot ', ''], ['of', 'weak'], [' what we know ', ''], ['about', 'weak'], [' ', ''], ['the', 'weak'], [' topic comes ', ''], ['from', 'weak'], [' ', ''], ['a', 'weak'], [' handful ', ''], ['of', 'weak'], [' studies.', '']], caption: 'Six function words reduce in one sentence — count them as you say it.' },
        examples: ['A lot of what we know about the topic comes from a handful of studies done over the past decade.', 'She was supposed to arrive at the station at about a quarter to three.', 'From what I could tell, most of the people there had no idea of the situation.', 'A number of us had been waiting for a response for a couple of weeks.', 'Most of the time, a bit of patience goes a long way in a situation like this.'],
        words: [['a lot of', 'Daily'], ['supposed to', 'Daily'], ['a quarter to', 'Daily'], ['most of the', 'Daily'], ['from what', 'Daily'], ['no idea of', 'Daily']],
        record: ['a lot of what we know', 'supposed to arrive', 'most of the people', 'from what I could tell', 'no idea of the situation'] },
    ],
  },
  {
    id: 'reductions', symbol: '/h/', name: 'Reductions in English',
    desc: 'Fluent English uses a second layer of contractions beyond formal writing. Recognizing and producing them is key to natural comprehension.',
    tags: ['📰 News & Daily Life'],
    practices: [
      { name: '"Going to" → Gonna', desc: '"Gonna" is used in informal and conversational speech — never in formal writing.',
        vis: { tokens: [['It is ', ''], ['going to', 'reduce:gonna'], [' rain later.', '']], caption: '"going to" → "gonna" — the boundary between the two words disappears completely.' },
        examples: ['It is gonna rain later this afternoon.', 'She is gonna call us when she lands.', 'I am gonna need a little more time on this.'],
        words: [['gonna rain', 'Daily'], ['gonna call', 'Daily'], ['gonna need', 'Daily'], ['gonna be', 'Daily'], ['gonna try', 'Daily'], ['gonna help', 'Daily']],
        record: ['gonna rain later', 'gonna call when she lands', 'gonna need more time', 'gonna be okay', 'gonna try again tomorrow'] },
      { name: '"Want to" → Wanna', desc: '"Wanna" appears in everyday conversation and informal registers.',
        vis: { tokens: [['Do you ', ''], ['want to', 'reduce:wanna'], [' grab coffee?', '']], caption: '"want to" → "wanna" — the t and the o merge and reduce.' },
        examples: ['Do you wanna grab coffee before the meeting?', 'I do not wanna wait in that line again.', 'She said she wanna hear the whole story.'],
        words: [['wanna grab', 'Daily'], ['wanna wait', 'Daily'], ['wanna know', 'Daily'], ['wanna go', 'Daily'], ['wanna hear', 'Daily'], ['wanna try', 'Daily']],
        record: ['wanna grab coffee', 'do not wanna wait', 'wanna hear the story', 'wanna go somewhere', 'wanna know the answer'] },
      { name: '"Have to" → Hafta', desc: '"Hafta" is very common in spoken English for obligations and necessity.',
        vis: { tokens: [['We ', ''], ['have to', 'reduce:hafta'], [' leave in ten minutes.', '']], caption: '"have to" → "hafta" — the v softens and "to" fully reduces.' },
        examples: ['We hafta leave in ten minutes or we will miss the train.', 'You hafta see this — it is unbelievable.', 'She said she hafta finish it by Friday.'],
        words: [['hafta leave', 'Daily'], ['hafta see', 'Daily'], ['hafta finish', 'Daily'], ['hafta be', 'Daily'], ['hafta do', 'Daily'], ['hafta call', 'Daily']],
        record: ['hafta leave in ten minutes', 'hafta see this', 'hafta finish by Friday', 'hafta be there early', 'hafta call them back'] },
      { name: '"Got to" → Gotta', desc: '"Gotta" implies urgency or necessity — very natural in informal speech.',
        vis: { tokens: [['I have ', ''], ['got to', 'reduce:gotta'], [' run — my bus is here.', '']], caption: '"got to" → "gotta" — the t and the o collapse into one syllable.' },
        examples: ['I have gotta run — my bus is in two minutes.', 'You have gotta try this place on Fifth.', 'She has gotta stop doing that.'],
        words: [['gotta run', 'Daily'], ['gotta try', 'Daily'], ['gotta stop', 'Daily'], ['gotta go', 'Daily'], ['gotta be', 'Daily'], ['gotta do', 'Daily']],
        record: ['gotta run right now', 'gotta try this place', 'gotta stop doing that', 'gotta go already', 'gotta be kidding'] },
      { name: '"Has to" → Hasta', desc: 'Third-person singular obligation — reduces the same way.',
        vis: { tokens: [['He ', ''], ['has to', 'reduce:hasta'], [' be there by eight.', '']], caption: '"has to" → "hasta" — same reduction pattern as "hafta".' },
        examples: ['He hasta be there by eight or the doors close.', 'She hasta sign the form before Thursday.', 'The report hasta go through three approvals.'],
        words: [['hasta be', 'Daily'], ['hasta sign', 'Daily'], ['hasta go', 'Daily'], ['hasta finish', 'Daily'], ['hasta wait', 'Daily'], ['hasta leave', 'Daily']],
        record: ['hasta be there by eight', 'hasta sign the form', 'hasta go through approval', 'hasta finish today', 'hasta leave early'] },
      { name: '"Used to" → Useta', desc: '"Useta" refers to past habits — the /d/ fully disappears in natural speech.',
        vis: { tokens: [['She ', ''], ['used to', 'reduce:useta'], [' live in that neighborhood.', '']], caption: '"used to" → "useta" — the d disappears entirely: /juːstə/.' },
        examples: ['She useta live in that neighborhood before the move.', 'We useta meet every Friday morning for years.', 'He useta run five miles a day before his injury.'],
        words: [['useta live', 'Daily'], ['useta meet', 'Daily'], ['useta run', 'Daily'], ['useta be', 'Daily'], ['useta work', 'Daily'], ['useta go', 'Daily']],
        record: ['useta live near here', 'useta meet every Friday', 'useta run every morning', 'useta be different', 'useta work downtown'] },
      { name: '"Supposed to" → Sposta', desc: '"Sposta" is very informal — essential for listening comprehension.',
        vis: { tokens: [['The package was ', ''], ['supposed to', 'reduce:sposta'], [' arrive two days ago.', '']], caption: '"supposed to" → "sposta" — the entire middle collapses.' },
        examples: ['The package was sposta arrive two days ago.', 'We were sposta meet at seven but plans changed.', 'She was sposta call before coming over.'],
        words: [['sposta arrive', 'Daily'], ['sposta meet', 'Daily'], ['sposta call', 'Daily'], ['sposta be', 'Daily'], ['sposta come', 'Daily'], ['sposta say', 'Daily']],
        record: ['sposta arrive two days ago', 'sposta meet at seven', 'sposta call first', 'sposta be here already', 'sposta come with us'] },
      { name: '"Do not know" → Dunno', desc: '"Dunno" is one of the most common informal reductions in everyday English.',
        vis: { tokens: [['I ', ''], ['do not know', 'reduce:dunno'], [' — what do you think?', '']], caption: '"do not know" → "dunno" — three words collapse into two syllables: /dʌnoʊ/.' },
        examples: ['I dunno — what do you think we should do?', 'She said she dunno where she put the keys.', 'Dunno why it keeps happening.'],
        words: [['dunno why', 'Daily'], ['dunno where', 'Daily'], ['dunno what', 'Daily'], ['dunno how', 'Daily'], ['dunno yet', 'Daily'], ['dunno if', 'Daily']],
        record: ['dunno what to do', 'dunno where the keys are', 'dunno why it happened', 'dunno how long', 'dunno if it is ready'] },
      { name: '"Let me" → Lemme', desc: '"Lemme" is used in requests and offers — one of the most frequent reductions.',
        vis: { tokens: [['', ''], ['Let me', 'reduce:lemme'], [' see that for a second.', '']], caption: '"let me" → "lemme" — the t softens and the two words fuse into one.' },
        examples: ['Lemme see that for a second.', 'Lemme know when you are ready to leave.', 'Lemme guess — you forgot again.'],
        words: [['lemme see', 'Daily'], ['lemme know', 'Daily'], ['lemme guess', 'Daily'], ['lemme check', 'Daily'], ['lemme try', 'Daily'], ['lemme ask', 'Daily']],
        record: ['lemme see that', 'lemme know when you are ready', 'lemme guess what happened', 'lemme check the time', 'lemme ask someone'] },
      { name: '"Give me" → Gimme', desc: '"Gimme" in conversation — common in requests and expressions.',
        vis: { tokens: [['', ''], ['Give me', 'reduce:gimme'], [' a second — I am almost done.', '']], caption: '"give me" → "gimme" — the v softens and "me" loses its vowel quality.' },
        examples: ['Gimme a second — I am almost done.', 'Just gimme the short version.', 'She said gimme a call when you land.'],
        words: [['gimme a second', 'Daily'], ['gimme the', 'Daily'], ['gimme a call', 'Daily'], ['just gimme', 'Daily'], ['gimme a chance', 'Daily'], ['gimme a break', 'Daily']],
        record: ['gimme a second', 'gimme the short version', 'gimme a call tonight', 'just gimme a chance', 'gimme a break'] },
      { name: '"Kind of / Sort of" → Kinda / Sorta', desc: 'These hedging words are extremely common in everyday spoken English.',
        vis: { tokens: [['It was ', ''], ['kind of', 'reduce:kinda'], [' cold so I grabbed a jacket.', '']], caption: '"kind of" → "kinda" — the f disappears and the vowel in "of" reduces to /ə/.' },
        examples: ['It was kinda cold out so I grabbed a jacket.', 'The movie was sorta interesting but a bit slow.', 'I am kinda tired but I can still make it.'],
        words: [['kinda cold', 'Daily'], ['sorta interesting', 'Daily'], ['kinda tired', 'Daily'], ['kinda want', 'Daily'], ['sorta makes', 'Daily'], ['kinda nice', 'Daily']],
        record: ['kinda cold outside', 'sorta interesting but slow', 'kinda tired today', 'sorta makes sense', 'kinda want to go'] },
      { name: 'Reductions in Everyday Conversations', desc: 'Full conversational exchanges with all reductions used naturally.',
        vis: { tokens: [['I ', ''], ['dunno', 'reduce:dunno'], [' — I ', ''], ['kinda', 'reduce:kinda'], [' ', ''], ['wanna', 'reduce:wanna'], [' stay in tonight.', '']], caption: 'Three reductions in one casual sentence — all completely natural.' },
        examples: ['I dunno — I kinda wanna stay in tonight. I am gonna order food.', 'You hafta lemme know if you wanna come. We are gonna leave by six.', 'She useta call every week but I dunno what happened.'],
        words: [['dunno yet', 'Daily'], ['gonna order', 'Daily'], ['hafta know', 'Daily'], ['useta call', 'Daily'], ['wanna stay', 'Daily'], ['lemme know', 'Daily']],
        record: ['gonna order food tonight', 'hafta lemme know by five', 'useta call every week', 'dunno what happened', 'kinda wanna stay in'] },
      { name: 'Reductions in News Conversations', desc: 'Even casual broadcast speech uses reductions in interview-style delivery.',
        vis: { tokens: [['A lot of people ', ''], ['wanna', 'reduce:wanna'], [' know when they are ', ''], ['gonna', 'reduce:gonna'], [' get an answer.', '']], caption: '"wanna" and "gonna" appear naturally even in broadcast casual register.' },
        examples: ['I dunno what the officials are gonna do about it at this point.', 'A lot of people wanna know when they are gonna get an answer.', 'He said he was sposta meet with the committee but had to reschedule.'],
        words: [['gonna do', 'News'], ['wanna know', 'News'], ['sposta meet', 'News'], ['hafta reschedule', 'News'], ['dunno when', 'News'], ['gotta say', 'News']],
        record: ['gonna do about it', 'wanna know the answer', 'sposta meet the committee', 'hafta reschedule', 'dunno what comes next'] },
      { name: 'Listening — Recognizing Reductions', desc: 'Train your ear. The goal is catching reductions in fast speech.',
        vis: { tokens: [['She was ', ''], ['sposta', 'reduce:sposta'], [' call but I ', ''], ['dunno', 'reduce:dunno'], [' if she is ', ''], ['gonna', 'reduce:gonna'], [' make it.', '']], caption: 'Three reductions in one sentence — how fast can you catch all three?' },
        examples: ['She was sposta call but I dunno if she is gonna make it.', 'Lemme check — I think we hafta be there by noon.', 'I kinda wanna go but I dunno if I am gonna have enough time.'],
        words: [['sposta', 'Listen'], ['dunno', 'Listen'], ['gonna', 'Listen'], ['lemme', 'Listen'], ['hafta', 'Listen'], ['kinda', 'Listen']],
        record: ['sposta call', 'dunno if she is coming', 'hafta be there by noon', 'lemme check the time', 'kinda wanna go but cannot'] },
      { name: 'Mixed Reductions — Fluency Challenge', desc: 'All reductions in one natural flow. Smoothness over speed.',
        vis: { tokens: [['We are ', ''], ['gonna', 'reduce:gonna'], [' ', ''], ['hafta', 'reduce:hafta'], [' leave soon. ', ''], ['Gimme', 'reduce:gimme'], [' five more minutes.', '']], caption: 'Two reductions back to back — "gonna hafta" — then "gimme" right after.' },
        examples: ['I dunno — she was sposta be here by now. Lemme try calling her. She useta answer right away.', 'We are gonna hafta leave soon. Gimme five more minutes and I will be ready.', 'He kinda sorta knew what was gonna happen but did not wanna say anything.'],
        words: [['dunno yet', 'Mixed'], ['sposta be', 'Mixed'], ['gonna hafta', 'Mixed'], ['gimme five', 'Mixed'], ['kinda sorta', 'Mixed'], ['wanna say', 'Mixed']],
        record: ['dunno sposta be here', 'gonna hafta leave soon', 'gimme five more minutes', 'kinda sorta knew', 'useta answer right away'] },
    ],
  },
  {
    id: 'vowels', symbol: '◯', name: 'Opening the Mouth with Vowels',
    desc: 'Clear vowels require jaw movement. Compressed vowels make speech harder to follow and sound less confident.',
    tags: ['📰 News & Daily Life', '⚡ High Priority'],
    practices: [
      { name: '/æ/ — Short A', desc: 'Jaw drops noticeably. Tongue flat and low. Lips spread slightly.',
        vis: { tokens: [['She grabbed a black bag from the back of the cab.', 'link']], caption: 'Every bold word uses /æ/ — jaw drops on each one. Feel the difference from a regular "a".' },
        examples: ['The cat sat on a flat mat.', 'She grabbed a black bag from the back of the cab.', 'That was a bad plan from the start.'],
        words: [['cat', 'Short A'], ['flat', 'Short A'], ['grab', 'Short A'], ['black', 'Short A'], ['bad', 'Short A'], ['plan', 'Short A']],
        record: ['the cat sat flat', 'grabbed a black bag', 'bad plan from the start', 'back of the cab', 'that was bad'] },
      { name: '/ɑ/ — Open O', desc: 'Jaw opens fully. Lips rounded slightly. Tongue low and back.',
        vis: { tokens: [['He called the office at the top of the hour.', '']], caption: '"called", "office", "top" — all use /ɑ/. Jaw fully open, lips slightly rounded.' },
        examples: ['The fog was heavy over the dock this morning.', 'He called the office at the top of the hour.', 'The response was not what the author expected.'],
        words: [['fog', 'Open O'], ['dock', 'Open O'], ['office', 'Open O'], ['not', 'Open O'], ['on', 'Open O'], ['call', 'Open O']],
        record: ['fog over the dock', 'called the office', 'not what we expected', 'on top of it', 'call when you arrive'] },
      { name: '/ɛ/ — Short E', desc: 'Jaw slightly open. Tongue in the middle. A clean, forward sound.',
        vis: { tokens: [['The message said the next event was set for Wednesday.', '']], caption: '"message", "next", "set" — /ɛ/ throughout. Jaw half-open, tongue forward.' },
        examples: ['The message said the next event was set for Wednesday.', 'She checked the weather and decided to stay in.', 'Ten percent of the test was incorrect.'],
        words: [['message', 'Short E'], ['next', 'Short E'], ['checked', 'Short E'], ['weather', 'Short E'], ['ten', 'Short E'], ['set', 'Short E']],
        record: ['message said the next event', 'checked the weather', 'ten percent incorrect', 'set for Wednesday', 'next step forward'] },
      { name: '/ʌ/ — Short U', desc: 'Jaw opens about halfway. Tongue relaxed in the center of the mouth.',
        vis: { tokens: [['The judge announced the result just before lunch.', '']], caption: '"judge", "result", "lunch" — all /ʌ/. Central, relaxed jaw position.' },
        examples: ['The company cut funding for the study.', 'She won the trust of the public with one speech.', 'The judge announced the result just before lunch.'],
        words: [['cut', 'Short U'], ['trust', 'Short U'], ['public', 'Short U'], ['judge', 'Short U'], ['result', 'Short U'], ['lunch', 'Short U']],
        record: ['cut funding for the study', 'won the public trust', 'judge announced the result', 'just before lunch', 'one tough decision'] },
      { name: '/aɪ/ — Long I', desc: 'The mouth opens wide then closes as the jaw rises — a two-part glide.',
        vis: { tokens: [['The price was higher than expected by tonight.', '']], caption: '"price", "higher", "tonight" — /aɪ/ glide. Open wide, then close upward.' },
        examples: ['The price of the item was higher than expected.', 'She decided to apply for the position online.', 'By tonight the entire city will know the result.'],
        words: [['price', 'Long I'], ['higher', 'Long I'], ['decided', 'Long I'], ['apply', 'Long I'], ['tonight', 'Long I'], ['entire', 'Long I']],
        record: ['price was higher than expected', 'decided to apply', 'by tonight we will know', 'entire city', 'online application'] },
      { name: '/aʊ/ — OW Sound', desc: 'Start with an open jaw and close upward toward a rounded finish.',
        vis: { tokens: [['The crowd gathered around the fountain downtown.', '']], caption: '"crowd", "around", "fountain", "downtown" — /aʊ/ in every word. Open then round.' },
        examples: ['The crowd gathered around the fountain downtown.', 'She found out about the change about an hour ago.', 'The sound of the crowd outside was loud and clear.'],
        words: [['crowd', 'OW'], ['around', 'OW'], ['found out', 'OW'], ['about', 'OW'], ['loud', 'OW'], ['town', 'OW']],
        record: ['crowd gathered around', 'found out about the change', 'loud and clear', 'sound of the crowd', 'downtown fountain'] },
      { name: '/ɔɪ/ — OY Sound', desc: 'Start rounded and glide up and forward — a distinct two-part movement.',
        vis: { tokens: [['She was annoyed by the noise from the street.', '']], caption: '"annoyed" and "noise" — /ɔɪ/ both. Start with rounded lips, glide forward.' },
        examples: ['She was annoyed by the noise coming from the street.', 'The appointment was set to avoid the busy hours.', 'He enjoyed the choice of film for the evening.'],
        words: [['annoyed', 'OY'], ['noise', 'OY'], ['appointment', 'OY'], ['avoid', 'OY'], ['enjoyed', 'OY'], ['choice', 'OY']],
        record: ['annoyed by the noise', 'appointment to avoid rush hour', 'enjoyed the choice', 'point of the story', 'avoid the crowds'] },
      { name: 'Jaw Opening — Mirror Practice', desc: 'Watch yourself. For every word, your jaw should visibly move downward.',
        vis: { tokens: [['Law. Bad. Mud. Pride. Crowd. Noise.', '']], caption: 'Six different vowels — six different jaw positions. Watch in a mirror as you say each one.' },
        examples: ['Act naturally and speak at your normal pace.', 'Open each vowel as if the back row needs to hear you clearly.', 'Law. Bad. Mud. Pride. Crowd. Noise.'],
        words: [['act', 'Mirror'], ['law', 'Mirror'], ['bad', 'Mirror'], ['mud', 'Mirror'], ['pride', 'Mirror'], ['crowd', 'Mirror']],
        record: ['law and order', 'act naturally', 'bad decision', 'mud on the road', 'pride in the work', 'crowd outside'] },
      { name: 'Minimal Pairs — /æ/ vs /ɛ/', desc: 'These two sounds are close but distinct. The jaw drops further for /æ/.',
        vis: { tokens: [['The pen and the pan are not the same.', '']], caption: '"pen" = /ɛ/, "pan" = /æ/ — the jaw drops noticeably lower on "pan".' },
        examples: ['The pen and the pan are not the same thing.', 'They said he left the bag not the beg by the desk.', 'There is a difference between bed and bad.'],
        words: [['pen / pan', 'Pair'], ['bed / bad', 'Pair'], ['said / sad', 'Pair'], ['left / laughed', 'Pair'], ['ten / tan', 'Pair'], ['met / mat', 'Pair']],
        record: ['pen and pan', 'bed and bad', 'ten and tan', 'said and sad', 'met and mat', 'left and laughed'] },
      { name: 'Minimal Pairs — /ɑ/ vs /ʌ/', desc: 'Two open vowels that often get confused. /ɑ/ is back; /ʌ/ is central.',
        vis: { tokens: [['The cop and the cup are on the counter.', '']], caption: '"cop" = /ɑ/ (back, rounded), "cup" = /ʌ/ (central, open). Small mouth shift, big difference.' },
        examples: ['The cop and the cup are on the counter.', 'It was hot in the hut near the river.', 'She got a cut on her cot.'],
        words: [['cop / cup', 'Pair'], ['hot / hut', 'Pair'], ['got / gut', 'Pair'], ['lock / luck', 'Pair'], ['rob / rub', 'Pair'], ['shot / shut', 'Pair']],
        record: ['cop and cup', 'hot in the hut', 'got a cut', 'lock and luck', 'rob and rub', 'shot and shut'] },
      { name: 'Vowels in Everyday Words', desc: 'Common vocabulary where vowel clarity matters most.',
        vis: { tokens: [['The weather has been strange this past month.', '']], caption: '"weather" has /ɛ/, "strange" has /eɪ/, "month" has /ʌ/ — three different vowels.' },
        examples: ['The weather has been really strange this past month.', 'She brought a blanket and a pillow for the flight.', 'The price of groceries went up again this week.'],
        words: [['weather', 'Daily'], ['strange', 'Daily'], ['blanket', 'Daily'], ['pillow', 'Daily'], ['price', 'Daily'], ['groceries', 'Daily']],
        record: ['really strange weather', 'brought a blanket', 'price of groceries', 'went up again', 'past month or so'] },
      { name: 'Vowels in Multi-Syllable Words', desc: 'Longer words have more vowel variety — each syllable needs its own position.',
        vis: { tokens: [['The investigation took nearly three years to complete.', '']], caption: '"investigation" — 6 syllables, 5 different mouth positions. Each one distinct.' },
        examples: ['The investigation took nearly three years to complete.', 'His presentation was informative and well organized.', 'The community gathered to celebrate the anniversary.'],
        words: [['investigation', 'Long'], ['presentation', 'Long'], ['community', 'Long'], ['informative', 'Long'], ['anniversary', 'Long'], ['celebration', 'Long']],
        record: ['the investigation took years', 'presentation was well organized', 'community gathered', 'informative and clear', 'anniversary celebration'] },
      { name: 'Vowels in News Headlines', desc: 'News headlines are dense with stressed vowels — each one needs to land clearly.',
        vis: { tokens: [['Officials report a sharp rise in housing costs.', '']], caption: '"sharp", "rise", "housing" — three distinct vowels in quick succession. Each jaw position clear.' },
        examples: ['Officials report a sharp rise in housing costs across the country.', 'The storm caused widespread damage to crops in the midwest.', 'A breakthrough in battery technology could change electric transport.'],
        words: [['sharp rise', 'News'], ['widespread', 'News'], ['breakthrough', 'News'], ['costs', 'News'], ['damage', 'News'], ['transport', 'News']],
        record: ['sharp rise in costs', 'widespread damage to crops', 'breakthrough in technology', 'could change transport', 'across the country'] },
      { name: 'Vowels in Full Sentences', desc: 'Multiple vowels in sequence — keep each one open without slowing down.',
        vis: { tokens: [['It rained all night and the streets were flooded by dawn.', '']], caption: '"rained" /eɪ/, "flooded" /ʌ/, "dawn" /ɔ/ — three different vowel positions in one sentence.' },
        examples: ['It rained all night and the streets were flooded by dawn.', 'The crowd cheered loudly as the final point was announced.', 'She applied for three positions and got two interviews the same week.'],
        words: [['rained all night', 'Daily'], ['flooded by dawn', 'Daily'], ['cheered loudly', 'Daily'], ['applied for', 'Daily'], ['positions', 'Daily'], ['interviews', 'Daily']],
        record: ['rained all night', 'streets were flooded', 'crowd cheered loudly', 'applied for three positions', 'two interviews same week'] },
      { name: 'Mixed Vowels — Fluency Challenge', desc: 'All vowel types in one stretch — keep every vowel open, none blurring together.',
        vis: { tokens: [['By the time the crowd found out about the price change, it was too late to act.', '']], caption: '"crowd" /aʊ/, "price" /aɪ/, "act" /æ/ — three vowel glides, all different, in one sentence.' },
        examples: ['By the time the crowd found out about the price change, it was too late to act.', 'The investigation annoyed a lot of people who had trusted the public announcement.', 'She cut through the noise and made a choice that surprised everyone involved.'],
        words: [['crowd found out', 'Mixed'], ['price change', 'Mixed'], ['investigation', 'Mixed'], ['annoyed', 'Mixed'], ['cut through', 'Mixed'], ['choice', 'Mixed']],
        record: ['crowd found out about the price', 'investigation annoyed many', 'cut through the noise', 'made a choice', 'surprised everyone involved'] },
    ],
  },
]

// ── VISUAL TOKEN RENDERER ─────────────────────────────────────────────
function VisDisplay({ vis }: { vis: VisDiagram }) {
  const teal = '#1D9E75'
  return (
    <div style={{ background: 'white', border: '1px solid #dceee9', borderRadius: 12, padding: '20px 22px', marginBottom: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.09em', textTransform: 'uppercase', color: '#8aada5', marginBottom: 16 }}>🔍 Sound Pattern</div>
      <div style={{ fontSize: 26, fontWeight: 400, color: '#1a2e28', lineHeight: 1.4, paddingBottom: 28, letterSpacing: '0.01em' }}>
        {vis.tokens.map(([text, type, note], i) => {
          if (!type || type === '') return <span key={i}>{text}</span>
          if (type === 'link') return (
            <span key={i} style={{ display: 'inline-block', position: 'relative', paddingBottom: 16 }}>
              {note && <span style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontWeight: 700, color: '#0F6E56', fontFamily: 'monospace', whiteSpace: 'nowrap', letterSpacing: '.04em' }}>{note}</span>}
              <span>{text}</span>
              <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', height: 14, overflow: 'visible', pointerEvents: 'none' }} viewBox="0 0 120 13" preserveAspectRatio="none">
                <path d="M0,7 Q6,2 12,7 Q18,12 24,7 Q30,2 36,7 Q42,12 48,7 Q54,2 60,7 Q66,12 72,7 Q78,2 84,7 Q90,12 96,7 Q102,2 108,7 Q114,12 120,7" stroke={teal} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )
          if (type === 'weak') return <span key={i} style={{ display: 'inline-block', padding: '1px 6px', borderRadius: 5, background: '#fef3c7', color: '#92400e', fontWeight: 500, margin: '0 1px' }}>{text}</span>
          if (type && type.startsWith('reduce:')) {
            const reduced = type.split(':')[1]
            return (
              <span key={i} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '0 4px', gap: 0 }}>
                <span style={{ color: '#b8d4cc', textDecoration: 'line-through', fontSize: 14, lineHeight: 1.2 }}>{text}</span>
                <span style={{ color: '#7c3aed', fontWeight: 600, fontSize: 16, lineHeight: 1.3, fontFamily: 'monospace' }}>{reduced}</span>
              </span>
            )
          }
          return <span key={i}>{text}</span>
        })}
      </div>
      <div style={{ fontSize: 12.5, color: '#4a6b62', fontStyle: 'italic', borderTop: '1px solid #e8f2ef', paddingTop: 10, lineHeight: 1.5 }}>{vis.caption}</div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────
export default function FluencyPage() {
  const [topicId, setTopicId]   = useState('linking')
  const [pracIdx, setPracIdx]   = useState(0)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ linking: true })
  const [recWords, setRecWords] = useState(false)
  const [recSents, setRecSents] = useState(false)

  const topic    = TOPICS.find(t => t.id === topicId)!
  const practice = topic.practices[pracIdx]
  const topicIdx = TOPICS.indexOf(topic)
  const globalIdx = topicIdx * 15 + pracIdx
  const totalGlobal = TOPICS.length * 15

  function goTo(tid: string, pi: number) {
    setTopicId(tid)
    setPracIdx(pi)
    setOpenGroups({ [tid]: true })
    setRecWords(false)
    setRecSents(false)
  }

  function toggleGroup(tid: string) {
    setOpenGroups(prev => ({ ...prev, [tid]: !prev[tid] }))
  }

  function prevPractice() {
    if (pracIdx > 0) { goTo(topicId, pracIdx - 1); return }
    if (topicIdx > 0) goTo(TOPICS[topicIdx - 1].id, 14)
  }

  function nextPractice() {
    if (pracIdx < 14) { goTo(topicId, pracIdx + 1); return }
    if (topicIdx < TOPICS.length - 1) goTo(TOPICS[topicIdx + 1].id, 0)
  }

  const teal = '#1D9E75'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* Fluency topic panel */}
      <aside style={{ width: 256, background: '#f6f9f8', borderRight: '1px solid #e0eeea', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0 }}>
        <div style={{ padding: '18px 16px 12px', fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8aada5', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid #e0eeea' }}>
          🎯 Fluency Topics
        </div>
        {TOPICS.map(t => {
          const isOpen = !!openGroups[t.id]
          return (
            <div key={t.id} style={{ borderBottom: '1px solid #e0eeea' }}>
              <div
                onClick={() => toggleGroup(t.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px 12px 18px', cursor: 'pointer', background: isOpen ? '#e1f5ee' : 'transparent', gap: 8 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500, color: isOpen ? teal : '#0F6E56', lineHeight: 1 }}>{t.symbol}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#1a2e28', lineHeight: 1.25 }}>{t.name}</span>
                  <span style={{ fontSize: 10.5, color: '#8aada5', marginTop: 1 }}>15 practices</span>
                </div>
                <span style={{ color: '#8aada5', fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▼</span>
              </div>
              {isOpen && (
                <div style={{ background: 'white', borderTop: '1px solid #e0eeea' }}>
                  {t.practices.map((p, i) => {
                    const isActive = t.id === topicId && i === pracIdx
                    return (
                      <div
                        key={i}
                        onClick={() => goTo(t.id, i)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px 8px 28px', cursor: 'pointer', borderLeft: isActive ? `3px solid ${teal}` : '3px solid transparent', background: isActive ? '#e1f5ee' : 'transparent' }}
                      >
                        <span style={{ fontFamily: 'monospace', fontSize: 10, color: isActive ? teal : '#8aada5', minWidth: 18, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                        <span style={{ fontSize: 12.5, color: isActive ? '#1a2e28' : '#4a6b62', fontWeight: isActive ? 500 : 400, lineHeight: 1.35 }}>{p.name}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', background: 'white' }}>
        {/* Breadcrumb */}
        <div style={{ padding: '13px 32px', fontSize: 12, color: '#8aada5', borderBottom: '1px solid #e8f2ef', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span>LangSolution</span>
          <span style={{ color: '#e8f2ef', fontSize: 13 }}>›</span>
          <span>Accent Clarity</span>
          <span style={{ color: '#e8f2ef', fontSize: 13 }}>›</span>
          <span style={{ color: '#4a6b62', fontWeight: 500 }}>{topic.name}</span>
          <span style={{ color: '#e8f2ef', fontSize: 13 }}>›</span>
          <span style={{ color: '#4a6b62', fontWeight: 500 }}>Practice {pracIdx + 1}</span>
        </div>

        <div style={{ padding: '28px 36px 56px', maxWidth: 900 }}>
          {/* Topic header */}
          <div style={{ fontFamily: 'monospace', fontSize: 40, color: teal, lineHeight: 1, marginBottom: 10 }}>{topic.symbol}</div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a2e28', lineHeight: 1.2, marginBottom: 6 }}>{topic.name}</h1>
          <p style={{ fontSize: 14, color: '#4a6b62', lineHeight: 1.65, marginBottom: 16, maxWidth: 600 }}>{topic.desc}</p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {topic.tags.map((tag, i) => (
              <span key={i} style={{ fontSize: 11.5, fontWeight: 500, padding: '3px 10px', borderRadius: 20, background: tag.includes('News') ? '#f0f4ff' : tag.includes('Daily') ? '#f0fdf4' : '#faeeda', color: tag.includes('News') ? '#3355aa' : tag.includes('Daily') ? '#166534' : '#854F0B' }}>{tag}</span>
            ))}
          </div>

          {/* Practice header */}
          <div style={{ background: '#f4faf8', border: '1px solid #dceee9', borderRadius: 12, padding: '18px 22px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600, color: '#1a2e28', marginBottom: 4 }}>{practice.name}</div>
              <div style={{ fontSize: 13, color: '#4a6b62', lineHeight: 1.6 }}>{practice.desc}</div>
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#0F6E56', background: '#9FE1CB', padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 3 }}>Practice {pracIdx + 1} / 15</span>
          </div>

          {/* Visual */}
          <VisDisplay vis={practice.vis} />

          <hr style={{ border: 'none', borderTop: '1px solid #e8f2ef', margin: '28px 0' }} />

          {/* Video placeholder */}
          <div style={{ border: '1px solid #dceee9', borderRadius: 12, overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #dceee9', background: '#f4faf8' }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8aada5' }}>🎬 Watch</span>
            </div>
            <div style={{ background: '#0a0a0a', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, cursor: 'pointer', minHeight: 200 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', marginLeft: 4, fontSize: 20 }}>▶</span>
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 500 }}>Video coming soon</span>
            </div>
          </div>

          {/* Listen to examples */}
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8aada5', display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>🔊 Listen to Examples</div>

          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#8aada5', marginBottom: 10 }}>Words first</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {practice.words.map(([w, ctx], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid #dceee9', borderRadius: 9, background: 'white', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: '#1a2e28' }}>{w}</div>
                  <div style={{ fontSize: 10.5, color: '#8aada5' }}>{ctx}</div>
                </div>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: teal, fontSize: 10, marginLeft: 2 }}>▶</span>
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#8aada5', marginBottom: 10 }}>Then sentences</p>
          {practice.examples.map((ex, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', border: '1px solid #dceee9', borderRadius: 10, marginBottom: 8, background: 'white' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'white', border: '1.5px solid #dceee9', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                <span style={{ color: teal, fontSize: 12, marginLeft: 2 }}>▶</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: '#1a2e28' }}>{['Slow — isolated', 'Natural speed', 'Full sentence'][i] || `Sentence ${i + 1}`}</div>
                <div style={{ fontSize: 11.5, color: '#8aada5', marginTop: 2, fontStyle: 'italic' }}>{ex}</div>
              </div>
            </div>
          ))}

          <hr style={{ border: 'none', borderTop: '1px solid #e8f2ef', margin: '28px 0' }} />

          {/* Practice words */}
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8aada5', marginBottom: 14 }}>🗣️ Practice Words — Click to Hear</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginBottom: 4 }}>
            {practice.words.map(([w, ctx], i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 13px', border: '1px solid #dceee9', borderRadius: 9, background: 'white', cursor: 'pointer', minWidth: 120 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#1a2e28' }}>{w}</div>
                  <div style={{ fontSize: 10.5, color: '#8aada5' }}>{ctx}</div>
                </div>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: teal, fontSize: 10, marginLeft: 2 }}>▶</span>
                </div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e8f2ef', margin: '28px 0' }} />

          {/* Record yourself */}
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#8aada5', marginBottom: 14 }}>🎙️ Record Yourself</div>

          {/* Step 1 — Words */}
          <div style={{ border: '1px solid #dceee9', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '18px 22px 0' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#0F6E56', marginBottom: 6 }}>Step 1 — Words</p>
              <p style={{ fontSize: 13.5, color: '#4a6b62', lineHeight: 1.6, marginBottom: 16 }}>Read each word or phrase aloud. Focus on producing the sound correctly before moving to sentences.</p>
            </div>
            <div style={{ borderTop: '1px solid #dceee9' }}>
              {practice.words.map(([w], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 22px', borderBottom: i < practice.words.length - 1 ? '1px solid #e8f2ef' : 'none' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8aada5', minWidth: 20, flexShrink: 0, paddingTop: 2 }}>{i + 1}</span>
                  <span style={{ fontSize: 22, fontWeight: 400, color: '#1a2e28', letterSpacing: '0.01em' }}>{w}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 22px', borderTop: '1px solid #dceee9', background: 'white' }}>
              <button
                onClick={() => setRecWords(!recWords)}
                style={{ width: '100%', padding: 15, background: recWords ? '#c0392b' : teal, color: 'white', border: 'none', borderRadius: 9, fontSize: 14.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
              >
                🎙️ {recWords ? 'Stop Recording — Words' : 'Start Recording — Words'}
              </button>
            </div>
          </div>

          {/* Step 2 — Sentences */}
          <div style={{ border: '1px solid #dceee9', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px 0' }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: '#0F6E56', marginBottom: 6 }}>Step 2 — Sentences</p>
              <p style={{ fontSize: 13.5, color: '#4a6b62', lineHeight: 1.6, marginBottom: 16 }}>Now read the full sentences. Try to keep the same natural sound you practiced in the words above.</p>
            </div>
            <div style={{ borderTop: '1px solid #dceee9' }}>
              {practice.examples.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 22px', borderBottom: i < practice.examples.length - 1 ? '1px solid #e8f2ef' : 'none' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#8aada5', minWidth: 20, flexShrink: 0, paddingTop: 6 }}>{i + 1}</span>
                  <span style={{ fontSize: 18, fontWeight: 400, color: '#1a2e28', letterSpacing: '0.01em', lineHeight: 1.4 }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 22px', borderTop: '1px solid #dceee9', background: 'white' }}>
              <button
                onClick={() => setRecSents(!recSents)}
                style={{ width: '100%', padding: 15, background: recSents ? '#c0392b' : teal, color: 'white', border: 'none', borderRadius: 9, fontSize: 14.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}
              >
                🎙️ {recSents ? 'Stop Recording — Sentences' : 'Start Recording — Sentences'}
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 36, gap: 12 }}>
            <button
              onClick={prevPractice}
              disabled={globalIdx === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', border: '1px solid #dceee9', borderRadius: 9, background: 'white', fontSize: 13.5, fontWeight: 500, color: '#4a6b62', cursor: globalIdx === 0 ? 'not-allowed' : 'pointer', flex: 1, justifyContent: 'center', opacity: globalIdx === 0 ? 0.35 : 1 }}
            >
              ← Previous
            </button>
            <button
              onClick={nextPractice}
              disabled={globalIdx === totalGlobal - 1}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', border: '1px solid #dceee9', borderRadius: 9, background: 'white', fontSize: 13.5, fontWeight: 500, color: '#4a6b62', cursor: globalIdx === totalGlobal - 1 ? 'not-allowed' : 'pointer', flex: 1, justifyContent: 'center', opacity: globalIdx === totalGlobal - 1 ? 0.35 : 1 }}
            >
              Next →
            </button>
          </div>

          <p style={{ fontSize: 10, color: '#8aada5', letterSpacing: '.06em', textAlign: 'right', marginTop: 28, opacity: .45, textTransform: 'uppercase' }}>LangSolution · Accent Clarity</p>
        </div>
      </main>
    </div>
  )
}
