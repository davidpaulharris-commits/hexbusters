# Rush Hour 🏁

A family race game for phones. Everyone makes their own character, gets their own copy of the same map, and races to finish all their jobs first. The last person has to take a silly photo, and it pops up on everyone's phone.

- 2 to 10 players, each on their own phone
- 4 maps, each with 5 mini-games and its own ending: **School** (the bell rings and the school bus comes), **Bank** (the alarm goes off and money rains down), **Shopping Centre** (closing-time announcement and the lights go off shop by shop) and **Town** (the clock strikes, night falls and the street lamps come on)
- Rounds last 5 to 30 minutes. Longer rounds have more jobs (5 minutes = 5 jobs, 30 minutes = 15 jobs)
- Power-ups on the map: ⚡ speed boost, ⏭️ skip a job, ❄️ freeze someone's screen, 🎨 paint-splat someone's screen
- **Age-based difficulty:** each player enters their age in the character creator. The maths sums, spelling words, money-counting jobs, vault code and memory games get easier or harder to match, so a 6-year-old and a grown-up can race fairly. The age stays on that phone and isn't sent anywhere.
- **Practice mode** works straight away with no setup. You race three robots on one phone.

---

## Setting it up (about 15 minutes)

You need your **Supabase**, **GitHub** and **Netlify** accounts.

### 1. Set up the database in Supabase

1. Go to [supabase.com](https://supabase.com) and open a project. You can use the same project as your other games, because everything for Rush Hour starts with `rh_` so nothing clashes. Or you can make a new one.
2. In the left menu, click **SQL Editor**, then **New query**.
3. Open `supabase/schema.sql` from this folder, copy all of it, paste it in, and press **Run**. You should see "Success".
4. Go to **Project Settings → API** (or press **Connect** at the top of the project). Copy two things:
   - the **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - the **anon public** key (newer projects call it the **publishable** key)

### 2. Add your keys to the game

Open `js/config.js` and paste them between the quotes:

```js
window.RUSH_CONFIG = {
  SUPABASE_URL: 'https://abcdefgh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...your key...',
};
```

These keys are meant to be public, so it's fine for them to go on GitHub. The database only lets people change games through the game's own rules.

### 3. Put it on GitHub

1. On [github.com](https://github.com), click **New repository**, call it `rush-hour`, and click **Create repository**.
2. Click **uploading an existing file**, drag in **everything inside this folder** (not the folder itself), and click **Commit changes**.

### 4. Publish it with Netlify

1. On [netlify.com](https://app.netlify.com), click **Add new site → Import an existing project → GitHub** and pick `rush-hour`.
2. Leave the build command **empty**. The publish directory is `.` (the `netlify.toml` file already sets this). Click **Deploy**.
3. After a minute you'll get a link like `https://something.netlify.app`. You can rename it under **Site configuration → Change site name**, for example `rush-hour-family`.

From now on, whenever you change a file on GitHub, Netlify updates the site by itself.

---

## How to play

1. One person taps **Host a game** and makes their character.
2. Everyone else scans the QR code, taps the shared link, or types the 4-letter code into **Join a game**.
3. The host picks a map (or 🎲 Random) and the round length, then taps **Start the race!**
4. Tap the map to walk, or open **📋 Tasks** and tap a job to walk straight to it. Walk onto a glowing marker to start that job.
5. Pick up power-ups as you go. When you're holding a ❄️ or 🎨, tap the purple button to use it on someone.
6. The first person to finish every job wins. If the timer runs out, whoever has done the most wins.
7. Whoever comes last takes a silly photo, and it pops up on everyone's phone. Photos are never saved anywhere, they only travel to the other phones.
8. The host can tap **Play again** for another round with the same people.

**Tip:** on a phone, use **Share → Add to Home Screen** and Rush Hour will open full-screen like an app.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| "The database is not set up yet" | Run `supabase/schema.sql` in the Supabase SQL Editor (step 1). |
| Host and Join buttons are greyed out | `js/config.js` doesn't have your Supabase URL and key yet (step 2). |
| "We couldn't find a game with that code" | Check the code on the host's phone. Games are cleared away after a day. |
| Freezes, paint splats or the silly photo don't reach other phones | In Supabase, go to **Realtime → Settings** and make sure public channels are allowed (turn off "private channels only"). |
| The camera won't open for the silly photo | The phone will offer to use the camera app, or to send a cartoon silly face instead. The camera needs the `https://` Netlify link, not a file on the computer. |
| Someone's phone went to sleep | Just wake it up. The game catches up, and refreshing the page rejoins the same game. |

## What's in the folder

```
index.html            the page
css/style.css         how it looks
js/config.js          your Supabase details  ← the only file you need to edit
js/app.js             screens: home, character creator, lobby, game, results
js/game.js            walking around the map
js/maps.js            the four maps
js/tasks.js           the 20 mini-games
js/difficulty.js      age-based maths, spelling and money questions
js/avatar.js          drawing the characters
js/net.js             talking to Supabase (and the practice robots)
js/vendor/            Supabase and QR-code libraries (bundled, nothing to install)
supabase/schema.sql   the database setup
netlify.toml          Netlify settings
```
