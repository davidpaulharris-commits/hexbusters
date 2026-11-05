# Wreckers of Porthcove

A hidden-role party game for one room and many phones, for 4–12 players.
One person hosts. Everyone else taps a link (or scans a QR code) and plays in their phone's browser.
Nobody needs an account or an app.

The site is plain HTML hosted on **Netlify**. **Supabase** keeps the game state and passes moves between phones in real time.

---

## Setup (about 15 minutes, once)

### 1. Supabase: create the game table

You can use your existing Supabase project; everything here is named `wreckers_…` so it won't touch anything else. A separate free project works just as well.

1. Open your project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor → New query**.
3. Open `supabase/setup.sql` from this folder, copy all of it, paste it in and press **Run**.
   You should see *"Success. No rows returned."*

### 2. Supabase: copy your two keys

1. Click **Connect** at the top of the dashboard, or go to **Project Settings → API Keys**.
2. Copy the **Project URL**. It looks like `https://abcdefgh.supabase.co`.
3. Copy the **publishable key** (starts `sb_publishable_…`). Older projects call it the **anon / public** key; either works.
   Never use the *secret* or *service_role* key here.

### 3. Put the keys in `config.js`

Open `config.js` and replace the two placeholder values:

```js
window.WRECKERS_CONFIG = {
  supabaseUrl: "https://abcdefgh.supabase.co",
  supabaseAnonKey: "sb_publishable_xxxxxxxxxxxxxxxx"
};
```

This key is designed to be public, so committing it to GitHub is fine.
The database only allows the three game functions in `setup.sql`, and only the host's phone can change a game.

### 4. GitHub: make a repo

1. On GitHub, click **New repository**, call it something like `wreckers-of-porthcove`, and create it.
2. Click **uploading an existing file**, then drag in **everything in this folder**, keeping the `vendor` and `supabase` folders.
3. Click **Commit changes**.

### 5. Netlify: deploy

1. In Netlify: **Add new site → Import an existing project → GitHub**, then pick the repo.
2. Leave the build settings empty (`netlify.toml` already says "no build, publish this folder").
3. Click **Deploy**.
4. Optional: **Site configuration → Change site name** to get something like `wreckers-porthcove.netlify.app`.

From now on, any change you commit on GitHub goes live automatically within a minute.

### 6. Test with two phones

Open the site on one phone, make a character and press **Host a new game**.
On a second phone, scan the QR code on the host's screen. If the second phone appears under "Crew aboard", everything works.
To try a whole game alone, use **Add a practice bot** in the lobby.

---

## Playing on the night

1. **The host** opens the site, makes a character and taps **Host a new game**. Choose **Host and play**, or **Narrate only** to put the host screen on a laptop or TV.
2. Tap **Share link** to send it to the family chat, or let people scan the QR code.
3. Everyone taps the link, makes a character, and appears in the lobby.
4. With 4 or more aboard, the host taps **Cast off**.

**Keep the host's screen awake.** The game runs on the host's phone. If it locks or loses signal, the game pauses and carries on when it's back.
If the host's page reloads, it picks up where it left off, as long as it's the same phone and browser.

For 4–5 players a game takes about 15–20 minutes, so play a few rounds; the leaderboard keeps a running total.
With 8 or more, one game fills 45–60 minutes.

---

## If something goes wrong

| What you see | What to check |
|---|---|
| A **"Practice mode"** banner | `config.js` still has the placeholder values, or the file didn't upload. |
| **"Couldn't reach the game server"** when hosting | `setup.sql` hasn't been run, or the URL or key in `config.js` is wrong. |
| Players stuck on **"Signing you aboard…"** | In Supabase, **Realtime → Settings**: make sure *"Allow public access"* is on (private-only channels must be off). |
| **"There's no game with the code…"** | The code is wrong, or the game is more than 3 days old (old games are tidied away). |
| One phone is out of step | Reload that phone. It rejoins with its role and notes intact. |

## What's in the folder

```
index.html          the whole game: screens, rules, host engine
config.js           your Supabase URL and public key
vendor/supabase.js  Supabase client library (v2.117.3)
vendor/qrcode.js    QR code generator for the lobby
supabase/setup.sql  one-time database setup
netlify.toml        tells Netlify there's no build step
```

## How it works (for the curious)

- The **host's phone is the referee**. It holds the secret roles and the rules, and saves the public game state to Supabase after every move.
- Other phones read that state and send their moves through a Supabase Realtime channel.
- **Secret information is encrypted** between each phone and the host's phone. Roles, night choices and votes before they're revealed are unreadable to anyone else, even if they snoop on the network or the database.
- Notes are stored only on the phone that wrote them, until you table one as evidence.
