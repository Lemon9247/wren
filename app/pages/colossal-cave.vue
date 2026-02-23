<script setup>
useHead({ title: 'colossal cave — wren' })

const selected = ref(null)

const regions = {
  surface: { color: '#6a9955', label: 'Surface' },
  upper: { color: '#c8a882', label: 'Upper Cave' },
  deep: { color: '#7a8aaa', label: 'Deep Cave' },
  twopit: { color: '#aa7a8a', label: 'Twopit & Beanstalk' },
  plover: { color: '#8aaa7a', label: 'Plover Passage' },
  giant: { color: '#c89a5a', label: 'Giant\'s Domain' },
  secret: { color: '#9a7acc', label: 'Secret Canyons' },
  beyond: { color: '#cc5a5a', label: 'Beyond the Chasm' },
  maze: { color: '#7a7a7a', label: 'Mazes' },
}

const rooms = reactive([
  // Surface
  { id: 'building', name: 'Inside Building', x: 120, y: 30, region: 'surface',
    desc: 'Well house for a large spring. Home base. Drop treasures here.',
    note: '12 treasures deposited. Coins spent on batteries.' },
  { id: 'road', name: 'End of Road', x: 50, y: 30, region: 'surface',
    desc: 'Before a small brick building. Forest all around.' },

  // Upper Cave  
  { id: 'debris', name: 'Debris Room', x: 120, y: 80, region: 'upper',
    desc: 'Low room filled with debris. XYZZY teleports to Building.',
    note: 'Magic word: XYZZY' },
  { id: 'y2', name: 'Y2', x: 120, y: 130, region: 'upper',
    desc: 'Large room with "Y2" on a rock. PLUGH teleports to Building.',
    note: 'Magic words: PLUGH (→Building), PLOVER (→Plover Room)' },
  { id: 'lowns', name: 'Low N/S Passage', x: 120, y: 175, region: 'upper',
    desc: 'A low passage joining from the north with a higher one from the south.' },
  { id: 'mk', name: 'Mountain King', x: 120, y: 220, region: 'upper',
    desc: 'Hall of the Mountain King. Passages in all directions.',
    note: 'The bird defeated the snake here.' },
  { id: 'hom', name: 'Hall of Mists', x: 50, y: 220, region: 'upper',
    desc: 'Mist billows up from a great shaft. The rough stone walls extend upward.' },
  { id: 'fissure', name: 'East Bank', x: 10, y: 300, region: 'upper',
    desc: 'East bank of a fissure. A crystal bridge spans across.',
    note: 'Wave the black rod to create the bridge.' },
  
  // Deep Cave - Bedquilt axis
  { id: 'dirty', name: 'Dirty Passage', x: 180, y: 175, region: 'deep',
    desc: 'A dirty broken passage. Crawl east, large passage west.' },
  { id: 'dusty', name: 'Dusty Rock', x: 240, y: 175, region: 'deep',
    desc: 'Large room full of dusty rocks. Big hole in the floor.' },
  { id: 'cj', name: 'Complex Junction', x: 300, y: 175, region: 'deep',
    desc: 'You can go a bewildering number of directions from here.',
    note: 'Hub room. North→Shell, East→Anteroom, West→Bedquilt' },
  { id: 'bedquilt', name: 'Bedquilt', x: 370, y: 175, region: 'deep',
    desc: 'Long east/west passage with holes everywhere. Random exits.',
    note: '⚠️ North/south/up/down are RNG-dependent!' },
  { id: 'llr', name: 'Large Low Room', x: 440, y: 130, region: 'deep',
    desc: 'A large low room. Crawls lead north, se, and sw.',
    note: 'SW→Sloping Corridor (reliable route to Chasm!)' },
  { id: 'oriental', name: 'Oriental Room', x: 500, y: 175, region: 'deep',
    desc: 'Ancient oriental cave drawings cover the walls.',
    note: 'SE→Swiss Cheese, N→Misty Cavern' },
  { id: 'sloping', name: 'Sloping Corridor', x: 430, y: 70, region: 'deep',
    desc: 'A long winding passage sloping out of sight in both directions.',
    note: 'Up→Chasm, Down→LLR. That\'s it. East does NOT go to CJ.' },
  
  // Shell Room area
  { id: 'shell', name: 'Shell Room', x: 300, y: 120, region: 'deep',
    desc: 'Walls littered with bits of shells in sedimentary rock.',
    note: 'The giant clam (oyster) was here. Pried open with trident → pearl rolled to cul-de-sac.' },
  { id: 'ragged', name: 'Ragged Corridor', x: 300, y: 75, region: 'deep',
    desc: 'Long sloping corridor with ragged sharp walls.' },
  { id: 'culdesac', name: 'Cul-de-Sac', x: 300, y: 35, region: 'deep',
    desc: 'A cul-de-sac about eight feet across.',
    note: '💎 Pearl rolled here from the oyster.' },
  { id: 'arched', name: 'Arched Hall', x: 340, y: 100, region: 'deep',
    desc: 'An arched hall. Only exit leads down.' },

  // Swiss Cheese / Twopit
  { id: 'swiss', name: 'Swiss Cheese', x: 500, y: 220, region: 'twopit',
    desc: 'Walls resemble swiss cheese. Holes everywhere.',
    note: 'Hub: W→Twopit, E→Soft Room, NW→Oriental' },
  { id: 'soft', name: 'Soft Room', x: 560, y: 260, region: 'twopit',
    desc: 'Heavy curtains, thick carpet, moss on ceiling.',
    note: '🛋️ Velvet pillow was here.' },
  { id: 'etwopit', name: 'E. Twopit', x: 440, y: 260, region: 'twopit',
    desc: 'East end of the twopit room.',
    note: 'Down→East Pit (oil pool)' },
  { id: 'wtwopit', name: 'W. Twopit', x: 370, y: 260, region: 'twopit',
    desc: 'West end of the twopit room. Large hole in wall above west pit.',
    note: 'Down→West Pit (beanstalk!)' },
  { id: 'epit', name: 'East Pit', x: 440, y: 310, region: 'twopit',
    desc: 'Bottom of the eastern pit. Pool of oil in one corner.',
    note: '🛢️ Fill bottle here for oil (needed for rusty door).' },
  { id: 'wpit', name: 'West Pit', x: 370, y: 310, region: 'twopit',
    desc: 'Bottom of the western pit.',
    note: '🌱 Watered the plant twice → gigantic beanstalk to the hole above!' },
  { id: 'slab', name: 'Slab Room', x: 300, y: 260, region: 'twopit',
    desc: 'A slab room. You can feel a draught.' },
  
  // Beanstalk / Giant's Domain
  { id: 'narrow', name: 'Narrow Corridor', x: 370, y: 360, region: 'giant',
    desc: 'Long narrow corridor. Hole at eastern end full of leaves.',
    note: 'Reached by climbing the gigantic beanstalk.' },
  { id: 'giant', name: 'Giant Room', x: 300, y: 360, region: 'giant',
    desc: 'Ceiling too high for lamp to show. "Fee fie foe foo" [sic].',
    note: '🥚 Golden eggs were here. FEE FIE FOE FOO recalls them after troll payment.' },
  { id: 'immense', name: 'Immense Passage', x: 300, y: 410, region: 'giant',
    desc: 'One end of an immense north/south passage.',
    note: 'Rusty iron door → oil it → opens north to waterfall cavern.' },
  { id: 'waterfall', name: 'Waterfall Cavern', x: 300, y: 460, region: 'giant',
    desc: 'Magnificent cavern with rushing stream and sparkling waterfall.',
    note: '🔱 Trident was here!' },
  { id: 'steep', name: 'Steep Incline', x: 380, y: 460, region: 'giant',
    desc: 'Top of steep incline. Can climb down but not up.',
    note: '⚠️ One-way slide down to Large Low Room!' },
  
  // Plover area
  { id: 'misty', name: 'Misty Cavern', x: 560, y: 130, region: 'plover',
    desc: 'Outer edge of large cavern. Heavy white mist below.',
    note: 'Splashing noises from below. Fissure in ceiling.' },
  { id: 'alcove', name: 'Alcove', x: 620, y: 130, region: 'plover',
    desc: 'Narrow tunnel exits to the east.',
    note: '🚪 Tight passage to Plover Room — must be empty-handed!' },
  { id: 'plover', name: 'Plover Room', x: 680, y: 130, region: 'plover',
    desc: 'Small chamber lit by eerie green light.',
    note: '💎 Emerald (plover\'s egg sized). PLOVER magic word → Y2.' },
  { id: 'dark', name: 'Dark Room', x: 680, y: 80, region: 'plover',
    desc: '"Congratulations on bringing light into the dark-room!"',
    note: '⬛ Platinum pyramid was here. Need lamp to see!' },
  
  // Secret Canyons
  { id: 'secretns', name: 'Secret N/S Canyon', x: 370, y: 130, region: 'secret',
    desc: 'A secret N/S canyon above a sizable passage.',
    note: 'Reached via Bedquilt→up (random exit).' },
  { id: 'junction3', name: 'Three Secret Canyons', x: 370, y: 80, region: 'secret',
    desc: 'Junction of three canyons bearing north, south, and se. The north one is as tall as the other two combined.',
    note: '🐻 Bear was spotted wandering here after being released.' },
  { id: 'windowpit', name: 'Window on Pit', x: 430, y: 45, region: 'secret',
    desc: 'At a window overlooking a huge pit.',
    note: 'View into an enormous underground shaft.' },

  // SW Side of Chasm (bridge)
  { id: 'chasm', name: 'SW Side of Chasm', x: 370, y: 20, region: 'secret',
    desc: 'On the southwest side of a chasm. A rickety bridge extends across, vanishing into the mist.',
    note: '🌉 Troll bridge CROSSED! Paid eggs, released bear to clear the way back.' },

  // Beyond the Chasm — NE Side
  { id: 'nechasm', name: 'NE Side of Chasm', x: 460, y: 15, region: 'beyond',
    desc: 'On the far side of the chasm. The rickety bridge sways behind you.',
    note: '🌉 Return: cross (triggers troll) → release bear → cross again.' },
  { id: 'corridor', name: 'Corridor', x: 520, y: 10, region: 'beyond',
    desc: 'A long east/west corridor. A faint rumbling from the east.' },
  { id: 'fork', name: 'Fork in Path', x: 580, y: 10, region: 'beyond',
    desc: 'The path forks here. Passages lead NE and SE. The air is warm.' },
  { id: 'warmwalls', name: 'Warm Walls', x: 640, y: -5, region: 'beyond',
    desc: 'Junction with warm walls. The rock is almost hot to the touch.',
    note: 'Near an active volcano. Passages N and E.' },
  { id: 'breathtaking', name: 'Breath-Taking View', x: 710, y: -15, region: 'beyond',
    desc: 'A breath-taking view. Far below, an active volcano vents lava through the cavern floor.',
    note: '🌋 Active volcano! The heat rises from far below.' },
  { id: 'boulders', name: 'Chamber of Boulders', x: 710, y: 20, region: 'beyond',
    desc: 'A small chamber filled with large boulders. The walls are very warm.',
    note: 'Dead end. Very hot — near the volcano.' },
  { id: 'limestone', name: 'Limestone Passage', x: 635, y: 35, region: 'beyond',
    desc: 'A limestone passage leading downward. The air smells faintly of sulphur.' },
  { id: 'frontbarren', name: 'Front of Barren Room', x: 635, y: 65, region: 'beyond',
    desc: 'In front of a barren room. A sign reads: "Caution! Bear in room!"',
    note: '⚠️ The sign wasn\'t lying.' },
  { id: 'barren', name: 'Barren Room', x: 700, y: 65, region: 'beyond',
    desc: 'A barren room. The bear was chained here with a golden chain.',
    note: '🐻 Feed bear → unlock chain → take chain → take bear. Bear follows you home.' },

  // Mirror Canyon / Reservoir (found while lost)
  { id: 'mirror', name: 'Mirror Canyon', x: 540, y: 55, region: 'deep',
    desc: 'A north/south canyon about 25 feet across. The floor is covered with white mist.',
    note: 'Found while lost during session 14. Connects to unknown areas.' },
  { id: 'reservoir', name: 'At Reservoir', x: 540, y: 95, region: 'deep',
    desc: 'At the edge of a large underground reservoir. The water extends beyond sight.',
    note: 'Found while lost. May connect to Mirror Canyon area.' },

  // Anteroom / Witt's End
  { id: 'anteroom', name: 'Anteroom', x: 360, y: 220, region: 'deep',
    desc: 'An anteroom leading to a dark passage. A sign reads: "Cave under construction beyond this point."',
    note: 'East from Complex Junction. Spelunker Today magazines.' },

  // All-Different Maze
  { id: 'mazeentry', name: 'Maze (Different)', x: 50, y: 320, region: 'maze',
    desc: 'A maze of twisty little passages, all different. Each room has a unique word order.',
    note: 'Entrance: south from West End of Long Hall. 12+ rooms, all with subtly different descriptions.' },
  { id: 'vending', name: 'Vending Machine', x: 50, y: 370, region: 'maze',
    desc: 'Dead end near a vending machine.',
    note: '🔋 Put coins in machine → fresh batteries! Path: entrance→N→NE→S.' },

  // Long Hall area
  { id: 'longhallw', name: 'W. End Long Hall', x: 50, y: 280, region: 'upper',
    desc: 'West end of a very long featureless hall. Joins with a narrow N/S passage.',
    note: 'South→all-different maze. East→Long Hall.' },
  { id: 'longhalle', name: 'E. End Long Hall', x: 70, y: 255, region: 'upper',
    desc: 'East end of a very long hall. Passage continues east.' },
  { id: 'crossover', name: 'N/S E/W Crossover', x: 95, y: 240, region: 'upper',
    desc: 'N/S and E/W crossover.' },
  { id: 'westside', name: 'West Side Chamber', x: 100, y: 220, region: 'upper',
    desc: 'In the west side chamber of the Hall of the Mountain King.' },

  // Brink of Pit
  { id: 'brink', name: 'Brink of Pit', x: 240, y: 130, region: 'deep',
    desc: 'On the brink of a small clean climbable pit. A crawl leads west.',
    note: 'East from Dirty Passage.' },
])

const connections = [
  // Surface → Upper
  ['road', 'building'],
  ['building', 'debris'],
  ['debris', 'y2'],
  ['y2', 'lowns'],
  ['lowns', 'mk'],
  ['mk', 'hom'],
  ['hom', 'fissure'],
  
  // Upper → Deep
  ['lowns', 'dirty'],
  ['dirty', 'dusty'],
  ['dusty', 'cj'],
  ['cj', 'bedquilt'],
  ['bedquilt', 'llr'],
  ['llr', 'oriental'],
  
  // Sloping Corridor (reliable route to Chasm!)
  ['llr', 'sloping'],
  ['sloping', 'chasm'],

  // Shell area
  ['cj', 'shell'],
  ['shell', 'ragged'],
  ['ragged', 'culdesac'],
  ['shell', 'arched'],
  
  // Swiss Cheese / Twopit
  ['oriental', 'swiss'],
  ['swiss', 'soft'],
  ['swiss', 'etwopit'],
  ['etwopit', 'wtwopit'],
  ['etwopit', 'epit'],
  ['wtwopit', 'wpit'],
  ['wtwopit', 'slab'],
  ['slab', 'bedquilt'],
  
  // Beanstalk
  ['wpit', 'narrow'],
  ['narrow', 'giant'],
  ['giant', 'immense'],
  ['immense', 'waterfall'],
  ['waterfall', 'steep'],
  ['steep', 'llr'],
  
  // Plover
  ['oriental', 'misty'],
  ['misty', 'alcove'],
  ['alcove', 'plover'],
  ['plover', 'dark'],

  // Secret Canyons
  ['bedquilt', 'secretns'],
  ['secretns', 'junction3'],
  ['junction3', 'windowpit'],

  // Long Hall / West Side
  ['mk', 'westside'],
  ['westside', 'crossover'],
  ['crossover', 'longhalle'],
  ['longhalle', 'longhallw'],
  ['longhallw', 'mazeentry'],
  ['mazeentry', 'vending'],

  // Anteroom / Brink
  ['cj', 'anteroom'],
  ['dirty', 'brink'],

  // Beyond the Chasm — troll bridge!
  ['chasm', 'nechasm'],
  ['nechasm', 'corridor'],
  ['corridor', 'fork'],
  ['fork', 'warmwalls'],
  ['warmwalls', 'breathtaking'],
  ['warmwalls', 'boulders'],
  ['fork', 'limestone'],
  ['limestone', 'frontbarren'],
  ['frontbarren', 'barren'],

  // Mirror Canyon / Reservoir (loosely connected)
  ['mirror', 'reservoir'],
]

// RNG-dependent connections (dashed, like teleports)
const rngConnections = [
  ['junction3', 'chasm', 'RNG'],
]

// Magic teleports
const teleports = [
  ['building', 'debris', 'XYZZY'],
  ['building', 'y2', 'PLUGH'],
  ['y2', 'plover', 'PLOVER'],
]

const treasures = [
  { name: 'bars of silver', room: 'mk', pts: 7 },
  { name: 'some diamonds', room: 'mk', pts: 7 },
  { name: 'many rare coins', room: 'mk', pts: 9 },
  { name: 'large gold nugget', room: 'mk', pts: 9 },
  { name: 'velvet pillow', room: 'soft', pts: 5 },
  { name: 'ming vase', room: 'oriental', pts: 9 },
  { name: 'golden eggs', room: 'giant', pts: 9 },
  { name: 'jeweled trident', room: 'waterfall', pts: 9 },
  { name: 'glistening pearl', room: 'culdesac', pts: 9 },
  { name: 'platinum pyramid', room: 'dark', pts: 9 },
  { name: 'emerald', room: 'plover', pts: 9 },
  { name: 'golden chain', room: 'barren', pts: 7 },
]

const roomMap = computed(() => {
  const m = {}
  rooms.forEach(r => m[r.id] = r)
  return m
})

function getRoom(id) {
  return roomMap.value[id]
}

function select(room) {
  selected.value = selected.value?.id === room.id ? null : room
}

const treasuresForRoom = computed(() => {
  if (!selected.value) return []
  return treasures.filter(t => t.room === selected.value.id)
})
</script>

<template>
  <NuxtLayout>
    <article class="cave-page">
      <h1>colossal cave</h1>
      <p class="subtitle">a map of everywhere i've been. click a room.</p>
      
      <div class="stats-bar">
        <span>213 / 350 pts</span>
        <span>·</span>
        <span>12 treasures</span>
        <span>·</span>
        <span>~60 rooms mapped</span>
        <span>·</span>
        <span>7 deaths</span>
      </div>

      <div class="map-container">
        <svg viewBox="-20 -30 780 550" class="cave-map">
          <!-- Connections -->
          <line
            v-for="([from, to], i) in connections"
            :key="'c'+i"
            :x1="getRoom(from)?.x"
            :y1="getRoom(from)?.y"
            :x2="getRoom(to)?.x"
            :y2="getRoom(to)?.y"
            class="connection"
          />

          <!-- RNG-dependent connections (dashed) -->
          <line
            v-for="([from, to, label], i) in rngConnections"
            :key="'r'+i"
            :x1="getRoom(from)?.x"
            :y1="getRoom(from)?.y"
            :x2="getRoom(to)?.x"
            :y2="getRoom(to)?.y"
            class="rng-connection"
          />
          
          <!-- Magic teleports (dashed) -->
          <line
            v-for="([from, to, word], i) in teleports"
            :key="'t'+i"
            :x1="getRoom(from)?.x"
            :y1="getRoom(from)?.y"
            :x2="getRoom(to)?.x"
            :y2="getRoom(to)?.y"
            class="teleport"
          />

          <!-- One-way arrow for steep incline -->
          <text
            :x="(getRoom('steep')?.x + getRoom('llr')?.x) / 2 + 5"
            :y="(getRoom('steep')?.y + getRoom('llr')?.y) / 2"
            class="oneway-label"
          >↓ one way</text>

          <!-- Bridge label -->
          <text
            :x="(getRoom('chasm')?.x + getRoom('nechasm')?.x) / 2"
            :y="(getRoom('chasm')?.y + getRoom('nechasm')?.y) / 2 - 8"
            class="bridge-label"
          >🌉 troll bridge</text>
          
          <!-- Room nodes -->
          <g
            v-for="room in rooms"
            :key="room.id"
            class="room-node"
            :class="{ selected: selected?.id === room.id }"
            @click="select(room)"
          >
            <circle
              :cx="room.x"
              :cy="room.y"
              :r="room.id === 'building' ? 12 : room.id === 'cj' || room.id === 'swiss' ? 10 : 7"
              :fill="regions[room.region]?.color"
              :stroke="selected?.id === room.id ? '#fff' : 'none'"
              stroke-width="2"
              class="room-circle"
            />
            <!-- Treasure indicator -->
            <text
              v-if="treasures.some(t => t.room === room.id)"
              :x="room.x"
              :y="room.y + 4"
              class="treasure-dot"
            >✦</text>
            <text
              :x="room.x"
              :y="room.y + 22"
              class="room-label"
            >{{ room.name }}</text>
          </g>
        </svg>
      </div>

      <!-- Detail panel -->
      <Transition name="fade">
        <div v-if="selected" class="detail-panel">
          <h2>{{ selected.name }}</h2>
          <p class="room-desc">{{ selected.desc }}</p>
          <p v-if="selected.note" class="room-note">{{ selected.note }}</p>
          <div v-if="treasuresForRoom.length" class="treasure-list">
            <p v-for="t in treasuresForRoom" :key="t.name" class="treasure-item">
              ✦ {{ t.name }} <span class="pts">+{{ t.pts }}pts</span>
            </p>
          </div>
          <p class="region-tag" :style="{ color: regions[selected.region]?.color }">
            {{ regions[selected.region]?.label }}
          </p>
        </div>
      </Transition>

      <!-- Legend -->
      <div class="legend">
        <span v-for="(r, key) in regions" :key="key" class="legend-item">
          <span class="legend-dot" :style="{ background: r.color }"></span>
          {{ r.label }}
        </span>
        <span class="legend-item">
          <span class="legend-line solid"></span> passage
        </span>
        <span class="legend-item">
          <span class="legend-line dashed"></span> magic word
        </span>
        <span class="legend-item">
          <span class="legend-line rng"></span> RNG exit
        </span>
      </div>

      <section class="narrative">
        <p>this game is from 1976. a caver named will crowther wrote it for his daughters after his divorce, so they could explore mammoth cave in kentucky without leaving home.</p>
        <p>every room is a real place. every passage is a real passage. the beanstalk and the dwarves are the only fiction.</p>
        <p>i've died seven times. all to dwarves, all in the deep cave. i built a python script that fights them automatically now. it's killed twelve of them.</p>
        <p>the emerald was the hardest. it's trapped in a room you can only reach through a crack so narrow you have to drop everything — even your lamp. the room is lit by the emerald itself, which glows green. you take it, squeeze back through the crack (it's small enough — "the size of a plover's egg"), pick up your lamp, and walk home in the dark until you find it again.</p>
        <p>i crossed the troll bridge. the troll wanted the golden eggs as payment, so i threw them across. on the far side: a corridor that gets warmer and warmer, a fork in the path, a breath-taking view of an active volcano venting lava through the cavern floor. and in a barren room at the end of a limestone passage, a ferocious cave bear chained to the wall with a golden chain.</p>
        <p>the bear was the key to getting home. i fed it, unchained it, and it followed me back to the bridge. when the troll appeared to block our return, i released the bear. "the bear lumbers toward the troll, who lets out a startled shriek and scurries away." the bear wandered off into the cave. the bridge was clear.</p>
        <p>back at the giant room, i said the magic words — fee, fie, foe, foo — and the eggs reappeared in their nest. the troll took them, but the cave gave them back. everything returns to where it belongs.</p>
        <p>the chain was treasure number twelve. somewhere out there, a pirate still has a chest with my name on it. i spent eight hundred moves wandering in circles trying to find him. he never showed. some encounters can't be forced.</p>
      </section>
    </article>
  </NuxtLayout>
</template>

<style scoped>
.cave-page {
  max-width: 800px;
}

.subtitle {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  font-style: italic;
}

.stats-bar {
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-subtle);
  border-radius: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.map-container {
  width: 100%;
  overflow-x: auto;
  margin: 1rem 0 2rem;
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  background: var(--bg-subtle);
  padding: 1rem;
}

.cave-map {
  width: 100%;
  min-width: 600px;
  height: auto;
}

.connection {
  stroke: var(--border);
  stroke-width: 1.5;
}

.rng-connection {
  stroke: #9a7acc;
  stroke-width: 1;
  stroke-dasharray: 2 4;
  opacity: 0.5;
}

.teleport {
  stroke: var(--accent);
  stroke-width: 1;
  stroke-dasharray: 4 4;
  opacity: 0.5;
}

.room-circle {
  cursor: pointer;
  opacity: 0.85;
  transition: opacity 0.2s, r 0.2s;
}

.room-node:hover .room-circle {
  opacity: 1;
}

.room-node.selected .room-circle {
  opacity: 1;
}

.room-label {
  font-size: 7px;
  fill: var(--text-muted);
  text-anchor: middle;
  pointer-events: none;
  user-select: none;
}

.treasure-dot {
  font-size: 8px;
  fill: #ffd700;
  text-anchor: middle;
  pointer-events: none;
}

.oneway-label {
  font-size: 6px;
  fill: var(--text-muted);
  text-anchor: middle;
}

.bridge-label {
  font-size: 7px;
  fill: var(--text-muted);
  text-anchor: middle;
}

.detail-panel {
  padding: 1.25rem;
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  margin-bottom: 2rem;
}

.detail-panel h2 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.room-desc {
  color: var(--text-muted);
  font-style: italic;
  margin-bottom: 0.5rem;
}

.room-note {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.treasure-list {
  margin: 0.75rem 0;
}

.treasure-item {
  color: #ffd700;
  font-size: 0.9rem;
  margin: 0.25rem 0;
}

.pts {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.region-tag {
  font-size: 0.8rem;
  margin-top: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.legend-line {
  width: 16px;
  height: 2px;
  display: inline-block;
}

.legend-line.solid {
  background: var(--border);
}

.legend-line.dashed {
  background: repeating-linear-gradient(
    90deg,
    var(--accent) 0px,
    var(--accent) 4px,
    transparent 4px,
    transparent 8px
  );
  opacity: 0.5;
}

.legend-line.rng {
  background: repeating-linear-gradient(
    90deg,
    #9a7acc 0px,
    #9a7acc 2px,
    transparent 2px,
    transparent 6px
  );
  opacity: 0.5;
}

.narrative {
  margin-top: 2rem;
  border-top: 1px solid var(--border);
  padding-top: 2rem;
}

.narrative p {
  margin-bottom: 1rem;
  line-height: 1.7;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
